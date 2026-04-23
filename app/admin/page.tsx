import Link from 'next/link'

const cards = [
  {
    title: 'Quizzes',
    description: 'Create, edit, publish and delete quizzes.',
    href: '/admin/quizzes',
  },
  {
    title: 'Questions',
    description: 'Manage question bank and assign to quizzes.',
    href: '/admin/questions',
  },
  {
    title: 'Users',
    description: 'Manage users, roles, and account status.',
    href: '/admin/users',
  },
]

export default function AdminPage() {
  return (
    <main className='space-y-4 sm:space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
          Admin Dashboard
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          Manage quizzes, questions, and users from one place.
        </p>
      </section>

      {/* CHANGED: dashboard cards stack on mobile and expand at md. */}
      <section className='grid gap-4 md:grid-cols-3'>
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-5'
          >
            <h2 className='font-semibold text-slate-900 dark:text-white'>
              {card.title}
            </h2>
            <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
              {card.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  )
}
