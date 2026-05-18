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

  let questionId = ''

  // Handle both FormData and URL-encoded form data
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    // Handle URL-encoded data (from sendBeacon)
    const text = await req.text()
    const params = new URLSearchParams(text)
    questionId = String(params.get('questionId') || '').trim()
  } else {
    // Handle FormData (from regular fetch)
    const formData = await req.formData()
    questionId = String(formData.get('questionId') || '').trim()
  }

  if (!questionId) {
    return NextResponse.json(
      { success: false, message: 'Invalid pause payload' },
      { status: 400 },
    )
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
      { success: false, message: 'Attempt not found or not resumable' },
      { status: 404 },
    )
  }

  await saveCheckpoint({
    attemptId,
    userId: session.user.id,
    questionsAnswered: attempt.questionsAnswered ?? 0,
    currentQuestionIndex: attempt.currentQuestionIndex ?? 0,
    pauseAfterSave: true,
  })

  return NextResponse.json({
    success: true,
    attemptId,
    questionId,
    currentQuestionIndex: attempt.currentQuestionIndex ?? 0,
    questionsAnswered: attempt.questionsAnswered ?? 0,
    paused: true,
  })
}
