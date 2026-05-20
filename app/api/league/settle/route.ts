import { NextResponse } from 'next/server'
import { runWeeklySettlement } from '@/lib/actions/league-settlement.actions'

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWeeklySettlement()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('League settlement error', err)
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 })
  }
}
