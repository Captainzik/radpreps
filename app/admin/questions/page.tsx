import Link from 'next/link'
import { Types } from 'mongoose'
import { Question } from '@/lib/db/models/question.model'
import QuestionRowActions from '@/components/admin/actions/question-row-actions'

type QuestionRow = {
  _id: Types.ObjectId
  question: string
  quizName?: string
  isPublished?: boolean
}

export default async function AdminQuestionsPage() {
  const questions = (await Question.find({})
    .sort({ createdAt: -1 })
    .select('question quizName isPublished')
    .lean()) as QuestionRow[]

  return (
    <main className='space-y-4'>
      <div className='flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm'>
        <h1 className='text-xl font-semibold'>Manage Questions</h1>
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
            className='rounded-xl border bg-white p-4 shadow-sm'
          >
            <p className='font-medium text-slate-900'>{q.question}</p>
            <p className='mt-1 text-sm text-slate-600'>
              Quiz: {q.quizName ?? 'N/A'}
            </p>
            <p className='text-xs text-slate-500'>
              Published: {q.isPublished ? 'Yes' : 'No'}
            </p>

            <div className='mt-3 flex items-center gap-2'>
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
