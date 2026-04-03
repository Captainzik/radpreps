import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function requireAuth(callbackUrl?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    const target = callbackUrl
      ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/auth/signin'
    redirect(target)
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth('/admin')
  if (session.user.role !== 'admin') {
    redirect('/403')
  }
  return session
}
