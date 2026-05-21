import mongoose, { Types } from 'mongoose'
import {
  connectToDatabase,
  QuizAttempt,
  Quiz,
  computeAttemptXp,
} from './quizAttempt.shared'
import { Question } from '@/lib/db/models/question.model'
import {
  computeGemsEarned,
  applyWalletRewards,
  applyStreakUpdate,
  checkAndAwardBadges,
} from './gamification.actions'
export type {
  CpdPartEntry,
  CpdPartAnswer,
  CpdPartPageData,
} from './quizAttempt.cpd-part.types'
export { PART_SIZE } from './quizAttempt.cpd-part.types'
import type {
  CpdPartEntry,
  CpdPartPageData,
  CpdPartAnswer,
} from './quizAttempt.cpd-part.types'
import { PART_SIZE } from './quizAttempt.cpd-part.types'

function isRetryableMongoError(error: unknown) {
  const err = error as {
    code?: number
    errorLabels?: string[]
    message?: string
  }
  return (
    err?.code === 112 ||
    err?.errorLabels?.includes('TransientTransactionError') ||
    err?.errorLabels?.includes('UnknownTransactionCommitResult') ||
    /Write conflict|TransientTransactionError|UnknownTransactionCommitResult/i.test(
      err?.message ?? '',
    )
  )
}

/**
 * Grade and finalize one CPD part.
 * - First completion: awards XP, gems, streak via transaction.
 * - Redo: re-grades answers for display but does NOT re-award rewards.
 * - Last part: marks attempt completed and sets overall score/percentage.
 */
export async function completeCpdPart(input: {
  attemptId: string
  userId: string
  partIndex: number
}): Promise<{ isLastPart: boolean }> {
  await connectToDatabase()

  const { attemptId, userId, partIndex } = input

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: userId,
    mode: 'cpd',
    completed: false,
  })
  if (!attempt) throw new Error('Attempt not found')

  const totalQuestions = attempt.answers.length
  const partStart = partIndex * PART_SIZE
  const partEnd = Math.min(partStart + PART_SIZE, totalQuestions)
  const isLastPart = partEnd >= totalQuestions

  const existingEntry = attempt.completedParts?.find(
    (p) => p.partKey === String(partIndex),
  )
  const isRedoing = !!existingEntry

  // Fetch only this part's questions (10 or fewer IDs).
  const partAnswers = attempt.answers.slice(partStart, partEnd)
  const questionIds = partAnswers.map((a) => a.question)

  const questions = await Question.find({ _id: { $in: questionIds } })
    .select('_id options')
    .lean()

  const questionMap = new Map(
    questions.map((q) => [(q._id as Types.ObjectId).toString(), q]),
  )

  let partScore = 0
  const partMaxScore = partAnswers.length * 10
  const gradedAnswers = partAnswers.map((ans) => {
    const q = questionMap.get(ans.question.toString())
    if (!q) return { ...ans, isCorrect: false, pointsEarned: 0 }
    const opts = q.options as Array<{ isCorrect?: boolean }>
    const correctOptionIndex = opts.findIndex((o) => o.isCorrect)
    const isCorrect =
      typeof ans.selectedOptionIndex === 'number' &&
      ans.selectedOptionIndex === correctOptionIndex
    const pointsEarned = isCorrect ? 10 : 0
    partScore += pointsEarned
    return { ...ans, isCorrect, pointsEarned }
  })

  const partPercentage = partMaxScore > 0 ? (partScore / partMaxScore) * 100 : 0
  const partXp = isRedoing
    ? existingEntry!.xpEarned
    : computeAttemptXp({
        mode: 'cpd',
        score: partScore,
        maxScore: partMaxScore,
        percentage: partPercentage,
      })
  const partGems = isRedoing
    ? existingEntry!.gemsEarned
    : computeGemsEarned('cpd', partPercentage)
  const completedAt = isRedoing ? existingEntry!.completedAt : new Date()

  const maxRetries = 3
  let lastError: unknown

  for (let retryNum = 1; retryNum <= maxRetries; retryNum++) {
    const txSession = await mongoose.startSession()
    txSession.startTransaction()

    try {
      if (!isRedoing) {
        await applyWalletRewards({
          userId,
          xpEarned: partXp,
          gemsEarned: partGems,
          mode: 'cpd',
          session: txSession,
        })
        await applyStreakUpdate({ userId, completedAt, session: txSession })
      }

      // Persist graded answers for this part.
      for (let i = 0; i < gradedAnswers.length; i++) {
        attempt.answers[partStart + i].isCorrect = gradedAnswers[i].isCorrect
        attempt.answers[partStart + i].pointsEarned =
          gradedAnswers[i].pointsEarned
      }

      if (!attempt.completedParts) attempt.completedParts = []

      if (existingEntry) {
        // Update scores for redo; keep original XP/gems/completedAt.
        existingEntry.score = partScore
        existingEntry.percentage = partPercentage
      } else {
        attempt.completedParts.push({
          partKey: String(partIndex),
          score: partScore,
          maxScore: partMaxScore,
          percentage: partPercentage,
          xpEarned: partXp,
          gemsEarned: partGems,
          completedAt,
        })
        attempt.xpEarned = (attempt.xpEarned || 0) + partXp
        attempt.gemsEarned = (attempt.gemsEarned || 0) + partGems
      }

      if (isLastPart) {
        let overallScore = 0
        let overallMaxScore = 0
        for (const p of attempt.completedParts) {
          overallScore += p.score
          overallMaxScore += p.maxScore
        }
        const overallPct =
          overallMaxScore > 0 ? (overallScore / overallMaxScore) * 100 : 0
        attempt.score = overallScore
        attempt.maxScore = overallMaxScore
        attempt.percentage = overallPct
        attempt.completed = true
        attempt.completedAt = completedAt
        attempt.status = 'completed'
        attempt.endedReason = 'completed'
        attempt.timeTakenMs =
          completedAt.getTime() - attempt.startedAt.getTime()
      }

      await attempt.save({ session: txSession })
      await txSession.commitTransaction()

      void checkAndAwardBadges({
        userId,
        mode: 'cpd',
        percentage: partPercentage,
      })

      return { isLastPart }
    } catch (err) {
      lastError = err
      await txSession.abortTransaction()
      if (isRetryableMongoError(err) && retryNum < maxRetries) continue
      throw err
    } finally {
      if (!txSession.inTransaction()) txSession.endSession()
    }
  }

  throw lastError
}

