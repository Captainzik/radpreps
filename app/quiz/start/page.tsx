import Link from 'next/link'
import { getStartableQuizzes } from '@/lib/actions/quiz.actions'

export default async function QuizStartPage() {
  const quizzes = await getStartableQuizzes()

  return (
    <main className='space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Start a Quiz</h1>
        <p className='mt-1 text-sm text-slate-600'>
          Select a published quiz and begin your attempt.
        </p>
      </section>

      {quizzes.length === 0 ? (
        <section className='rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center'>
          <h2 className='text-lg font-semibold text-slate-900'>
            No quizzes available yet
          </h2>
          <p className='mt-2 text-sm text-slate-600'>
            Please check back later after quizzes are published.
          </p>
          <Link
            href='/quiz'
            className='mt-4 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
          >
            Back to quiz dashboard
          </Link>
        </section>
      ) : (
        <section className='grid gap-4 md:grid-cols-2'>
          {quizzes.map((quiz) => {
            const hasQuestions = quiz.questionsCount > 0

            return (
              <article
                key={quiz._id}
                className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
              >
                <div className='mb-3 flex items-start justify-between gap-3'>
                  <h2 className='text-lg font-semibold text-slate-900'>
                    {quiz.name}
                  </h2>
                  <span className='rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700'>
                    {quiz.category}
                  </span>
                </div>

                <p className='line-clamp-3 text-sm text-slate-600'>
                  {quiz.description}
                </p>

                <p className='mt-3 text-xs text-slate-500'>
                  {quiz.questionsCount} question
                  {quiz.questionsCount === 1 ? '' : 's'}
                </p>

                {!hasQuestions ? (
                  <p className='mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700'>
                    This quiz has no questions yet. Please choose another quiz.
                  </p>
                ) : null}

                <div className='mt-4'>
                  {hasQuestions ? (
                    <Link
                      href={`/quiz/${quiz._id}`}
                      className='inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
                    >
                      Start quiz
                    </Link>
                  ) : (
                    <button
                      type='button'
                      disabled
                      aria-disabled='true'
                      className='inline-flex w-full cursor-not-allowed items-center justify-center rounded-md bg-slate-300 px-4 py-2 text-sm font-medium text-slate-600'
                    >
                      Start quiz
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
