import { auth, signOut } from '@/auth'
import Link from 'next/link'
import { BookOpenCheck, ChevronDown } from 'lucide-react'

type AppSession = {
  user?: {
    id?: string | null
    role?: string | null
  } | null
} | null

type NavItem = {
  href: string
  label: string
  icon?: React.ReactNode
}

async function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/' })
      }}
    >
      <button
        type='submit'
        className='header-button w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
      >
        Logout
      </button>
    </form>
  )
}

function buildItems(isAdmin: boolean): NavItem[] {
  return [
    {
      href: '/quiz',
      label: 'Quiz',
      icon: <BookOpenCheck className='h-4 w-4' />,
    },
    { href: '/quiz/history', label: 'Stats' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/feed', label: 'Feed' },
    { href: '/profile', label: 'Profile' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]
}

function DesktopMenu({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean
  isAdmin: boolean
}) {
  const items = buildItems(isAdmin)

  if (!isLoggedIn) {
    return (
      <>
        <Link
          href='/signin'
          className='header-button rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3'
        >
          Sign in
        </Link>
        <Link
          href='/quiz'
          className='header-button flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3'
        >
          <BookOpenCheck className='h-4 w-4 sm:h-5 sm:w-5' />
          <span>Quiz</span>
        </Link>
        <Link
          href='/feed'
          className='header-button rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3'
        >
          Feed
        </Link>
        <Link
          href='/blog'
          className='header-button rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3'
        >
          Blog
        </Link>
      </>
    )
  }

  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className='header-button flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3'
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
      <LogoutButton />
    </>
  )
}

export default async function Menu() {
  const session = (await auth()) as AppSession
  const isLoggedIn = Boolean(session?.user?.id)
  const isAdmin = session?.user?.role === 'admin'
  const items = buildItems(isAdmin)

  return (
    <>
      {/* CHANGED: desktop nav stays inline on larger screens only. */}
      <nav
        aria-label='Primary navigation'
        className='hidden items-center gap-1 md:flex sm:gap-2'
      >
        <DesktopMenu isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
      </nav>

      {/* CHANGED: mobile menu uses a server-rendered details dropdown so it stays responsive without a client component. */}
      <details className='relative md:hidden'>
        <summary className='inline-flex list-none items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden'>
          <span>Menu</span>
          <ChevronDown className='h-4 w-4' />
        </summary>

        <div className='absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-950'>
          <div className='flex flex-col gap-1'>
            {!isLoggedIn ? (
              <>
                <Link
                  href='/signin'
                  className='header-button rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                >
                  Sign in
                </Link>
                <Link
                  href='/quiz'
                  className='header-button flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                >
                  <BookOpenCheck className='h-4 w-4' />
                  <span>Quiz</span>
                </Link>
                <Link
                  href='/feed'
                  className='header-button rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                >
                  Feed
                </Link>
                <Link
                  href='/blog'
                  className='header-button rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                >
                  Blog
                </Link>
              </>
            ) : (
              <>
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className='header-button flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
                <div className='pt-1'>
                  <LogoutButton />
                </div>
              </>
            )}
          </div>
        </div>
      </details>
    </>
  )
}
