import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { User } from '@/lib/db/models/user.model'
import { CreateUserSchema } from '@/lib/validator'
import { connectToDatabase } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    const body: unknown = await req.json()
    const parsed = CreateUserSchema.parse(body)

    const email = parsed.email.trim().toLowerCase()
    const username = parsed.username?.trim() || undefined
    const fullName = parsed.fullName?.trim() || undefined
    const avatar = parsed.avatar?.trim() || ''

    const existingEmail = await User.findOne({ email }).lean()
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'Email already in use' },
        { status: 409 },
      )
    }

    if (username) {
      const existingUsername = await User.findOne({ username }).lean()
      if (existingUsername) {
        return NextResponse.json(
          { success: false, message: 'Username already in use' },
          { status: 409 },
        )
      }
    }

    const hashed = await bcrypt.hash(parsed.password, 12)

    const user = await User.create({
      email,
      username,
      password: hashed,
      fullName,
      avatar,
      role: 'user',
      isVerified: false,
      favoriteCategories: [],
      lifetimeTotalScore: 0,
      currentStreak: 0,
      longestStreak: 0,
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
        },
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Signup failed'

    const isConnectionError =
      message.includes('Database connection failed') ||
      message.includes('MONGODB_URI') ||
      message.includes('buffering timed out') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND')

    return NextResponse.json(
      { success: false, message },
      { status: isConnectionError ? 500 : 400 },
    )
  }
}
