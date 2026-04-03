import Link from 'next/link'
import { Types } from 'mongoose'
import { Quiz } from '@/lib/db/models/quiz.model'
import QuizRowActions from '@/components/admin/actions/quiz-row-actions'

type QuizRow = {
  _id: Types.ObjectId
  name: string
  category: string
  isPublished?: boolean
  questions?: Types.ObjectId[]
}

export default async function AdminQuizzesPage() {
  const quizzes = (await Quiz.find({})
    .sort({ createdAt: -1 })
    .select('name category isPublished questions')
    .lean()) as QuizRow[]

  return (
    <main className='space-y-4'>
      <div className='flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm'>
        <h1 className='text-xl font-semibold'>Manage Quizzes</h1>
        <Link
          href='/admin/quizzes/new'
          className='rounded-lg bg-slate-900 px-4 py-2 text-sm text-white'
        >
          + New Quiz
        </Link>
      </div>

      <div className='overflow-hidden rounded-xl border bg-white shadow-sm'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-50 text-left'>
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
              <tr key={q._id.toString()} className='border-t'>
                <td className='p-3'>{q.name}</td>
                <td className='p-3'>{q.category}</td>
                <td className='p-3'>{q.isPublished ? 'Yes' : 'No'}</td>
                <td className='p-3'>{q.questions?.length ?? 0}</td>
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
