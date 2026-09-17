import { NextResponse } from 'next/server'
import { getMongoClient, DB_NAME, CHUNKS_COLLECTION, type Mode } from '@/lib/mongodb'
import { embedText } from '@/lib/embeddings'

const TOP_K = 5
const CHAT_MODEL = 'gemini-3.6-flash'

async function retrieveContext(question: string, mode: Mode) {
  const client = await getMongoClient()
  const chunksCollection = client.db(DB_NAME).collection(CHUNKS_COLLECTION)
  const queryVector = await embedText(question, 'RETRIEVAL_QUERY')

  const results = await chunksCollection
    .aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector,
          filter: { mode: { $eq: mode } },
          numCandidates: 100,
          limit: TOP_K
        }
      },
      { $project: { _id: 0, title: 1, url: 1, text: 1 } }
    ])
    .toArray()

  return results as { title: string; url: string; text: string }[]
}

export async function POST(request: Request) {
  const { question, mode: rawMode = 'heritage' } = await request.json()
  const mode: Mode = rawMode === 'game' ? 'game' : 'heritage'

  if (typeof question !== 'string' || question.trim().length < 2) {
    return NextResponse.json(
      { error: 'Vui lòng nhập câu hỏi rõ hơn.' },
      { status: 400 }
    )
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      {
        configured: false,
        message: 'AI hiện chưa được kết nối. Vui lòng liên hệ quản trị viên.'
      },
      { status: 503 }
    )
  }

  let relevant: { title: string; url: string; text: string }[] = []
  try {
    relevant = await retrieveContext(question, mode)
  } catch (err) {
    console.error('Vector search failed:', err)
  }

  const context =
    relevant.length > 0
      ? relevant.map((item) => `${item.title}: ${item.text}`).join('\n\n')
      : 'Không tìm thấy tài liệu liên quan trực tiếp.'

  const systemPrompt =
    mode === 'game'
      ? `Bạn là AI Vén Màn, trợ lý của board game Chiếu Chèo Sương Oan.
Hãy giúp học sinh tìm hiểu Quan Âm Thị Kính và nghệ thuật chèo.
Không tự bịa sự kiện. Phân biệt rõ sự kiện, diễn giải và kết luận.
Nếu có thể, hãy chỉ ra bằng chứng hoặc thông tin giúp học sinh tự suy luận.`
      : `Bạn là AI hỏi đáp di sản văn hóa Việt Nam.
Hãy trả lời rõ ràng, dễ hiểu, phù hợp với học sinh.
Không tự bịa thông tin. Nếu không chắc chắn, hãy nói rõ giới hạn của thông tin.`

  try {
    const callGemini = () =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Thông tin tham khảo:
${context}

Câu hỏi của học sinh:
${question}`
                  }
                ]
              }
            ]
          })
        }
      )

    // ponytail: 1 retry on 503 (model overloaded) with a fixed delay -
    // covers the common transient case without a full backoff/queue.
    let response = await callGemini()
    if (response.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      response = await callGemini()
    }

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            'Không thể kết nối với Gemini lúc này.'
        },
        { status: 502 }
      )
    }

    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!answer) {
      return NextResponse.json(
        { error: 'Gemini không trả về câu trả lời.' },
        { status: 502 }
      )
    }

    const sources = Array.from(
      new Map(relevant.map((item) => [item.title, { title: item.title, url: item.url }])).values()
    )

    return NextResponse.json({
      configured: true,
      answer,
      sources
    })
  } catch {
    return NextResponse.json(
      {
        error: 'Không thể kết nối AI lúc này. Trạng thái trò chơi của bạn vẫn được giữ nguyên.'
      },
      { status: 502 }
    )
  }
}
