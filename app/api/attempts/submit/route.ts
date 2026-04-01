// app/api/attempts/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { submitQuizAttempt } from '@/lib/actions/quizAttempt.actions'
import { SubmitQuizAttemptSchema } from '@/lib/validator'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const payload = SubmitQuizAttemptSchema.parse(body)

    const result = await submitQuizAttempt(session.user.id, payload)

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error: unknown) {
    console.error('Submit attempt error:', error)

    // Explicit narrowing for ZodError
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit attempt',
        details: message,
      },
      { status: 500 },
    )
  }
}
