import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { connectToDatabase } from '@/lib/db'
import { getCurrentWeekPeriod } from '@/lib/utils'
import { Leaderboard } from '@/lib/db/models/leaderboard.model'
import mongoose from 'mongoose'

type LeaderboardRow = {
  id: string
  rank: number
  userName: string
  email: string
  avatar: string
  totalScore: number
  quizAttempts: number
  averagePercentage: number
  bestPercentage: number
  lastAttemptAt: Date
}

export default async function LeaderboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/leaderboard')
  }

  await connectToDatabase()

  const period = getCurrentWeekPeriod()

  const rows = (await Leaderboard.find({ period })
    .sort({ totalScore: -1, bestPercentage: -1, lastAttemptAt: 1 })
    .limit(100)
    .populate({
      path: 'user',
      select: 'fullName username email avatar',
    })
    .lean()) as Array<{
    _id: mongoose.Types.ObjectId
    totalScore: number
    quizAttempts: number
    averagePercentage: number
    bestPercentage: number
    lastAttemptAt: Date
    user?: {
      fullName?: string
      username?: string
      email?: string
      avatar?: string
    }
  }>

  const data: LeaderboardRow[] = rows.map((row, index) => ({
    id: row._id.toString(),
    rank: index + 1,
    userName:
      row.user?.fullName ||
      row.user?.username ||
      row.user?.email ||
      'Unknown user',
    email: row.user?.email || '',
    avatar: row.user?.avatar || '',
    totalScore: row.totalScore,
    quizAttempts: row.quizAttempts,
    averagePercentage: row.averagePercentage,
    bestPercentage: row.bestPercentage,
    lastAttemptAt: row.lastAttemptAt,
  }))

  return (
    <main className='space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Leaderboard</h1>
        <p className='mt-1 text-sm text-slate-600'>
          Weekly standings ({period}). Ranked by total score.
        </p>
      </section>

      <section className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
        {data.length === 0 ? (
          <div className='p-8 text-center text-sm text-slate-600'>
            No leaderboard entries yet this week.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-190'>
              <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500'>
                <tr>
                  <th className='px-4 py-3'>Rank</th>
                  <th className='px-4 py-3'>User</th>
                  <th className='px-4 py-3'>Total score</th>
                  <th className='px-4 py-3'>Attempts</th>
                  <th className='px-4 py-3'>Avg %</th>
                  <th className='px-4 py-3'>Best %</th>
                  <th className='px-4 py-3'>Last attempt</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.id}
                    className='border-t border-slate-100 text-sm text-slate-700'
                  >
                    <td className='px-4 py-3 font-semibold text-slate-900'>
                      #{row.rank}
                    </td>
                    <td className='px-4 py-3'>{row.userName}</td>
                    <td className='px-4 py-3'>{row.totalScore}</td>
                    <td className='px-4 py-3'>{row.quizAttempts}</td>
                    <td className='px-4 py-3'>
                      {row.averagePercentage.toFixed(1)}%
                    </td>
                    <td className='px-4 py-3'>
                      {row.bestPercentage.toFixed(1)}%
                    </td>
                    <td className='px-4 py-3'>
                      {new Date(row.lastAttemptAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
