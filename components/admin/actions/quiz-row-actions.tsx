'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  quizId: string
  initialPublished: boolean
}

export default function QuizRowActions({ quizId, initialPublished }: Props) {
  const router = useRouter()
  const [isPublished, setIsPublished] = useState(initialPublished)
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)

  async function togglePublish() {
    try {
      setLoading('toggle')
      const res = await fetch('/api/admin/quizzes/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, isPublished: !isPublished }),
      })

      const json = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed')

      setIsPublished((v) => !v)
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update publish status')
    } finally {
      setLoading(null)
    }
  }

  async function deleteQuiz() {
    const ok = confirm('Delete this quiz? This action cannot be undone.')
    if (!ok) return

    try {
      setLoading('delete')
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE',
      })
      const json = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete quiz')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <button
        onClick={togglePublish}
        disabled={loading !== null}
        className='rounded-md border px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-50'
      >
        {loading === 'toggle'
          ? 'Saving...'
          : isPublished
            ? 'Unpublish'
            : 'Publish'}
      </button>

      <button
        onClick={deleteQuiz}
        disabled={loading !== null}
        className='rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50'
      >
        {loading === 'delete' ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
