import Link from 'next/link'
import CreateUserForm from '@/components/admin/forms/create-user-form'

export default function NewAdminUserPage() {
  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* CHANGED: header card gets mobile padding and wraps more naturally. */}
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <h1 className='text-xl font-semibold text-slate-900 dark:text-white'>
          Create User
        </h1>
        <Link
          href='/admin/users'
          className='rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-800'
        >
          Back
        </Link>
      </div>

      <CreateUserForm />
    </main>
  )
}
