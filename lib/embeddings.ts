const EMBEDDING_MODEL = 'gemini-embedding-001'
const OUTPUT_DIMENSIONALITY = 768

type TaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'

export async function embedText(text: string, taskType: TaskType): Promise<number[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: OUTPUT_DIMENSIONALITY
      })
    }
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Gemini embedding request failed: ${response.status} ${detail}`)
  }

  const data = await response.json()
  const values = data?.embedding?.values

  if (!Array.isArray(values)) {
    throw new Error('Gemini embedding response missing values')
  }

  return values
}
