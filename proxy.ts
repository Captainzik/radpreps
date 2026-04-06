import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export default auth((req) => {
  const pathname = req.nextUrl.pathname

  const isAdminRoute = pathname.startsWith('/admin')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isStatsRoute = pathname.startsWith('/stats')
  const isLeaderboardRoute = pathname.startsWith('/leaderboard')
  const isSubscriptionRoute = pathname.startsWith('/subscription')
  const isQuizRoute = pathname.startsWith('/quiz')
  const isFeedRoute = pathname.startsWith('/feed')
  const isProfileRoute = pathname.startsWith('/profile')

  const requiresAuth =
    isAdminRoute ||
    isDashboardRoute ||
    isStatsRoute ||
    isLeaderboardRoute ||
    isSubscriptionRoute ||
    isQuizRoute ||
    isFeedRoute ||
    isProfileRoute

  if (!req.auth && requiresAuth) {
    const signInUrl = new URL('/signin', req.nextUrl.origin)
    const relativeCallback = `${req.nextUrl.pathname}${req.nextUrl.search}`
    signInUrl.searchParams.set('callbackUrl', relativeCallback)
    return NextResponse.redirect(signInUrl)
  }

  if (isAdminRoute && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/403', req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/quiz/:path*',
    '/stats/:path*',
    '/leaderboard/:path*',
    '/subscription/:path*',
    '/feed/:path*',
    '/profile/:path*',
  ],
}
