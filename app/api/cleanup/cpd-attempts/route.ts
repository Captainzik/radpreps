import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, QuizAttempt } from '@/lib/actions/quizAttempt.shared'
import { discardAttempt } from '@/lib/actions/quizAttempt.session'

/**
 * Cleanup old unfinished CPD attempts (>= 24 hours old)
 *
 * This endpoint should be called by a scheduled job/cron to prevent
 * database bloat from abandoned CPD attempts.
 *
 * Security: Add your own authentication mechanism before deploying to production
 * For example: verify API key, check authorization header, etc.
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication here before deploying to production
    // Example: verify API key from headers
    // const apiKey = req.headers.get('x-api-key')
    // if (apiKey !== process.env.CLEANUP_API_KEY) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    // }

    await connectToDatabase()

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find old unfinished CPD attempts
    const oldCpdAttempts = await QuizAttempt.find({
      mode: 'cpd',
      completed: false,
      $or: [
        { createdAt: { $lte: twentyFourHoursAgo } },
        { startedAt: { $lte: twentyFourHoursAgo } },
      ],
    })
      .select('_id user')
      .lean()

    let deletedCount = 0
    const errors: string[] = []

    // Delete each attempt
    for (const attempt of oldCpdAttempts) {
      try {
        await discardAttempt({
          attemptId: attempt._id.toString(),
          userId: attempt.user.toString(),
          reason: 'cleanup_old',
        })
        deletedCount++
      } catch (error) {
        errors.push(
          `Failed to delete attempt ${attempt._id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed`,
      deletedCount,
      totalFound: oldCpdAttempts.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('CPD cleanup error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cleanup CPD attempts',
      },
      { status: 500 },
    )
  }
}
