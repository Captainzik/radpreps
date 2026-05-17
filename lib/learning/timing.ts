import type { QuizMode } from '@/lib/modes/types'

export function formatDuration(ms: number) {
  const safeMs = Math.max(0, ms)
  const totalSeconds = Math.floor(safeMs / 1000)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms)
  const totalSeconds = Math.ceil(safeMs / 1000)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function getElapsedMs(startedAt: Date, endedAt = new Date()) {
  return Math.max(0, endedAt.getTime() - startedAt.getTime())
}

export function getQuestionTimeLimitMs(mode: QuizMode) {
  if (mode !== 'exam') return undefined
  return 30_000
}

export function getExamCheckpointDeadlineMs(totalQuestions: number) {
  return Math.max(1, totalQuestions) * 30_000
}

export function getResumeCheckpointDeadlineMs(params: {
  totalQuestions: number
  checkpointIndex?: number
}) {
  // CHANGED: resume timer is based only on the remaining questions.
  const checkpointIndex = Math.max(0, params.checkpointIndex ?? 0)
  const remainingQuestions = Math.max(
    0,
    params.totalQuestions - checkpointIndex,
  )
  return remainingQuestions * 30_000
}

export function shouldForceExamTimeout(params: {
  mode: QuizMode
  startedAt: Date
  now?: Date
  totalQuestions: number
  checkpointIndex?: number
  resume?: boolean
}) {
  if (params.mode !== 'exam') return false

  const now = params.now ?? new Date()

  // CHANGED: resume uses remaining-question budget only; normal flow stays anchored to startedAt.
  const maxAllowed = params.resume
    ? getResumeCheckpointDeadlineMs({
        totalQuestions: params.totalQuestions,
        checkpointIndex: params.checkpointIndex,
      })
    : getExamCheckpointDeadlineMs(params.totalQuestions)

  const elapsed = getElapsedMs(params.startedAt, now)

  return elapsed >= maxAllowed
}

export function getReadableTimeTaken(startedAt: Date, completedAt?: Date) {
  const end = completedAt ?? new Date()
  return formatDuration(getElapsedMs(startedAt, end))
}

export function getActiveAttemptTimerState(params: {
  mode: QuizMode
  startedAt: Date
  totalQuestions: number
  now?: Date
  checkpointIndex?: number
  resume?: boolean
}) {
  if (params.mode !== 'exam') {
    return {
      showTimer: false,
      remainingMs: undefined,
      totalMs: undefined,
      expired: false,
      countdownLabel: undefined,
    }
  }

  const now = params.now ?? new Date()

  // CHANGED: normal exam timer is anchored to startedAt; resume timer is based on remaining questions only.
  const totalMs = params.resume
    ? getResumeCheckpointDeadlineMs({
        totalQuestions: params.totalQuestions,
        checkpointIndex: params.checkpointIndex,
      })
    : getExamCheckpointDeadlineMs(params.totalQuestions)

  const remainingMs = params.resume
    ? totalMs
    : Math.max(0, totalMs - getElapsedMs(params.startedAt, now))

  return {
    showTimer: true,
    remainingMs,
    totalMs,
    expired: remainingMs === 0,
    countdownLabel: formatCountdown(remainingMs),
  }
}
