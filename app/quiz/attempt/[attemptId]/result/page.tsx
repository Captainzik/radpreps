import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getQuizAttemptResult } from '@/lib/actions/quizAttempt.actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{
    attemptId: string
  }>
}

type ResultAnswer = {
  questionId: string
  questionText: string
  selectedOptionIndex?: number
  correctOptionIndex: number
  isCorrect: boolean
  pointsEarned: number
  tips?: string
  options: { text: string }[]
}

type QuizAttemptResult = {
  attemptId: string
  quiz: {
    id: string
    name: string
    category: string
  }
  score: number
  maxScore: number
  percentage: number
  completedAt?: Date | string
  answers: ResultAnswer[]
}

export default async function QuizAttemptResultPage({ params }: PageProps) {
  const { attemptId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/quiz/attempt/${attemptId}/result`)
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
    <main className='space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Quiz Result</h1>
        <p className='mt-1 text-sm text-slate-600'>{result.quiz.name}</p>

        <div className='mt-4 grid gap-3 sm:grid-cols-3'>
          <div className='rounded-lg bg-slate-50 p-4'>
            <p className='text-xs text-slate-500'>Score</p>
            <p className='text-lg font-bold text-slate-900'>
              {result.score} / {result.maxScore}
            </p>
          </div>
          <div className='rounded-lg bg-slate-50 p-4'>
            <p className='text-xs text-slate-500'>Percentage</p>
            <p className='text-lg font-bold text-slate-900'>
              {result.percentage.toFixed(1)}%
            </p>
          </div>
          <div className='rounded-lg bg-slate-50 p-4'>
            <p className='text-xs text-slate-500'>Correct</p>
            <p className='text-lg font-bold text-slate-900'>
              {correctCount} / {totalCount}
            </p>
          </div>
        </div>

        <div className='mt-4 flex flex-wrap gap-3'>
          <Link
            href='/quiz/start'
            className='inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
          >
            Try another quiz
          </Link>
          <Link
            href={`/quiz/${result.quiz.id}`}
            className='inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
          >
            Back to quiz details
          </Link>
        </div>
      </section>

      <section className='space-y-3'>
        {result.answers.map((ans, index) => {
          const userChoice =
            typeof ans.selectedOptionIndex === 'number'
              ? (ans.options[ans.selectedOptionIndex]?.text ?? 'No answer')
              : 'No answer'

          const correctChoice =
            ans.correctOptionIndex >= 0
              ? (ans.options[ans.correctOptionIndex]?.text ?? 'N/A')
              : 'N/A'

          return (
            <article
              key={ans.questionId || `${attemptId}-${index}`}
              className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
            >
              <div className='mb-2 flex items-center justify-between gap-3'>
                <p className='text-sm font-semibold text-slate-900'>
                  Q{index + 1}. {ans.questionText}
                </p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    ans.isCorrect
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {ans.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <p className='text-sm text-slate-700'>
                <span className='font-medium'>Your answer:</span> {userChoice}
              </p>
              <p className='mt-1 text-sm text-slate-700'>
                <span className='font-medium'>Correct answer:</span>{' '}
                {correctChoice}
              </p>

              {ans.tips ? (
                <p className='mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800'>
                  Tip: {ans.tips}
                </p>
              ) : null}
            </article>
          )
        })}
      </section>
    </main>
  )
}
