import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { submitAnswerToAttempt } from '@/lib/actions/quizAttempt.submit'
import {
  connectToDatabase,
  QuizAttempt,
} from '@/lib/actions/quizAttempt.shared'
import { completeCpdPart, PART_SIZE } from '@/lib/actions/quizAttempt.cpd-part'

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

  // Load only scalar fields — avoids pulling the full answers array.
  // maxScore = totalQuestions * 10 for CPD, so totalQuestions = maxScore / 10.
  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: session.user.id,
    mode: 'cpd',
    completed: false,
  }).select('maxScore currentQuestionIndex')

  if (!attempt) {
    return NextResponse.json<AnswerResponse>(
      { success: false, message: 'Attempt not found' },
      { status: 404 },
    )
  }

  const totalQuestions = attempt.maxScore / 10
  const currentQIndex = attempt.currentQuestionIndex
  const atPartBoundary = currentQIndex > 0 && currentQIndex % PART_SIZE === 0
  const atEnd = currentQIndex >= totalQuestions

  if (atPartBoundary || atEnd) {
    const partIndex = Math.floor((currentQIndex - 1) / PART_SIZE)
    await completeCpdPart({ attemptId, userId: session.user.id, partIndex })

    return NextResponse.json<AnswerResponse>({
      success: true,
      completed: atEnd,
      redirectTo: `/cpd/attempt/${attemptId}/part/${partIndex}`,
    })
  }

  return NextResponse.json<AnswerResponse>({
    success: true,
    completed: false,
    redirectTo: `/cpd/attempt/${attemptId}`,
  })
}
