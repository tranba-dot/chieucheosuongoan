import { getMongoClient, DB_NAME, CHUNKS_COLLECTION, type Mode } from '@/lib/mongodb'
import { embedText } from '@/lib/embeddings'

const TOP_K = 5
export const CHAT_MODEL = 'gemini-3.6-flash'
export const FALLBACK_MODEL = 'gemini-3.1-flash-lite'

export type Chunk = { title: string; url: string; text: string }

// No mode = search every source collection.
export async function retrieveContext(question: string, mode?: Mode): Promise<Chunk[]> {
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
          ...(mode && { filter: { mode: { $eq: mode } } }),
          numCandidates: 100,
          limit: TOP_K
        }
      },
      { $project: { _id: 0, title: 1, url: 1, text: 1 } }
    ])
    .toArray()

  return results as Chunk[]
}

export function formatContext(chunks: Chunk[]) {
  return chunks.length > 0
    ? chunks.map((item) => `${item.title}: ${item.text}`).join('\n\n')
    : 'Không tìm thấy tài liệu liên quan trực tiếp.'
}

// Throws an Error whose message is safe to show to the user.
// `attempts` is tried in order, moving on only when the model answers 503
// (overloaded) or 429 (free-tier quota) - list the same model twice to retry it.
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  generationConfig?: Record<string, unknown>,
  attempts: string[] = [CHAT_MODEL, FALLBACK_MODEL]
): Promise<string> {
  const call = (model: string) =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          ...(generationConfig && { generationConfig })
        })
      }
    ).catch(() => {
      throw new Error('Không thể kết nối AI lúc này. Trạng thái trò chơi của bạn vẫn được giữ nguyên.')
    })

  // ponytail: fixed 1s pause between attempts, no exponential backoff/queue.
  let response!: Response
  for (const [i, model] of attempts.entries()) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, 1000))
    response = await call(model)
    if (response.status !== 503 && response.status !== 429) break
  }

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Không thể kết nối với Gemini lúc này.')
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini không trả về câu trả lời.')
  return text
}
