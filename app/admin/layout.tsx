import { requireAdmin } from '@/lib/auth/guards'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdmin()

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
        {/* CHANGED: admin shell card gets smaller padding on mobile. */}
        <div className='mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <h1 className='text-xl font-semibold text-slate-900 dark:text-white'>
            Admin Panel
          </h1>
          <p className='text-sm text-slate-600 dark:text-slate-400'>
            Restricted area. Signed in as {session.user.email}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
