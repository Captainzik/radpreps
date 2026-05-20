import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import { LeagueGroup } from '@/lib/db/models/league-group.model'
import { LeagueMembership } from '@/lib/db/models/league-membership.model'
import { Wallet } from '@/lib/db/models/wallet.model'
import { LEAGUES } from '@/lib/gamification/leagues'

const PROMOTION_SLOTS = 5
const BELT_SLOTS = 10 // ranks 6–15 (belt zone)

/**
 * Settles a single completed group:
 * - top 5 → promoted to next tier
 * - next 10 (belt) → stay in same tier
 * - rest → demoted to prior tier (unless Bronze)
 */
export async function settleLeagueGroup(groupId: string): Promise<void> {
  await connectToDatabase()

  const group = await LeagueGroup.findById(groupId)
  if (!group || group.status === 'completed') return

  // Ranked members: highest weeklyXp first, tie-break by join time.
  const members = await LeagueMembership.find({
    group: groupId,
    settled: false,
  })
    .sort({ weeklyXp: -1, createdAt: 1 })
    .lean()

  if (members.length === 0) {
    await LeagueGroup.findByIdAndUpdate(groupId, { status: 'completed' })
    return
  }

  const currentTierRank = group.tierRank
  const nextTier = LEAGUES.find((l) => l.rank === currentTierRank + 1)
  const prevTier = LEAGUES.find((l) => l.rank === currentTierRank - 1)

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const walletUpdates: Promise<unknown>[] = []
    const membershipUpdates: Promise<unknown>[] = []

    members.forEach((m, idx) => {
      const rank = idx + 1 // 1-based

      let newTierName: string
      let newTierRank: number
      let promotedFrom: string | undefined
      let demotedFrom: string | undefined

      if (rank <= PROMOTION_SLOTS && nextTier) {
        // Promote
        newTierName = nextTier.name
        newTierRank = nextTier.rank
        promotedFrom = group.tier
      } else if (rank <= PROMOTION_SLOTS + BELT_SLOTS || !prevTier) {
        // Belt zone OR Bronze (no demotion possible) — stay
        newTierName = group.tier
        newTierRank = currentTierRank
      } else {
        // Demote
        newTierName = prevTier.name
        newTierRank = prevTier.rank
        demotedFrom = group.tier
      }

      walletUpdates.push(
        Wallet.findOneAndUpdate(
          { user: m.user },
          { $set: { leagueTier: newTierName, leagueTierRank: newTierRank } },
          { session },
        ),
      )

      membershipUpdates.push(
        LeagueMembership.findByIdAndUpdate(
          m._id,
          {
            $set: {
              settled: true,
              ...(promotedFrom ? { promotedFrom } : {}),
              ...(demotedFrom ? { demotedFrom } : {}),
            },
          },
          { session },
        ),
      )
    })

    await Promise.all([...walletUpdates, ...membershipUpdates])
    await LeagueGroup.findByIdAndUpdate(
      groupId,
      { status: 'completed' },
      { session },
    )

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}

/**
 * Finds all active groups whose weekEnd has passed and settles them.
 * Safe to call multiple times — completed groups are skipped.
 */
export async function runWeeklySettlement(): Promise<{ settled: number }> {
  await connectToDatabase()

  const overdueGroups = await LeagueGroup.find({
    status: 'active',
    weekEnd: { $lt: new Date() },
  })
    .select('_id')
    .lean()

  let settled = 0
  for (const group of overdueGroups) {
    try {
      await settleLeagueGroup(group._id.toString())
      settled++
    } catch {
      // Log but continue settling other groups.
      console.error(`League settlement failed for group ${group._id}`)
    }
  }

  return { settled }
}
