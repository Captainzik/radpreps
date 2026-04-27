import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { ZodError } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { EmailToken } from '@/lib/db/models/email-token.model'
import { User } from '@/lib/db/models/user.model'
import { hashToken } from '@/lib/email/resend'
import { ResetPasswordSchema } from '@/lib/validator'

export async function POST(req: NextRequest) {
  await connectToDatabase()

  try {
    const raw = await req.json()
    const payload = ResetPasswordSchema.parse(raw)

    const tokenHash = hashToken(payload.token)

    const tokenRecord = await EmailToken.findOne({
      tokenHash,
      purpose: 'reset-password',
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 400 },
      )
    }

    const user = await User.findById(tokenRecord.user).select('+password')
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 12)

    user.password = hashedPassword
    await user.save()

    tokenRecord.usedAt = new Date()
    await tokenRecord.save()

    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      const confirmPasswordError = error.issues.find(
        (issue) => issue.path?.[0] === 'confirmPassword',
      )

      return NextResponse.json(
        {
          success: false,
          message:
            confirmPasswordError?.message ||
            error.issues[0]?.message ||
            'Failed to reset password',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to reset password',
      },
      { status: 400 },
    )
  }
}
