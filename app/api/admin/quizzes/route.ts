import { NextRequest, NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth/api-guards'
import { Quiz } from '@/lib/db/models/quiz.model'
import { Question } from '@/lib/db/models/question.model'
import { CreateQuizSchema } from '@/lib/validator'
import { ZodError } from 'zod'

export async function GET() {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const quizzes = await Quiz.find({})
    .sort({ createdAt: -1 })
    .populate('questions', '_id question quizName isPublished')
    .lean()

  return NextResponse.json({ success: true, data: quizzes }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  try {
    const raw = await req.json()
    const payload = CreateQuizSchema.parse(raw)

    // Validate question references explicitly before create (friendly API error)
    const questionCount = await Question.countDocuments({
      _id: { $in: payload.questions },
    })

    if (questionCount !== payload.questions.length) {
      return NextResponse.json(
        {
          success: false,
          message: 'One or more question IDs do not exist',
        },
        { status: 400 },
      )
    }

    const created = await Quiz.create({
      name: payload.name,
      description: payload.description,
      image: payload.image || '',
      category: payload.category,
      tags: payload.tags,
      questions: payload.questions,
      // keep defaults from model for reviews/ratings fields
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
        message: 'Failed to create quiz',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
