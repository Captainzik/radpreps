import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getUserQuizHistory } from '@/lib/actions/quizAttempt.actions'

export default async function QuizHistoryPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/quiz/history')
  }

  const history = await getUserQuizHistory({
    userId: session.user.id,
    limit: 100,
  })

  return (
    <main className='space-y-4 sm:space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
          Quiz History
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          Review your previous quiz attempts and performance.
        </p>
      </section>

      {history.length === 0 ? (
        <section className='rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800 sm:p-8'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
            No attempts yet
          </h2>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            Start a quiz to build your history.
          </p>
          <Link
            href='/quiz/start'
            className='mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
          >
            Start a quiz
          </Link>
        </section>
      ) : (
        <section className='space-y-3'>
          {history.map((item) => (
            <article
              key={item.id}
              className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5'
            >
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <h2 className='text-base font-semibold text-slate-900 dark:text-white'>
                    {item.quizName}
                  </h2>
                  <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
                    {item.category || 'General'}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.completed
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  }`}
                >
                  {item.completed ? 'Completed' : 'In progress'}
                </span>
              </div>

              <div className='mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4'>
                <p>
                  <span className='font-medium'>Score:</span> {item.score} /{' '}
                  {item.maxScore}
                </p>
                <p>
                  <span className='font-medium'>Percentage:</span>{' '}
                  {item.percentage.toFixed(1)}%
                </p>
                <p>
                  <span className='font-medium'>Answered:</span>{' '}
                  {item.questionsAnswered} / {item.totalQuestions}
                </p>
                <p>
                  <span className='font-medium'>Started:</span>{' '}
                  {new Date(item.startedAt).toLocaleString()}
                </p>
              </div>

              <div className='mt-4 flex flex-wrap gap-2'>
                {item.completed ? (
                  <Link
                    href={`/quiz/attempt/${item.id}/result`}
                    className='inline-flex rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                  >
                    View result
                  </Link>
                ) : (
                  <Link
                    href={`/quiz/attempt/${item.id}`}
                    className='inline-flex rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                  >
                    Continue attempt
                  </Link>
                )}

                {item.quizId ? (
                  <Link
                    href={`/quiz/${item.quizId}`}
                    className='inline-flex rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                  >
                    Quiz details
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
