import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import { Wallet } from '@/lib/db/models/wallet.model'
import { LeagueGroup } from '@/lib/db/models/league-group.model'
import { LeagueMembership } from '@/lib/db/models/league-membership.model'
import { QuizAttempt } from '@/lib/db/models/attempts.model'
import { LEAGUES } from '@/lib/gamification/leagues'
import { getWeekStart, getWeekEnd } from '@/lib/gamification/league-weeks'

/**
 * Ensures the collections exist before any transaction runs.
 * MongoDB cannot create collections inside multi-document transactions.
 */
async function ensureCollections() {
  await Promise.all([
    LeagueGroup.createCollection().catch(() => {}),
    LeagueMembership.createCollection().catch(() => {}),
  ])
}

/**
 * Ensures the user has a LeagueMembership for the current week.
 * Lazily creates a group if needed. Safe to call multiple times — idempotent.
 */
export async function ensureLeagueMembership(userId: string) {
  await connectToDatabase()
  await ensureCollections()

  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd()

  // Return existing membership if present.
  const existing = await LeagueMembership.findOne({
    user: userId,
    weekStart,
  }).lean()
  if (existing) return existing

  // Read wallet to get current league tier.
  const wallet = (await Wallet.findOne({ user: userId })
    .select('leagueTier leagueTierRank')
    .lean()) as { leagueTier?: string; leagueTierRank?: number } | null

  const tierName = wallet?.leagueTier ?? 'Bronze'
  const tierRank =
    wallet?.leagueTierRank ??
    LEAGUES.find((l) => l.name === tierName)?.rank ??
    1

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Atomically grab a slot in an existing group, or create a new one.
    let group = await LeagueGroup.findOneAndUpdate(
      {
        tier: tierName,
        weekStart,
        status: 'active',
        $expr: { $lt: ['$memberCount', '$maxMembers'] },
      },
      { $inc: { memberCount: 1 } },
      { returnDocument: 'after', session },
    )

    if (!group) {
      const [newGroup] = await LeagueGroup.create(
        [
          {
            tier: tierName,
            tierRank,
            weekStart,
            weekEnd,
            status: 'active',
            memberCount: 1,
            maxMembers: 25,
          },
        ],
        { session },
      )
      group = newGroup
    }

    // Backfill weeklyXp from quiz attempts completed this week before the user
    // first visited the league page. Uses QuizAttempt directly to avoid any
    // ambiguity around wallet subdocument timestamp storage.
    const xpAgg = await QuizAttempt.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          completedAt: { $gte: weekStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$xpEarned' } } },
    ])
    const backdatedXp: number = xpAgg[0]?.total ?? 0

    // Upsert membership — unique index {user, weekStart} handles race conditions.
    const membership = await LeagueMembership.findOneAndUpdate(
      { user: userId, weekStart },
      {
        $setOnInsert: {
          user: userId,
          group: group._id,
          tier: tierName,
          tierRank,
          weeklyXp: backdatedXp,
          weekStart,
          settled: false,
        },
      },
      { upsert: true, returnDocument: 'after', session },
    )

    await session.commitTransaction()
    return membership!
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}

/**
 * Returns the current week's membership + ranked group members for the league page.
 */
export async function getLeagueGroupData(userId: string) {
  await connectToDatabase()

  const membership = await ensureLeagueMembership(userId)

  const members = await LeagueMembership.find({ group: membership.group })
    .sort({ weeklyXp: -1, createdAt: 1 }) // tie-break: joined earlier = higher rank
    .populate<{
      user: { _id: mongoose.Types.ObjectId; username?: string; avatar?: string }
    }>('user', 'username avatar')
    .lean()

  const currentRank =
    members.findIndex((m) => m.user._id.toString() === userId) + 1

  const isFirstTier = membership.tierRank === 1
  const promotionCutoff = 5
  const demotionCutoff = 15

  return {
    tier: membership.tier,
    tierRank: membership.tierRank,
    weekStart: membership.weekStart,
    members: members.map((m, i) => ({
      rank: i + 1,
      userId: m.user._id.toString(),
      username: m.user.username ?? 'Anonymous',
      avatar: m.user.avatar ?? null,
      weeklyXp: m.weeklyXp,
      isCurrentUser: m.user._id.toString() === userId,
    })),
    currentRank,
    zones: {
      promotionCutoff,
      demotionCutoff: isFirstTier ? null : demotionCutoff,
      hasDemotion: !isFirstTier,
    },
  }
}
