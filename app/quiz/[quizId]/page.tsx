import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Types } from 'mongoose'
import { auth } from '@/auth'
import { Quiz } from '@/lib/db/models/quiz.model'
import { Question } from '@/lib/db/models/question.model'
import MediaPreview from '@/components/shared/media-preview'
import { QUIZ_MEDIA_BOX_CLASS, QUIZ_MEDIA_SIZES } from '@/lib/constants/media'
import { connectToDatabase } from '@/lib/db'

type PageProps = {
  params: Promise<{
    quizId: string
  }>
}

type QuizTag = 'Radiography' | 'Sonography'
type QuizCategory = 'ARDMS' | 'Sonography Canada' | 'CAMRT' | 'ARRT' | 'CPD'

type QuizDetails = {
  _id: Types.ObjectId
  name: string
  description: string
  image?: string
  category: QuizCategory
  tags: QuizTag[]
  isPublished?: boolean
  questions: Types.ObjectId[]
}

export default async function QuizDetailsPage({ params }: PageProps) {
  await connectToDatabase()
  const { quizId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/quiz/${quizId}`)
  }

  const quiz = (await Quiz.findById(quizId)
    .select('name description image category tags questions isPublished')
    .lean()) as QuizDetails | null

  if (!quiz) notFound()
  if (!quiz.isPublished) notFound()

  const questionIds = Array.isArray(quiz.questions) ? quiz.questions : []
  const questionCount = questionIds.length

  const publishedQuestionCount = await Question.countDocuments({
    _id: { $in: questionIds },
    isPublished: true,
  })

  const canStart = questionCount > 0 && publishedQuestionCount > 0

  return (
    <main className='space-y-4 sm:space-y-6'>
      <section className='rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
              {quiz.name}
            </h1>
            <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
              {quiz.category}
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            {quiz.tags?.map((tag) => (
              <span
                key={tag}
                className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {quiz.image?.trim() ? (
          <div className={QUIZ_MEDIA_BOX_CLASS}>
            <MediaPreview
              url={quiz.image}
              alt={`${quiz.name} media`}
              sizes={QUIZ_MEDIA_SIZES}
            />
          </div>
        ) : null}

        <p className='mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300'>
          {quiz.description}
        </p>

        <div className='mt-5 grid gap-3 sm:grid-cols-2'>
          <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-700'>
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Total questions
            </p>
            <p className='text-lg font-semibold text-slate-900 dark:text-white'>
              {questionCount}
            </p>
          </div>
          <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-700'>
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Published questions
            </p>
            <p className='text-lg font-semibold text-slate-900 dark:text-white'>
              {publishedQuestionCount}
            </p>
          </div>
        </div>

        <div className='mt-6 flex flex-wrap gap-3'>
          {canStart ? (
            <Link
              href={`/quiz/${quiz._id.toString()}/start`}
              className='inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
            >
              Start quiz
            </Link>
          ) : (
            <button
              type='button'
              disabled
              className='inline-flex items-center justify-center rounded-md bg-slate-300 px-4 py-2 text-sm font-medium text-white dark:bg-slate-700 dark:text-slate-400'
            >
              Quiz unavailable
            </button>
          )}

          <Link
            href='/quiz/start'
            className='inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
          >
            Back to quizzes
          </Link>
        </div>
      </section>
    </main>
  )
}
