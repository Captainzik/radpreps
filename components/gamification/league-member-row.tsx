import Image from 'next/image'
import { Zap } from 'lucide-react'

interface LeagueMember {
  rank: number
  userId: string
  username: string
  avatar: string | null
  weeklyXp: number
  isCurrentUser: boolean
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900'>
        1
      </span>
    )
  if (rank === 2)
    return (
      <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-700 dark:bg-slate-600 dark:text-slate-100'>
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white'>
        3
      </span>
    )
  return (
    <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400'>
      {rank}
    </span>
  )
}

function Avatar({
  avatar,
  username,
}: {
  avatar: string | null
  username: string
}) {
  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={username}
        width={36}
        height={36}
        className='h-9 w-9 rounded-full object-cover'
        unoptimized
      />
    )
  }
  const initial = (username[0] ?? '?').toUpperCase()
  return (
    <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'>
      {initial}
    </span>
  )
}

export function LeagueMemberRow({ member }: { member: LeagueMember }) {
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 sm:px-6 ${
        member.isCurrentUser
          ? 'bg-purple-50 ring-1 ring-inset ring-purple-200 dark:bg-purple-950/20 dark:ring-purple-800'
          : ''
      }`}
    >
      <RankBadge rank={member.rank} />

      <Avatar avatar={member.avatar} username={member.username} />

      <div className='min-w-0 flex-1'>
        <p
          className={`truncate text-sm font-semibold ${
            member.isCurrentUser
              ? 'text-purple-700 dark:text-purple-300'
              : 'text-slate-900 dark:text-slate-50'
          }`}
        >
          {member.username}
          {member.isCurrentUser && (
            <span className='ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'>
              You
            </span>
          )}
        </p>
      </div>

      <div className='flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400'>
        <Zap className='h-3.5 w-3.5' />
        {member.weeklyXp.toLocaleString()}
      </div>
    </li>
  )
}
