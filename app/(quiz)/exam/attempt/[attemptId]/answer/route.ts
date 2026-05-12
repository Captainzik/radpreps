import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { submitAnswerToAttempt } from '@/lib/actions/quizAttempt.submit'
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
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 },
    )
  }

  const formData = await req.formData()
  const questionId = String(formData.get('questionId') || '')
  const selectedOptionIndexRaw = String(
    formData.get('selectedOptionIndex') || '',
  )
  const selectedOptionIndex = Number(selectedOptionIndexRaw)

  if (!questionId || Number.isNaN(selectedOptionIndex)) {
    return NextResponse.json(
      { success: false, message: 'Invalid submission payload' },
      { status: 400 },
    )
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: session.user.id,
    mode: 'exam',
    completed: false,
    status: { $in: ['in_progress', 'paused'] },
  })
    .select('answers mode completed')
    .lean()

  if (!attempt) {
    return NextResponse.json(
      { success: false, message: 'Attempt not found or not resumable' },
      { status: 404 },
    )
  }

  await submitAnswerToAttempt({
    attemptId,
    userId: session.user.id,
    questionId,
    selectedOptionIndex,
  })

  const answeredCount = attempt.answers.filter(
    (a) => typeof a.selectedOptionIndex === 'number',
  ).length

  const totalQuestions = attempt.answers.length

  if (answeredCount >= totalQuestions) {
    await completeQuizAttempt({
      attemptId,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      completed: true,
      redirectTo: `/exam/attempt/${attemptId}/result`,
    })
  }

  return NextResponse.json({
    success: true,
    completed: false,
    redirectTo: `/exam/attempt/${attemptId}`,
  })
}
