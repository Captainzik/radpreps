'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { QuizMode } from '@/lib/modes/types'
import { Clock } from 'lucide-react'
import {
  getCompletionSummaryTimeLabel,
  getExamCountdownDisplay,
} from '@/lib/ui/quiz-timing'

type QuizTimingBadgeProps = {
  mode: QuizMode
  startedAt: Date
  totalQuestions: number
  completedAt?: Date
  timeTakenMs?: number
  showCompletedTime?: boolean
  onExpire?: () => void // CHANGED: still only signals expiry; pause-on-leave is handled by the client wrapper.
}

export function QuizTimingBadge({
  mode,
  startedAt,
  totalQuestions,
  completedAt,
  timeTakenMs,
  showCompletedTime = false,
  onExpire,
}: QuizTimingBadgeProps) {
  const [now, setNow] = useState<Date | null>(null)
  const expiredRef = useRef(false) // CHANGED: avoid duplicate expiry calls.

  useEffect(() => {
    if (mode !== 'exam' || showCompletedTime) return

    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [mode, showCompletedTime])

  const countdown = useMemo(() => {
    if (mode !== 'exam' || showCompletedTime || !now) return null

    return getExamCountdownDisplay({
      mode,
      startedAt,
      totalQuestions,
      now,
    })
  }, [mode, showCompletedTime, now, startedAt, totalQuestions])

  useEffect(() => {
    if (mode !== 'exam' || showCompletedTime || !countdown?.expired) return
    if (expiredRef.current) return

    expiredRef.current = true // CHANGED: lock before notifying parent.
    onExpire?.() // CHANGED: parent decides whether expiry completes or pauses.
  }, [countdown?.expired, mode, onExpire, showCompletedTime])

  const completedLabel = useMemo(() => {
    if (mode !== 'cpd') return undefined

    return getCompletionSummaryTimeLabel({
      mode,
      startedAt,
      completedAt,
      timeTakenMs,
    })
  }, [mode, startedAt, completedAt, timeTakenMs])

  const label =
    mode === 'exam'
      ? countdown?.countdownLabel
      : showCompletedTime
        ? completedLabel
        : completedLabel

  if (mode === 'exam') {
    if (!countdown?.showCountdown || !label) return null
  } else if (!label) {
    return null
  }

  return (
    <div className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'>
      <Clock className='h-4 w-4 text-slate-500 dark:text-slate-400' />
      <span className='font-medium'>{label}</span>
    </div>
  )
}
