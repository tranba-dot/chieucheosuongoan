import { NextResponse } from 'next/server'
import { retrieveContext, formatContext, generateText, type Chunk } from '@/lib/rag'

const SYSTEM_PROMPT = `Bạn là AI hỏi đáp di sản văn hóa Việt Nam.
Hãy trả lời rõ ràng, dễ hiểu, phù hợp với học sinh.
Không tự bịa thông tin. Nếu không chắc chắn, hãy nói rõ giới hạn của thông tin.`

export async function POST(request: Request) {
  const { question } = await request.json()

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

  let relevant: Chunk[] = []
  try {
    relevant = await retrieveContext(question, 'heritage')
  } catch (err) {
    console.error('Vector search failed:', err)
  }

  try {
    const answer = await generateText(
      SYSTEM_PROMPT,
      `Thông tin tham khảo:
${formatContext(relevant)}

Câu hỏi của học sinh:
${question}`
    )

    const sources = Array.from(
      new Map(relevant.map((item) => [item.title, { title: item.title, url: item.url }])).values()
    )

    return NextResponse.json({ configured: true, answer, sources })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
