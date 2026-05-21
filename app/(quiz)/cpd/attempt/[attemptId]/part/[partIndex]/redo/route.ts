import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { resetCpdPart } from '@/lib/actions/quizAttempt.cpd-part'

type RouteContext = {
  params: Promise<{ attemptId: string; partIndex: string }>
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { attemptId, partIndex: partIndexStr } = await params
  const partIndex = Number(partIndexStr)

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/signin', _req.url), 302)
  }

  try {
    await resetCpdPart({ attemptId, userId: session.user.id, partIndex })
  } catch {
    // If reset fails, fall through to runner — it will handle the state.
  }

  return NextResponse.redirect(
    new URL(`/cpd/attempt/${attemptId}`, _req.url),
    302,
  )
}