/**
 * Load part result data for display.
 * Uses $slice projection — only the 10 part answers are fetched from MongoDB.
 */
export async function getCpdPartPageData(input: {
  attemptId: string
  userId: string
  partIndex: number
}): Promise<CpdPartPageData> {
  await connectToDatabase()

  const { attemptId, userId, partIndex } = input
  const partStart = partIndex * PART_SIZE

  type AggregateDoc = {
    _id: Types.ObjectId
    quiz: Types.ObjectId
    completedParts: CpdPartEntry[]
    maxScore: number
    totalAnswers: number
    partAnswers: Array<{
      question: Types.ObjectId
      selectedOptionIndex?: number
      isCorrect: boolean
      pointsEarned: number
    }>
  }

  const [doc] = await QuizAttempt.aggregate<AggregateDoc>([
    {
      $match: {
        _id: new Types.ObjectId(attemptId),
        user: new Types.ObjectId(userId),
        mode: 'cpd',
      },
    },
    {
      $project: {
        quiz: 1,
        completedParts: 1,
        maxScore: 1,
        totalAnswers: { $size: '$answers' },
        partAnswers: { $slice: ['$answers', partStart, PART_SIZE] },
      },
    },
  ])

  if (!doc) throw new Error('Attempt not found')

  const totalQuestions = doc.totalAnswers
  const partEnd = Math.min(partStart + PART_SIZE, totalQuestions)
  const isLastPart = partEnd >= totalQuestions
  const totalParts = Math.ceil(totalQuestions / PART_SIZE)

  const partEntry = (doc.completedParts ?? []).find(
    (p) => p.partKey === String(partIndex),
  )
  if (!partEntry) throw new Error(`Part ${partIndex} not yet completed`)

  const questionIds = doc.partAnswers.map((a) => a.question)

  const [quizDoc, questionDocs] = await Promise.all([
    Quiz.findById(doc.quiz).select('name category image').lean(),
    Question.find({ _id: { $in: questionIds } })
      .select('_id question image options tips')
      .lean(),
  ])

  if (!quizDoc) throw new Error('Quiz not found')

  type QDoc = {
    _id: Types.ObjectId
    question: string
    image?: string
    options: Array<{ text?: string; image?: string; isCorrect?: boolean }>
    tips?: string
  }
  const questionMap = new Map(
    (questionDocs as QDoc[]).map((q) => [q._id.toString(), q]),
  )

  const answers: CpdPartAnswer[] = doc.partAnswers.map((ans) => {
    const q = questionMap.get(ans.question.toString())
    const opts = q?.options ?? []
    const correctOptionIndex = opts.findIndex((o) => o.isCorrect)
    return {
      questionId: ans.question.toString(),
      questionText: q?.question ?? '',
      questionImage: q?.image ?? '',
      selectedOptionIndex: ans.selectedOptionIndex,
      correctOptionIndex,
      isCorrect: ans.isCorrect,
      pointsEarned: ans.pointsEarned,
      tips: q?.tips ?? '',
      options: opts.map((o) => ({ text: o.text ?? '', image: o.image ?? '' })),
    }
  })

  const allCompletedParts = (doc.completedParts ?? [])
    .map((p) => ({
      ...p,
      partIndex: Number(p.partKey),
      partNumber: Number(p.partKey) + 1,
    }))
    .sort((a, b) => a.partIndex - b.partIndex)

  const maxCompletedPartIndex =
    allCompletedParts.length > 0
      ? Math.max(...allCompletedParts.map((p) => p.partIndex))
      : -1
  // Redo is only available for the most recent non-final part.
  const canRedo = partIndex === maxCompletedPartIndex && !isLastPart

  const overallXp = allCompletedParts.reduce((s, p) => s + p.xpEarned, 0)
  const overallGems = allCompletedParts.reduce((s, p) => s + p.gemsEarned, 0)
  const overallScore = allCompletedParts.reduce((s, p) => s + p.score, 0)
  const overallMaxScore = allCompletedParts.reduce((s, p) => s + p.maxScore, 0)
  const overallPercentage =
    overallMaxScore > 0 ? (overallScore / overallMaxScore) * 100 : 0

  type QuizLean = {
    _id: Types.ObjectId
    name: string
    category: string
    image?: string
  }
  const q = quizDoc as unknown as QuizLean

  return {
    attemptId,
    partIndex,
    partNumber: partIndex + 1,
    totalParts,
    isLastPart,
    canRedo,
    quiz: {
      id: q._id.toString(),
      name: q.name,
      category: q.category,
      image: q.image,
    },
    partSummary: partEntry,
    answers,
    allCompletedParts,
    overallXp,
    overallGems,
    overallScore,
    overallMaxScore,
    overallPercentage,
  }
}

