import type { LearningCheckpoint, SaveCheckpointInput } from './session.types' // CHANGED: checkpoint logic stays reusable and session-agnostic.

export function getCheckpointFloorIndex(answeredCount: number, interval = 10) {
  if (interval <= 0) return 0
  if (answeredCount <= 0) return 0

  // CHANGED: checkpoint floor is 0, 10, 20... based on answered count.
  return Math.floor(answeredCount / interval) * interval
}

export function buildCheckpoint(
  input: SaveCheckpointInput,
  savedAt = new Date(),
): LearningCheckpoint {
  const percentage =
    input.maxScore > 0 ? (input.score / input.maxScore) * 100 : 0

  const checkpointIndex = getCheckpointFloorIndex(input.answeredCount, 10) // CHANGED: save the checkpoint floor, not the current question index.

  return {
    checkpointIndex, // CHANGED: authoritative resume anchor.
    questionIndex: input.questionIndex, // CHANGED: live progression pointer retained separately.
    answeredCount: input.answeredCount,
    score: input.score,
    maxScore: input.maxScore,
    percentage,
    savedAt,
  }
}

export function shouldSaveCheckpoint(
  questionIndex: number,
  totalQuestions: number,
  interval = 10,
) {
  if (totalQuestions <= 0) return false
  if (questionIndex < 0) return false
  if (interval <= 0) return false

  const isLastQuestion = questionIndex >= totalQuestions - 1
  const isIntervalCheckpoint = (questionIndex + 1) % interval === 0

  return isLastQuestion || isIntervalCheckpoint
}

export function getNextResumeQuestionIndex(checkpoint: LearningCheckpoint) {
  // CHANGED: resume from the checkpoint floor, not the next question after the last seen question.
  return Math.max(0, checkpoint.checkpointIndex)
}

export function shouldForceCompleteOnTimeout(
  elapsedMs: number,
  questionTimeLimitMs = 60_000,
  totalQuestions: number,
) {
  const maxAllowedMs = Math.max(1, totalQuestions) * questionTimeLimitMs
  return elapsedMs >= maxAllowedMs
}
