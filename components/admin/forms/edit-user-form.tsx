'use client'

import { SubmitEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'user' | 'admin' | 'moderator'

type Props = {
  userId: string
  initialEmail: string
  initialUsername: string
  initialFullName: string
  initialAvatar: string
  initialRole: Role
  initialIsVerified: boolean
}

type ApiResponse = {
  success?: boolean
  message?: string
}

function toast(message: string) {
  if (typeof window !== 'undefined') {
    window.alert(message)
  }
}

export default function EditUserForm({
  userId,
  initialEmail,
  initialUsername,
  initialFullName,
  initialAvatar,
  initialRole,
  initialIsVerified,
}: Props) {
  const router = useRouter()

  const [email, setEmail] = useState(initialEmail)
  const [username, setUsername] = useState(initialUsername)
  const [fullName, setFullName] = useState(initialFullName)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [role, setRole] = useState<Role>(initialRole)
  const [isVerified, setIsVerified] = useState(initialIsVerified)
  const [password, setPassword] = useState('')

  const [saving, setSaving] = useState(false)

  const isDirty = useMemo(() => {
    return (
      email !== initialEmail ||
      username !== initialUsername ||
      fullName !== initialFullName ||
      avatar !== initialAvatar ||
      role !== initialRole ||
      isVerified !== initialIsVerified ||
      password.length > 0
    )
  }, [
    email,
    username,
    fullName,
    avatar,
    role,
    isVerified,
    password,
    initialEmail,
    initialUsername,
    initialFullName,
    initialAvatar,
    initialRole,
    initialIsVerified,
  ])

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!isDirty) {
      toast('No changes to save.')
      return
    }

    try {
      setSaving(true)

      const payload: Record<string, unknown> = {
        email: email.trim(),
        username: username.trim(),
        fullName: fullName.trim(),
        avatar: avatar.trim(),
        role,
        isVerified,
      }

      if (password.trim().length > 0) {
        payload.password = password.trim()
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update user')
      }

      toast('User updated successfully.')
      router.push('/admin/users')
      router.refresh()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className='space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'
    >
      {/* CHANGED: form fields now use a responsive two-column layout on larger screens. */}
      <div className='grid gap-3 sm:grid-cols-2'>
        <input
          name='email'
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
        />

        <input
          name='username'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
        />
      </div>

      <input
        name='fullName'
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
      />

      <input
        name='avatar'
        value={avatar}
        onChange={(e) => setAvatar(e.target.value)}
        placeholder='https://...'
        className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
      />

      {/* CHANGED: controls wrap vertically on small screens to prevent overflow. */}
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

      <input
        name='password'
        type='password'
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder='New password (optional)'
        className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
      />

      <button
        type='submit'
        disabled={saving}
        className='rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50'
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
