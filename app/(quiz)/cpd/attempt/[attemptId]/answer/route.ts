import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { submitAnswerToAttempt } from '@/lib/actions/quizAttempt.submit'
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.result'
import {
  connectToDatabase,
  QuizAttempt,
} from '@/lib/actions/quizAttempt.shared' // CHANGED: shared export is valid and keeps model access consistent.

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
      new URL(`/cpd/attempt/${attemptId}`, req.url), // CHANGED: invalid payload returns to the current CPD attempt page.
    )
  }

  await submitAnswerToAttempt({
    attemptId,
    userId: session.user.id,
    questionId,
    selectedOptionIndex,
  })

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: session.user.id,
    mode: 'cpd', // CHANGED: ensure this flow only touches CPD attempts.
    completed: false,
  }).select('answers')

  if (!attempt) {
    return NextResponse.redirect(
      new URL(`/cpd/attempt/${attemptId}`, req.url), // CHANGED: safe fallback if the attempt cannot be loaded.
    )
  }

  const answeredCount = attempt.answers.filter(
    (a) => typeof a.selectedOptionIndex === 'number',
  ).length

  const totalQuestions = attempt.answers.length

  if (answeredCount >= totalQuestions) {
    await completeQuizAttempt({
      attemptId,
      userId: session.user.id,
    })

    return NextResponse.redirect(
      new URL(`/cpd/attempt/${attemptId}/result`, req.url), // CHANGED: final CPD answer now goes directly to the result summary page.
    )
  }

  // CHANGED: CPD still advances through questions one-by-one; this is not a resume flow.
  return NextResponse.redirect(new URL(`/cpd/attempt/${attemptId}`, req.url))
}
