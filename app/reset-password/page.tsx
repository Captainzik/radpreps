'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [message, setMessage] = useState('Preparing password reset...')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [tokenReady, setTokenReady] = useState(false)
  const [hasReset, setHasReset] = useState(false)
  const [fieldError, setFieldError] = useState('')

  useEffect(() => {
    if (!token) {
      setMessage('Missing reset token.')
      return
    }

    // CHANGED: token presence is enough to show the reset form now; validation is delegated to the reset endpoint.
    setMessage('Enter a new password to complete your reset.')
    setTokenReady(true)
  }, [token])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldError('')

    if (!token) {
      setMessage('Missing reset token.')
      return
    }

    if (newPassword !== confirmPassword) {
      setFieldError('Passwords do not match.')
      setMessage('Please correct the highlighted field.')
      return
    }

    try {
      setSaving(true)
      setMessage('Updating password...')

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      })

      const json = (await res.json()) as {
        success?: boolean
        message?: string
      }

      if (!res.ok || !json.success) {
        const apiMessage = json.message || 'Failed to reset password.'

        if (apiMessage.toLowerCase().includes('match')) {
          setFieldError(apiMessage)
          setMessage('Please correct the highlighted field.')
        } else {
          setMessage(apiMessage)
        }

        throw new Error(apiMessage)
      }

      setMessage(json.message || 'Your password has been reset successfully.')
      setHasReset(true)
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.toLowerCase().includes('match')
        )
      ) {
        setMessage(
          error instanceof Error ? error.message : 'Failed to reset password.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const isSuccess = hasReset
  const isError =
    message.toLowerCase().includes('missing') ||
    message.toLowerCase().includes('failed') ||
    message.toLowerCase().includes('match') ||
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('expired')

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
              Reset Password
            </h1>

            <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
              {message}
            </p>
          </div>
        </div>

        {tokenReady && !isSuccess ? (
          <form onSubmit={handleSubmit} className='mt-5 space-y-3'>
            <Input
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder='New password'
              autoComplete='new-password'
              required
            />
            <div>
              <Input
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Confirm new password'
                autoComplete='new-password'
                required
              />
              {fieldError ? (
                <p className='mt-2 text-sm text-red-600 dark:text-red-400'>
                  {fieldError}
                </p>
              ) : null}
            </div>

            <Button type='submit' className='w-full' disabled={saving}>
              {saving ? 'Saving...' : 'Reset password'}
            </Button>
          </form>
        ) : null}

        {isSuccess ? (
          <div className='mt-5'>
            <Button asChild className='w-full'>
              <Link href='/signin'>Go to Sign In</Link>
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
