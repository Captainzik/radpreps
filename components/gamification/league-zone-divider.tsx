import { ArrowUp, ArrowDown } from 'lucide-react'
import { LEAGUES } from '@/lib/gamification/leagues'

interface Props {
  type: 'promotion' | 'demotion'
  tierRank: number
}

export function LeagueZoneDivider({ type, tierRank }: Props) {
  const isPromotion = type === 'promotion'

  const nextTier = LEAGUES.find((l) => l.rank === tierRank + 1)
  const prevTier = LEAGUES.find((l) => l.rank === tierRank - 1)

  const label = isPromotion
    ? `Promotion zone — top 5 advance to ${nextTier?.name ?? 'next tier'}`
    : `Demotion zone — bottom players drop to ${prevTier?.name ?? 'prior tier'}`

  return (
    <li
      role='separator'
      className={`flex items-center gap-2 px-4 py-2 sm:px-6 ${
        isPromotion
          ? 'bg-emerald-50 dark:bg-emerald-950/30'
          : 'bg-red-50 dark:bg-red-950/30'
      }`}
    >
      {isPromotion ? (
        <ArrowUp
          strokeWidth={3}
          className='h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400'
        />
      ) : (
        <ArrowDown
          strokeWidth={3}
          className='h-4 w-4 shrink-0 text-red-600 dark:text-red-400'
        />
      )}
      <span
        className={`text-xs font-semibold ${
          isPromotion
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-red-700 dark:text-red-400'
        }`}
      >
        {label}
      </span>
    </li>
  )
}
