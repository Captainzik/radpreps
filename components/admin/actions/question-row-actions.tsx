'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  questionId: string
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
      const json = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={deleteQuestion}
      disabled={loading}
      className='rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50'
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
