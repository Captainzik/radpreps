async function checkAnswers(payload: z.infer<typeof SubmitQuizAnswersSchema>) {
  const quiz = await Quiz.findById(payload.quizId).populate('questions.options')

  let score = 0
  const results = []

  for (const answer of payload.answers) {
    const question = quiz.questions.id(answer.questionId)
    if (!question) throw new Error('Invalid question')

    const correctOption = question.options.find((opt) => opt.isCorrect)
    const isCorrect = answer.selectedOptionId === correctOption._id.toString()

    results.push({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      isCorrect,
    })

    if (isCorrect) score += question.points || 1
  }

  // save attempt, update stats, return results + score
}
