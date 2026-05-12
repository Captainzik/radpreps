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
  showTimer = mode === 'exam',
  onExpireAction = mode === 'exam' ? 'complete' : 'none',
}: QuizExamAttemptClientProps) {
  const router = useRouter()
  const handledRef = useRef(false)

  const handlePause = useCallback(async () => {
    try {
      const formData = new FormData()
      formData.set('questionId', question.questionId)

      await fetch(`/exam/attempt/${attemptId}/pause`, {
        method: 'POST',
        body: formData,
        keepalive: true,
      })
    } catch {
      // best effort
    }
  }, [attemptId, question.questionId])

  useEffect(() => {
    if (mode !== 'exam') return

    const onBeforeUnload = () => {
      void handlePause()
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
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
      showTimer={showTimer}
      onExpire={handleExpire}
    />
  )
}
