'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'

export function ResumeAttemptButton({ attemptId }: { attemptId: string }) {
  const router = useRouter()
  const busyRef = useRef(false)

  const handleResume = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true

    try {
      const res = await fetch(`/exam/attempt/${attemptId}/resume`, {
        method: 'POST',
      })

      const data = (await res.json()) as {
        success?: boolean
        redirectTo?: string
        message?: string
      }

      if (!res.ok || !data.success || !data.redirectTo) {
        throw new Error(data.message || 'Failed to resume attempt')
      }

      router.replace(data.redirectTo)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to resume attempt')
    } finally {
      busyRef.current = false
    }
  }, [attemptId, router])

  return (
    <button
      type='button'
      onClick={handleResume}
      className='inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
    >
      Resume attempt
    </button>
  )
}
