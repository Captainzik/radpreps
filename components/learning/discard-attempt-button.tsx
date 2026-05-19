'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

type DiscardAttemptButtonProps = {
  attemptId: string
  mode: 'exam' | 'cpd'
  /** Called just before the DELETE fires so callers can skip unload handlers */
  onBeforeDiscard?: () => void
}

export function DiscardAttemptButton({
  attemptId,
  mode,
  onBeforeDiscard,
}: DiscardAttemptButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const backPath = mode === 'exam' ? '/exam/start' : '/cpd/start'
  const discardUrl = `/${mode}/attempt/${attemptId}/discard`

  async function handleDiscard() {
    setLoading(true)
    onBeforeDiscard?.()

    try {
      const res = await fetch(discardUrl, { method: 'DELETE' })
      if (res.ok) {
        window.location.href = backPath
      } else {
        setLoading(false)
        setConfirming(false)
      }
    } catch {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950/40'>
        <span className='text-xs font-medium text-red-700 dark:text-red-300'>
          Discard attempt?
        </span>
        <button
          type='button'
          disabled={loading}
          onClick={handleDiscard}
          className='rounded px-2 py-0.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-900/40'
        >
          {loading ? 'Discarding…' : 'Yes, discard'}
        </button>
        <button
          type='button'
          disabled={loading}
          onClick={() => setConfirming(false)}
          className='rounded px-2 py-0.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700'
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      type='button'
      onClick={() => setConfirming(true)}
      title='Discard attempt'
      className='rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400'
    >
      <X className='h-5 w-5' />
    </button>
  )
}

