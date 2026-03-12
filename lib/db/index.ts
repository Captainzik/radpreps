import mongoose, { Mongoose } from 'mongoose'

// Proper type-safe global augmentation
declare global {
  var mongoose:
    | {
        conn: Mongoose | null
        promise: Promise<Mongoose> | null
      }
    | undefined
}

// Reuse cached connection across hot reloads in development
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export const connectToDatabase = async (
  MONGODB_URI = process.env.MONGODB_URI
): Promise<Mongoose> => {
  // Return existing connection if healthy
  if (cached.conn) {
    return cached.conn
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  // Only start connecting if we're not already in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Good default for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached.conn = await cached.promise

    // Optional: Log success (useful in dev)
    if (process.env.NODE_ENV !== 'production') {
      console.log('MongoDB connected successfully')
    }

    return cached.conn
  } catch (error) {
    // Important: reset promise on failure so next call can retry
    cached.promise = null
    throw new Error(`Database connection failed: ${(error as Error).message}`)
  }
}

/*import mongoose from 'mongoose'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cached = (global as any).mongoose || { conn: null, promise: null }

export const connectToDatabase = async (
  MONGODB_URI = process.env.MONGODB_URI
) => {
  if (cached.conn) return cached.conn

  if (!MONGODB_URI) throw new Error('MONGODB_URI is missing')

  cached.promise = cached.promise || mongoose.connect(MONGODB_URI)

  cached.conn = await cached.promise

  return cached.conn
}**/
