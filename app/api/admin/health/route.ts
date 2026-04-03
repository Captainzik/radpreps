import { NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth/api-guards'

export async function GET() {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  return NextResponse.json(
    {
      success: true,
      message: 'Admin API is healthy',
      user: {
        id: guard.session.user.id,
        role: guard.session.user.role,
      },
    },
    { status: 200 },
  )
}
