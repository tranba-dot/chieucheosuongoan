import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

export function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  }

  if (!clientPromise) {
    client = new MongoClient(uri)
    clientPromise = client.connect()
  }
  return clientPromise
}

export const DB_NAME = 'ChieuCheoSuongOan'
export const CHUNKS_COLLECTION = 'document_chunks'
export const SOURCE_COLLECTIONS = {
  heritage: 'Tai_lieu_nghe_thuat_truyen_thong_Viet_Nam',
  // sic: the Atlas collection really is named "TaI" (capital i) - rename it there and here together.
  game: 'TaI_lieu_board_game',
  rhythm: 'Tai_lieu_nhip_phach'
} as const

export type Mode = keyof typeof SOURCE_COLLECTIONS
