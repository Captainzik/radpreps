'use client'

import { useEffect, useState } from 'react'
import { msUntilWeekEnd } from '@/lib/gamification/league-weeks'

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Resetting…'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

export function LeagueCountdown() {
  const [display, setDisplay] = useState(() =>
    formatCountdown(msUntilWeekEnd()),
  )

  useEffect(() => {
    const tick = () => setDisplay(formatCountdown(msUntilWeekEnd()))
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <p className='text-xs text-slate-500 dark:text-slate-400'>
      Resets in{' '}
      <span className='font-semibold text-slate-700 dark:text-slate-200'>
        {display}
      </span>
    </p>
  )
}
