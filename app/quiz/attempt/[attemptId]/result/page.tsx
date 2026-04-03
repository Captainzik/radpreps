import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth' // adjust if your auth helper path is different
import { getQuizAttemptResult } from '@/lib/actions/quizAttempt.actions'

type PageProps = {
  params: {
    attemptId: string
  }
}

export default async function QuizAttemptResultPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  let result: Awaited<ReturnType<typeof getQuizAttemptResult>>
  try {
    result = await getQuizAttemptResult({
      attemptId: params.attemptId,
      userId: session.user.id,
    })
  } catch {
    notFound()
  }

  const correctCount = result.answers.filter((a) => a.isCorrect).length
  const incorrectCount = result.answers.length - correctCount

  return (
    <main className='mx-auto max-w-4xl px-4 py-8'>
      <header className='mb-6'>
        <h1 className='text-2xl font-bold'>Quiz Result</h1>
        <p className='text-sm text-gray-600'>
          {result.quiz.name} • {result.quiz.category}
        </p>
      </header>

      <section className='mb-8 rounded-xl border p-4'>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          <Stat label='Score' value={`${result.score} / ${result.maxScore}`} />
          <Stat label='Percentage' value={`${result.percentage.toFixed(2)}%`} />
          <Stat label='Correct' value={`${correctCount}`} />
          <Stat label='Incorrect' value={`${incorrectCount}`} />
        </div>
      </section>

      <section className='space-y-4'>
        {result.answers.map((a, idx) => (
          <article key={a.questionId || idx} className='rounded-xl border p-4'>
            <div className='mb-2 flex items-center justify-between'>
              <h2 className='font-semibold'>
                Q{idx + 1}. {a.questionText}
              </h2>
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  a.isCorrect
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {a.isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>

            <ul className='mb-3 list-disc pl-5 text-sm'>
              {a.options.map((opt, i) => {
                const isSelected = a.selectedOptionIndex === i
                const isCorrect = a.correctOptionIndex === i

                return (
                  <li
                    key={`${a.questionId}-${i}`}
                    className={
                      isCorrect
                        ? 'text-green-700'
                        : isSelected
                          ? 'text-red-700'
                          : 'text-gray-800'
                    }
                  >
                    {opt.text}
                    {isSelected ? ' (Your answer)' : ''}
                    {isCorrect ? ' (Correct answer)' : ''}
                  </li>
                )
              })}
            </ul>

            {a.tips ? (
              <p className='rounded bg-blue-50 p-2 text-sm text-blue-900'>
                Tip: {a.tips}
              </p>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg bg-gray-50 p-3'>
      <p className='text-xs uppercase tracking-wide text-gray-500'>{label}</p>
      <p className='text-lg font-semibold'>{value}</p>
    </div>
  )
}
