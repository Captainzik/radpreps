import mongoose from 'mongoose'
import {
  connectToDatabase,
  Quiz,
  QuizAttempt,
  getAttemptMode,
  computeAttemptXp,
  getElapsedMs,
  shouldForceExamTimeout,
  buildAudioEventEnvelope,
} from './quizAttempt.shared'
import { getModeRules } from '@/lib/modes/rules'
import type { IQuestion } from '../db/models/question.model'
import { upsertLeaderboardFromAttempt } from '@/lib/actions/leaderboard.actions'
import {
  computeGemsEarned,
  applyWalletRewards,
  applyStreakUpdate,
  checkAndAwardBadges,
} from '@/lib/actions/gamification.actions'
import type { IQuizAttempt } from '../db/models/attempts.model'

type CompleteQuizAttemptInput = {
  attemptId: string
  userId: string
  attemptKey?: string
}

type CompleteQuizAttemptResult = {
  attemptId: string
  score: number
  maxScore: number
  percentage: number
  completedAt: Date
  idempotentReplay: boolean
  timeTakenMs?: number
}

function isRetryableMongoError(error: unknown) {
  const err = error as {
    code?: number
    errorLabels?: string[]
    message?: string
  }

  return (
    err?.code === 112 || // write conflict
    err?.errorLabels?.includes('TransientTransactionError') ||
    err?.errorLabels?.includes('UnknownTransactionCommitResult') ||
    /Write conflict|TransientTransactionError|UnknownTransactionCommitResult/i.test(
      err?.message ?? '',
    )
  )
}

