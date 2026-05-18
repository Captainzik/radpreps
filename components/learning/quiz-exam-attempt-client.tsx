'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QuizActiveAttemptShell } from '@/components/learning/quiz-active-attempt-shell'

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
  const handledRef = useRef(false)

  const handlePause = useCallback(async () => {
    try {
      const formData = new FormData()
      formData.set('questionId', question.questionId)

      // Try navigator.sendBeacon first (most reliable for page unload)
      const pauseUrl = `/exam/attempt/${attemptId}/pause`
      const beaconSent = navigator.sendBeacon?.(pauseUrl, formData)

      // Fallback to fetch with keepalive if sendBeacon not available or failed
      if (!beaconSent) {
        await fetch(pauseUrl, {
          method: 'POST',
          body: formData,
          keepalive: true,
        })
      }
    } catch {
      // best effort
    }
  }, [attemptId, question.questionId])

  useEffect(() => {
    if (mode !== 'exam') return

    // Use pagehide event - fires when page is being unloaded (navigation, close, reload)
    // NOTE: We don't use visibilitychange because that fires on tab switch,
    // and we only want to pause when user actually navigates away/closes the page
    const onPageHide = () => {
      void handlePause()
    }

    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [handlePause, mode])

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
