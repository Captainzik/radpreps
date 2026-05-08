import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { saveCheckpoint } from '@/lib/actions/quizAttempt.session'
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

  const formData = await req.formData()
  const questionId = String(formData.get('questionId') || '')
  const currentQuestionIndexRaw = String(
    formData.get('currentQuestionIndex') || '',
  )
  const questionsAnsweredRaw = String(formData.get('questionsAnswered') || '')

  const currentQuestionIndex = Number(currentQuestionIndexRaw)
  const questionsAnswered = Number(questionsAnsweredRaw)

  if (
    !questionId ||
    Number.isNaN(currentQuestionIndex) ||
    Number.isNaN(questionsAnswered)
  ) {
    return NextResponse.json(
      { success: false, message: 'Invalid pause payload' },
      { status: 400 },
    )
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: session.user.id,
    mode: 'exam', // CHANGED: pause is only valid for exam attempts in this flow.
    completed: false,
    status: { $in: ['in_progress', 'paused'] }, // CHANGED: only resumable attempts can be paused.
  }).lean()

  if (!attempt) {
    return NextResponse.json(
      { success: false, message: 'Attempt not found or not resumable' },
      { status: 404 },
    )
  }

  await saveCheckpoint({
    attemptId,
    userId: session.user.id,
    questionsAnswered,
    currentQuestionIndex,
    pauseAfterSave: true, // CHANGED: explicit pause path; this is what enables resume-from-checkpoint.
  })

  return NextResponse.json({
    success: true,
    attemptId,
    questionId,
    currentQuestionIndex,
    questionsAnswered,
    paused: true, // CHANGED: makes the client/server intent explicit in the response.
  })
}
