import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getActiveQuizAttempt } from '@/lib/actions/quizAttempt.active'
import { completeQuizAttempt } from '@/lib/actions/quizAttempt.result'
import { QuizExamAttemptClient } from '@/components/learning/quiz-exam-attempt-client'

type PageProps = {
  params: Promise<{
    attemptId: string
  }>
  searchParams?: Promise<{
    resume?: string
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
  status: string
  resultVisibility: string
  startedAt: Date
  timerStartedAt?: Date
  timeTakenMs?: number
  questionTimeLimitMs?: number
  checkpointDeadlineMs?: number
  checkpointIndex: number
  showTimer: boolean
  questions: AttemptQuestion[]
  currentQuestionIndex: number
  currentQuestion?: AttemptQuestion
  quiz: {
    id: string
    name: string
    category: string
    image?: string
  }
  answers: {
    questionId: string
    selectedOptionIndex?: number
  }[]
  answeredCount: number
  completed: boolean
}

export default async function QuizAttemptRunnerPage({
  params,
  searchParams,
}: PageProps) {
  const { attemptId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/exam/attempt/${attemptId}`)
  }

  const isResume = resolvedSearchParams?.resume === '1'

  const attempt = (await getActiveQuizAttempt({
    attemptId,
    userId: session.user.id,
    expectedMode: 'exam',
    resume: isResume,
  })) as ActiveAttempt | null

  if (!attempt) {
    notFound()
  }

  // Auto-resume paused attempts when user loads the page
  // This allows continuing after page reload without going through resume flow
  if (attempt.status === 'paused') {
    // Redirect to same page with resume flag to trigger proper resume logic
    redirect(`/exam/attempt/${attemptId}?resume=1`)
  }

  if (attempt.answeredCount >= attempt.questions.length) {
    await completeQuizAttempt({
      attemptId,
      userId: session.user.id,
    })
    redirect(`/exam/attempt/${attemptId}/result`)
  }

  const currentQuestion = attempt.currentQuestion

  if (!currentQuestion) {
    notFound()
  }

  const currentQuestionNumber = attempt.currentQuestionIndex + 1

  return (
    <QuizExamAttemptClient
      attemptId={attemptId}
      mode={attempt.mode}
      startedAt={
        attempt.timerStartedAt instanceof Date
          ? attempt.timerStartedAt.toISOString()
          : attempt.timerStartedAt
            ? new Date(attempt.timerStartedAt).toISOString()
            : attempt.startedAt instanceof Date
              ? attempt.startedAt.toISOString()
              : new Date(attempt.startedAt).toISOString()
      }
      quizName={attempt.quiz.name}
      quizCategory={attempt.quiz.category}
      questionNumber={currentQuestionNumber}
      totalQuestions={attempt.questions.length}
      question={currentQuestion}
      action={`/exam/attempt/${attemptId}/answer`}
      checkpointIndex={attempt.checkpointIndex}
      resume={isResume || attempt.status === 'paused'}
    />
  )
}
