import mongoose, { Mongoose } from 'mongoose'
import { MongoClient } from 'mongodb'

// Global cache type
interface MongooseCache {
  conn: Mongoose | null
  authClient: MongoClient | null
  promise: Promise<Mongoose> | null
}

// Proper global augmentation
declare global {
  var mongoose: MongooseCache | undefined
}

// Initialize cache (guaranteed to exist)
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
  // Return existing connection if healthy
  if (cached.conn && cached.conn.connection.readyState >= 1) {
    return cached.conn
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  // Only start connecting if we're not already in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached.conn = await cached.promise

    if (process.env.NODE_ENV !== 'production') {
      console.log('MongoDB connected successfully')
    }

    return cached.conn
  } catch (error) {
    cached.promise = null // reset on failure
    throw new Error(`Database connection failed: ${(error as Error).message}`)
  }
}

// Helper to get the MongoClient for NextAuth adapter
export async function getMongoClient(): Promise<MongoClient> {
  if (cached.authClient) {
    return cached.authClient
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  const client = new MongoClient(uri)
  await client.connect()
  cached.authClient = client
  return client
}
