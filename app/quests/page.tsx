import { Scroll } from 'lucide-react'
import type { Metadata } from 'next'
import { pageBootstrap } from '@/lib/page-conventions'
import { Quest } from '@/lib/db/models/quest.model'
import type { IQuest, QuestScope } from '@/lib/db/models/quest.model'
import type { Types } from 'mongoose'
import {
  QuestCard,
  QuestEmptyState,
} from '@/components/gamification/quest-card'

export const metadata: Metadata = { title: 'Quests' }

type QuestWithId = IQuest & { _id: Types.ObjectId }

const SCOPE_ORDER: QuestScope[] = [
  'daily',
  'weekly',
  'monthly',
  'seasonal',
  'friend',
]

export default async function QuestsPage() {
  await pageBootstrap('/quests')

  const now = new Date()

  const quests = (await Quest.find({
    isActive: true,
    $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }],
  })
    .sort({ scope: 1, createdAt: -1 })
    .lean()) as QuestWithId[]

  // Group by scope in preferred order
  const grouped = SCOPE_ORDER.reduce<Record<string, QuestWithId[]>>(
    (acc, scope) => {
      const items = quests.filter((q) => q.scope === scope)
      if (items.length > 0) acc[scope] = items
      return acc
    },
    {},
  )

  const hasAny = quests.length > 0

  const SECTION_LABELS: Record<QuestScope, string> = {
    daily: 'Daily Quests',
    weekly: 'Weekly Quests',
    monthly: 'Monthly Quests',
    seasonal: 'Seasonal Events',
    friend: 'Social Quests',
  }

  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* Header */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
        <div className='flex items-center gap-2'>
          <Scroll className='h-5 w-5 text-amber-500' />
          <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
            Quests
          </h1>
        </div>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
          Complete quests to earn XP, gems, and hearts.
        </p>
      </section>

      {!hasAny ? (
        <QuestEmptyState />
      ) : (
        Object.entries(grouped).map(([scope, items]) => (
          <section key={scope} className='space-y-3'>
            <h2 className='px-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>
              {SECTION_LABELS[scope as QuestScope] ?? scope}
            </h2>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {items.map((quest) => (
                <QuestCard key={quest._id.toString()} quest={quest} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
