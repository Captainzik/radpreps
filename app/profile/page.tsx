import Link from 'next/link'
import Image from 'next/image'
import { User } from '@/lib/db/models/user.model'
import { Leaderboard } from '@/lib/db/models/leaderboard.model'
import { getCurrentWeekPeriod } from '@/lib/utils'
import { pageBootstrap } from '@/lib/page-conventions'

type ProfileUser = {
  email?: string
  username?: string
  fullName?: string
  currentStreak?: number
  longestStreak?: number
  lifetimeTotalScore?: number
  avatar?: string
}

type WeeklyLeaderboardEntry = {
  quizAttempts?: number
  bestPercentage?: number
  totalScore?: number
}

function AvatarPreview({ avatar, name }: { avatar?: string; name: string }) {
  if (!avatar) {
    return (
      <div className='flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300'>
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
    <div className='relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'>
      <Image
        src={avatar}
        alt={`${name} avatar`}
        fill
        sizes='80px'
        unoptimized
        className='object-cover'
      />
    </div>
  )
}

export default async function ProfilePage() {
  const session = await pageBootstrap('/profile')

  const [user, weeklyEntry] = await Promise.all([
    User.findById(session.user.id)
      .select(
        'email username fullName currentStreak longestStreak lifetimeTotalScore avatar',
      )
      .lean(),
    Leaderboard.findOne({
      user: session.user.id,
      period: getCurrentWeekPeriod(),
    })
      .select('quizAttempts bestPercentage totalScore')
      .lean(),
  ])

  const profileUser = user as ProfileUser | null
  const leaderboardEntry = weeklyEntry as WeeklyLeaderboardEntry | null

  const displayName =
    profileUser?.fullName ||
    profileUser?.username ||
    profileUser?.email ||
    'User'

  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* CHANGED: profile hero card gets smaller padding on mobile. */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
        <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
          <AvatarPreview avatar={profileUser?.avatar} name={displayName} />
          <div>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
              Profile
            </h1>
            <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
              {displayName}
            </p>
          </div>
        </div>
      </section>

      {/* CHANGED: stat cards stack naturally on small screens. */}
      <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            Current streak
          </p>
          <p className='mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50'>
            {profileUser?.currentStreak ?? 0}
          </p>
        </article>

        <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            Longest streak
          </p>
          <p className='mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50'>
            {profileUser?.longestStreak ?? 0}
          </p>
        </article>

        <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            Total XP points
          </p>
          <p className='mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50'>
            {profileUser?.lifetimeTotalScore ?? 0}
          </p>
        </article>

        <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            Leaderboard status
          </p>
          <p className='mt-2 text-sm text-slate-700 dark:text-slate-300'>
            {leaderboardEntry
              ? `${leaderboardEntry.quizAttempts ?? 0} attempts • best ${(leaderboardEntry.bestPercentage ?? 0).toFixed(1)}%`
              : 'No weekly rank yet'}
          </p>
        </article>
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
          Account settings
        </h2>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
          Manage profile details, password, reset data, and account deletion.
        </p>
        <Link
          href='/profile/update'
          className='mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
        >
          Update profile
        </Link>
      </section>
    </main>
  )
}
