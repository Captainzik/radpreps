import { NextRequest, NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth/api-guards'
import { Question } from '@/lib/db/models/question.model'
import { QuestionPatchSchema } from '@/lib/validator'
import { ZodError } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: RouteContext) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const { id } = await context.params
  const question = await Question.findById(id).lean()

  if (!question) {
    return NextResponse.json(
      { success: false, message: 'Question not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: question }, { status: 200 })
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  try {
    const { id } = await context.params
    const raw = await req.json()
    const payload = QuestionPatchSchema.parse({ ...raw, _id: id })

    const update: Record<string, unknown> = {}
    if (payload.question !== undefined) update.question = payload.question
    if (payload.image !== undefined) update.image = payload.image || ''
    if (payload.quizName !== undefined) update.quizName = payload.quizName
    if (payload.options !== undefined) update.options = payload.options
    if (payload.tips !== undefined) update.tips = payload.tips || ''
    if (payload.isPublished !== undefined)
      update.isPublished = payload.isPublished

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields provided for update' },
        { status: 400 },
      )
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    ).lean()

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Question not found' },
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
        message: 'Failed to update question',
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
  const deleted = await Question.findByIdAndDelete(id).lean()

  if (!deleted) {
    return NextResponse.json(
      { success: false, message: 'Question not found' },
      { status: 404 },
    )
  }

  return NextResponse.json(
    { success: true, message: 'Question deleted' },
    { status: 200 },
  )
}
