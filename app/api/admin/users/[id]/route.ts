import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import bcrypt from 'bcryptjs'
import { requireApiAdmin } from '@/lib/auth/api-guards'
import { User } from '@/lib/db/models/user.model'

type RouteContext = { params: Promise<{ id: string }> }

const UserPatchSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().trim().min(3).max(30).optional().or(z.literal('')),
  fullName: z.string().trim().max(100).optional().or(z.literal('')),
  avatar: z.string().url().optional().or(z.literal('')),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  isVerified: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
})

export async function GET(_: NextRequest, context: RouteContext) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const { id } = await context.params

  const user = await User.findById(id)
    .select(
      '_id email username fullName avatar role isVerified favoriteCategories lifetimeTotalScore currentStreak longestStreak createdAt updatedAt',
    )
    .lean()

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: user }, { status: 200 })
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  try {
    const { id } = await context.params
    const raw = (await req.json()) as Record<string, unknown>
    const payload = UserPatchSchema.parse(raw)

    const update: Record<string, unknown> = {}

    if (payload.email !== undefined) {
      const normalizedEmail = payload.email.toLowerCase().trim()
      const emailExists = await User.exists({
        email: normalizedEmail,
        _id: { $ne: id },
      })
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 409 },
        )
      }
      update.email = normalizedEmail
    }

    if (payload.username !== undefined) {
      const nextUsername = payload.username.trim()
      if (nextUsername) {
        const usernameExists = await User.exists({
          username: nextUsername,
          _id: { $ne: id },
        })
        if (usernameExists) {
          return NextResponse.json(
            { success: false, message: 'Username already exists' },
            { status: 409 },
          )
        }
        update.username = nextUsername
      } else {
        update.username = undefined
      }
    }

    if (payload.fullName !== undefined) {
      update.fullName = payload.fullName.trim() || undefined
    }

    if (payload.avatar !== undefined) {
      update.avatar = payload.avatar || ''
    }

    if (payload.role !== undefined) update.role = payload.role
    if (payload.isVerified !== undefined) update.isVerified = payload.isVerified

    if (payload.password !== undefined) {
      update.password = await bcrypt.hash(payload.password, 10)
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields provided for update' },
        { status: 400 },
      )
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    )
      .select(
        '_id email username fullName avatar role isVerified favoriteCategories lifetimeTotalScore currentStreak longestStreak createdAt updatedAt',
      )
      .lean()

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
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
        message: 'Failed to update user',
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
  const deleted = await User.findByIdAndDelete(id).lean()

  if (!deleted) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 },
    )
  }

  return NextResponse.json(
    { success: true, message: 'User deleted' },
    { status: 200 },
  )
}
