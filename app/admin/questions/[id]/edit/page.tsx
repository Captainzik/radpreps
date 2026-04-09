'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type OptionRow = {
  text: string
  isCorrect: boolean
}

type QuestionRow = {
  _id: string
  question: string
  image?: string
  quizName: string
  options: OptionRow[]
  tips?: string
  isPublished?: boolean
}

export default function EditQuestionPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const questionId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [question, setQuestion] = useState('')
  const [image, setImage] = useState('')
  const [quizName, setQuizName] = useState('')
  const [tips, setTips] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [options, setOptions] = useState<OptionRow[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ])

  useEffect(() => {
    let mounted = true

    async function loadQuestion() {
      try {
        setLoading(true)

        const res = await fetch(`/api/admin/questions/${questionId}`)
        const json = (await res.json()) as {
          success?: boolean
          message?: string
          data?: QuestionRow
        }

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || 'Failed to load question')
        }

        if (!mounted) return

        setQuestion(json.data.question)
        setImage(json.data.image ?? '')
        setQuizName(json.data.quizName)
        setTips(json.data.tips ?? '')
        setIsPublished(Boolean(json.data.isPublished))

        const normalized = [...json.data.options]
        while (normalized.length < 4) {
          normalized.push({ text: '', isCorrect: false })
        }
        setOptions(normalized.slice(0, 4))
      } catch (error) {
        alert(
          error instanceof Error ? error.message : 'Failed to load question',
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadQuestion()
    return () => {
      mounted = false
    }
  }, [questionId])

  function setCorrect(index: number) {
    setOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, isCorrect: i === index })),
    )
  }

  function setOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const normalizedOptions = options
      .map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect }))
      .filter((o) => o.text.length > 0)

    if (normalizedOptions.length < 2) {
      alert('Provide at least 2 options.')
      return
    }

    if (normalizedOptions.filter((o) => o.isCorrect).length !== 1) {
      alert('Exactly one option must be marked correct.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        question: question.trim(),
        image: image.trim(),
        quizName: quizName.trim(),
        options: normalizedOptions,
        tips: tips.trim(),
        isPublished,
      }

      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update question')
      }

      router.push('/admin/questions')
      router.refresh()
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to update question',
      )
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
        <h1 className='text-xl font-semibold'>Edit Question</h1>
        <Link
          href='/admin/questions'
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
          <label className='text-sm font-medium'>Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            minLength={10}
            maxLength={600}
            rows={4}
            className='w-full rounded border px-3 py-2'
          />
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Quiz Name</label>
          <input
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            required
            minLength={3}
            maxLength={100}
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

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Options</label>
          <div className='space-y-2'>
            {options.map((opt, idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <input
                  type='radio'
                  name='correct'
                  checked={opt.isCorrect}
                  onChange={() => setCorrect(idx)}
                />
                <input
                  value={opt.text}
                  onChange={(e) => setOptionText(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className='w-full rounded border px-3 py-2'
                />
              </div>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Tips (optional)</label>
          <textarea
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            maxLength={2000}
            rows={3}
            className='w-full rounded border px-3 py-2'
          />
        </div>

        <label className='inline-flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>

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
