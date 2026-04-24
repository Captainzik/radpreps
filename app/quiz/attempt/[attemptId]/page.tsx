import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  getActiveQuizAttempt,
  completeQuizAttempt,
} from '@/lib/actions/quizAttempt.actions'
import MediaPreview from '@/components/shared/media-preview'
import {
  QUESTION_MEDIA_BOX_CLASS,
  QUESTION_MEDIA_SIZES,
} from '@/lib/constants/media'

type PageProps = {
  params: Promise<{
    attemptId: string
  }>
}

type AttemptOption = {
  text?: string
  image?: string
}

type AttemptQuestion = {
  questionId: string
  questionText: string
  image?: string
  options: AttemptOption[]
}

type ActiveAttempt = {
  _id: { toString(): string }
  quiz: {
    name: string
    category: string
    image?: string
  }
  answers: {
    questionId: string
    selectedOptionIndex?: number
  }[]
  questions: AttemptQuestion[]
}

export default async function QuizAttemptRunnerPage({ params }: PageProps) {
  const { attemptId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/quiz/attempt/${attemptId}`)
  }

  const attempt = (await getActiveQuizAttempt({
    attemptId,
    userId: session.user.id,
  })) as ActiveAttempt | null

  if (!attempt) {
    notFound()
  }

  const answeredCount = attempt.answers.filter(
    (a) => typeof a.selectedOptionIndex === 'number',
  ).length

  if (answeredCount >= attempt.questions.length) {
    await completeQuizAttempt({
      attemptId,
      userId: session.user.id,
    })
    redirect(`/quiz/attempt/${attemptId}/result`)
  }

  const currentQuestion = attempt.questions[answeredCount]

  if (!currentQuestion) {
    notFound()
  }

  return (
    <main className='space-y-4 sm:space-y-6'>
      <section className='rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-xl font-bold text-slate-900 dark:text-white'>
            {attempt.quiz.name}
          </h1>
          <span className='rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300'>
            Question {answeredCount + 1} / {attempt.questions.length}
          </span>
        </div>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
          {attempt.quiz.category}
        </p>
      </section>

      <section className='rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
          {currentQuestion.questionText}
        </h2>

        {currentQuestion.image?.trim() ? (
          <div className={QUESTION_MEDIA_BOX_CLASS}>
            <MediaPreview
              url={currentQuestion.image}
              alt='Question media'
              sizes={QUESTION_MEDIA_SIZES}
            />
          </div>
        ) : null}

        <form
          action={`/quiz/attempt/${attemptId}/answer`}
          method='POST'
          className='mt-4 space-y-3'
        >
          <input
            type='hidden'
            name='questionId'
            value={currentQuestion.questionId}
          />

          {currentQuestion.options.map((opt: AttemptOption, idx: number) => (
            <label
              key={`${currentQuestion.questionId}-${idx}`}
              className='flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700'
            >
              <input
                type='radio'
                name='selectedOptionIndex'
                value={idx}
                required
                className='mt-1'
              />
              <div className='min-w-0 flex-1 space-y-2'>
                {opt.text?.trim() ? (
                  <span className='block text-sm text-slate-800 dark:text-slate-300'>
                    {opt.text}
                  </span>
                ) : null}

                {opt.image?.trim() ? (
                  <div className={QUESTION_MEDIA_BOX_CLASS}>
                    <MediaPreview
                      url={opt.image}
                      alt={`Option ${idx + 1} media`}
                      sizes={QUESTION_MEDIA_SIZES}
                    />
                  </div>
                ) : null}
              </div>
            </label>
          ))}

          <div className='pt-2'>
            <button
              type='submit'
              className='inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
            >
              Submit answer
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
