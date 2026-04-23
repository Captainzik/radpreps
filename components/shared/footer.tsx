'use client'

import { ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className='mt-8 border-t border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50'>
      <Button
        variant='ghost'
        className='w-full rounded-none border-b border-slate-200 bg-slate-100 py-4 text-sm hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 sm:py-5'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp className='mr-2 h-4 w-4' />
        Back to top
      </Button>

      <div className='container-app py-6'>
        <nav className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-700 dark:text-slate-300'>
          <Link href='/page/terms-of-use' className='hover:underline'>
            Terms of Use
          </Link>
          <Link href='/page/privacy-policy' className='hover:underline'>
            Privacy Notice
          </Link>
          <Link href='/page/help' className='hover:underline'>
            Help
          </Link>
        </nav>

        <p className='mt-3 text-center text-sm text-slate-700 dark:text-slate-300'>
          © 2026, {APP_NAME}
        </p>

        <p className='mt-4 text-center text-xs text-slate-500 sm:text-sm dark:text-slate-400'>
          123, Main Street, Anytown, CA, Zip 12345 | +1 (123) 456-7890
        </p>
      </div>
    </footer>
  )
}
