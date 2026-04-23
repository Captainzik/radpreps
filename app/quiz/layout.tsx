import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/quiz')
  }

  return (
    /* CHANGED: quiz shell uses a mobile-safe page container without fixed widths. */
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
        {children}
      </div>
    </div>
  )
}
