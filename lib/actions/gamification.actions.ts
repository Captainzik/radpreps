import type { ClientSession } from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import { Wallet } from '@/lib/db/models/wallet.model'
import { User } from '@/lib/db/models/user.model'
import { Badge, UserBadge } from '@/lib/db/models/badge.model'
import { QuizAttempt } from '@/lib/db/models/attempts.model'
import { LeagueMembership } from '@/lib/db/models/league-membership.model'
import type { QuizMode } from '@/lib/modes/types'
import { BADGES } from '@/lib/gamification/badges'
import { getWeekStart } from '@/lib/gamification/league-weeks'

// ---------------------------------------------------------------------------
// Gems
// ---------------------------------------------------------------------------

const GEM_AWARDS: Record<
  QuizMode,
  { base: number; highScore: number; perfectScore: number }
> = {
  exam: { base: 0, highScore: 0, perfectScore: 5 },
  cpd: { base: 3, highScore: 5, perfectScore: 10 },
}

export function computeGemsEarned(mode: QuizMode, percentage: number): number {
  const awards = GEM_AWARDS[mode]
  if (percentage >= 100) return awards.perfectScore
  if (percentage >= 80) return awards.highScore
  return awards.base
}

// ---------------------------------------------------------------------------
// Wallet – XP + Gems  (call inside transaction)
// ---------------------------------------------------------------------------

export async function applyWalletRewards({
  userId,
  xpEarned,
  gemsEarned,
  mode,
  session,
}: {
  userId: string
  xpEarned: number
  gemsEarned: number
  mode: QuizMode
  session: ClientSession
}) {
  if (xpEarned <= 0 && gemsEarned <= 0) return

  const inc: Record<string, number> = {}
  const push: { transactions: object[] } = { transactions: [] }
  const now = new Date()

  if (xpEarned > 0) {
    inc['xp'] = xpEarned
    push.transactions.push({
      type: 'quiz_completion',
      amount: xpEarned,
      currency: 'xp',
      mode,
      reason: `Quiz completion XP (${mode})`,
      createdAt: now,
    })
  }

  if (gemsEarned > 0) {
    inc['gems'] = gemsEarned
    push.transactions.push({
      type: 'quiz_completion',
      amount: gemsEarned,
      currency: 'gems',
      mode,
      reason: `Quiz completion gems (${mode})`,
      createdAt: now,
    })
  }

  await Wallet.findOneAndUpdate(
    { user: userId },
    {
      $inc: inc,
      $push: { transactions: { $each: push.transactions } },
      $set: { lastXPAwardAt: now },
    },
    { upsert: true, session, returnDocument: 'before' },
  )

  // Also increment weeklyXp on the current league membership (best-effort, outside tx).
  if (xpEarned > 0) {
    const weekStart = getWeekStart(now)
    LeagueMembership.findOneAndUpdate(
      { user: userId, weekStart, settled: false },
      { $inc: { weeklyXp: xpEarned } },
    ).catch(() => {
      // Silently ignore — membership may not exist yet if user hasn't visited league page.
    })
  }
}

// ---------------------------------------------------------------------------
// Streak – daily increment on User  (call inside transaction)
// ---------------------------------------------------------------------------

function isSameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

function isYesterday(candidate: Date, today: Date) {
  const yesterday = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - 1,
    ),
  )
  return isSameDay(candidate, yesterday)
}

export async function applyStreakUpdate({
  userId,
  completedAt,
  session,
}: {
  userId: string
  completedAt: Date
  session: ClientSession
}) {
  const user = await User.findById(userId).session(session)
  if (!user) return

  const today = new Date(completedAt)
  const lastDate = user.lastStreakDate

  // Already updated streak today – nothing to do.
  if (lastDate && isSameDay(lastDate, today)) return

  let nextStreak: number
  if (lastDate && isYesterday(lastDate, today)) {
    // Consecutive day – continue streak.
    nextStreak = user.currentStreak + 1
  } else {
    // Gap or first quiz – start fresh streak.
    nextStreak = 1
  }

  const nextLongest = Math.max(user.longestStreak, nextStreak)

  user.currentStreak = nextStreak
  user.longestStreak = nextLongest
  user.lastStreakDate = today
  await user.save({ session })
}

// ---------------------------------------------------------------------------
// Badges – best-effort, fire-and-forget  (call AFTER transaction commit)
// ---------------------------------------------------------------------------

async function upsertBadge(badgeId: string) {
  const def = BADGES.find((b) => b.id === badgeId)
  if (!def) return null

  const doc = await Badge.findOneAndUpdate(
    { badgeId },
    {
      $setOnInsert: {
        badgeId: def.id,
        title: def.title,
        description: def.description,
        mode: def.mode ?? undefined,
        isActive: true,
      },
    },
    { upsert: true, returnDocument: 'after' },
  )
  return doc
}

async function awardBadgeIfNew(
  userId: string,
  badgeId: string,
  source: string,
) {
  const badge = await upsertBadge(badgeId)
  if (!badge) return

  await UserBadge.findOneAndUpdate(
    { user: userId, badge: badge._id },
    {
      $setOnInsert: {
        user: userId,
        badge: badge._id,
        earnedAt: new Date(),
        source,
      },
    },
    { upsert: true, returnDocument: 'before' },
  )
}

export async function checkAndAwardBadges({
  userId,
  mode,
  percentage,
}: {
  userId: string
  mode: QuizMode
  percentage: number
}) {
  try {
    await connectToDatabase()

    // Fetch user for streak info and total completed count in parallel.
    const [user, totalCompleted, cpdCompleted] = await Promise.all([
      User.findById(userId).select('currentStreak').lean(),
      QuizAttempt.countDocuments({ user: userId, completed: true }),
      QuizAttempt.countDocuments({
        user: userId,
        completed: true,
        mode: 'cpd',
      }),
    ])

    if (!user) return

    const streak = user.currentStreak ?? 0
    const source = `quiz_completion:${mode}`

    const checks: Promise<void>[] = []

    // First quiz
    if (totalCompleted >= 1)
      checks.push(awardBadgeIfNew(userId, 'first-quiz', source))

    // Volume badges
    if (totalCompleted >= 10)
      checks.push(awardBadgeIfNew(userId, 'quiz-10', source))
    if (totalCompleted >= 50)
      checks.push(awardBadgeIfNew(userId, 'quiz-50', source))
    if (totalCompleted >= 100)
      checks.push(awardBadgeIfNew(userId, 'quiz-100', source))

    // Streak badges
    if (streak >= 3) checks.push(awardBadgeIfNew(userId, 'streak-3', source))
    if (streak >= 7) checks.push(awardBadgeIfNew(userId, 'streak-7', source))
    if (streak >= 30) checks.push(awardBadgeIfNew(userId, 'streak-30', source))

    // Accuracy badges
    if (percentage >= 80)
      checks.push(awardBadgeIfNew(userId, 'accuracy-80', source))
    if (percentage >= 90)
      checks.push(awardBadgeIfNew(userId, 'accuracy-90', source))

    // Mode-specific badges
    if (mode === 'exam' && percentage >= 80)
      checks.push(awardBadgeIfNew(userId, 'exam-master', source))
    if (mode === 'cpd' && cpdCompleted >= 10)
      checks.push(awardBadgeIfNew(userId, 'cpd-consistent', source))

    await Promise.allSettled(checks)
  } catch {
    // Badge awards are best-effort; never fail the completion flow.
  }
}
