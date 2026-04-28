'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'

function VerifyEmailContent() {
  const router = useRouter() // CHANGED: redirect to sign-in after successful verification.
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [message, setMessage] = useState('Verifying your email...')
  const [hasVerified, setHasVerified] = useState(false)

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setMessage('Missing verification token.')
        return
      }

      try {
        const res = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        )

        const json = (await res.json()) as {
          success?: boolean
          message?: string
        }

        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to verify email.')
        }

        setMessage(json.message || 'Your email has been verified successfully.')
        setHasVerified(true)
        router.replace('/signin?verified=1') // CHANGED: move user directly to sign-in with a verified success flag.
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : 'Failed to verify email.',
        )
      }
    }

    void verifyEmail()
  }, [router, token])

  const isSuccess = hasVerified && !message.toLowerCase().includes('failed')
  const isError =
    !isSuccess &&
    (message.toLowerCase().includes('missing') ||
      message.toLowerCase().includes('failed') ||
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('expired'))

  return (
    <main className='mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-8 sm:py-10'>
      <div className='w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <div className='flex items-start gap-3'>
          <div
            className={[
              'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              isSuccess
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                : isError
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
            ].join(' ')}
          >
            {isSuccess ? (
              <CheckCircle2 className='h-5 w-5' aria-hidden='true' />
            ) : isError ? (
              <XCircle className='h-5 w-5' aria-hidden='true' />
            ) : (
              <span className='text-sm font-semibold'>…</span>
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
              Verify Email
            </h1>

            <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
              {message}
            </p>
          </div>
        </div>

        {hasVerified ? (
          <div className='mt-5'>
            <Button asChild className='w-full'>
              <Link href='/signin?verified=1'>Go to Sign In</Link>
            </Button>
          </div>
        ) : (
          <div className='mt-5 flex flex-col gap-3 sm:flex-row'>
            <Button asChild className='w-full sm:flex-1' variant='outline'>
              <Link href='/signin'>Back to Sign In</Link>
            </Button>
            <Button asChild className='w-full sm:flex-1'>
              <Link href='/signup'>Create Account</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className='mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-8 sm:py-10'>
          <div className='w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
            <div className='h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
            <div className='mt-3 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
            <div className='mt-6 h-10 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
