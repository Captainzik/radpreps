import type { ReactNode } from 'react'

type StatCardProps = {
  icon: ReactNode
  label: string
  value: ReactNode
  href?: string
  /** extra Tailwind classes on the card border/bg for accent colours */
  accent?: string
}

export function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-5 ${
        accent ?? 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className='flex items-center gap-2'>
        {icon}
        <p className='text-xs text-slate-500 dark:text-slate-400'>{label}</p>
      </div>
      <p className='mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50'>
        {value}
      </p>
    </article>
  )
}
