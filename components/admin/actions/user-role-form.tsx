'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Role = 'user' | 'moderator' | 'admin'

type Props = {
  userId: string
  initialRole: Role
}

type ApiResponse = {
  success?: boolean
  message?: string
}

export default function UserRoleForm({ userId, initialRole }: Props) {
  const router = useRouter()
  const [role, setRole] = useState<Role>(initialRole)
  const [loading, setLoading] = useState(false)

  async function updateRole() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed')

      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* CHANGED: the control group now wraps on mobile instead of forcing a single tight row. */
    <div className='flex flex-wrap items-center gap-2'>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className='rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white'
        disabled={loading}
      >
        <option value='user'>user</option>
        <option value='moderator'>moderator</option>
        <option value='admin'>admin</option>
      </select>
      <button
        onClick={updateRole}
        disabled={loading}
        className='rounded border border-slate-300 px-3 py-1 text-xs dark:border-slate-600 dark:text-slate-300'
      >
        {loading ? 'Updating...' : 'Update'}
      </button>
    </div>
  )
}
