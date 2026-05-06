import {
  connectToDatabase,
  Quiz,
  QuizAttempt,
  getAttemptMode,
  getResultVisibility,
  buildAudioEventEnvelope,
} from './quizAttempt.shared'
import type { IQuizAttempt } from '../db/models/attempts.model'
import { getModeRules } from '@/lib/modes/rules'
import {
  findUnfinishedAttempt,
  type AttemptSessionResult, // CHANGED: use the shared session/start result shape.
} from './quizAttempt.session'

export async function startQuizAttempt(input: {
  quizId: string
  userId: string
  attemptKey?: string
  mode?: 'exam' | 'cpd'
}): Promise<AttemptSessionResult> {
  await connectToDatabase()

  const { quizId, userId, attemptKey } = input

  if (!input.mode) {
    throw new Error('Mode is required for starting an attempt from a route')
  } // CHANGED: require explicit mode so route-driven attempts cannot fall back to the wrong mode.

  const quiz = await Quiz.findById(quizId)
    .select('_id questions allowedModes')
    .lean()

  if (!quiz) throw new Error('Quiz not found')
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('Quiz has no questions')
  }

  const mode = getAttemptMode({
    mode: input.mode,
    allowedModes: quiz.allowedModes as Array<'exam' | 'cpd'> | undefined,
  })

  // CHANGED: CPD always starts fresh, but exam can still reuse an unfinished attempt.
  if (mode === 'exam') {
    const unfinishedAttempt = await findUnfinishedAttempt({
      userId,
      quizId,
      mode,
    }) // CHANGED: detect unfinished exam attempt before creating a new one.

    if (unfinishedAttempt) {
      return unfinishedAttempt // CHANGED: exam resumes the existing unfinished attempt.
    }
  }

  const answers: IQuizAttempt['answers'] = quiz.questions.map((qId) => ({
    question: qId,
    selectedOptionIndex: undefined,
    isCorrect: false,
    pointsEarned: 0,
    timeSpentMs: 0,
  }))

  const now = new Date()
  const modeRules = getModeRules(mode)
  const questionTimeLimitMs = modeRules.questionTimeLimitSeconds
    ? modeRules.questionTimeLimitSeconds * 1000
    : undefined
  const checkpointDeadlineMs = modeRules.checkpointIntervalMinutes
    ? modeRules.checkpointIntervalMinutes * 60_000
    : undefined

  const attempt = (await QuizAttempt.create({
    user: userId,
    quiz: quiz._id,
    mode,
    status: 'in_progress',
    resultVisibility: getResultVisibility(mode),
    attemptKey:
      attemptKey ||
      `attempt_${userId}_${quizId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    startedAt: now,
    completed: false,
    score: 0,
    maxScore: quiz.questions.length * (mode === 'exam' ? 2 : 10),
    percentage: 0,
    questionsAnswered: 0,
    currentQuestionIndex: 0,
    checkpointIndex: 0,
    checkpointSavedAt: now,
    lastCheckpointAt: now, // CHANGED: initialize resumable checkpoint timestamp for new attempts.
    lastSeenQuestionIndex: 0, // CHANGED: start from the beginning with zero-based indexing.
    questionTimeLimitMs,
    checkpointDeadlineMs,
    timedOut: false,
    forceCompletedByTimeout: false,
    adsServedCount: 0,
    heartsConsumed: 0,
    gemsEarned: 0,
    xpEarned: 0,
    answers,
    // CHANGED: category stays for display/history metadata only, not mode detection.
  })) as AttemptSessionResult // CHANGED: Mongoose create needs a final explicit shape for the shared contract.

  void buildAudioEventEnvelope(userId, { type: 'mode_enter', mode }) // CHANGED: emit mode entry event from start action.

  return attempt
}
