'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

type QuestionsResponse = {
  success?: boolean
  message?: string
  data?: QuestionRow[]
}

type QuizCategory = 'ARDMS' | 'Sonography Canada' | 'CAMRT' | 'ARRT' | 'CPD'
type QuizTag = 'Radiography' | 'Sonography'

const QUIZ_CATEGORIES: QuizCategory[] = [
  'ARDMS',
  'Sonography Canada',
  'CAMRT',
  'ARRT',
  'CPD',
]

const QUIZ_TAGS: QuizTag[] = ['Radiography', 'Sonography']

export default function NewQuizPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [category, setCategory] = useState<QuizCategory>('ARDMS')
  const [tags, setTags] = useState<QuizTag[]>([])
  const [questionIds, setQuestionIds] = useState<string[]>([])

  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadQuestions() {
      try {
        setLoadingQuestions(true)
        const res = await fetch('/api/admin/questions')
        const json = (await res.json()) as QuestionsResponse
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load questions')
        }
        if (!mounted) return
        setQuestions(json.data ?? [])
      } catch (error) {
        alert(
          error instanceof Error ? error.message : 'Failed to load questions',
        )
      } finally {
        if (mounted) setLoadingQuestions(false)
      }
    }

    void loadQuestions()
    return () => {
      mounted = false
    }
  }, [])

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
      }

      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create quiz')
      }

      router.push('/admin/quizzes')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create quiz')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className='space-y-4'>
      <div className='flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm'>
        <h1 className='text-xl font-semibold'>New Quiz</h1>
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
            placeholder='https://...'
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

        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            Questions (select one or more)
          </label>

          {loadingQuestions ? (
            <p className='text-sm text-slate-500'>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className='text-sm text-slate-500'>
              No questions found. Create questions first.
            </p>
          ) : (
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
          )}
        </div>

        <button
          type='submit'
          disabled={saving}
          className='rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50'
        >
          {saving ? 'Creating...' : 'Create Quiz'}
        </button>
      </form>
    </main>
  )
}
