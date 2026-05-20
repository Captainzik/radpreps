import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import { getLeagueGroupData } from '@/lib/actions/league.actions'
import { runWeeklySettlement } from '@/lib/actions/league-settlement.actions'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectToDatabase()

  // Lazy settlement: run before serving so the user sees up-to-date tier.
  await runWeeklySettlement().catch(() => {})

  try {
    const data = await getLeagueGroupData(session.user.id)
    return NextResponse.json(data)
  } catch (err) {
    console.error('League group fetch error', err)
    return NextResponse.json(
      { error: 'Failed to load league' },
      { status: 500 },
    )
  }
}
