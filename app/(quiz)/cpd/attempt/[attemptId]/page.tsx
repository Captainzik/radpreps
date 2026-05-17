import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.result'
import { getActiveQuizAttempt } from '@/lib/actions/quizAttempt.active'
import { QuizActiveAttemptShell } from '@/components/learning/quiz-active-attempt-shell'

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
  selectedOptionIndex?: number
}

type ActiveAttempt = {
  _id: { toString(): string }
  mode: 'exam' | 'cpd'
  startedAt: Date
  timerStartedAt?: Date
  quiz: {
    name: string
    category: string
  }
  questions: AttemptQuestion[]
  currentQuestionIndex: number
  currentQuestion?: AttemptQuestion
}

export default async function QuizAttemptRunnerPage({ params }: PageProps) {
  const { attemptId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/cpd/attempt/${attemptId}`)
  }

  const attempt = (await getActiveQuizAttempt({
    attemptId,
    userId: session.user.id,
    expectedMode: 'cpd',
  })) as ActiveAttempt | null

  if (!attempt) {
    notFound()
  }

  const totalQuestions = attempt.questions.length
  const currentQuestion =
    attempt.currentQuestion ?? attempt.questions[attempt.currentQuestionIndex]

  if (attempt.currentQuestionIndex >= totalQuestions) {
    await completeQuizAttempt({
      attemptId,
      userId: session.user.id,
    })
    redirect(`/cpd/attempt/${attemptId}/result`)
  }

  if (!currentQuestion) {
    notFound()
  }

  return (
    <QuizActiveAttemptShell
      mode={attempt.mode}
      startedAt={attempt.startedAt}
      quizName={attempt.quiz.name}
      quizCategory={attempt.quiz.category}
      questionNumber={Math.min(
        attempt.currentQuestionIndex + 1,
        totalQuestions,
      )}
      totalQuestions={totalQuestions}
      question={currentQuestion}
      action={`/cpd/attempt/${attemptId}/answer`}
      showTimer={attempt.mode === 'exam'}
    />
  )
}
