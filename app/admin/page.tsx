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
    <main className='space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Admin Dashboard</h1>
        <p className='mt-1 text-sm text-slate-600'>
          Manage quizzes, questions, and users from one place.
        </p>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md'
          >
            <h2 className='font-semibold text-slate-900'>{card.title}</h2>
            <p className='mt-1 text-sm text-slate-600'>{card.description}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
