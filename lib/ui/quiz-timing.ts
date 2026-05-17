import type { QuizMode } from '@/lib/modes/types'
import {
  formatDuration,
  getActiveAttemptTimerState,
  getReadableTimeTaken,
} from '@/lib/learning/timing'

export function getExamCountdownDisplay(params: {
  mode: QuizMode
  startedAt: Date
  totalQuestions: number
  checkpointIndex?: number
  resume?: boolean
  now?: Date
}) {
  const state = getActiveAttemptTimerState({
    mode: params.mode,
    startedAt: params.startedAt,
    totalQuestions: params.totalQuestions,
    checkpointIndex: params.checkpointIndex,
    resume: params.resume,
    now: params.now,
  })

  return {
    showCountdown: state.showTimer,
    countdownLabel: state.countdownLabel ?? '0:00',
    remainingMs: state.remainingMs ?? 0,
    expired: state.expired,
  }
}

export function getCpdSummaryTimeDisplay(params: {
  startedAt: Date
  completedAt?: Date
  timeTakenMs?: number
}) {
  const elapsedMs =
    typeof params.timeTakenMs === 'number'
      ? params.timeTakenMs
      : params.completedAt
        ? params.completedAt.getTime() - params.startedAt.getTime()
        : Date.now() - params.startedAt.getTime()

  return {
    rawMs: Math.max(0, elapsedMs),
    display: formatDuration(Math.max(0, elapsedMs)),
    readable: getReadableTimeTaken(params.startedAt, params.completedAt),
  }
}

export function getExamTimerLabel(params: {
  mode: QuizMode
  startedAt: Date
  totalQuestions: number
  checkpointIndex?: number
  resume?: boolean
  now?: Date
}) {
  const countdown = getExamCountdownDisplay(params)

  return countdown.showCountdown ? countdown.countdownLabel : undefined
}

export function getCompletionSummaryTimeLabel(params: {
  mode: QuizMode
  startedAt: Date
  completedAt?: Date
  timeTakenMs?: number
}) {
  if (params.mode !== 'cpd') return undefined

  return getCpdSummaryTimeDisplay({
    startedAt: params.startedAt,
    completedAt: params.completedAt,
    timeTakenMs: params.timeTakenMs,
  }).display
}
