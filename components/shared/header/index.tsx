import Link from 'next/link'
import Menu from './menu'
import ThemeToggle from './theme-toggle'
import Search from './search'

export default function Header() {
  return (
    <header className='sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90'>
      <div className='mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8'>
        {/* CHANGED: keep logo and actions in the top row so the header stays compact. */}
        <div className='flex items-center gap-3'>
          <Link
            href='/'
            className='shrink-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white'
          >
            RadPreps
          </Link>

          <div className='ml-auto flex items-center gap-2'>
            <ThemeToggle />
            <Menu />
          </div>
        </div>

        {/* CHANGED: search is kept on a second row to avoid crowding the mobile header. */}
        <div className='mt-3'>
          <Search />
        </div>
      </div>
    </header>
  )
}
