'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  questionId: string
}

type ApiResponse = {
  success?: boolean
  message?: string
}

export default function QuestionRowActions({ questionId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function deleteQuestion() {
    const ok = confirm('Delete this question? This action cannot be undone.')
    if (!ok) return

    try {
      setLoading(true)
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
      })
      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete question')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* CHANGED: button now uses a fixed mobile-friendly size and keeps spacing predictable in cramped table rows. */
    <button
      onClick={deleteQuestion}
      disabled={loading}
      className='rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950'
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
