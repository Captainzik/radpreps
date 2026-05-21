import Link from 'next/link'
import Image from 'next/image'
import { Flame, Award, Zap, Gem, Heart } from 'lucide-react'
import { User } from '@/lib/db/models/user.model'
import { Wallet } from '@/lib/db/models/wallet.model'
import { Leaderboard } from '@/lib/db/models/leaderboard.model'
import { getCurrentWeekPeriod } from '@/lib/utils'
import { pageBootstrap } from '@/lib/page-conventions'
import { StatCard } from '@/components/gamification/stat-card'
import { LeagueBadge } from '@/components/gamification/leagues'

type ProfileUser = {
  email?: string
  username?: string
  fullName?: string
  currentStreak?: number
  longestStreak?: number
  avatar?: string
}

type WalletData = {
  xp?: number
  gems?: number
  hearts?: number
  leagueTier?: string
}

type WeeklyLeaderboardEntry = {
  quizAttempts?: number
  bestPercentage?: number
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

  const [user, wallet, weeklyEntry] = await Promise.all([
    User.findById(session.user.id)
      .select('email username fullName currentStreak longestStreak avatar')
      .lean(),
    Wallet.findOne({ user: session.user.id })
      .select('xp gems hearts leagueTier')
      .lean(),
    Leaderboard.findOne({
      user: session.user.id,
      period: getCurrentWeekPeriod(),
    })
      .select('quizAttempts bestPercentage')
      .lean(),
  ])

  const profileUser = user as ProfileUser | null
  const walletData = wallet as WalletData | null
  const leaderboardEntry = weeklyEntry as WeeklyLeaderboardEntry | null

  const xp = walletData?.xp ?? 0

  const displayName =
    profileUser?.fullName ||
    profileUser?.username ||
    (user as { email?: string } | null)?.email ||
    'User'

  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* Hero */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
        <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <AvatarPreview avatar={profileUser?.avatar} name={displayName} />
            <div>
              <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                Profile
              </h1>
              <p className='mt-0.5 text-sm text-slate-600 dark:text-slate-300'>
                {displayName}
              </p>
            </div>
          </div>
          <LeagueBadge xp={xp} overrideTier={walletData?.leagueTier} />
        </div>
      </section>

      {/* Gamification stat grid */}
      <section className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4'>
        <StatCard
          icon={<Flame className='h-4 w-4 text-orange-500' />}
          label='Current streak'
          value={profileUser?.currentStreak ?? 0}
        />
        <StatCard
          icon={<Award className='h-4 w-4 text-amber-500' />}
          label='Longest streak'
          value={profileUser?.longestStreak ?? 0}
        />
        <StatCard
          icon={<Zap className='h-4 w-4 text-yellow-500' />}
          label='Total XP'
          value={xp.toLocaleString()}
        />
        <StatCard
          icon={<Gem className='h-4 w-4 text-blue-500' />}
          label='Gems'
          value={walletData?.gems ?? 0}
        />
        <StatCard
          icon={<Heart className='h-4 w-4 text-rose-500' />}
          label='Hearts'
          value={walletData?.hearts ?? 5}
        />
        <article className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            Weekly rank
          </p>
          <p className='mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300'>
            {leaderboardEntry
              ? `${leaderboardEntry.quizAttempts ?? 0} attempts`
              : 'No rank yet'}
          </p>
          {leaderboardEntry?.bestPercentage != null && (
            <p className='text-xs text-slate-400 dark:text-slate-500'>
              Best {leaderboardEntry.bestPercentage.toFixed(1)}%
            </p>
          )}
        </article>
      </section>

      {/* Account settings */}
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
