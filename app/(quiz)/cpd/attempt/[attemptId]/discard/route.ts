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

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  await connectToDatabase()
  const { attemptId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const attempt = await QuizAttempt.findOneAndDelete({
    _id: attemptId,
    user: session.user.id,
    mode: 'cpd',
    completed: false,
    status: { $in: ['in_progress', 'paused'] },
  })

  if (!attempt) {
    return NextResponse.json(
      { success: false, message: 'Attempt not found or already completed' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true })
}
