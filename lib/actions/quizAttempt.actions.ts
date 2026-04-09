import mongoose from 'mongoose'
import { Quiz } from '../db/models/quiz.model'
import { User } from '../db/models/user.model'
import { Leaderboard } from '../db/models/leaderboard.model'
import { getCurrentWeekPeriod } from '@/lib/utils'
import { IQuizAttempt, QuizAttempt } from '../db/models/attempts.model'
import type { IQuestion } from '../db/models/question.model'
import { SubmitQuizAttemptWithKeySchema } from '@/lib/validator'
import type { ISubmitQuizAttemptInput } from '@/types'
import { upsertLeaderboardFromAttempt } from '@/lib/actions/leaderboard.actions'

const isMongoDuplicateKeyError = (err: unknown): err is { code: number } => {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'number'
  )
}

export async function startQuizAttempt(input: {
  quizId: string
  userId: string
  attemptKey?: string
}) {
  const { quizId, userId, attemptKey } = input

  const quiz = await Quiz.findById(quizId)
    .select('_id category questions')
    .lean()

  if (!quiz) throw new Error('Quiz not found')
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('Quiz has no questions')
  }

  const answers: IQuizAttempt['answers'] = quiz.questions.map((qId) => ({
    question: qId,
    selectedOptionIndex: undefined,
    isCorrect: false,
    pointsEarned: 0,
    timeSpentMs: 0,
  }))

  const attempt = await QuizAttempt.create({
    user: userId,
    quiz: quiz._id,
    attemptKey:
      attemptKey ||
      `attempt_${userId}_${quizId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    startedAt: new Date(),
    completed: false,
    score: 0,
    maxScore: quiz.questions.length * 10,
    percentage: 0,
    questionsAnswered: 0,
    answers,
    category: quiz.category,
  })

  return attempt
}

export async function getActiveQuizAttempt(params: {
  attemptId: string
  userId: string
}) {
  const attempt = await QuizAttempt.findOne({
    _id: params.attemptId,
    user: params.userId,
  })
    .populate({
      path: 'quiz',
      select: 'name category',
    })
    .populate({
      path: 'answers.question',
      select: 'question options',
    })
    .lean()

  if (!attempt || attempt.completed) return null

  const quizObj = attempt.quiz as unknown as {
    _id: mongoose.Types.ObjectId
    name: string
    category: string
  }

  const questions = (attempt.answers || []).map((a) => {
    const q = a.question as unknown as {
      _id: mongoose.Types.ObjectId
      question: string
      options: Array<{ text: string; isCorrect?: boolean }>
    }

    return {
      questionId: q?._id?.toString?.() ?? '',
      questionText: q?.question ?? '',
      options: (q?.options || []).map((o) => ({ text: o.text })),
      selectedOptionIndex: a.selectedOptionIndex,
    }
  })

  return {
    _id: attempt._id,
    quiz: {
      id: quizObj?._id?.toString?.() ?? '',
      name: quizObj?.name ?? 'Quiz',
      category: quizObj?.category ?? '',
    },
    questions,
    answers: (attempt.answers || []).map((a) => ({
      questionId:
        (
          a.question as unknown as { _id?: mongoose.Types.ObjectId }
        )?._id?.toString?.() ?? '',
      selectedOptionIndex: a.selectedOptionIndex,
    })),
    completed: attempt.completed,
  }
}

export async function submitAnswerToAttempt(input: {
  attemptId: string
  userId: string
  questionId: string
  selectedOptionIndex: number
  timeSpentMs?: number
}) {
  const {
    attemptId,
    userId,
    questionId,
    selectedOptionIndex,
    timeSpentMs = 0,
  } = input

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: userId,
  })

  if (!attempt) throw new Error('Attempt not found')
  if (attempt.completed) throw new Error('Attempt already completed')

  const answerIndex = attempt.answers.findIndex(
    (a) => a.question.toString() === questionId,
  )

  if (answerIndex === -1) {
    throw new Error('Question does not belong to this attempt')
  }

  attempt.answers[answerIndex].selectedOptionIndex = selectedOptionIndex
  attempt.answers[answerIndex].timeSpentMs = timeSpentMs

  attempt.questionsAnswered = attempt.answers.filter(
    (a) => typeof a.selectedOptionIndex === 'number',
  ).length

  await attempt.save()

  return {
    attemptId: attempt._id.toString(),
    questionsAnswered: attempt.questionsAnswered,
    totalQuestions: attempt.answers.length,
    completed: attempt.completed,
  }
}

export async function submitQuizAttempt(
  userId: string,
  rawPayload: ISubmitQuizAttemptInput,
) {
  const payload = SubmitQuizAttemptWithKeySchema.parse(rawPayload)

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const existingAttempt = await QuizAttempt.findOne({
      user: userId,
      quiz: payload.quizId,
      attemptKey: payload.attemptKey,
      completed: true,
    })
      .session(session)
      .lean()

    if (existingAttempt) {
      await session.commitTransaction()
      return {
        attempt: existingAttempt,
        score: existingAttempt.score,
        percentage: existingAttempt.percentage,
        maxScore: existingAttempt.maxScore,
        idempotentReplay: true,
      }
    }

    const quiz = await Quiz.findById(payload.quizId)
      .populate('questions')
      .lean()
      .session(session)

    if (!quiz) throw new Error('Quiz not found')

    const populatedQuestions = quiz.questions as unknown as IQuestion[]
    const quizQuestionIds = new Set(
      populatedQuestions
        .map((q) => q._id?.toString())
        .filter(Boolean) as string[],
    )

    for (const ans of payload.answers) {
      if (!quizQuestionIds.has(ans.questionId)) {
        throw new Error(
          `Question ${ans.questionId} does not belong to this quiz`,
        )
      }
    }

    let score = 0
    const maxScore = populatedQuestions.length * 10
    const attemptAnswers: IQuizAttempt['answers'] = []

    for (const ans of payload.answers) {
      const question = populatedQuestions.find(
        (q) => q._id?.toString() === ans.questionId,
      )
      if (!question || !question._id) continue

      const correctOptionIndex = question.options.findIndex(
        (opt) => opt.isCorrect,
      )
      if (correctOptionIndex === -1) {
        throw new Error(`Question ${question._id} has no correct option`)
      }

      const isCorrect =
        ans.selectedOptionIndex !== undefined
          ? ans.selectedOptionIndex === correctOptionIndex
          : false

      const pointsEarned = isCorrect ? 10 : 0
      score += pointsEarned

      attemptAnswers.push({
        question: question._id,
        selectedOptionIndex: ans.selectedOptionIndex,
        isCorrect,
        pointsEarned,
        timeSpentMs: ans.timeSpentMs,
      })
    }

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

    const attempt = new QuizAttempt({
      user: userId,
      quiz: payload.quizId,
      attemptKey: payload.attemptKey,
      startedAt: new Date(),
      completedAt: new Date(),
      timeTakenMs: payload.timeTakenMs || 0,
      score,
      maxScore,
      percentage,
      completed: true,
      questionsAnswered: attemptAnswers.length,
      answers: attemptAnswers,
      category: quiz.category,
    })

    await attempt.save({ session })

    const now = new Date()
    const todayLocal = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )
    const userDoc = await User.findById(userId).session(session)

    if (userDoc) {
      let newStreak = userDoc.currentStreak || 0
      let shouldUpdateLastStreakDate = false

      if (userDoc.lastStreakDate) {
        const lastDate = new Date(userDoc.lastStreakDate)
        const lastLocal = new Date(
          lastDate.getFullYear(),
          lastDate.getMonth(),
          lastDate.getDate(),
        )
        const diffDays = Math.floor(
          (todayLocal.getTime() - lastLocal.getTime()) / (1000 * 60 * 60 * 24),
        )

        if (diffDays === 1) {
          newStreak += 1
          shouldUpdateLastStreakDate = true
        } else if (diffDays > 1) {
          newStreak = 1
          shouldUpdateLastStreakDate = true
        }
      } else {
        newStreak = 1
        shouldUpdateLastStreakDate = true
      }

      const newLongestStreak = Math.max(userDoc.longestStreak || 0, newStreak)

      await User.findByIdAndUpdate(
        userId,
        {
          $inc: { lifetimeTotalScore: score },
          $set: {
            lastActive: new Date(),
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            ...(shouldUpdateLastStreakDate
              ? { lastStreakDate: todayLocal }
              : {}),
          },
          $addToSet: { favoriteCategories: quiz.category },
        },
        { session },
      )
    }

    const period = getCurrentWeekPeriod()

    const lbAfterInc = await Leaderboard.findOneAndUpdate(
      { period, user: userId },
      {
        $inc: {
          totalScore: score,
          quizAttempts: 1,
          totalPercentage: percentage,
          [`categoryScores.${quiz.category}`]: score,
        },
        $max: { bestPercentage: percentage },
        $set: { lastAttemptAt: new Date() },
        $setOnInsert: { averagePercentage: 0 },
      },
      { upsert: true, new: true, session },
    )

    if (!lbAfterInc) {
      throw new Error('Failed to update leaderboard')
    }

    const computedAverage =
      lbAfterInc.quizAttempts > 0
        ? lbAfterInc.totalPercentage / lbAfterInc.quizAttempts
        : 0

    await Leaderboard.updateOne(
      { _id: lbAfterInc._id },
      { $set: { averagePercentage: computedAverage } },
      { session },
    )

    await session.commitTransaction()

    return {
      attempt,
      score,
      percentage,
      maxScore,
      idempotentReplay: false,
    }
  } catch (error: unknown) {
    if (isMongoDuplicateKeyError(error) && error.code === 11000) {
      const fallback = await QuizAttempt.findOne({
        user: userId,
        quiz: payload.quizId,
        attemptKey: payload.attemptKey,
        completed: true,
      }).lean()

      await session.abortTransaction()

      if (fallback) {
        return {
          attempt: fallback,
          score: fallback.score,
          percentage: fallback.percentage,
          maxScore: fallback.maxScore,
          idempotentReplay: true,
        }
      }
    }

    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

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
}

export async function completeQuizAttempt(
  input: CompleteQuizAttemptInput,
): Promise<CompleteQuizAttemptResult> {
  const { attemptId, userId, attemptKey } = input

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
      }
    }

    if (attemptKey && !attempt.attemptKey) {
      attempt.attemptKey = attemptKey
    }

    const quiz = await Quiz.findById(attempt.quiz)
      .populate('questions')
      .lean()
      .session(session)

    if (!quiz) throw new Error('Quiz not found')

    const populatedQuestions = quiz.questions as unknown as IQuestion[]
    const questionMap = new Map(
      populatedQuestions
        .filter((q) => q._id)
        .map((q) => [q._id!.toString(), q]),
    )

    let score = 0
    const maxScore = populatedQuestions.length * 10

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

      const pointsEarned = isCorrect ? 10 : 0
      score += pointsEarned

      return { ...ans, isCorrect, pointsEarned }
    })

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
    const completedAt = new Date()

    attempt.answers = gradedAnswers as IQuizAttempt['answers']
    attempt.score = score
    attempt.maxScore = maxScore
    attempt.percentage = percentage
    attempt.completed = true
    attempt.completedAt = completedAt
    attempt.questionsAnswered = gradedAnswers.length
    attempt.category = quiz.category

    await attempt.save({ session })

    const todayLocal = new Date(
      completedAt.getFullYear(),
      completedAt.getMonth(),
      completedAt.getDate(),
    )

    const userDoc = await User.findById(userId).session(session)
    if (userDoc) {
      let newStreak = userDoc.currentStreak || 0
      let shouldUpdateLastStreakDate = false

      if (userDoc.lastStreakDate) {
        const last = new Date(userDoc.lastStreakDate)
        const lastLocal = new Date(
          last.getFullYear(),
          last.getMonth(),
          last.getDate(),
        )
        const diffDays = Math.floor(
          (todayLocal.getTime() - lastLocal.getTime()) / (1000 * 60 * 60 * 24),
        )

        if (diffDays === 1) {
          newStreak += 1
          shouldUpdateLastStreakDate = true
        } else if (diffDays > 1) {
          newStreak = 1
          shouldUpdateLastStreakDate = true
        }
      } else {
        newStreak = 1
        shouldUpdateLastStreakDate = true
      }

      const newLongest = Math.max(userDoc.longestStreak || 0, newStreak)

      await User.findByIdAndUpdate(
        userId,
        {
          $inc: { lifetimeTotalScore: score },
          $set: {
            lastActive: completedAt,
            currentStreak: newStreak,
            longestStreak: newLongest,
            ...(shouldUpdateLastStreakDate
              ? { lastStreakDate: todayLocal }
              : {}),
          },
          $addToSet: { favoriteCategories: quiz.category },
        },
        { session },
      )
    }

    await upsertLeaderboardFromAttempt({
      userId,
      category: quiz.category,
      score,
      percentage,
      attemptedAt: completedAt,
      session,
    })

    await session.commitTransaction()

    return {
      attemptId: attempt._id.toString(),
      score,
      maxScore,
      percentage,
      completedAt,
      idempotentReplay: false,
    }
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

export async function getQuizAttemptResult(params: {
  attemptId: string
  userId: string
}) {
  const attempt = await QuizAttempt.findOne({
    _id: params.attemptId,
    user: params.userId,
    completed: true,
  })
    .populate({
      path: 'quiz',
      select: 'name category',
    })
    .populate({
      path: 'answers.question',
      select: 'question options tips',
    })
    .lean()

  if (!attempt) throw new Error('Attempt not found')

  const quizObj = attempt.quiz as unknown as {
    _id: mongoose.Types.ObjectId
    name: string
    category: string
  }

  const answers = (attempt.answers || []).map((a) => {
    const q = a.question as unknown as {
      _id: mongoose.Types.ObjectId
      question: string
      options: Array<{ text: string; isCorrect?: boolean }>
      tips?: string
    }

    const correctOptionIndex = Array.isArray(q?.options)
      ? q.options.findIndex((opt) => opt.isCorrect)
      : -1

    return {
      questionId: q?._id?.toString?.() ?? '',
      questionText: q?.question ?? '',
      selectedOptionIndex: a.selectedOptionIndex,
      correctOptionIndex,
      isCorrect: a.isCorrect,
      pointsEarned: a.pointsEarned,
      tips: q?.tips ?? '',
      options: (q?.options || []).map((o) => ({ text: o.text })),
    }
  })

  return {
    attemptId: attempt._id.toString(),
    quiz: {
      id: quizObj?._id?.toString?.() ?? '',
      name: quizObj?.name ?? 'Quiz',
      category: quizObj?.category ?? '',
    },
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    completedAt: attempt.completedAt,
    answers,
  }
}

export type QuizHistoryItem = {
  id: string
  quizId: string
  quizName: string
  category: string
  score: number
  maxScore: number
  percentage: number
  completed: boolean
  startedAt: Date
  completedAt?: Date
  questionsAnswered: number
  totalQuestions: number
}

export async function getUserQuizHistory(params: {
  userId: string
  limit?: number
}): Promise<QuizHistoryItem[]> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200)

  const attempts = await QuizAttempt.find({
    user: params.userId,
    completed: true,
  })
    .sort({ completedAt: -1, _id: -1 })
    .limit(limit)
    .populate({
      path: 'quiz',
      select: 'name category',
    })
    .lean()

  return attempts.map((attempt) => {
    const quizObj = attempt.quiz as unknown as
      | {
          _id?: mongoose.Types.ObjectId
          name?: string
          category?: string
        }
      | undefined

    return {
      id: attempt._id.toString(),
      quizId: quizObj?._id?.toString?.() ?? '',
      quizName: quizObj?.name ?? 'Quiz',
      category: attempt.category || quizObj?.category || '',
      score: attempt.score ?? 0,
      maxScore: attempt.maxScore ?? 0,
      percentage: attempt.percentage ?? 0,
      completed: Boolean(attempt.completed),
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      questionsAnswered: attempt.questionsAnswered ?? 0,
      totalQuestions: Array.isArray(attempt.answers)
        ? attempt.answers.length
        : 0,
    }
  })
}

export type FeedActivityItem = {
  id: string
  type: 'quiz_completed'
  title: string
  description: string
  occurredAt: Date
  score: number
  maxScore: number
  percentage: number
  category: string
  quizId: string
}

export async function getUserFeedActivity(params: {
  userId: string
  limit?: number
}): Promise<FeedActivityItem[]> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200)

  const attempts = await QuizAttempt.find({
    user: params.userId,
    completed: true,
  })
    .sort({ completedAt: -1, _id: -1 })
    .limit(limit)
    .populate({
      path: 'quiz',
      select: 'name',
    })
    .lean()

  return attempts.map((attempt) => {
    const quizObj = attempt.quiz as unknown as
      | {
          _id?: mongoose.Types.ObjectId
          name?: string
        }
      | undefined

    const quizName = quizObj?.name ?? 'Quiz'
    const totalQuestions = Array.isArray(attempt.answers)
      ? attempt.answers.length
      : 0

    return {
      id: attempt._id.toString(),
      type: 'quiz_completed',
      title: `Completed ${quizName}`,
      description: `Answered ${attempt.questionsAnswered}/${totalQuestions} questions • ${attempt.percentage.toFixed(1)}%`,
      occurredAt: attempt.completedAt ?? attempt.startedAt,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      category: attempt.category || '',
      quizId: quizObj?._id?.toString?.() ?? '',
    }
  })
}
