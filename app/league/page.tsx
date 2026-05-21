import { Fragment } from 'react'
import { Shield } from 'lucide-react'
import type { Metadata } from 'next'
import { pageBootstrap } from '@/lib/page-conventions'
import { getLeagueGroupData } from '@/lib/actions/league.actions'
import { runWeeklySettlement } from '@/lib/actions/league-settlement.actions'
import { LeagueBadge } from '@/components/gamification/leagues'
import { LeagueMemberRow } from '@/components/gamification/league-member-row'
import { LeagueZoneDivider } from '@/components/gamification/league-zone-divider'
import { LeagueCountdown } from '@/components/gamification/league-countdown'

export const metadata: Metadata = { title: 'League' }

export default async function LeaguePage() {
  const session = await pageBootstrap('/league')

  // Lazy settlement before serving page.
  await runWeeklySettlement().catch(() => {})

  const data = await getLeagueGroupData(session.user.id)

  const { tier, tierRank, members, currentRank, zones } = data

  const GOAT_TIER_RANK = 10
  const isTopTier = tierRank >= GOAT_TIER_RANK

  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* Hero */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <Shield className='h-5 w-5 text-purple-500' />
              <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                {tier} League
              </h1>
            </div>
            <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
              {isTopTier
                ? 'You are in the top tier. Defend your championship!'
                : 'Top 5 advance at week end. Keep earning XP!'}
            </p>
            <div className='mt-2'>
              <LeagueCountdown />
            </div>
          </div>
          <div className='flex flex-col items-start gap-1 sm:items-end'>
            <LeagueBadge xp={0} overrideTier={tier} />
            {currentRank > 0 && (
              <p className='text-xs text-slate-500 dark:text-slate-400'>
                Your rank:{' '}
                <span className='font-semibold text-slate-700 dark:text-slate-200'>
                  #{currentRank}
                </span>{' '}
                of {members.length}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Ranked list */}
      <section className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <h2 className='border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200 sm:px-6'>
          This week&apos;s rankings — weekly XP
        </h2>
        <ul className='divide-y divide-slate-100 dark:divide-slate-800'>
          {members.map((member) => (
            <Fragment key={member.userId}>
              <LeagueMemberRow member={member} />

              {/* Promotion divider — after rank 5 */}
              {member.rank === zones.promotionCutoff && !isTopTier && (
                <LeagueZoneDivider
                  key='promo-divider'
                  type='promotion'
                  tierRank={tierRank}
                />
              )}

              {/* Demotion divider — after rank 15, only for tiers 2+ */}
              {zones.hasDemotion && member.rank === zones.demotionCutoff && (
                <LeagueZoneDivider
                  key='demo-divider'
                  type='demotion'
                  tierRank={tierRank}
                />
              )}
            </Fragment>
          ))}
        </ul>

        {members.length === 0 && (
          <p className='px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400'>
            No members yet this week.
          </p>
        )}
      </section>
    </main>
  )
}
