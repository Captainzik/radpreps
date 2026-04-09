'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type QuizCategory = 'ARDMS' | 'Sonography Canada' | 'CAMRT' | 'ARRT' | 'CPD'
type QuizTag = 'Radiography' | 'Sonography'

type QuestionOption = {
  text: string
  isCorrect: boolean
}

type QuestionRow = {
  _id: string
  question: string
  quizName?: string
  isPublished?: boolean
  options?: QuestionOption[]
}

type QuizRow = {
  _id: string
  name: string
  description: string
  image?: string
  category: QuizCategory
  tags: QuizTag[]
  isPublished?: boolean
  questions: Array<string | { _id: string }>
}

const QUIZ_CATEGORIES: QuizCategory[] = [
  'ARDMS',
  'Sonography Canada',
  'CAMRT',
  'ARRT',
  'CPD',
]

const QUIZ_TAGS: QuizTag[] = ['Radiography', 'Sonography']

export default function EditQuizPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const quizId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [category, setCategory] = useState<QuizCategory>('ARDMS')
  const [tags, setTags] = useState<QuizTag[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [questionIds, setQuestionIds] = useState<string[]>([])

  const [questions, setQuestions] = useState<QuestionRow[]>([])

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        setLoading(true)

        const [quizRes, questionsRes] = await Promise.all([
          fetch(`/api/admin/quizzes/${quizId}`),
          fetch('/api/admin/questions'),
        ])

        const quizJson = (await quizRes.json()) as {
          success?: boolean
          message?: string
          data?: QuizRow
        }
        const questionsJson = (await questionsRes.json()) as {
          success?: boolean
          message?: string
          data?: QuestionRow[]
        }

        if (!quizRes.ok || !quizJson.success || !quizJson.data) {
          throw new Error(quizJson.message || 'Failed to load quiz')
        }
        if (!questionsRes.ok || !questionsJson.success) {
          throw new Error(questionsJson.message || 'Failed to load questions')
        }

        if (!mounted) return

        const q = quizJson.data
        const selected = q.questions.map((item) =>
          typeof item === 'string' ? item : item._id,
        )

        setName(q.name)
        setDescription(q.description)
        setImage(q.image ?? '')
        setCategory(q.category)
        setTags(q.tags ?? [])
        setIsPublished(Boolean(q.isPublished))
        setQuestionIds(selected)
        setQuestions(questionsJson.data ?? [])
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to load quiz')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadData()
    return () => {
      mounted = false
    }
  }, [quizId])

  function toggleTag(tag: QuizTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function toggleQuestion(id: string) {
    setQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id],
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (questionIds.length === 0) {
      alert('Please select at least one question.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
        category,
        tags,
        questions: questionIds,
        isPublished,
      }

      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update quiz')
      }

      router.push('/admin/quizzes')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update quiz')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className='rounded-xl border bg-white p-4 shadow-sm'>
        Loading...
      </main>
    )
  }

  return (
    <main className='space-y-4'>
      <div className='flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm'>
        <h1 className='text-xl font-semibold'>Edit Quiz</h1>
        <Link
          href='/admin/quizzes'
          className='rounded border px-3 py-1 text-sm'
        >
          Back
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className='space-y-4 rounded-xl border bg-white p-4 shadow-sm'
      >
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={100}
            className='w-full rounded border px-3 py-2'
          />
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            className='w-full rounded border px-3 py-2'
          />
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Image URL (optional)</label>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className='w-full rounded border px-3 py-2'
          />
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as QuizCategory)}
              className='w-full rounded border px-3 py-2'
            >
              {QUIZ_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Tags</label>
            <div className='flex flex-wrap gap-2'>
              {QUIZ_TAGS.map((tag) => (
                <label
                  key={tag}
                  className='inline-flex items-center gap-2 rounded border px-3 py-2 text-sm'
                >
                  <input
                    type='checkbox'
                    checked={tags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
        </div>

        <label className='inline-flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Questions</label>
          <div className='max-h-80 space-y-2 overflow-auto rounded border p-3'>
            {questions.map((q) => (
              <label
                key={q._id}
                className='flex cursor-pointer items-start gap-2 rounded border p-2 hover:bg-slate-50'
              >
                <input
                  type='checkbox'
                  checked={questionIds.includes(q._id)}
                  onChange={() => toggleQuestion(q._id)}
                  className='mt-1'
                />
                <div>
                  <p className='text-sm font-medium'>{q.question}</p>
                  <p className='text-xs text-slate-500'>
                    Quiz: {q.quizName ?? 'N/A'} • Published:{' '}
                    {q.isPublished ? 'Yes' : 'No'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          type='submit'
          disabled={saving}
          className='rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </main>
  )
}
