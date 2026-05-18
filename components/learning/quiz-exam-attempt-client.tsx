'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { QuizActiveAttemptShell } from '@/components/learning/quiz-active-attempt-shell'

// Extend Window interface to include our custom flag
declare global {
  interface Window {
    __skipExamPause?: boolean
  }
}

type AttemptQuestion = {
  questionId: string
  questionText: string
  image?: string
  options: {
    text?: string
    image?: string
  }[]
}

type QuizExamAttemptClientProps = {
  attemptId: string
  mode: 'exam' | 'cpd'
  startedAt: string
  quizName: string
  quizCategory: string
  questionNumber: number
  totalQuestions: number
  question: AttemptQuestion
  action: string
  checkpointIndex?: number
  resume?: boolean
  showTimer?: boolean
  onExpireAction?: 'complete' | 'none'
}

export function QuizExamAttemptClient({
  attemptId,
  mode,
  startedAt,
  quizName,
  quizCategory,
  questionNumber,
  totalQuestions,
  question,
  action,
  checkpointIndex = 0,
  resume = false,
  showTimer = mode === 'exam',
  onExpireAction = mode === 'exam' ? 'complete' : 'none',
}: QuizExamAttemptClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const handledRef = useRef(false)

  // Clear the skip pause flag when component mounts
  useEffect(() => {
    window.__skipExamPause = false
  }, [])

  const handlePause = useCallback(async () => {
    // Skip pause if we're navigating within the same exam attempt
    if (window.__skipExamPause) {
      return
    }

    try {
      // Use URLSearchParams instead of FormData for better sendBeacon compatibility
      const params = new URLSearchParams()
      params.set('questionId', question.questionId)

      const pauseUrl = `/exam/attempt/${attemptId}/pause`

      // Try navigator.sendBeacon first (most reliable for page unload)
      // Note: sendBeacon sends with credentials by default
      const beaconData = params.toString()
      const beaconSent = navigator.sendBeacon?.(
        pauseUrl,
        new Blob([beaconData], { type: 'application/x-www-form-urlencoded' })
      )

      // Fallback to fetch with keepalive if sendBeacon not available or failed
      if (!beaconSent) {
        await fetch(pauseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: beaconData,
          keepalive: true,
          credentials: 'include',
        })
      }
    } catch {
      // best effort
    }
  }, [attemptId, question.questionId])

  useEffect(() => {
    if (mode !== 'exam') return

    // Use both pagehide and beforeunload for maximum compatibility
    // pagehide is more reliable on mobile, beforeunload works on desktop
    const onPageHide = () => {
      void handlePause()
    }

    const onBeforeUnload = () => {
      void handlePause()
    }

    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [handlePause, mode])

  // Handle client-side navigation (Next.js Link clicks)
  // This uses MutationObserver to detect when links are clicked before navigation starts
  useEffect(() => {
    if (mode !== 'exam') return

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')

      // If user clicked a link that will navigate away from current page
      if (link && link.href && !link.href.includes(pathname)) {
        // Trigger pause before navigation
        void handlePause()
      }
    }

    // Attach click listener to document to catch all link clicks
    document.addEventListener('click', handleLinkClick, { capture: true })

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true })
    }
  }, [pathname, handlePause, mode])

  const handleExpire = useCallback(async () => {
    if (handledRef.current || onExpireAction !== 'complete') return
    handledRef.current = true

    try {
      const res = await fetch(`/exam/attempt/${attemptId}/complete`, {
        method: 'POST',
      })

      if (!res.ok) {
        handledRef.current = false
        return
      }

      router.replace(`/exam/attempt/${attemptId}/result`)
      router.refresh()
    } catch {
      handledRef.current = false
    }
  }, [attemptId, onExpireAction, router])

  return (
    <QuizActiveAttemptShell
      mode={mode}
      startedAt={new Date(startedAt)}
      quizName={quizName}
      quizCategory={quizCategory}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      question={question}
      action={action}
      checkpointIndex={checkpointIndex}
      resume={resume}
      showTimer={showTimer}
      onExpire={handleExpire}
    />
  )
}
