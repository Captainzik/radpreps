import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getQuizAttemptResult } from '@/lib/actions/quizAttempt.actions'
import MediaPreview from '@/components/shared/media-preview'
import QuizReviewForm from '@/components/reviews/quiz-review-form'

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
}

const MEDIA_BOX =
  'relative mt-3 h-48 w-full max-w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700'

function renderOption(
  option?: { text?: string; image?: string },
  alt = 'Option',
) {
  if (!option) return <span>N/A</span>

  return (
    <div className='space-y-2'>
      {option.text?.trim() ? <p>{option.text}</p> : null}
      {option.image?.trim() ? (
        <div className={MEDIA_BOX}>
          <MediaPreview url={option.image} alt={alt} />
        </div>
      ) : null}
      {!option.text?.trim() && !option.image?.trim() ? <span>N/A</span> : null}
    </div>
  )
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
    <main className='space-y-4 sm:space-y-6'>
      <section className='rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
          Quiz Result
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          {result.quiz.name}
        </p>

        {result.quiz.image?.trim() ? (
          <div className={MEDIA_BOX}>
            <MediaPreview url={result.quiz.image} alt='Quiz media' />
          </div>
        ) : null}

        <div className='mt-4 grid gap-3 sm:grid-cols-3'>
          <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-700'>
            <p className='text-xs text-slate-500 dark:text-slate-400'>Score</p>
            <p className='text-lg font-bold text-slate-900 dark:text-white'>
              {result.score} / {result.maxScore}
            </p>
          </div>
          <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-700'>
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Percentage
            </p>
            <p className='text-lg font-bold text-slate-900 dark:text-white'>
              {result.percentage.toFixed(1)}%
            </p>
          </div>
          <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-700'>
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Correct
            </p>
            <p className='text-lg font-bold text-slate-900 dark:text-white'>
              {correctCount} / {totalCount}
            </p>
          </div>
        </div>

        <div className='mt-4 flex flex-wrap gap-3'>
          <Link
            href='/quiz/start'
            className='inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
          >
            Try another quiz
          </Link>
          <Link
            href={`/quiz/${result.quiz.id}`}
            className='inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          >
            Back to quiz details
          </Link>
        </div>
      </section>

      <section className='rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <QuizReviewForm quizId={result.quiz.id} userId={session.user.id} />
      </section>

      <section className='space-y-3'>
        {result.answers.map((ans, index) => {
          const userOption =
            typeof ans.selectedOptionIndex === 'number'
              ? ans.options[ans.selectedOptionIndex]
              : undefined

          const correctOption =
            ans.correctOptionIndex >= 0
              ? ans.options[ans.correctOptionIndex]
              : undefined

          return (
            <article
              key={ans.questionId || `${attemptId}-${index}`}
              className='rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5'
            >
              <div className='mb-2 flex items-center justify-between gap-3'>
                <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                  Q{index + 1}. {ans.questionText}
                </p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    ans.isCorrect
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                  }`}
                >
                  {ans.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              {ans.questionImage?.trim() ? (
                <div className={MEDIA_BOX}>
                  <MediaPreview
                    url={ans.questionImage}
                    alt={`Question ${index + 1} media`}
                  />
                </div>
              ) : null}

              <div className='mt-2 text-sm text-slate-700 dark:text-slate-300'>
                <span className='font-medium'>Your answer:</span>
                <div className='mt-1'>
                  {renderOption(userOption, 'Your selected option media')}
                </div>
              </div>

              <div className='mt-2 text-sm text-slate-700 dark:text-slate-300'>
                <span className='font-medium'>Correct answer:</span>
                <div className='mt-1'>
                  {renderOption(correctOption, 'Correct option media')}
                </div>
              </div>

              {ans.tips ? (
                <p className='mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-50 dark:text-amber-800'>
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
