'use client'

import { QuizAttemptHeader } from '@/components/learning/quiz-attempt-header'
import { QuizQuestionCard } from '@/components/learning/quiz-question-card'
import type { QuizMode } from '@/lib/modes/types'

type QuizActiveAttemptShellProps = {
  mode: QuizMode
  startedAt: Date
  quizName: string
  quizCategory: string
  questionNumber: number
  totalQuestions: number
  question: {
    questionId: string
    questionText: string
    image?: string
    options: {
      text?: string
      image?: string
    }[]
  }
  action: string
  checkpointIndex?: number
  resume?: boolean
  showTimer?: boolean
  onExpire?: () => void
}

export function QuizActiveAttemptShell({
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
  showTimer = true,
  onExpire,
}: QuizActiveAttemptShellProps) {
  return (
    <main className='space-y-4 sm:space-y-6'>
      <QuizAttemptHeader
        mode={mode}
        startedAt={startedAt}
        totalQuestions={totalQuestions}
        quizName={quizName}
        quizCategory={quizCategory}
        questionNumber={questionNumber}
        checkpointIndex={checkpointIndex}
        resume={resume}
        showTimer={showTimer}
        onExpire={onExpire}
      />

      <QuizQuestionCard question={question} action={action} />
    </main>
  )
}
