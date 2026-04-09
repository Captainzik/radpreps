import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import { QuizAttempt } from '@/lib/db/models/attempts.model'
import '@/lib/db/models/quiz.model'
import '@/lib/db/models/user.model'

export type GlobalFeedItem = {
  attemptId: string
  userName: string
  quizName: string
  quizId: string
  category: string
  completedAt: Date
  timeAgo: string
  score: number
  maxScore: number
  percentage: number
}

function formatTimeAgo(fromDate: Date, nowDate = new Date()): string {
  const diffMs = Math.max(0, nowDate.getTime() - fromDate.getTime())
  const seconds = Math.floor(diffMs / 1000)

  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`

  const weeks = Math.floor(days / 7)
  if (days < 30) return `${weeks} week${weeks === 1 ? '' : 's'} ago`

  const months = Math.floor(days / 30)
  if (days < 365) return `${months} month${months === 1 ? '' : 's'} ago`

  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export async function getGlobalFeed(params?: { limit?: number }) {
  await connectToDatabase()

  const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200)

  const attempts = await QuizAttempt.find({ completed: true })
    .sort({ completedAt: -1, _id: -1 })
    .limit(limit)
    .populate({ path: 'user', select: 'fullName username email' })
    .populate({ path: 'quiz', select: 'name' })
    .lean()

  const now = new Date()

  return attempts.map((attempt) => {
    const userObj = attempt.user as
      | { fullName?: string; username?: string; email?: string }
      | undefined

    const quizObj = attempt.quiz as
      | { _id?: mongoose.Types.ObjectId; name?: string }
      | undefined

    const completedAt = attempt.completedAt ?? attempt.startedAt

    return {
      attemptId: attempt._id.toString(),
      userName:
        userObj?.fullName || userObj?.username || userObj?.email || 'Someone',
      quizName: quizObj?.name || 'Quiz',
      quizId: quizObj?._id?.toString() || '',
      category: attempt.category || '',
      completedAt,
      timeAgo: formatTimeAgo(new Date(completedAt), now),
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
    } satisfies GlobalFeedItem
  })
}
