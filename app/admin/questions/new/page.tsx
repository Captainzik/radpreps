'use client'

import { SubmitEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import MediaPreview from '@/components/shared/media-preview'

type OptionRow = {
  text: string
  image: string
  isCorrect: boolean
}

export default function NewQuestionPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [question, setQuestion] = useState('')
  const [image, setImage] = useState('')
  const [quizName, setQuizName] = useState('')
  const [tips, setTips] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  const [options, setOptions] = useState<OptionRow[]>([
    { text: '', image: '', isCorrect: true },
    { text: '', image: '', isCorrect: false },
    { text: '', image: '', isCorrect: false },
    { text: '', image: '', isCorrect: false },
  ])

  function setCorrect(index: number) {
    setOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, isCorrect: i === index })),
    )
  }

  function setOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)))
  }

  function setOptionImage(index: number, imageUrl: string) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, image: imageUrl } : o)),
    )
  }

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const normalizedOptions = options
      .map((o) => ({
        text: o.text.trim(),
        image: o.image.trim(),
        isCorrect: o.isCorrect,
      }))
      .filter((o) => o.text.length > 0 || o.image.length > 0)

    if (normalizedOptions.length < 2) {
      alert('Provide at least 2 options (text or image/video URL).')
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

      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create question')
      }

      router.push('/admin/questions')
      router.refresh()
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to create question',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className='space-y-4 sm:space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <h1 className='text-xl font-semibold text-slate-900 dark:text-white'>
          New Question
        </h1>
        <Link
          href='/admin/questions'
          className='rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-800'
        >
          Back
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className='space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'
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
            className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
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
            className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
          />
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            Question Image URL (optional)
          </label>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder='https://...'
            className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
          />
          {image.trim() ? (
            <div className='relative h-48 w-96 overflow-hidden rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800'>
              <MediaPreview url={image.trim()} alt='Question media preview' />
            </div>
          ) : null}
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Options</label>
          <div className='space-y-3'>
            {options.map((opt, idx) => (
              <div
                key={idx}
                className='rounded border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-800'
              >
                <div className='mb-2 flex items-center gap-2'>
                  <input
                    type='radio'
                    name='correct'
                    checked={opt.isCorrect}
                    onChange={() => setCorrect(idx)}
                  />
                  <span className='text-sm font-medium'>Option {idx + 1}</span>
                </div>

                <div className='space-y-2'>
                  <input
                    value={opt.text}
                    onChange={(e) => setOptionText(idx, e.target.value)}
                    placeholder={`Option ${idx + 1} text (optional if media provided)`}
                    className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                  />
                  <input
                    value={opt.image}
                    onChange={(e) => setOptionImage(idx, e.target.value)}
                    placeholder='Option image/video URL (optional)'
                    className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                  />
                  {opt.image.trim() ? (
                    <div className='relative h-24 w-48 overflow-hidden rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800'>
                      <MediaPreview
                        url={opt.image.trim()}
                        alt={`Option ${idx + 1} media preview`}
                      />
                    </div>
                  ) : null}
                </div>
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
            className='w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
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
          {saving ? 'Creating...' : 'Create Question'}
        </button>
      </form>
    </main>
  )
}
