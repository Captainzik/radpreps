import Link from 'next/link'
import { auth } from '@/auth'

export default async function QuizHomePage() {
  const session = await auth()

  return (
    <main className='space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Quiz Dashboard</h1>
        <p className='mt-1 text-sm text-slate-600'>
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}.
        </p>
      </section>

      <section className='grid gap-4 md:grid-cols-2'>
        <Link
          href='/quiz/start'
          className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md'
        >
          <h2 className='font-semibold text-slate-900'>Start New Quiz</h2>
          <p className='mt-1 text-sm text-slate-600'>
            Pick a category and begin your timed assessment.
          </p>
        </Link>

        <Link
          href='/quiz/history'
          className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md'
        >
          <h2 className='font-semibold text-slate-900'>View Attempt History</h2>
          <p className='mt-1 text-sm text-slate-600'>
            Review your past attempts and progress.
          </p>
        </Link>
      </section>
    </main>
  )
}