/**
 * Reset a CPD part so the user can redo it.
 * Clears the answer slice and rewinds indices.
 * Does NOT clear the completedParts entry — XP is preserved as already awarded.
 */
export async function resetCpdPart(input: {
  attemptId: string
  userId: string
  partIndex: number
}): Promise<void> {
  await connectToDatabase()

  const { attemptId, userId, partIndex } = input

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    user: userId,
    mode: 'cpd',
    completed: false,
  })
  if (!attempt) throw new Error('Attempt not found')

  const completedKeys = (attempt.completedParts ?? []).map((p) =>
    Number(p.partKey),
  )
  const maxCompletedPart =
    completedKeys.length > 0 ? Math.max(...completedKeys) : -1

  if (partIndex < maxCompletedPart) {
    throw new Error(
      'Cannot redo a part that has been followed by later completed parts',
    )
  }

  const totalQuestions = attempt.answers.length
  const partStart = partIndex * PART_SIZE
  const partEnd = Math.min(partStart + PART_SIZE, totalQuestions)

  for (let i = partStart; i < partEnd; i++) {
    attempt.answers[i].selectedOptionIndex = undefined
    attempt.answers[i].isCorrect = false
    attempt.answers[i].pointsEarned = 0
  }

  attempt.currentQuestionIndex = partStart
  attempt.questionsAnswered = partStart
  attempt.checkpointIndex = partStart

  await attempt.save()
}
