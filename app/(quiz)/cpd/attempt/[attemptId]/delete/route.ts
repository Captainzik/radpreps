import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { discardAttempt } from '@/lib/actions/quizAttempt.session'

type RouteContext = {
  params: Promise<{
    attemptId: string
  }>
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { attemptId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 },
    )
  }

  try {
    const deleted = await discardAttempt({
      attemptId,
      userId: session.user.id,
      reason: 'user_ended',
    })

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Attempt not found or already deleted' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'CPD attempt deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete attempt',
      },
      { status: 500 },
    )
  }
}
