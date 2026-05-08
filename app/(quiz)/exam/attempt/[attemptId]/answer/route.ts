import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { submitAnswerToAttempt } from '@/lib/actions/quizAttempt.submit'
import {
  connectToDatabase,
  QuizAttempt,
} from '@/lib/actions/quizAttempt.shared' // CHANGED: import QuizAttempt to validate resume state explicitly.

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

  const formData = await req.formData()
  const questionId = String(formData.get('questionId') || '')
  const selectedOptionIndexRaw = String(
    formData.get('selectedOptionIndex') || '',
  )
  const selectedOptionIndex = Number(selectedOptionIndexRaw)

  if (!questionId || Number.isNaN(selectedOptionIndex)) {
    return NextResponse.redirect(
      new URL(`/exam/attempt/${attemptId}`, req.url), // CHANGED: exam-specific invalid-form fallback.
    )
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: session.user.id,
    mode: 'exam', // CHANGED: ensure this answer submission belongs to an exam attempt.
    completed: false,
    status: { $in: ['in_progress', 'paused'] }, // CHANGED: explicit resume-state validation before updating answers.
  }).lean()

  if (!attempt) {
    return NextResponse.redirect(
      new URL(`/exam/attempt/${attemptId}`, req.url), // CHANGED: redirect back to the runner if the attempt is not resumable.
    )
  }

  await submitAnswerToAttempt({
    attemptId,
    userId: session.user.id,
    questionId,
    selectedOptionIndex,
  })

  return NextResponse.redirect(
    new URL(`/exam/attempt/${attemptId}`, req.url), // CHANGED: exam-specific post-submit redirect keeps resume flow intact.
  )
}