export async function completeQuizAttempt(
  input: CompleteQuizAttemptInput,
): Promise<CompleteQuizAttemptResult> {
  await connectToDatabase()

  const { attemptId, userId, attemptKey } = input

  const maxAttempts = 3 // CHANGED: retry write-conflict transactions instead of failing immediately.
  let lastError: unknown

  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const attempt = await QuizAttempt.findOne({
        _id: attemptId,
        user: userId,
      }).session(session)

      if (!attempt) throw new Error('Attempt not found')

      if (attempt.completed) {
        await session.commitTransaction()
        return {
          attemptId: attempt._id.toString(),
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: attempt.percentage,
          completedAt: attempt.completedAt ?? new Date(),
          idempotentReplay: true,
          timeTakenMs: attempt.timeTakenMs,
        }
      }

      if (attemptKey && !attempt.attemptKey) {
        attempt.attemptKey = attemptKey
      }

      const quiz = await Quiz.findById(attempt.quiz)
        .select('_id questions allowedModes category')
        .populate('questions')
        .lean()
        .session(session)

      if (!quiz) throw new Error('Quiz not found')

      const mode =
        attempt.mode || getAttemptMode({ allowedModes: quiz.allowedModes })
      const modeRules = getModeRules(mode)
      const populatedQuestions = quiz.questions as unknown as IQuestion[]
      const questionMap = new Map(
        populatedQuestions
          .filter((q) => q._id)
          .map((q) => [q._id!.toString(), q]),
      )

      let score = 0
      const maxScore = populatedQuestions.length * (mode === 'exam' ? 2 : 10)

      const gradedAnswers = attempt.answers.map((ans) => {
        const q = questionMap.get(ans.question.toString())
        if (!q) {
          return { ...ans, isCorrect: false, pointsEarned: 0 }
        }

        const correctOptionIndex = q.options.findIndex((o) => o.isCorrect)
        if (correctOptionIndex === -1) {
          throw new Error(`Question ${q._id} has no correct option`)
        }

        const isCorrect =
          typeof ans.selectedOptionIndex === 'number' &&
          ans.selectedOptionIndex === correctOptionIndex

        const pointsEarned = isCorrect ? (mode === 'exam' ? 2 : 10) : 0
        score += pointsEarned

        return { ...ans, isCorrect, pointsEarned }
      })

      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
      const completedAt = new Date()
      const timeTakenMs = getElapsedMs(attempt.startedAt, completedAt)

      const forceTimeout =
        mode === 'exam'
          ? shouldForceExamTimeout({
              mode,
              startedAt: attempt.startedAt,
              now: completedAt,
              totalQuestions: populatedQuestions.length,
            })
          : false

      const xpEarned = computeAttemptXp({ mode, score, maxScore, percentage })
      const gemsEarned = computeGemsEarned(mode, percentage)

      attempt.answers = gradedAnswers as IQuizAttempt['answers']
      attempt.score = score
      attempt.maxScore = maxScore
      attempt.percentage = percentage
      attempt.completed = true
      attempt.completedAt = completedAt
      attempt.timeTakenMs = timeTakenMs
      attempt.status = forceTimeout ? 'ended' : 'completed'
      attempt.endedAt = forceTimeout ? completedAt : attempt.endedAt
      attempt.endedReason = forceTimeout ? 'timeout' : 'completed' // CHANGED: keep terminal state explicit and consistent with checkpoint flow.
      attempt.resultVisibility = modeRules.resultVisibility
      attempt.timedOut = forceTimeout
      attempt.forceCompletedByTimeout = forceTimeout
      attempt.questionsAnswered = gradedAnswers.length
      attempt.category = quiz.category
      attempt.xpEarned = xpEarned
      attempt.gemsEarned = gemsEarned
      attempt.checkpointIndex = attempt.questionsAnswered // CHANGED: final completion aligns checkpoint state with the finished attempt.
      attempt.checkpointSavedAt = completedAt // CHANGED: completed attempts carry the final checkpoint timestamp.
      attempt.lastCheckpointAt = completedAt // CHANGED: keep last checkpoint timing aligned at completion.

      await attempt.save({ session })

      await Promise.all([
        upsertLeaderboardFromAttempt({
          userId,
          category: quiz.category,
          score,
          percentage,
          attemptedAt: completedAt,
          session,
        }),
        applyWalletRewards({ userId, xpEarned, gemsEarned, mode, session }),
        applyStreakUpdate({ userId, completedAt, session }),
      ])

      void buildAudioEventEnvelope(userId, {
        type: 'quiz_complete',
        mode,
        score,
        percentage,
      })

      await session.commitTransaction()

      // Best-effort badge checks run outside the transaction.
      void checkAndAwardBadges({ userId, mode, percentage })

      return {
        attemptId: attempt._id.toString(),
        score,
        maxScore,
        percentage,
        completedAt,
        idempotentReplay: false,
        timeTakenMs,
      }
    } catch (error) {
      lastError = error
      await session.abortTransaction()
      session.endSession()

      if (isRetryableMongoError(error) && attemptNumber < maxAttempts) {
        continue // CHANGED: retry transient write conflicts caused by concurrent completion / resume requests.
      }

      throw error
    } finally {
      if (session.inTransaction()) {
        await session.endSession()
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to complete attempt')
}

export async function getQuizAttemptResult(params: {
  attemptId: string
  userId: string
}) {
  await connectToDatabase()

  const attempt = await QuizAttempt.findOne({
    _id: params.attemptId,
    user: params.userId,
    completed: true,
  })
    .populate({
      path: 'quiz',
      select: 'name category image',
    })
    .populate({
      path: 'answers.question',
      select: 'question image options tips',
    })
    .lean()

  if (!attempt) throw new Error('Attempt not found')

  const quizObj = attempt.quiz as unknown as {
    _id: mongoose.Types.ObjectId
    name: string
    category: 'Radiography' | 'Sonography'
    image?: string
  }

  const answers = (attempt.answers || []).map((a) => {
    const q = a.question as unknown as {
      _id: mongoose.Types.ObjectId
      question: string
      image?: string
      options: Array<{ text?: string; image?: string; isCorrect?: boolean }>
      tips?: string
    }

    const correctOptionIndex = Array.isArray(q?.options)
      ? q.options.findIndex((opt) => opt.isCorrect)
      : -1

    return {
      questionId: q?._id?.toString?.() ?? '',
      questionText: q?.question ?? '',
      questionImage: q?.image ?? '',
      selectedOptionIndex: a.selectedOptionIndex,
      correctOptionIndex,
      isCorrect: a.isCorrect,
      pointsEarned: a.pointsEarned,
      tips: q?.tips ?? '',
      options: (q?.options || []).map((o) => ({
        text: o?.text ?? '',
        image: o?.image ?? '',
      })),
    }
  })

  return {
    attemptId: attempt._id.toString(),
    quiz: {
      id: quizObj?._id?.toString?.() ?? '',
      name: quizObj?.name ?? 'Quiz',
      category: quizObj?.category ?? '',
      image: quizObj?.image ?? '',
    },
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    completedAt: attempt.completedAt,
    startedAt: attempt.startedAt,
    timeTakenMs: attempt.timeTakenMs,
    timedOut: attempt.timedOut,
    forceCompletedByTimeout: attempt.forceCompletedByTimeout,
    answers,
  }
}
