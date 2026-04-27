'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuthErrorPage() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  const error = params.get('error') ?? ''

  const friendlyMessage = useMemo(() => {
    if (error === 'EMAIL_NOT_VERIFIED') {
      return 'Your account has not been verified yet. Please resend the verification email or check your inbox.'
    }

    if (error.toLowerCase().includes('credentials')) {
      return 'Invalid email or password.'
    }

    if (error.toLowerCase().includes('accessdenied')) {
      return 'Access was denied. Please try again.'
    }

    return error
      ? `Authentication error: ${error}`
      : 'An authentication error occurred.'
  }, [error])

  async function resendVerification() {
    try {
      setSending(true)
      setMessage('')

      const res = await fetch('/api/auth/request-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const json = (await res.json()) as {
        success?: boolean
        message?: string
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to resend verification email')
      }

      setMessage(
        json.message ||
          'Verification email sent. Please check your inbox and spam folder.',
      )
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Failed to resend verification email',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <main className='mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-8 sm:py-10'>
      <div className='w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
          Sign-in error
        </h1>

        <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
          {friendlyMessage}
        </p>

        {error === 'EMAIL_NOT_VERIFIED' ? (
          <div className='mt-5 space-y-3'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                Email address
              </label>
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@example.com'
                autoComplete='email'
              />
            </div>

            <Button
              type='button'
              className='w-full'
              onClick={resendVerification}
              disabled={sending || !email.trim()}
            >
              {sending ? 'Sending...' : 'Resend verification email'}
            </Button>

            <p className='text-xs text-slate-500 dark:text-slate-400'>
              If you already verified your email, return to sign in and try
              again.
            </p>
          </div>
        ) : null}

        {message ? (
          <p className='mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'>
            {message}
          </p>
        ) : null}

        <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
          <Button asChild className='w-full sm:flex-1' variant='outline'>
            <Link href='/signin'>Back to sign in</Link>
          </Button>
          <Button asChild className='w-full sm:flex-1'>
            <Link href='/signup'>Create account</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
