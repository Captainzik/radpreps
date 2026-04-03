import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/quiz')
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8'>
        {children}
      </div>
    </div>
  )
}
