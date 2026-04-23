import Link from 'next/link'
import { Types } from 'mongoose'
import { User } from '@/lib/db/models/user.model'
import UserRoleForm from '@/components/admin/actions/user-role-form'
import UserRowActions from '@/components/admin/actions/user-row-actions'
import { connectToDatabase } from '@/lib/db'

type UserRole = 'user' | 'admin' | 'moderator'

type UserRow = {
  _id: Types.ObjectId
  email: string
  username?: string
  role: UserRole
  isVerified: boolean
}

export default async function AdminUsersPage() {
  await connectToDatabase()
  const users = (await User.find({})
    .sort({ createdAt: -1 })
    .select('email username role isVerified')
    .lean()) as UserRow[]

  return (
    <main className='space-y-4 sm:space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <h1 className='text-xl font-semibold text-slate-900 dark:text-white'>
          Manage Users
        </h1>
        <Link
          href='/admin/users/new'
          className='rounded-lg bg-slate-900 px-4 py-2 text-sm text-white'
        >
          + New User
        </Link>
      </div>

      {/* CHANGED: table remains scrollable on smaller screens. */}
      <div className='overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <table className='w-full min-w-56 text-sm'>
          <thead className='bg-slate-50 text-left dark:bg-slate-700'>
            <tr>
              <th className='p-3'>Email</th>
              <th className='p-3'>Username</th>
              <th className='p-3'>Role</th>
              <th className='p-3'>Verified</th>
              <th className='p-3'>Role Action</th>
              <th className='p-3'>CRUD Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u._id.toString()}
                className='border-t border-slate-100 dark:border-slate-700'
              >
                <td className='p-3 text-slate-900 dark:text-slate-100'>
                  {u.email}
                </td>
                <td className='p-3 text-slate-700 dark:text-slate-300'>
                  {u.username ?? '—'}
                </td>
                <td className='p-3 text-slate-700 dark:text-slate-300'>
                  {u.role}
                </td>
                <td className='p-3 text-slate-700 dark:text-slate-300'>
                  {u.isVerified ? 'Yes' : 'No'}
                </td>
                <td className='p-3'>
                  <UserRoleForm
                    userId={u._id.toString()}
                    initialRole={u.role}
                  />
                </td>
                <td className='p-3'>
                  <UserRowActions userId={u._id.toString()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
