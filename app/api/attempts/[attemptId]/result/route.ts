import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getQuizAttemptResult } from '@/lib/actions/quizAttempt.actions'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attemptId } = await context.params

    const result = await getQuizAttemptResult({
      attemptId,
      userId: session.user.id,
    })

    return NextResponse.json({ ok: true, data: result }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch attempt result'

    if (message.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    if (message.toLowerCase().includes('not completed')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
