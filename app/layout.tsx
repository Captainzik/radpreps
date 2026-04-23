import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { APP_DESCRIPTION, APP_NAME, APP_SLOGAN } from '@/lib/constants'
import AuthSessionProvider from '@/components/providers/session-provider'
import ToasterProvider from '@/components/providers/toaster-provider'
import Header from '@/components/shared/header'
import ThemeProvider from '@/components/providers/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME}: ${APP_SLOGAN}`,
  },
  description: APP_DESCRIPTION,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-50`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider>
            {/* CHANGED: wrap the whole app in a responsive shell that keeps spacing consistent on small screens. */}
            <div className='min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-50'>
              <Header />
              {/* CHANGED: main padding now scales down on mobile and expands on larger screens. */}
              <main className='mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
                {children}
              </main>
            </div>
            <ToasterProvider />
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
