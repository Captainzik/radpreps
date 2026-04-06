'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/lib/db/models/user.model'
import { QuizAttempt } from '@/lib/db/models/attempts.model'
import { Leaderboard } from '@/lib/db/models/leaderboard.model'
import { UserUpdateSchema } from '@/lib/validator'

export type UpdateProfileInput = {
  userId: string
  email: string
  username?: string
  fullName?: string
  avatar?: string
}

export type ChangePasswordInput = {
  userId: string
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}

export async function updateProfile(input: UpdateProfileInput) {
  await connectToDatabase()

  const parsed = UserUpdateSchema.parse({
    _id: input.userId,
    email: input.email.trim().toLowerCase(),
    username: input.username?.trim() || undefined,
    fullName: input.fullName?.trim() || undefined,
    avatar: input.avatar?.trim() || '',
  })

  const existingByEmail = await User.findOne({
    _id: { $ne: parsed._id },
    email: parsed.email,
  })
    .select('_id')
    .lean()

  if (existingByEmail) {
    throw new Error('Email already in use')
  }

  if (parsed.username) {
    const existingByUsername = await User.findOne({
      _id: { $ne: parsed._id },
      username: parsed.username,
    })
      .select('_id')
      .lean()

    if (existingByUsername) {
      throw new Error('Username already in use')
    }
  }

  const updated = await User.findByIdAndUpdate(
    parsed._id,
    {
      $set: {
        email: parsed.email,
        username: parsed.username,
        fullName: parsed.fullName ?? '',
        avatar: parsed.avatar ?? '',
      },
    },
    { new: true, runValidators: true },
  )
    .select('email username fullName avatar')
    .lean()

  if (!updated) throw new Error('User not found')

  revalidatePath('/profile')
  revalidatePath('/profile/update')
  revalidatePath('/feed')
  revalidatePath('/leaderboard')

  return {
    success: true,
    user: {
      email: updated.email,
      username: updated.username ?? '',
      fullName: updated.fullName ?? '',
      avatar: updated.avatar ?? '',
    },
  }
}

export async function changePassword(input: ChangePasswordInput) {
  await connectToDatabase()

  const oldPassword = input.oldPassword.trim()
  const newPassword = input.newPassword.trim()
  const confirmNewPassword = input.confirmNewPassword.trim()

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    throw new Error('All password fields are required')
  }

  if (newPassword !== confirmNewPassword) {
    throw new Error('New password and confirm password do not match')
  }

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!strongPasswordRegex.test(newPassword)) {
    throw new Error(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    )
  }

  const user = await User.findById(input.userId).select('+password')
  if (!user) throw new Error('User not found')
  if (!user.password) {
    throw new Error('Password is not available for this account')
  }

  const isOldValid = await bcrypt.compare(oldPassword, user.password)
  if (!isOldValid) throw new Error('Old password is incorrect')

  const isSameAsOld = await bcrypt.compare(newPassword, user.password)
  if (isSameAsOld) {
    throw new Error('New password must be different from old password')
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  user.password = hashed
  await user.save()

  revalidatePath('/profile/update')

  return { success: true }
}

export async function resetUserData(userId: string) {
  await connectToDatabase()

  await Promise.all([
    QuizAttempt.deleteMany({ user: userId }),
    Leaderboard.deleteMany({ user: userId }),
    User.findByIdAndUpdate(userId, {
      $set: {
        favoriteCategories: [],
        lifetimeTotalScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastStreakDate: null,
      },
    }),
  ])

  revalidatePath('/quiz/history')
  revalidatePath('/feed')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')

  return { success: true }
}

export async function deleteUserAccount(userId: string) {
  await connectToDatabase()

  await Promise.all([
    QuizAttempt.deleteMany({ user: userId }),
    Leaderboard.deleteMany({ user: userId }),
    User.findByIdAndDelete(userId),
  ])

  revalidatePath('/')
  return { success: true }
}
