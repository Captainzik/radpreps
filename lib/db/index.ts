import mongoose, { Mongoose } from 'mongoose'
import { MongoClient } from 'mongodb'

interface MongooseCache {
  conn: Mongoose | null
  authClient: MongoClient | null
  promise: Promise<Mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose ?? {
  conn: null,
  authClient: null,
  promise: null,
}

if (!global.mongoose) {
  global.mongoose = cached
}

export const connectToDatabase = async (
  MONGODB_URI = process.env.MONGODB_URI,
): Promise<Mongoose> => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  if (!process.env.MONGODB_DB) {
    throw new Error('MONGODB_DB is not defined in environment variables')
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      dbName: process.env.MONGODB_DB,
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached.conn = await cached.promise

    if (process.env.NODE_ENV !== 'production') {
      const dbName = cached.conn.connection.db?.databaseName
      console.log(`MongoDB connected successfully (db: ${dbName})`)
    }

    return cached.conn
  } catch (error) {
    cached.promise = null
    throw new Error(`Database connection failed: ${(error as Error).message}`)
  }
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cached.authClient) return cached.authClient

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  })

  await client.connect()

  if (process.env.MONGODB_DB) {
    await client.db(process.env.MONGODB_DB).command({ ping: 1 })
  }

  cached.authClient = client
  return client
}
