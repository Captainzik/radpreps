'use client'

import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

type MobileMenuShellProps = {
  children: React.ReactNode
}

export function MobileMenuShell({ children }: MobileMenuShellProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(e.target as Node)
      ) {
        detailsRef.current.open = false
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <details ref={detailsRef} className='relative md:hidden'>
      <summary className='inline-flex list-none items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden'>
        <span>Menu</span>
        <ChevronDown className='h-4 w-4' />
      </summary>

      <div className='absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-950'>
        <div className='flex flex-col gap-1'>{children}</div>
      </div>
    </details>
  )
}
