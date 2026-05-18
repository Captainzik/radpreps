import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
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

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: session.user.id,
    mode: 'exam',
    completed: false,
    status: { $in: ['in_progress', 'paused'] },
  })

  if (!attempt) {
    return NextResponse.json(
      { success: false, message: 'Attempt not found or not resumable' },
      { status: 404 },
    )
  }
  // Set resumedAt timestamp if this is the first resume (when status is paused)
  // and change status to in_progress so timer calculations are consistent
  if (attempt.status === 'paused' && !attempt.resumedAt) {
    attempt.resumedAt = new Date()
    attempt.status = 'in_progress'
    await attempt.save()
  }

  return NextResponse.json({
    success: true,
    redirectTo: `/exam/attempt/${attemptId}?resume=1`,
  })
}
