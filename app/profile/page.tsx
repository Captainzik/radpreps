import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/lib/db/models/user.model'
import { Leaderboard } from '@/lib/db/models/leaderboard.model'
import { getCurrentWeekPeriod } from '@/lib/utils'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/profile')
  }

  await connectToDatabase()

  const [user, weeklyEntry] = await Promise.all([
    User.findById(session.user.id)
      .select(
        'email username fullName currentStreak longestStreak lifetimeTotalScore',
      )
      .lean(),
    Leaderboard.findOne({
      user: session.user.id,
      period: getCurrentWeekPeriod(),
    })
      .select('quizAttempts bestPercentage totalScore')
      .lean(),
  ])

  return (
    <main className='space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Profile</h1>
        <p className='mt-1 text-sm text-slate-600'>
          {user?.fullName || user?.username || user?.email || 'User'}
        </p>
      </section>

      <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
          <p className='text-xs text-slate-500'>Current streak</p>
          <p className='mt-2 text-2xl font-bold text-slate-900'>
            {user?.currentStreak ?? 0}
          </p>
        </article>

        <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
          <p className='text-xs text-slate-500'>Longest streak</p>
          <p className='mt-2 text-2xl font-bold text-slate-900'>
            {user?.longestStreak ?? 0}
          </p>
        </article>

        <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
          <p className='text-xs text-slate-500'>Total XP points</p>
          <p className='mt-2 text-2xl font-bold text-slate-900'>
            {user?.lifetimeTotalScore ?? 0}
          </p>
        </article>

        <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
          <p className='text-xs text-slate-500'>Leaderboard status</p>
          <p className='mt-2 text-sm text-slate-700'>
            {weeklyEntry
              ? `${weeklyEntry.quizAttempts} attempts • best ${weeklyEntry.bestPercentage.toFixed(1)}%`
              : 'No weekly rank yet'}
          </p>
        </article>
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900'>
          Account settings
        </h2>
        <p className='mt-1 text-sm text-slate-600'>
          Manage profile details, password, data reset, and account deletion.
        </p>
        <Link
          href='/profile/update'
          className='mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
        >
          Update profile
        </Link>
      </section>
    </main>
  )
}
