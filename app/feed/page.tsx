import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getGlobalFeed } from '@/lib/actions/feed.actions'

export default async function FeedPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/feed')
  }

  const feed = await getGlobalFeed({ limit: 100 })

  return (
    <main className='space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Feed</h1>
        <p className='mt-1 text-sm text-slate-600'>
          Community activity, most recent first.
        </p>
      </section>

      {feed.length === 0 ? (
        <section className='rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center'>
          <h2 className='text-lg font-semibold text-slate-900'>
            No activity yet
          </h2>
        </section>
      ) : (
        <section className='space-y-3'>
          {feed.map((item) => (
            <article
              key={item.attemptId}
              className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
            >
              <p className='text-sm text-slate-700'>
                <span className='font-semibold text-slate-900'>
                  {item.userName}
                </span>{' '}
                did <span className='font-semibold'>{item.quizName}</span>{' '}
                {item.timeAgo}
              </p>

              <div className='mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3'>
                <p>
                  <span className='font-medium'>Score:</span> {item.score}/
                  {item.maxScore}
                </p>
                <p>
                  <span className='font-medium'>Percentage:</span>{' '}
                  {item.percentage.toFixed(1)}%
                </p>
                <p>
                  <span className='font-medium'>Category:</span>{' '}
                  {item.category || 'General'}
                </p>
              </div>

              <div className='mt-4 flex gap-2'>
                <Link
                  href={`/quiz/attempt/${item.attemptId}/result`}
                  className='inline-flex rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800'
                >
                  View result
                </Link>
                {item.quizId ? (
                  <Link
                    href={`/quiz/${item.quizId}`}
                    className='inline-flex rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50'
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
