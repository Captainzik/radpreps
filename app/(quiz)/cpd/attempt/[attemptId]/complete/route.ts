import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  connectToDatabase,
  QuizAttempt,
} from '@/lib/actions/quizAttempt.shared'
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.result'

type RouteContext = {
  params: Promise<{
    attemptId: string
  }>
}

type CompleteResponse =
  | {
      success: true
      redirectTo: string
    }
  | {
      success: false
      message: string
    }

export async function POST(req: NextRequest, { params }: RouteContext) {
  await connectToDatabase()

  const { attemptId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json<CompleteResponse>(
      { success: false, message: 'Unauthorized' },
      { status: 401 },
    )
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: session.user.id,
    completed: false,
    mode: 'cpd',
  })

  if (!attempt) {
    return NextResponse.json<CompleteResponse>(
      { success: false, message: 'Attempt not found' },
      { status: 404 },
    )
  }

  await completeQuizAttempt({
    attemptId,
    userId: session.user.id,
  })

  return NextResponse.json<CompleteResponse>({
    success: true,
    redirectTo: `/cpd/attempt/${attemptId}/result`,
  })
}
