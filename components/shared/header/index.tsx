import Link from 'next/link'
import Menu from './menu'
import ThemeToggle from './theme-toggle'
import Search from './search'

export default function Header() {
  return (
    <header className='sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90'>
      {/* CHANGED: header content now stacks more naturally on small screens. */}
      <div className='mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3'>
          <Link
            href='/'
            className='shrink-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white'
          >
            RadPreps
          </Link>

          {/* CHANGED: keep theme toggle visible and prevent nav overflow on mobile. */}
          <div className='ml-auto flex items-center gap-2'>
            <ThemeToggle />
            <Menu />
          </div>
        </div>

        {/* CHANGED: search lives on its own row so mobile header doesn't crowd. */}
        <div className='mt-3'>
          <Search />
        </div>
      </div>
    </header>
  )
}
