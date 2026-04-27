'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import GoogleSignInButton from '@/components/auth/google-signin-button'
import BackHomeButton from '@/components/auth/back-home-button'
import { Button } from '@/components/ui/button'

type SignUpForm = {
  email: string
  username: string
  fullName: string
  password: string
}

export default function SignUpPage() {
  const [form, setForm] = useState<SignUpForm>({
    email: '',
    username: '',
    fullName: '',
    password: '',
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  // CHANGED: field-level errors allow users to see exactly which input needs attention.

  function validateForm() {
    setPasswordError('')
    setEmailError('')

    const trimmedEmail = form.email.trim().toLowerCase()
    if (!trimmedEmail) {
      setEmailError('Email is required.')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.')
      return false
    }

    if (form.password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return false
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      setPasswordError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
      )
      return false
    }

    return true
  }

  async function handleSignup(
    e: React.SyntheticEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault()
    setLoading(true)
    setError('')

    const isValid = validateForm()
    if (!isValid) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data: { message?: string } = await res.json()

      if (!res.ok) {
        setError(data?.message || 'Signup failed')
        setLoading(false)
        return
      }

      // Keep redirect behavior consistent across auth flows
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        callbackUrl: '/',
      })
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className='mx-auto w-full max-w-md px-4 py-8 sm:py-10'>
      <h1 className='mb-5 text-2xl font-bold text-slate-900 dark:text-white'>
        Create account
      </h1>

      {/* CHANGED: signup form uses full-width fields and mobile-friendly spacing. */}
      <form onSubmit={handleSignup} className='space-y-3'>
        <div>
          <input
            className='w-full rounded border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400'
            placeholder='Email'
            type='email'
            autoComplete='email'
            required
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            disabled={loading}
          />
          {emailError ? (
            <p className='mt-2 text-sm text-red-600 dark:text-red-400'>
              {emailError}
            </p>
          ) : null}
        </div>

        <input
          className='w-full rounded border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400'
          placeholder='Username'
          autoComplete='username'
          value={form.username}
          onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
          disabled={loading}
        />

        <input
          className='w-full rounded border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400'
          placeholder='Full Name'
          autoComplete='name'
          value={form.fullName}
          onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
          disabled={loading}
        />

        <div>
          <input
            className='w-full rounded border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400'
            placeholder='Password'
            type='password'
            autoComplete='new-password'
            required
            value={form.password}
            onChange={(e) =>
              setForm((s) => ({ ...s, password: e.target.value }))
            }
            disabled={loading}
          />
          {passwordError ? (
            <p className='mt-2 text-sm text-red-600 dark:text-red-400'>
              {passwordError}
            </p>
          ) : null}
        </div>

        {error ? <p className='text-sm text-red-600'>{error}</p> : null}

        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </Button>
      </form>

      <div className='my-5 flex items-center gap-3'>
        <div className='h-px flex-1 bg-border' />
        <span className='text-xs text-muted-foreground'>OR</span>
        <div className='h-px flex-1 bg-border' />
      </div>

      <GoogleSignInButton callbackUrl='/' label='Sign up with Google' />

      <div className='mt-4'>
        <BackHomeButton />
      </div>

      <div className='mt-6 rounded-lg border border-slate-200 p-4 text-center dark:border-slate-700'>
        <p className='text-sm text-muted-foreground'>
          Already have an account?
        </p>
        <Button asChild className='mt-3 w-full' type='button' variant='outline'>
          <Link href='/signin'>Sign in</Link>
        </Button>
      </div>
    </main>
  )
}
