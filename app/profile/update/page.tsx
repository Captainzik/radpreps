'use client'

import { useState, useTransition } from 'react'
import { signOut, useSession } from 'next-auth/react'
import {
  updateProfile,
  changePassword,
  resetUserData,
  deleteUserAccount,
} from '@/lib/actions/user.actions'

export default function UpdateProfilePage() {
  const { data: session } = useSession()

  const [profile, setProfile] = useState({
    email: session?.user?.email ?? '',
    username: '',
    fullName: session?.user?.name ?? '',
    avatar: session?.user?.image ?? '',
  })

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  const [message, setMessage] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  if (!session?.user?.id) {
    return (
      <main className='mx-auto max-w-xl px-4 py-8'>
        <p className='text-sm text-slate-600'>
          Please sign in to update profile.
        </p>
      </main>
    )
  }

  return (
    <main className='space-y-6'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Update Profile</h1>
        <p className='mt-1 text-sm text-slate-600'>
          Update account details and security options.
        </p>
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900'>Profile info</h2>

        <form
          className='mt-4 space-y-3'
          onSubmit={(e) => {
            e.preventDefault()
            setMessage('')

            startTransition(async () => {
              try {
                const res = await updateProfile({
                  userId: session.user.id,
                  email: profile.email,
                  username: profile.username,
                  fullName: profile.fullName,
                  avatar: profile.avatar,
                })
                if (res.success) setMessage('Profile updated successfully.')
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : 'Failed to update profile',
                )
              }
            })
          }}
        >
          <input
            className='w-full rounded border p-2'
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
            className='w-full rounded border p-2'
            placeholder='Username'
            value={profile.username}
            onChange={(e) =>
              setProfile((s) => ({ ...s, username: e.target.value }))
            }
            disabled={isPending}
          />
          <input
            className='w-full rounded border p-2'
            placeholder='Full name'
            value={profile.fullName}
            onChange={(e) =>
              setProfile((s) => ({ ...s, fullName: e.target.value }))
            }
            disabled={isPending}
          />
          <input
            className='w-full rounded border p-2'
            placeholder='Avatar URL'
            value={profile.avatar}
            onChange={(e) =>
              setProfile((s) => ({ ...s, avatar: e.target.value }))
            }
            disabled={isPending}
          />

          <button
            type='submit'
            className='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60'
            disabled={isPending}
          >
            Save profile
          </button>
        </form>
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900'>Reset password</h2>

        <form
          className='mt-4 space-y-3'
          onSubmit={(e) => {
            e.preventDefault()
            setMessage('')

            startTransition(async () => {
              try {
                await changePassword({
                  userId: session.user.id,
                  oldPassword: passwordForm.oldPassword,
                  newPassword: passwordForm.newPassword,
                  confirmNewPassword: passwordForm.confirmNewPassword,
                })
                setPasswordForm({
                  oldPassword: '',
                  newPassword: '',
                  confirmNewPassword: '',
                })
                setMessage('Password updated successfully.')
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : 'Failed to update password',
                )
              }
            })
          }}
        >
          <input
            className='w-full rounded border p-2'
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
            className='w-full rounded border p-2'
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
            className='w-full rounded border p-2'
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

      <section className='rounded-xl border border-red-200 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-red-700'>Danger zone</h2>
        <div className='mt-4 flex flex-wrap gap-2'>
          <button
            type='button'
            className='rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60'
            disabled={isPending}
            onClick={() => {
              setMessage('')
              startTransition(async () => {
                try {
                  await resetUserData(session.user.id)
                  setMessage('Data reset completed.')
                } catch (error) {
                  setMessage(
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

          <button
            type='button'
            className='rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60'
            disabled={isPending}
            onClick={() => {
              const ok = window.confirm(
                'Are you sure? This action permanently deletes your account.',
              )
              if (!ok) return

              setMessage('')
              startTransition(async () => {
                try {
                  await deleteUserAccount(session.user.id)
                  await signOut({ callbackUrl: '/' })
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : 'Failed to delete account',
                  )
                }
              })
            }}
          >
            Delete account
          </button>
        </div>
      </section>

      {message ? (
        <section className='rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700'>
          {message}
        </section>
      ) : null}
    </main>
  )
}
