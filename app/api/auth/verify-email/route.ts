import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { EmailToken } from '@/lib/db/models/email-token.model'
import { User } from '@/lib/db/models/user.model'
import { hashToken } from '@/lib/email/resend'
import { z } from 'zod'

const VerifyEmailQuerySchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export async function GET(req: NextRequest) {
  await connectToDatabase()

  try {
    const url = new URL(req.url)
    const payload = VerifyEmailQuerySchema.parse({
      token: url.searchParams.get('token') ?? '',
    })

    const tokenHash = hashToken(payload.token)

    const tokenRecord = await EmailToken.findOne({
      tokenHash,
      purpose: 'verify-email',
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 400 },
      )
    }

    const user = await User.findById(tokenRecord.user)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }

    user.isVerified = true
    await user.save()

    tokenRecord.usedAt = new Date()
    await tokenRecord.save()

    return NextResponse.json(
      { success: true, message: 'Email verified successfully' },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to verify email',
      },
      { status: 400 },
    )
  }
}
