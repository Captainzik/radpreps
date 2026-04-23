import Link from 'next/link'
import { auth } from '@/auth'
import { getStartableQuizzes } from '@/lib/actions/quiz.actions'

export default async function QuizHomePage() {
  const session = await auth()
  const quizzes = await getStartableQuizzes()

  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* CHANGED: quiz dashboard intro card gets reduced padding on mobile. */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
          Quiz Dashboard
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}.
        </p>
      </section>

      {/* CHANGED: action cards stack on phones and become a 2-column grid later. */}
      <section className='grid gap-4 md:grid-cols-2'>
        <Link
          href='/quiz/start'
          className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-5'
        >
          <h2 className='font-semibold text-slate-900 dark:text-white'>
            Start New Quiz
          </h2>
          <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
            Browse {quizzes.length} available published quiz
            {quizzes.length === 1 ? '' : 'zes'} and begin your assessment.
          </p>
        </Link>

        <Link
          href='/quiz/history'
          className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-5'
        >
          <h2 className='font-semibold text-slate-900 dark:text-white'>
            View Attempt History
          </h2>
          <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
            Review your past attempts and progress.
          </p>
        </Link>
      </section>
    </main>
  )
}
