import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { requireApiAdmin } from '@/lib/auth/api-guards'
import { Quiz } from '@/lib/db/models/quiz.model'
import { PublishQuizSchema } from '@/lib/validator'

export async function POST(req: NextRequest) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  try {
    const raw = await req.json().catch(() => null)

    if (!raw) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 },
      )
    }

    const payload = PublishQuizSchema.parse(raw)

    const updated = await Quiz.findByIdAndUpdate(
      payload.quizId,
      { $set: { isPublished: payload.isPublished } },
      { new: true },
    )
      .select('_id name category isPublished updatedAt')
      .lean()

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: payload.isPublished ? 'Quiz published' : 'Quiz unpublished',
        data: updated,
      },
      { status: 200 },
    )
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
        message: 'Failed to update publish status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
