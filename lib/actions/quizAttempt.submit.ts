import { connectToDatabase, QuizAttempt } from './quizAttempt.shared'
import {
  getCheckpointResumeQuestionIndex,
  shouldCreateCheckpoint,
} from './quizAttempt.session'

type SubmitAnswerResult = {
  attemptId: string
  questionsAnswered: number
  totalQuestions: number
  currentQuestionIndex: number
  checkpointIndex?: number
  completed: boolean
}

export async function submitAnswerToAttempt(input: {
  attemptId: string
  userId: string
  questionId: string
  selectedOptionIndex: number
  timeSpentMs?: number
}): Promise<SubmitAnswerResult> {
  await connectToDatabase()

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
    completed: false,
    status: { $in: ['in_progress', 'paused'] },
  })

  if (!attempt) throw new Error('Attempt not found')
  if (attempt.completed) throw new Error('Attempt already completed')

  const answerIndex = attempt.answers.findIndex(
    (a) => a.question.toString() === questionId,
  )

  if (answerIndex === -1) {
    throw new Error('Question does not belong to this attempt')
  }

  const existingAnswer = attempt.answers[answerIndex]
  const isFirstAnswer = typeof existingAnswer.selectedOptionIndex !== 'number'

  attempt.answers[answerIndex].selectedOptionIndex = selectedOptionIndex
  attempt.answers[answerIndex].timeSpentMs = timeSpentMs

  attempt.questionsAnswered = attempt.answers.filter(
    (a) => typeof a.selectedOptionIndex === 'number',
  ).length

  attempt.currentQuestionIndex = Math.min(
    answerIndex + 1,
    attempt.answers.length,
  )

  const checkpointBoundary = getCheckpointResumeQuestionIndex({
    answeredCount: attempt.questionsAnswered,
    checkpointSize: 10,
  })

  attempt.lastSeenQuestionIndex =
    attempt.currentQuestionIndex > 0 ? attempt.currentQuestionIndex - 1 : 0
  attempt.lastCheckpointAt = new Date()

  if (isFirstAnswer) {
    if (
      shouldCreateCheckpoint({
        answeredCount: attempt.questionsAnswered,
        checkpointSize: 10,
      })
    ) {
      attempt.checkpointIndex = checkpointBoundary
      attempt.checkpointSavedAt = attempt.lastCheckpointAt
      // CHANGED: checkpoint metadata updated here, but pause state is not set here.
    } else if (
      typeof attempt.checkpointIndex !== 'number' ||
      Number.isNaN(attempt.checkpointIndex)
    ) {
      attempt.checkpointIndex = checkpointBoundary
    }
  }

  if (attempt.currentQuestionIndex > attempt.answers.length) {
    attempt.currentQuestionIndex = attempt.answers.length
  }

  await attempt.save()

  return {
    attemptId: attempt._id.toString(),
    questionsAnswered: attempt.questionsAnswered,
    totalQuestions: attempt.answers.length,
    currentQuestionIndex: attempt.currentQuestionIndex,
    checkpointIndex: attempt.checkpointIndex,
    completed: attempt.completed,
  }
}
