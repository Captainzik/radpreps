import {
  Heart,
  Zap,
  Gem,
  BookOpen,
  Clock,
  Calendar,
  Users,
  Star,
} from 'lucide-react'
import type { IQuest, QuestScope } from '@/lib/db/models/quest.model'
import type { Types } from 'mongoose'

type QuestWithId = IQuest & { _id: Types.ObjectId }

const SCOPE_LABELS: Record<QuestScope, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  friend: 'Social',
  seasonal: 'Seasonal',
}

const SCOPE_STYLES: Record<
  QuestScope,
  { text: string; bg: string; icon: React.ReactNode }
> = {
  daily: {
    text: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    icon: <Clock className='h-3 w-3' />,
  },
  weekly: {
    text: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    icon: <Calendar className='h-3 w-3' />,
  },
  monthly: {
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    icon: <Star className='h-3 w-3' />,
  },
  friend: {
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    icon: <Users className='h-3 w-3' />,
  },
  seasonal: {
    text: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-100 dark:bg-green-900/40',
    icon: <Star className='h-3 w-3' />,
  },
}

const MODE_LABELS: Record<string, string> = {
  exam: 'Exam',
  cpd: 'CPD',
}

function ScopeBadge({ scope }: { scope: QuestScope }) {
  const s = SCOPE_STYLES[scope]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.text} ${s.bg}`}
    >
      {s.icon}
      {SCOPE_LABELS[scope]}
    </span>
  )
}

function RewardPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  if (value <= 0) return null
  return (
    <span className='inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
      {icon}
      {value} {label}
    </span>
  )
}

export function QuestCard({ quest }: { quest: QuestWithId }) {
  return (
    <article className='flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <ScopeBadge scope={quest.scope} />
          {quest.mode && (
            <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400'>
              <BookOpen className='h-3 w-3' />
              {MODE_LABELS[quest.mode] ?? quest.mode}
            </span>
          )}
        </div>
        <span className='text-xs text-slate-400 dark:text-slate-500'>
          Goal: {quest.targetCount}
        </span>
      </div>

      <div>
        <h3 className='text-base font-semibold text-slate-900 dark:text-slate-50'>
          {quest.title}
        </h3>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          {quest.description}
        </p>
      </div>

      {(quest.reward.xp > 0 ||
        quest.reward.gems > 0 ||
        quest.reward.hearts > 0) && (
        <div className='flex flex-wrap gap-2'>
          <RewardPill
            icon={<Zap className='h-3 w-3 text-yellow-500' />}
            value={quest.reward.xp}
            label='XP'
          />
          <RewardPill
            icon={<Gem className='h-3 w-3 text-blue-500' />}
            value={quest.reward.gems}
            label='gems'
          />
          <RewardPill
            icon={<Heart className='h-3 w-3 text-rose-500' />}
            value={quest.reward.hearts}
            label='hearts'
          />
        </div>
      )}

      {quest.endsAt && (
        <p className='text-xs text-slate-400 dark:text-slate-500'>
          Ends {new Date(quest.endsAt).toLocaleDateString()}
        </p>
      )}
    </article>
  )
}

export function QuestEmptyState() {
  return (
    <div className='rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900'>
      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
        No active quests right now
      </p>
      <p className='mt-1 text-xs text-slate-400 dark:text-slate-500'>
        Check back soon — new quests are added regularly.
      </p>
    </div>
  )
}
