'use client'

import { SubmitEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'user' | 'moderator' | 'admin'

type ApiResponse = {
  success?: boolean
  message?: string
}

function toast(message: string) {
  if (typeof window !== 'undefined') {
    window.alert(message)
  }
}

export default function CreateUserForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState('')
  const [role, setRole] = useState<Role>('user')
  const [isVerified, setIsVerified] = useState(true)

  const [saving, setSaving] = useState(false)

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      setSaving(true)

      const payload = {
        email: email.trim(),
        username: username.trim(),
        fullName: fullName.trim(),
        password: password.trim(),
        avatar: avatar.trim(),
        role,
        isVerified,
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create user')
      }

      toast('User created successfully.')
      router.push('/admin/users')
      router.refresh()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className='space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'
    >
      {/* CHANGED: inputs now use mobile-safe spacing and consistent theme-aware borders. */}
      <div className='grid gap-3 sm:grid-cols-2'>
        <input
          name='email'
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='Email'
          className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
        />

        <input
          name='username'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder='Username (optional)'
          className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
        />
      </div>

      <input
        name='fullName'
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder='Full name (optional)'
        className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
      />

      <input
        name='password'
        type='password'
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder='Password'
        className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
      />

      <input
        name='avatar'
        value={avatar}
        onChange={(e) => setAvatar(e.target.value)}
        placeholder='Avatar URL (optional)'
        className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
      />

      {/* CHANGED: role + verified controls now wrap on mobile instead of staying in one tight row. */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <select
          name='role'
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:w-auto'
        >
          <option value='user'>user</option>
          <option value='moderator'>moderator</option>
          <option value='admin'>admin</option>
        </select>

        <label className='inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300'>
          <input
            name='isVerified'
            type='checkbox'
            checked={isVerified}
            onChange={(e) => setIsVerified(e.target.checked)}
          />
          Verified
        </label>
      </div>

      <button
        type='submit'
        disabled={saving}
        className='rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50'
      >
        {saving ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
