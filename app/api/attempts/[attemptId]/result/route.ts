import { NextResponse } from 'next/server'
import { auth } from '@/auth' // adjust if your auth helper path is different
import { getQuizAttemptResult } from '@/lib/actions/quizAttempt.actions'

type RouteContext = {
  params: {
    attemptId: string
  }
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getQuizAttemptResult({
      attemptId: params.attemptId,
      userId: session.user.id,
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
