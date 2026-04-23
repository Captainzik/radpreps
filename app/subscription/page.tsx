import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User } from '@/lib/db/models/user.model'

type Plan = {
  id: 'free' | 'pro' | 'elite'
  name: string
  price: string
  features: string[]
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0/mo',
    features: ['Access to quiz basics', 'Community leaderboard', 'Basic feed'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12/mo',
    features: ['Advanced analytics', 'Priority support', 'More exam sets'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$29/mo',
    features: [
      'Everything in Pro',
      'Early feature access',
      'Premium prep roadmap',
    ],
  },
]

export default async function SubscriptionPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/subscription')
  }

  const user = await User.findById(session.user.id)
    .select(
      'email fullName username lifetimeTotalScore currentStreak longestStreak',
    )
    .lean()

  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* CHANGED: header card gets mobile-friendly padding. */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
          Subscription
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          Choose a plan that fits your learning pace.
        </p>
      </section>

      {/* CHANGED: plan cards stack naturally on mobile. */}
      <section className='grid gap-4 md:grid-cols-3'>
        {plans.map((plan) => (
          <article
            key={plan.id}
            className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5'
          >
            <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
              {plan.name}
            </h2>
            <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
              {plan.price}
            </p>
            <ul className='mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-400'>
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <button
              type='button'
              className='mt-5 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600'
            >
              Select {plan.name}
            </button>
          </article>
        ))}
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h3 className='text-base font-semibold text-slate-900 dark:text-white'>
          Your learning snapshot
        </h3>
        <div className='mt-3 grid gap-3 text-sm text-slate-700 dark:text-slate-400 sm:grid-cols-2 lg:grid-cols-4'>
          <p>
            <span className='font-medium'>User:</span>{' '}
            {user?.fullName || user?.username || user?.email || 'N/A'}
          </p>
          <p>
            <span className='font-medium'>Lifetime score:</span>{' '}
            {user?.lifetimeTotalScore ?? 0}
          </p>
          <p>
            <span className='font-medium'>Current streak:</span>{' '}
            {user?.currentStreak ?? 0}
          </p>
          <p>
            <span className='font-medium'>Longest streak:</span>{' '}
            {user?.longestStreak ?? 0}
          </p>
        </div>
        <Link
          href='/quiz'
          className='mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
        >
          Continue practicing
        </Link>
      </section>
    </main>
  )
}
