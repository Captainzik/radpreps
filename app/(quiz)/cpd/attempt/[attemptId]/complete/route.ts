import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  connectToDatabase,
  QuizAttempt,
} from '@/lib/actions/quizAttempt.shared' // CHANGED: shared export is valid and keeps model access consistent.
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.result'

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
    completed: false,
    mode: 'cpd', // CHANGED: ensure this completion route only applies to CPD attempts.
  })

  if (!attempt) {
    return NextResponse.redirect(new URL(`/cpd/attempt/${attemptId}`, req.url))
  }

  await completeQuizAttempt({
    attemptId,
    userId: session.user.id,
  })

  return NextResponse.redirect(
    new URL(`/cpd/attempt/${attemptId}/result`, req.url),
  )
}
