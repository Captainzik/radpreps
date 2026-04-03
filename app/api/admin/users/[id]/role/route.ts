import { NextRequest, NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth/api-guards'
import { User } from '@/lib/db/models/user.model'
import { z, ZodError } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

const UpdateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'moderator']),
})

export async function PATCH(req: NextRequest, context: RouteContext) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  try {
    const { id } = await context.params
    const raw = await req.json()
    const payload = UpdateRoleSchema.parse(raw)

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { role: payload.role } },
      { new: true },
    )
      .select('_id email username role isVerified')
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
        message: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
