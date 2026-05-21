import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getActiveQuizAttempt } from '@/lib/actions/quizAttempt.active'
import { completeCpdPart, PART_SIZE } from '@/lib/actions/quizAttempt.cpd-part'
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

  // Attempt already completed — send to full result page.
  if (!attempt) {
    redirect(`/cpd/attempt/${attemptId}/result`)
  }

  const totalQuestions = attempt.questions.length
  const currentQuestion =
    attempt.currentQuestion ?? attempt.questions[attempt.currentQuestionIndex]

  // All questions answered but part not yet finalised (e.g. crash recovery).
  if (attempt.currentQuestionIndex >= totalQuestions) {
    const lastPartIndex = Math.floor((totalQuestions - 1) / PART_SIZE)
    await completeCpdPart({
      attemptId,
      userId: session.user.id,
      partIndex: lastPartIndex,
    })
    redirect(`/cpd/attempt/${attemptId}/part/${lastPartIndex}`)
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
      attemptId={attemptId}
      showTimer={attempt.mode === 'exam'}
    />
  )
}
