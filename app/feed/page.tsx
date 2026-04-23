import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getGlobalFeed } from '@/lib/actions/feed.actions'
import FeedList from './feed-list'

export default async function FeedPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/feed')
  }

  const initialItems = await getGlobalFeed({ limit: 20 })

  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* CHANGED: section card padding and spacing are reduced on mobile. */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
          Feed
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
          Community activity, most recent first.
        </p>
      </section>

      <FeedList initialItems={initialItems} />
    </main>
  )
}
