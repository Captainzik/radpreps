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

/**
 * Existing flow: submit + grade + complete in one call.
 * (Kept intact, with your current imports/logic.)
 */
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

    // User update
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

    // Leaderboard update with totalPercentage + recomputed averagePercentage
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
        $setOnInsert: {
          averagePercentage: 0,
        },
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

/**
 * New lifecycle action: complete an existing in-progress attempt.
 */
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
        return {
          ...ans,
          isCorrect: false,
          pointsEarned: 0,
        }
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

      return {
        ...ans,
        isCorrect,
        pointsEarned,
      }
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

    // user streak + lifetime score
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

/**
 * Result payload for result page.
 */
export async function getQuizAttemptResult(params: {
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
      select: 'question options tips',
    })
    .lean()

  if (!attempt) throw new Error('Attempt not found')
  if (!attempt.completed) throw new Error('Attempt is not completed yet')

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
