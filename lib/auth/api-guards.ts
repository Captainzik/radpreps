import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export type AppRole = 'user' | 'admin' | 'moderator'

export async function requireApiAuth() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      ),
    }
  }

  return {
    ok: true as const,
    session,
  }
}

export async function requireApiRoles(allowedRoles: AppRole[]) {
  const authResult = await requireApiAuth()

  if (!authResult.ok) return authResult

  const userRole = authResult.session.user.role

  if (!allowedRoles.includes(userRole)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 },
      ),
    }
  }

  return authResult
}

export async function requireApiAdmin() {
  return requireApiRoles(['admin'])
}
