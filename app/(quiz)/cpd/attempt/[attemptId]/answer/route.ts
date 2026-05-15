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

type AnswerResponse =
  | {
      success: true
      completed: boolean
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
    return NextResponse.json<AnswerResponse>(
      { success: false, message: 'Unauthorized' },
      { status: 401 },
    )
  }

  const formData = await req.formData()
  const questionId = String(formData.get('questionId') || '').trim()
  const selectedOptionIndexRaw = String(
    formData.get('selectedOptionIndex') || '',
  )
  const selectedOptionIndex = Number(selectedOptionIndexRaw)

  if (!questionId || Number.isNaN(selectedOptionIndex)) {
    return NextResponse.json<AnswerResponse>(
      { success: false, message: 'Invalid answer payload' },
      { status: 400 },
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
    mode: 'cpd',
    completed: false,
  }).select('answers')

  if (!attempt) {
    return NextResponse.json<AnswerResponse>(
      { success: false, message: 'Attempt not found' },
      { status: 404 },
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

    return NextResponse.json<AnswerResponse>({
      success: true,
      completed: true,
      redirectTo: `/cpd/attempt/${attemptId}/result`,
    })
  }

  return NextResponse.json<AnswerResponse>({
    success: true,
    completed: false,
    redirectTo: `/cpd/attempt/${attemptId}`,
  })
}
