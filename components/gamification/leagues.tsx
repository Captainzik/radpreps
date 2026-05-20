import { Shield } from 'lucide-react'
import type { LeagueTier } from '@/lib/gamification/leagues'
import { LEAGUES, getLeagueProgress } from '@/lib/gamification/leagues'

// Tier colour map — kept here so both the progress section and tiers list use the same palette.
export const TIER_STYLES: Record<
  string,
  { text: string; bg: string; border: string; bar: string }
> = {
  Bronze: {
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    bar: 'bg-amber-400 dark:bg-amber-500',
  },
  Silver: {
    text: 'text-slate-500 dark:text-slate-300',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-300 dark:border-slate-600',
    bar: 'bg-slate-400 dark:bg-slate-400',
  },
  Gold: {
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-300 dark:border-yellow-700',
    bar: 'bg-yellow-400 dark:bg-yellow-500',
  },
  Platinum: {
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-300 dark:border-cyan-700',
    bar: 'bg-cyan-400 dark:bg-cyan-500',
  },
  Diamond: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-300 dark:border-blue-700',
    bar: 'bg-blue-400 dark:bg-blue-500',
  },
  Elite: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-300 dark:border-purple-700',
    bar: 'bg-purple-400 dark:bg-purple-500',
  },
  Master: {
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-300 dark:border-rose-700',
    bar: 'bg-rose-400 dark:bg-rose-500',
  },
  Legend: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-300 dark:border-orange-700',
    bar: 'bg-orange-400 dark:bg-orange-500',
  },
  Champion: {
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-300 dark:border-indigo-700',
    bar: 'bg-indigo-400 dark:bg-indigo-500',
  },
  GOAT: {
    text: 'text-yellow-500 dark:text-yellow-300',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-400 dark:border-yellow-600',
    bar: 'bg-yellow-400 dark:bg-yellow-400',
  },
}

const DEFAULT_STYLE = TIER_STYLES['Bronze']

export function getTierStyle(name: string) {
  return TIER_STYLES[name] ?? DEFAULT_STYLE
}

// ─── Current league badge (used on profile + league page) ───────────────────

export function LeagueBadge({
  xp,
  overrideTier,
}: {
  xp: number
  overrideTier?: string
}) {
  const { league } = getLeagueProgress(xp)
  const tierName = overrideTier ?? league.name
  const style = getTierStyle(tierName)
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${style.bg} ${style.border}`}
    >
      <Shield className={`h-4 w-4 ${style.text}`} />
      <span className={`text-sm font-bold ${style.text}`}>{tierName}</span>
    </div>
  )
}

// ─── XP progress bar ────────────────────────────────────────────────────────

export function LeagueProgress({ xp }: { xp: number }) {
  const { league, nextLeague, progressPercent } = getLeagueProgress(xp)
  const style = getTierStyle(league.name)
  const nextStyle = nextLeague ? getTierStyle(nextLeague.name) : null

  return (
    <div className='space-y-2'>
      <div className='flex items-end justify-between'>
        <div>
          <p className='text-xs text-slate-500 dark:text-slate-400'>Your XP</p>
          <p className='text-3xl font-bold text-slate-900 dark:text-slate-50'>
            {xp.toLocaleString()}
          </p>
        </div>
        {nextLeague && nextStyle ? (
          <p className='text-right text-xs text-slate-500 dark:text-slate-400'>
            {(nextLeague.minXp - xp).toLocaleString()} XP to{' '}
            <span className={`font-semibold ${nextStyle.text}`}>
              {nextLeague.name}
            </span>
          </p>
        ) : (
          <p className='text-xs font-semibold text-yellow-500 dark:text-yellow-400'>
            Max rank reached 🏆
          </p>
        )}
      </div>

      <div className='h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800'>
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className='flex justify-between text-xs text-slate-400 dark:text-slate-500'>
        <span>{league.minXp.toLocaleString()} XP</span>
        <span>
          {nextLeague ? `${nextLeague.minXp.toLocaleString()} XP` : '∞'}
        </span>
      </div>
    </div>
  )
}

// ─── All tiers list ──────────────────────────────────────────────────────────

export function LeagueTierList({ xp }: { xp: number }) {
  const { league: current } = getLeagueProgress(xp)

  return (
    <ul className='divide-y divide-slate-100 dark:divide-slate-800'>
      {LEAGUES.map((tier: LeagueTier) => {
        const ts = getTierStyle(tier.name)
        const isCurrent = tier.rank === current.rank
        const isUnlocked = xp >= tier.minXp

        return (
          <li
            key={tier.rank}
            className={`flex items-center justify-between px-4 py-3 sm:px-6 ${isCurrent ? ts.bg : ''}`}
          >
            <div className='flex items-center gap-3'>
              <Shield
                className={`h-5 w-5 shrink-0 ${
                  isUnlocked ? ts.text : 'text-slate-300 dark:text-slate-600'
                }`}
              />
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isCurrent
                      ? ts.text
                      : isUnlocked
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {tier.name}
                  {isCurrent && (
                    <span className='ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900'>
                      Current
                    </span>
                  )}
                </p>
                <p className='text-xs text-slate-400 dark:text-slate-500'>
                  {tier.maxXp === Number.MAX_SAFE_INTEGER
                    ? `${tier.minXp.toLocaleString()}+ XP`
                    : `${tier.minXp.toLocaleString()} – ${tier.maxXp.toLocaleString()} XP`}
                </p>
              </div>
            </div>
            {isUnlocked && !isCurrent && (
              <span className='text-xs text-slate-400 dark:text-slate-500'>
                ✓ Unlocked
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
