import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getActiveQuizAttempt } from '@/lib/actions/quizAttempt.active'
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.result'
import { QuizExamAttemptClient } from '@/components/learning/quiz-exam-attempt-client'

type PageProps = {
  params: Promise<{
    attemptId: string
  }>
}

type AttemptQuestion = {
  questionId: string
  questionText: string
  image?: string
  options: {
    text?: string
    image?: string
  }[]
}

type ActiveAttempt = {
  _id: { toString(): string }
  mode: 'exam' | 'cpd'
  startedAt: Date
  checkpointIndex: number // CHANGED: checkpoint is retained for resume metadata only.
  currentQuestionIndex: number // CHANGED: consume the shared active-attempt state explicitly.
  currentQuestion?: AttemptQuestion // CHANGED: consume the precomputed question from the shared active-attempt state.
  quiz: {
    name: string
    category: string
  }
  answers: {
    questionId: string
    selectedOptionIndex?: number
  }[]
  questions: AttemptQuestion[]
}

export default async function QuizAttemptRunnerPage({ params }: PageProps) {
  const { attemptId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/exam/attempt/${attemptId}`) // CHANGED: exam-specific auth callback.
  }

  const attempt = (await getActiveQuizAttempt({
    attemptId,
    userId: session.user.id,
    expectedMode: 'exam',
  })) as ActiveAttempt | null

  if (!attempt) {
    notFound()
  }

  const answeredCount = attempt.answers.filter(
    (a) => typeof a.selectedOptionIndex === 'number',
  ).length

  if (answeredCount >= attempt.questions.length) {
    await completeQuizAttempt({
      attemptId,
      userId: session.user.id,
    }) // CHANGED: finalize the attempt before redirecting to results.
    redirect(`/exam/attempt/${attemptId}/result`)
  }

  // CHANGED: prefer the advancing currentQuestion first; checkpointIndex is only a fallback.
  const currentQuestion =
    attempt.currentQuestion ??
    attempt.questions[attempt.currentQuestionIndex] ??
    attempt.questions[answeredCount] ??
    attempt.questions[
      Math.min(attempt.checkpointIndex, attempt.questions.length - 1)
    ]

  if (!currentQuestion) {
    notFound()
  }

  // CHANGED: display index follows the current pointer, not the checkpoint anchor.
  const currentQuestionNumber =
    Math.min(attempt.currentQuestionIndex, attempt.questions.length - 1) + 1

  return (
    <QuizExamAttemptClient
      attemptId={attemptId}
      mode={attempt.mode}
      startedAt={
        attempt.startedAt instanceof Date
          ? attempt.startedAt.toISOString()
          : new Date(attempt.startedAt).toISOString()
      } // CHANGED: serializable ISO string keeps client timer synchronous with backend start time.
      quizName={attempt.quiz.name}
      quizCategory={attempt.quiz.category}
      questionNumber={currentQuestionNumber}
      totalQuestions={attempt.questions.length}
      question={currentQuestion}
      action={`/exam/attempt/${attemptId}/answer`} // CHANGED: exam-specific answer endpoint.
    />
  )
}
