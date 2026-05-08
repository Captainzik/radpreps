'use client'

import { useCallback, useEffect, useRef } from 'react' // CHANGED: keep useEffect for page-leave listeners.
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
  currentQuestionIndex: number // CHANGED: explicit live index for pause payload.
  questionsAnswered: number // CHANGED: explicit answered count for pause payload.
  showTimer?: boolean // CHANGED: allow the page to control timer visibility explicitly.
  onExpireAction?: 'complete' | 'none' // CHANGED: makes timer-expiry behavior explicit.
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
  currentQuestionIndex,
  questionsAnswered,
  showTimer = mode === 'exam', // CHANGED: default remains exam-only timer visibility.
  onExpireAction = mode === 'exam' ? 'complete' : 'none', // CHANGED: default expiry behavior stays exam-specific.
}: QuizExamAttemptClientProps) {
  const router = useRouter()
  const handledRef = useRef(false) // CHANGED: prevents duplicate complete requests.
  const pausedRef = useRef(false) // CHANGED: prevents duplicate pause requests.

  const handlePause = useCallback(async () => {
    if (pausedRef.current) return
    pausedRef.current = true // CHANGED: lock before making the pause request.

    try {
      const formData = new FormData()
      formData.set('questionId', question.questionId)
      formData.set('currentQuestionIndex', String(currentQuestionIndex)) // CHANGED: use the exact live index from the page.
      formData.set('questionsAnswered', String(questionsAnswered)) // CHANGED: use the exact answered count from the page.

      // CHANGED: pause uses the exam-local route under app/(quiz)/exam/attempt/[attemptId]/pause.
      await fetch(`/exam/attempt/${attemptId}/pause`, {
        method: 'POST',
        body: formData,
        keepalive: true,
      })
    } catch {
      // CHANGED: pause is best-effort; user navigation should not be blocked.
    }
  }, [attemptId, currentQuestionIndex, question.questionId, questionsAnswered])

  useEffect(() => {
    if (mode !== 'exam' || !showTimer) return

    const onPageHide = () => {
      void handlePause() // CHANGED: pause on tab close, navigation away, or browser unload.
    }

    // CHANGED: strict-but-practical exam-only pause behavior.
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [handlePause, mode, showTimer])

  const handleExpire = useCallback(async () => {
    if (handledRef.current || onExpireAction !== 'complete') return // CHANGED: expiry action remains explicit.
    handledRef.current = true // CHANGED: lock before making the network request.

    try {
      const res = await fetch(`/exam/attempt/${attemptId}/complete`, {
        method: 'POST',
      })

      if (!res.ok) {
        handledRef.current = false // CHANGED: allow retry if completion fails.
        return
      }

      router.replace(`/exam/attempt/${attemptId}/result`) // CHANGED: redirect only after completion succeeds.
      router.refresh()
    } catch {
      handledRef.current = false // CHANGED: allow retry on network errors.
    }
  }, [attemptId, onExpireAction, router])

  return (
    <QuizActiveAttemptShell
      mode={mode}
      startedAt={new Date(startedAt)} // CHANGED: pass the server timestamp directly.
      quizName={quizName}
      quizCategory={quizCategory}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      question={question}
      action={action}
      showTimer={showTimer} // CHANGED: timer visibility is now configurable and aligned with the mode.
      onExpire={handleExpire} // CHANGED: timer expiry now completes only when the page is still active.
    />
  )
}
