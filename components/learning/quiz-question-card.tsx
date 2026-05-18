'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MediaPreview from '@/components/shared/media-preview'
import {
  QUESTION_MEDIA_BOX_CLASS,
  QUESTION_MEDIA_SIZES,
} from '@/lib/constants/media'
import { QuizOptionList } from '@/components/learning/quiz-option-list'

type QuizQuestion = {
  questionId: string
  questionText: string
  image?: string
  options: {
    text?: string
    image?: string
  }[]
}

type QuizQuestionCardProps = {
  question: QuizQuestion
  action: string
}

type AnswerResponse =
  | {
      success: true
      completed: boolean
      redirectTo: string
    }
  | {
      success: false
      message: string
    }

export function QuizQuestionCard({ question, action }: QuizQuestionCardProps) {
  const router = useRouter()
  const submittingRef = useRef(false)

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      if (submittingRef.current) return
      submittingRef.current = true

      try {
        const res = await fetch(action, {
          method: 'POST',
          body: formData,
        })

        const data = (await res.json()) as AnswerResponse

        if (!res.ok || !data.success) {
          throw new Error(
            data.success ? 'Failed to submit answer' : data.message,
          )
        }

        // Set flag to prevent pause when navigating to next question
        // This prevents the redirect loop caused by pause-on-unload
        ;(window as any).__skipExamPause = true

        // Use window.location for hard navigation to ensure fresh page load
        // This prevents stale server action references that cause 500 errors
        window.location.href = data.redirectTo
      } finally {
        submittingRef.current = false
      }
    },
    [action, router],
  )

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
      <h2 className='text-lg font-semibold leading-7 text-slate-900 dark:text-white sm:text-xl'>
        {question.questionText}
      </h2>

      {question.image?.trim() ? (
        <div className='mt-4'>
          <div className={QUESTION_MEDIA_BOX_CLASS}>
            <MediaPreview
              url={question.image}
              alt='Question media'
              sizes={QUESTION_MEDIA_SIZES}
            />
          </div>
        </div>
      ) : null}

      <form
        className='mt-5 space-y-4'
        onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          await handleSubmit(formData)
        }}
      >
        <input type='hidden' name='questionId' value={question.questionId} />

        <QuizOptionList
          questionId={question.questionId}
          options={question.options}
        />

        <div className='pt-1'>
          <button
            type='submit'
            className='inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus:ring-slate-100 dark:focus:ring-offset-slate-900 sm:w-auto'
          >
            Submit answer
          </button>
        </div>
      </form>
    </section>
  )
}
