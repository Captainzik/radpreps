import Image from 'next/image'
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

function Avatar({ src, name }: { src: string; name: string }) {
  if (!src) {
    return (
      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400'>
        {name
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()}
      </div>
    )
  }

  return (
    <div className='relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'>
      <Image
        src={src}
        alt={`${name} avatar`}
        fill
        sizes='40px'
        unoptimized
        className='object-cover'
      />
    </div>
  )
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
    <main className='space-y-4 sm:space-y-6'>
      {/* CHANGED: page header card gets smaller padding on mobile. */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
          Leaderboard
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
          Weekly standings ({period}). Ranked by total score.
        </p>
      </section>

      <section className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        {data.length === 0 ? (
          <div className='p-6 text-center text-sm text-slate-600 dark:text-slate-300 sm:p-8'>
            No leaderboard entries yet this week.
          </div>
        ) : (
          // CHANGED: horizontal scroll is preserved on smaller screens so the table doesn't break layout.
          <div className='overflow-x-auto'>
            <table className='w-full min-w-190'>
              <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300'>
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
                    className='border-t border-slate-100 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300'
                  >
                    <td className='px-4 py-3 font-semibold text-slate-900 dark:text-slate-50'>
                      #{row.rank}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar src={row.avatar} name={row.userName} />
                        <span className='font-medium text-slate-900 dark:text-slate-50'>
                          {row.userName}
                        </span>
                      </div>
                    </td>
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
