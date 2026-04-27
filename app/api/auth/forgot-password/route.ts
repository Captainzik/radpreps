import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/lib/db/models/user.model'
import { EmailToken } from '@/lib/db/models/email-token.model'
import {
  createToken,
  hashToken,
  sendResetPasswordEmail,
} from '@/lib/email/resend'
import { RequestPasswordResetSchema } from '@/lib/validator'

export async function POST(req: NextRequest) {
  await connectToDatabase()

  try {
    const raw = await req.json()
    const payload = RequestPasswordResetSchema.parse(raw)

    const user = await User.findOne({ email: payload.email.toLowerCase() })

    // CHANGED: do not reveal whether the email exists; always return success.
    if (!user) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    await EmailToken.deleteMany({
      user: user._id,
      purpose: 'reset-password',
    })
    // CHANGED: old password reset tokens are invalidated before issuing a new one.

    const token = createToken()
    const tokenHash = hashToken(token)

    await EmailToken.create({
      user: user._id,
      email: user.email,
      purpose: 'reset-password',
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    })
    // CHANGED: reset links expire after 30 minutes.

    await sendResetPasswordEmail({
      to: user.email,
      token,
      fullName: user.fullName,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send reset link',
      },
      { status: 400 },
    )
  }
}
