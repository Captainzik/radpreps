import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  if (session.user.role !== 'admin') {
    redirect('/403')
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8'>
        <div className='mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h1 className='text-xl font-semibold text-slate-900'>Admin Panel</h1>
          <p className='text-sm text-slate-600'>
            Restricted area. Signed in as {session.user.email}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
