import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getQuizAttemptResult } from '@/lib/actions/quizAttempt.result'
import QuizReviewForm from '@/components/reviews/quiz-review-form'
import { QuizResultSummary } from '@/components/results/quiz-result-summary'
import { QuizResultAnswerCard } from '@/components/results/quiz-result-answer-card'

type PageProps = {
  params: Promise<{
    attemptId: string
  }>
}

type ResultAnswer = {
  questionId: string
  questionText: string
  questionImage?: string
  selectedOptionIndex?: number
  correctOptionIndex: number
  isCorrect: boolean
  pointsEarned: number
  tips?: string
  options: { text?: string; image?: string }[]
}

type QuizAttemptResult = {
  attemptId: string
  quiz: {
    id: string
    name: string
    category: string
    image?: string
  }
  score: number
  maxScore: number
  percentage: number
  completedAt?: Date | string
  answers: ResultAnswer[]
  startedAt?: Date
}

export default async function QuizAttemptResultPage({ params }: PageProps) {
  const { attemptId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/cpd/attempt/${attemptId}/result`)
  }

  let result: QuizAttemptResult

  try {
    result = (await getQuizAttemptResult({
      attemptId,
      userId: session.user.id,
    })) as QuizAttemptResult
  } catch {
    notFound()
  }

  const correctCount = result.answers.filter((a) => a.isCorrect).length
  const totalCount = result.answers.length

  return (
    <main className='space-y-4 sm:space-y-6'>
      <QuizResultSummary
        mode='cpd'
        quiz={result.quiz}
        score={result.score}
        maxScore={result.maxScore}
        percentage={result.percentage}
        startedAt={result.startedAt ?? new Date()}
        completedAt={
          result.completedAt instanceof Date
            ? result.completedAt
            : result.completedAt
              ? new Date(result.completedAt)
              : undefined
        }
        totalQuestions={totalCount}
        correctCount={correctCount}
        totalCount={totalCount}
      />

      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <QuizReviewForm quizId={result.quiz.id} userId={session.user.id} />
      </section>

      <section className='space-y-3'>
        {result.answers.map((answer, index) => (
          <QuizResultAnswerCard
            key={answer.questionId || `${attemptId}-${index}`}
            answer={answer}
            index={index}
            attemptId={attemptId}
          />
        ))}
      </section>
    </main>
  )
}
