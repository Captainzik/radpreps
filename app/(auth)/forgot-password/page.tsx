'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, CheckCircle2, XCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(
    'Enter your email address and we’ll send you a password reset link.',
  )
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setIsError(false)
    setIsSuccess(false)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const json = (await res.json()) as {
        success?: boolean
        message?: string
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to send reset link.')
      }

      // CHANGED: success state is shown even though the backend does not reveal whether the email exists.
      setMessage(
        json.message ||
          'If that email exists, a password reset link has been sent.',
      )
      setIsSuccess(true)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Failed to send reset link.',
      )
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

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
              <Mail className='h-5 w-5' aria-hidden='true' />
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
              Forgot Password
            </h1>

            <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
              {message}
            </p>
          </div>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className='mt-5 space-y-3'>
            <div>
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Email address'
                autoComplete='email'
                required
                disabled={loading}
              />
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        ) : null}

        <div className='mt-5 flex flex-col gap-3 sm:flex-row'>
          <Button asChild className='w-full sm:flex-1' variant='outline'>
            <Link href='/signin'>Back to Sign In</Link>
          </Button>
          <Button asChild className='w-full sm:flex-1'>
            <Link href='/signup'>Create Account</Link>
          </Button>
        </div>

        <p className='mt-4 text-xs text-slate-500 dark:text-slate-400'>
          For security, we do not reveal whether an account exists for a given
          email address.
        </p>
      </div>
    </main>
  )
}
