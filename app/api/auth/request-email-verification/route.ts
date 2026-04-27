import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/lib/db/models/user.model'
import { EmailToken } from '@/lib/db/models/email-token.model'
import { createToken, hashToken, sendVerifyEmail } from '@/lib/email/resend'

const RequestEmailVerificationSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
})

export async function POST(req: NextRequest) {
  await connectToDatabase()

  try {
    const raw = await req.json()
    const payload = RequestEmailVerificationSchema.parse(raw)

    const email = payload.email.trim().toLowerCase()
    const user = await User.findOne({ email })

    // CHANGED: return success even when the user is missing so this endpoint does not reveal account existence.
    if (!user) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (user.isVerified) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    await EmailToken.deleteMany({
      user: user._id,
      purpose: 'verify-email',
    })
    // CHANGED: any older verification token is invalidated before issuing a fresh one.

    const token = createToken()
    const tokenHash = hashToken(token)

    await EmailToken.create({
      user: user._id,
      email: user.email,
      purpose: 'verify-email',
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    })
    // CHANGED: verification links expire after one hour and only the hashed token is stored.

    await sendVerifyEmail({
      to: user.email,
      token,
      fullName: user.fullName,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent',
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send verification email',
      },
      { status: 400 },
    )
  }
}
