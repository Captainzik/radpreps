import { NextRequest, NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth/api-guards'
import { Quiz } from '@/lib/db/models/quiz.model'
import { Question } from '@/lib/db/models/question.model'
import { QuizPatchSchema } from '@/lib/validator'
import { ZodError } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: RouteContext) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const { id } = await context.params
  const quiz = await Quiz.findById(id).populate('questions').lean()

  if (!quiz) {
    return NextResponse.json(
      { success: false, message: 'Quiz not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: quiz }, { status: 200 })
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  try {
    const { id } = await context.params
    const raw = await req.json()
    const payload = QuizPatchSchema.parse({ ...raw, _id: id })

    if (payload.questions !== undefined) {
      const questionCount = await Question.countDocuments({
        _id: { $in: payload.questions },
      })

      if (questionCount !== payload.questions.length) {
        return NextResponse.json(
          { success: false, message: 'One or more question IDs do not exist' },
          { status: 400 },
        )
      }
    }

    const update: Record<string, unknown> = {}
    if (payload.name !== undefined) update.name = payload.name
    if (payload.description !== undefined)
      update.description = payload.description
    if (payload.image !== undefined) update.image = payload.image || ''
    if (payload.category !== undefined) update.category = payload.category
    if (payload.tags !== undefined) update.tags = payload.tags
    if (payload.questions !== undefined) update.questions = payload.questions

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields provided for update' },
        { status: 400 },
      )
    }

    const updated = await Quiz.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    ).lean()

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update quiz',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const { id } = await context.params
  const deleted = await Quiz.findByIdAndDelete(id).lean()

  if (!deleted) {
    return NextResponse.json(
      { success: false, message: 'Quiz not found' },
      { status: 404 },
    )
  }

  return NextResponse.json(
    { success: true, message: 'Quiz deleted' },
    { status: 200 },
  )
}
