const MAX_WORDS_PER_CHUNK = 400

export function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current: string[] = []
  let currentWordCount = 0

  for (const paragraph of paragraphs) {
    const wordCount = paragraph.split(/\s+/).length

    if (currentWordCount + wordCount > MAX_WORDS_PER_CHUNK && current.length > 0) {
      chunks.push(current.join('\n'))
      current = []
      currentWordCount = 0
    }

    current.push(paragraph)
    currentWordCount += wordCount
  }

  if (current.length > 0) {
    chunks.push(current.join('\n'))
  }

  return chunks
}
