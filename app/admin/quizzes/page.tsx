import Link from 'next/link'
import { Types } from 'mongoose'
import { Quiz } from '@/lib/db/models/quiz.model'
import QuizRowActions from '@/components/admin/actions/quiz-row-actions'
import { connectToDatabase } from '@/lib/db'

type QuizRow = {
  _id: Types.ObjectId
  name: string
  category: string
  isPublished?: boolean
  questions?: Types.ObjectId[]
}

export default async function AdminQuizzesPage() {
  await connectToDatabase()
  const quizzes = (await Quiz.find({})
    .sort({ createdAt: -1 })
    .select('name category isPublished questions')
    .lean()) as QuizRow[]

  return (
    <main className='space-y-4 sm:space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <h1 className='text-xl font-semibold text-slate-900 dark:text-white'>
          Manage Quizzes
        </h1>
        <Link
          href='/admin/quizzes/new'
          className='rounded-lg bg-slate-900 px-4 py-2 text-sm text-white'
        >
          + New Quiz
        </Link>
      </div>

      {/* CHANGED: mobile users can horizontally scroll the quiz table instead of breaking layout. */}
      <div className='overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <table className='w-full min-w-200 text-sm'>
          <thead className='bg-slate-50 text-left dark:bg-slate-700'>
            <tr>
              <th className='p-3'>Name</th>
              <th className='p-3'>Category</th>
              <th className='p-3'>Published</th>
              <th className='p-3'>Questions</th>
              <th className='p-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr
                key={q._id.toString()}
                className='border-t border-slate-100 dark:border-slate-700'
              >
                <td className='p-3 text-slate-900 dark:text-slate-100'>
                  {q.name}
                </td>
                <td className='p-3 text-slate-700 dark:text-slate-300'>
                  {q.category}
                </td>
                <td className='p-3 text-slate-700 dark:text-slate-300'>
                  {q.isPublished ? 'Yes' : 'No'}
                </td>
                <td className='p-3 text-slate-700 dark:text-slate-300'>
                  {q.questions?.length ?? 0}
                </td>
                <td className='p-3'>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={`/admin/quizzes/${q._id.toString()}/edit`}
                      className='rounded border px-3 py-1 text-xs'
                    >
                      Edit
                    </Link>
                    <QuizRowActions
                      quizId={q._id.toString()}
                      initialPublished={Boolean(q.isPublished)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
