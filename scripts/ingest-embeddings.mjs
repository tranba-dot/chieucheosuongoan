// One-time/repeatable script: embeds every document in the source
// collections (SOURCE_COLLECTIONS below) into `document_chunks`.
// Run after adding/editing source documents:
//   node --env-file=.env.local scripts/ingest-embeddings.mjs
// ponytail: re-embeds ALL documents on every run, not just new/changed ones
// (find({}) over the whole collection each time). Fine at a few dozen docs;
// if the corpus grows large, skip docs whose content hash matches what's
// already in document_chunks.
import { MongoClient } from 'mongodb'

const DB_NAME = 'ChieuCheoSuongOan'
const CHUNKS_COLLECTION = 'document_chunks'
const SOURCE_COLLECTIONS = {
  heritage: 'Tai_lieu_nghe_thuat_truyen_thong_Viet_Nam',
  // sic: the Atlas collection really is named "TaI" (capital i) - rename it there and here together.
  game: 'TaI_lieu_board_game',
  rhythm: 'Tai_lieu_nhip_phach'
}
const EMBEDDING_MODEL = 'gemini-embedding-001'
const OUTPUT_DIMENSIONALITY = 768
const MAX_WORDS_PER_CHUNK = 400

function chunkText(text) {
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const chunks = []
  let current = []
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
  if (current.length > 0) chunks.push(current.join('\n'))
  return chunks
}

async function embedText(text, taskType) {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set')

  // ponytail: the free tier allows ~100 embed requests/min, so on 429 just wait
  // and retry (fixed pause, no adaptive pacing).
  for (let attempt = 1; ; attempt++) {
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
    if (response.status === 429 && attempt < 6) {
      console.log('    rate limited, waiting 30s...')
      await new Promise((resolve) => setTimeout(resolve, 30000))
      continue
    }
    if (!response.ok) {
      throw new Error(`Gemini embedding failed: ${response.status} ${await response.text()}`)
    }
    const data = await response.json()
    return data.embedding.values
  }
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(DB_NAME)
  const chunksCollection = db.collection(CHUNKS_COLLECTION)

  for (const [mode, sourceCollectionName] of Object.entries(SOURCE_COLLECTIONS)) {
    const sourceDocs = await db.collection(sourceCollectionName).find({}).toArray()
    console.log(`\n${sourceCollectionName}: ${sourceDocs.length} document(s)`)

    for (const doc of sourceDocs) {
      await chunksCollection.deleteMany({ sourceId: doc._id })

      const chunks = chunkText(doc.content ?? '')
      console.log(`  - ${doc.title}: ${chunks.length} chunk(s)`)

      for (let i = 0; i < chunks.length; i++) {
        const embedding = await embedText(chunks[i], 'RETRIEVAL_DOCUMENT')
        await chunksCollection.insertOne({
          sourceId: doc._id,
          sourceCollection: sourceCollectionName,
          mode,
          title: doc.title,
          url: doc.url,
          chunkIndex: i,
          text: chunks[i],
          embedding
        })
      }
    }
  }

  try {
    await chunksCollection.createSearchIndex({
      name: 'vector_index',
      type: 'vectorSearch',
      definition: {
        fields: [
          { type: 'vector', path: 'embedding', numDimensions: 768, similarity: 'cosine' },
          { type: 'filter', path: 'mode' }
        ]
      }
    })
    console.log('\nCreated Atlas Vector Search index "vector_index" (takes ~1 min to finish building - queries before that return no results).')
  } catch (err) {
    if (!String(err.message).includes('already exists')) throw err
    console.log('\nIndex "vector_index" already exists, left as-is.')
  }

  await client.close()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
