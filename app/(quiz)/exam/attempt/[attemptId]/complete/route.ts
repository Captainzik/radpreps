import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.result'
import {
  connectToDatabase,
  QuizAttempt,
} from '@/lib/actions/quizAttempt.shared'

type RouteContext = {
  params: Promise<{
    attemptId: string
  }>
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  await connectToDatabase()
  const { attemptId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: session.user.id,
    mode: 'exam',
    completed: false,
    status: { $in: ['in_progress', 'paused'] },
  }).lean()

  if (!attempt) {
    return NextResponse.json(
      { success: false, message: 'Attempt not found' },
      { status: 404 },
    )
  }

  const result = await completeQuizAttempt({
    attemptId,
    userId: session.user.id,
  })

  return NextResponse.json({
    success: true,
    ...result,
  })
}
