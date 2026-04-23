import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getStartableQuizzes } from '@/lib/actions/quiz.actions'

export default async function QuizStartPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/quiz/start')
  }

  const quizzes = await getStartableQuizzes()

  return (
    <main className='space-y-4 sm:space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
          Start a Quiz
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          Select a published quiz and begin your attempt.
        </p>
      </section>

      {quizzes.length === 0 ? (
        <section className='rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-600 dark:bg-slate-800 sm:p-8'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
            No quizzes available yet
          </h2>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            Please check back later after quizzes are published.
          </p>
          <Link
            href='/quiz'
            className='mt-4 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
          >
            Back to quiz dashboard
          </Link>
        </section>
      ) : (
        <section className='grid gap-4 md:grid-cols-2'>
          {quizzes.map((quiz) => {
            const hasQuestions = quiz.questionsCount > 0

            return (
              <article
                key={quiz._id}
                className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5'
              >
                <div className='mb-3 flex items-start justify-between gap-3'>
                  <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
                    {quiz.name}
                  </h2>
                  <span className='rounded-full bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-700 dark:text-slate-300'>
                    {quiz.category}
                  </span>
                </div>

                <p className='line-clamp-3 text-sm text-slate-600 dark:text-slate-400'>
                  {quiz.description}
                </p>

                <p className='mt-3 text-xs text-slate-500 dark:text-slate-400'>
                  {quiz.questionsCount} question
                  {quiz.questionsCount === 1 ? '' : 's'}
                </p>

                {!hasQuestions ? (
                  <p className='mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300'>
                    This quiz has no questions yet. Please choose another quiz.
                  </p>
                ) : null}

                <div className='mt-4'>
                  {hasQuestions ? (
                    <Link
                      href={`/quiz/${quiz._id}`}
                      className='inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                    >
                      Start quiz
                    </Link>
                  ) : (
                    <button
                      type='button'
                      disabled
                      aria-disabled='true'
                      className='inline-flex w-full cursor-not-allowed items-center justify-center rounded-md bg-slate-300 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    >
                      Start quiz
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
