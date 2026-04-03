'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Role = 'user' | 'moderator' | 'admin'

type Props = {
  userId: string
  initialRole: Role
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

      const json = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed')

      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className='rounded border px-2 py-1'
        disabled={loading}
      >
        <option value='user'>user</option>
        <option value='moderator'>moderator</option>
        <option value='admin'>admin</option>
      </select>
      <button
        onClick={updateRole}
        disabled={loading}
        className='rounded border px-3 py-1 disabled:opacity-50'
      >
        {loading ? 'Updating...' : 'Update'}
      </button>
    </div>
  )
}
