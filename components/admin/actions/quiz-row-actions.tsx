'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  quizId: string
  initialPublished: boolean
}

type ApiResponse = {
  success?: boolean
  message?: string
}

export default function QuizRowActions({ quizId, initialPublished }: Props) {
  const router = useRouter()
  const [isPublished, setIsPublished] = useState(initialPublished)
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)

  async function togglePublish() {
    try {
      setLoading('toggle')

      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      })

      const json = (await res.json()) as ApiResponse
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
      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete quiz')
    } finally {
      setLoading(null)
    }
  }

  return (
    /* CHANGED: actions now wrap on narrow screens so table cells don’t overflow horizontally as much. */
    <div className='flex flex-wrap items-center gap-2'>
      <button
        onClick={togglePublish}
        disabled={loading !== null}
        className='rounded-md border border-slate-300 px-3 py-1 text-xs dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50'
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
        className='rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50'
      >
        {loading === 'delete' ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
