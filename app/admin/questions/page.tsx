import Link from 'next/link'
import { Types } from 'mongoose'
import { Question } from '@/lib/db/models/question.model'
import QuestionRowActions from '@/components/admin/actions/question-row-actions'
import { connectToDatabase } from '@/lib/db'

type QuestionRow = {
  _id: Types.ObjectId
  question: string
  quizName?: string
  isPublished?: boolean
}

export default async function AdminQuestionsPage() {
  await connectToDatabase()
  const questions = (await Question.find({})
    .sort({ createdAt: -1 })
    .select('question quizName isPublished')
    .lean()) as QuestionRow[]

  return (
    <main className='space-y-4 sm:space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <h1 className='text-xl font-semibold text-slate-900 dark:text-white'>
          Manage Questions
        </h1>
        <Link
          href='/admin/questions/new'
          className='rounded-lg bg-slate-900 px-4 py-2 text-sm text-white'
        >
          + New Question
        </Link>
      </div>

      <div className='space-y-3'>
        {questions.map((q) => (
          <div
            key={q._id.toString()}
            className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'
          >
            <p className='font-medium text-slate-900 dark:text-white'>
              {q.question}
            </p>
            <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
              Quiz: {q.quizName ?? 'N/A'}
            </p>
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Published: {q.isPublished ? 'Yes' : 'No'}
            </p>

            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <Link
                href={`/admin/questions/${q._id.toString()}/edit`}
                className='rounded border px-3 py-1 text-sm'
              >
                Edit
              </Link>
              <QuestionRowActions questionId={q._id.toString()} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
