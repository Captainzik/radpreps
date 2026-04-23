'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  userId: string
}

type ApiResponse = {
  success?: boolean
  message?: string
}

export default function UserRowActions({ userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function deleteUser() {
    const ok = confirm('Delete this user? This action cannot be undone.')
    if (!ok) return

    try {
      setLoading(true)

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed')

      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* CHANGED: action buttons now wrap instead of squeezing into a single row on smaller screens. */
    <div className='flex flex-wrap items-center gap-2'>
      <Link
        href={`/admin/users/${userId}/edit`}
        className='rounded border border-slate-300 px-3 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
      >
        Edit
      </Link>
      <button
        onClick={deleteUser}
        disabled={loading}
        className='rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950'
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
