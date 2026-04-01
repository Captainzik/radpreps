import { z } from 'zod'
import { Quiz } from '@/lib/db/models/quiz.model'
import { SubmitQuizAttemptSchema } from '@/lib/validator'
import { IQuestion } from '@/lib/db/models/question.model'

export async function checkAnswers(
  payload: z.infer<typeof SubmitQuizAttemptSchema>,
) {
  const quiz = await Quiz.findById(payload.quizId).populate('questions')

  if (!quiz) throw new Error('Quiz not found')

  let score = 0
  const results = []

  for (const answer of payload.answers) {
    // Safe find on populated array
    const question = (quiz.questions as unknown as IQuestion[]).find(
      (q) => q._id?.toString() === answer.questionId,
    )

    if (!question) throw new Error('Invalid question')

    const correctOptionIndex = question.options.findIndex(
      (opt) => opt.isCorrect,
    )

    const isCorrect = answer.selectedOptionIndex === correctOptionIndex

    results.push({
      questionId: answer.questionId,
      selectedOptionIndex: answer.selectedOptionIndex,
      isCorrect,
    })

    if (isCorrect) score += 10 // or question.points || 1
  }

  return { score, results }
}
