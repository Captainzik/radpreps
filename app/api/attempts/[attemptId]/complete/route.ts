import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.actions'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attemptId } = await context.params
    const body = await req.json().catch(() => ({}))
    const attemptKey =
      typeof body?.attemptKey === 'string' ? body.attemptKey : undefined

    const result = await completeQuizAttempt({
      attemptId,
      userId: session.user.id,
      attemptKey,
    })

    return NextResponse.json({ ok: true, data: result }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to complete attempt'

    if (message.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
