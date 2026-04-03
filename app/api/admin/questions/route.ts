import { NextRequest, NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth/api-guards'
import { Question } from '@/lib/db/models/question.model'
import { CreateQuestionSchema } from '@/lib/validator'
import { ZodError } from 'zod'

export async function GET() {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const questions = await Question.find({}).sort({ createdAt: -1 }).lean()

  return NextResponse.json({ success: true, data: questions }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  try {
    const raw = await req.json()
    const payload = CreateQuestionSchema.parse(raw)

    // payload includes required quizName per your schema
    const created = await Question.create({
      question: payload.question,
      image: payload.image || '',
      quizName: payload.quizName,
      options: payload.options,
      tips: payload.tips || '',
      isPublished: payload.isPublished,
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
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
        message: 'Failed to create question',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
