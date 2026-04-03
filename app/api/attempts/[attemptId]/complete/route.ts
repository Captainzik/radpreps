import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth' // adjust if your auth helper path is different
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.actions'

type RouteContext = {
  params: {
    attemptId: string
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const attemptKey =
      typeof body?.attemptKey === 'string' ? body.attemptKey : undefined

    const result = await completeQuizAttempt({
      attemptId: params.attemptId,
      userId: session.user.id,
      attemptKey,
    })

    return NextResponse.json(
      {
        ok: true,
        data: result,
      },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to complete attempt'

    if (message.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
