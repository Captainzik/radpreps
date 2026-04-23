'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import {
  updateProfile,
  changePassword,
  resetUserData,
  deleteUserAccount,
} from '@/lib/actions/user.actions'

type AvatarStyle = 'fun-emoji' | 'bottts' | 'adventurer' | 'avataaars'

type Props = {
  userId: string
  initialEmail: string
  initialUsername: string
  initialFullName: string
  initialAvatar: string
  initialAvatarStyle?: AvatarStyle
}

const AVATAR_STYLES: AvatarStyle[] = [
  'fun-emoji',
  'bottts',
  'adventurer',
  'avataaars',
]

function buildDiceBearAvatar(style: AvatarStyle, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || 'user')}`
}

export default function UpdateProfileClient({
  userId,
  initialEmail,
  initialUsername,
  initialFullName,
  initialAvatar,
  initialAvatarStyle = 'adventurer',
}: Props) {
  const [profile, setProfile] = useState({
    email: initialEmail,
    username: initialUsername,
    fullName: initialFullName,
    avatarStyle: initialAvatarStyle,
    avatar:
      initialAvatar ||
      buildDiceBearAvatar(
        initialAvatarStyle,
        initialUsername || initialEmail || userId,
      ),
  })

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()

  const canDelete = deleteConfirmText === 'DELETE'
  const avatarSeed = profile.username || profile.email || userId
  const previewAvatar = buildDiceBearAvatar(profile.avatarStyle, avatarSeed)

  return (
    <main className='space-y-4 sm:space-y-6'>
      {/* CHANGED: all sections get smaller padding on mobile for better fit. */}
      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
          Update Profile
        </h1>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
          Update account details and security options.
        </p>
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
          Profile info
        </h2>

        <form
          className='mt-4 space-y-4'
          onSubmit={(e) => {
            e.preventDefault()

            startTransition(async () => {
              try {
                const result = await updateProfile({
                  userId,
                  email: profile.email,
                  username: profile.username,
                  fullName: profile.fullName,
                  avatarStyle: profile.avatarStyle,
                })

                setProfile((prev) => ({
                  ...prev,
                  avatar: result.user.avatar,
                }))

                toast.success('Profile updated successfully')
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : 'Failed to update profile',
                )
              }
            })
          }}
        >
          <input
            className='w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
            type='email'
            placeholder='Email'
            value={profile.email}
            onChange={(e) =>
              setProfile((s) => ({ ...s, email: e.target.value }))
            }
            required
            disabled={isPending}
          />

          <input
            className='w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
            placeholder='Username'
            value={profile.username}
            onChange={(e) =>
              setProfile((s) => ({ ...s, username: e.target.value }))
            }
            disabled={isPending}
          />

          <input
            className='w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
            placeholder='Full name'
            value={profile.fullName}
            onChange={(e) =>
              setProfile((s) => ({ ...s, fullName: e.target.value }))
            }
            disabled={isPending}
          />

          <div className='space-y-3'>
            <div>
              <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                Choose your avatar style
              </p>
              <p className='text-xs text-slate-500 dark:text-slate-400'>
                Pick avatar style that best represents you.
              </p>
            </div>

            {/* CHANGED: avatar style grid remains responsive on mobile. */}
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              {AVATAR_STYLES.map((style) => {
                const selected = profile.avatarStyle === style
                const url = buildDiceBearAvatar(style, avatarSeed)

                return (
                  <button
                    key={style}
                    type='button'
                    disabled={isPending}
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        avatarStyle: style,
                        avatar: url,
                      }))
                    }
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900 dark:border-white dark:bg-slate-700 dark:ring-white'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                    } disabled:opacity-60`}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='relative h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'>
                        <Image
                          src={url}
                          alt={style}
                          fill
                          sizes='56px'
                          unoptimized
                          className='object-cover'
                        />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                          {style}
                        </p>
                        <p className='text-xs text-slate-500 dark:text-slate-400'>
                          {selected ? 'Selected' : 'Click to choose'}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className='rounded-lg border border-slate-200 p-3 dark:border-slate-700'>
            <p className='mb-2 text-sm font-medium text-slate-700 dark:text-slate-300'>
              Selected avatar preview
            </p>
            <div className='relative h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'>
              <Image
                src={previewAvatar}
                alt='Selected avatar'
                fill
                sizes='112px'
                unoptimized
                className='object-cover'
              />
            </div>
          </div>

          <button
            type='submit'
            className='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60'
            disabled={isPending}
          >
            Save profile
          </button>
        </form>
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
          Reset password
        </h2>

        <form
          className='mt-4 space-y-3'
          onSubmit={(e) => {
            e.preventDefault()

            startTransition(async () => {
              try {
                await changePassword({
                  userId,
                  oldPassword: passwordForm.oldPassword,
                  newPassword: passwordForm.newPassword,
                  confirmNewPassword: passwordForm.confirmNewPassword,
                })

                setPasswordForm({
                  oldPassword: '',
                  newPassword: '',
                  confirmNewPassword: '',
                })

                toast.success('Password updated successfully')
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : 'Failed to update password',
                )
              }
            })
          }}
        >
          <input
            className='w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
            type='password'
            placeholder='Old password'
            value={passwordForm.oldPassword}
            onChange={(e) =>
              setPasswordForm((s) => ({ ...s, oldPassword: e.target.value }))
            }
            required
            disabled={isPending}
          />
          <input
            className='w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
            type='password'
            placeholder='New password'
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((s) => ({ ...s, newPassword: e.target.value }))
            }
            required
            disabled={isPending}
          />
          <input
            className='w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
            type='password'
            placeholder='Confirm new password'
            value={passwordForm.confirmNewPassword}
            onChange={(e) =>
              setPasswordForm((s) => ({
                ...s,
                confirmNewPassword: e.target.value,
              }))
            }
            required
            disabled={isPending}
          />

          <button
            type='submit'
            className='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60'
            disabled={isPending}
          >
            Update password
          </button>
        </form>
      </section>

      <section className='rounded-xl border border-red-200 bg-white p-4 shadow-sm dark:border-red-700 dark:bg-slate-800 sm:p-6'>
        <h2 className='text-lg font-semibold text-red-700 dark:text-red-500'>
          Danger zone
        </h2>

        <div className='mt-4 space-y-4'>
          <button
            type='button'
            className='rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-500 dark:hover:bg-red-950 disabled:opacity-60'
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await resetUserData(userId)
                  toast.success('Data reset completed')
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : 'Failed to reset data',
                  )
                }
              })
            }}
          >
            Reset data
          </button>

          <div className='rounded-md border border-red-300 p-3 dark:border-red-700'>
            <p className='text-sm font-medium text-red-700 dark:text-red-500'>
              Type <span className='font-bold'>DELETE</span> to confirm
              permanent account deletion.
            </p>

            <input
              className='mt-3 w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
              placeholder='Type DELETE'
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={isPending}
            />

            <button
              type='button'
              className='mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-60'
              disabled={isPending || !canDelete}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await deleteUserAccount(userId)
                    toast.success('Account deleted')
                    await signOut({ callbackUrl: '/' })
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : 'Failed to delete account',
                    )
                  }
                })
              }}
            >
              Delete account permanently
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
