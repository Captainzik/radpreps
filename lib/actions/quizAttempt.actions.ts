// lib/actions/quizAttempt.actions.ts
import { z } from 'zod'
import mongoose from 'mongoose'
import { Quiz } from '../db/models/quiz.model'
import { User } from '../db/models/user.model'
import { Leaderboard } from '../db/models/leaderboard.model'
import { SubmitQuizAttemptSchema } from '@/lib/validator'
import { getCurrentWeekPeriod } from '@/lib/utils'
import { IQuizAttempt, QuizAttempt } from '../db/models/attempts.model'
import type { IQuestion } from '../db/models/question.model'

export async function submitQuizAttempt(
  userId: string,
  payload: z.infer<typeof SubmitQuizAttemptSchema>,
) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const quiz = await Quiz.findById(payload.quizId)
      .populate('questions')
      .lean()
      .session(session)

    if (!quiz) {
      throw new Error('Quiz not found')
    }

    // Safe cast after population
    const populatedQuestions = quiz.questions as unknown as IQuestion[]

    // 2. Validate question IDs
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

    // 3. Calculate score & build answers
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
        question: question._id, // ← safe now
        selectedOptionIndex: ans.selectedOptionIndex,
        isCorrect,
        pointsEarned,
        timeSpentMs: ans.timeSpentMs,
      })
    }

    // 4. Create and save the attempt
    const attempt = new QuizAttempt({
      user: userId,
      quiz: payload.quizId,
      startedAt: new Date(),
      completedAt: new Date(),
      timeTakenMs: payload.timeTakenMs || 0,
      score,
      maxScore,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
      completed: true,
      questionsAnswered: attemptAnswers.length,
      answers: attemptAnswers,
      category: quiz.category,
    })

    await attempt.save({ session })

    // 5. Update User
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: { lifetimeTotalScore: score },
        $set: { lastActive: new Date() },
        $addToSet: { favoriteCategories: quiz.category },
      },
      { session },
    )

    // 6. Update Leaderboard
    const period = getCurrentWeekPeriod()
    await Leaderboard.findOneAndUpdate(
      { period, user: userId },
      {
        $inc: {
          totalScore: score,
          quizAttempts: 1,
          [`categoryScores.${quiz.category}`]: score,
        },
        $max: { bestPercentage: attempt.percentage },
        $set: { lastAttemptAt: new Date() },
      },
      { upsert: true, new: true, session },
    )

    await session.commitTransaction()

    return {
      attempt,
      score,
      percentage: attempt.percentage,
      maxScore,
    }
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}
