import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <main className='mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center'>
      <div className='rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-slate-900 sm:p-8'>
        <h1 className='text-2xl font-bold text-red-700'>403 - Forbidden</h1>
        <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
          You do not have permission to access this page.
        </p>
        <Link
          href='/'
          className='mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-700 dark:hover:bg-slate-600'
        >
          Go back home
        </Link>
      </div>
    </main>
  )
}
