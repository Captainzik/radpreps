import Link from 'next/link'
import { notFound } from 'next/navigation'
import { User } from '@/lib/db/models/user.model'
import EditUserForm from '@/components/admin/forms/edit-user-form'

type PageProps = {
  params: Promise<{ id: string }>
}

type UserRole = 'user' | 'admin' | 'moderator'

type EditableUser = {
  _id: { toString(): string }
  email: string
  username?: string
  fullName?: string
  avatar?: string
  role: UserRole
  isVerified: boolean
}

export default async function EditAdminUserPage({ params }: PageProps) {
  const { id } = await params

  const user = (await User.findById(id)
    .select('_id email username fullName avatar role isVerified')
    .lean()) as EditableUser | null

  if (!user) notFound()

  return (
    <main className='space-y-4'>
      <div className='flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm'>
        <h1 className='text-xl font-semibold'>Edit User</h1>
        <Link href='/admin/users' className='rounded border px-3 py-1 text-sm'>
          Back
        </Link>
      </div>

      <EditUserForm
        userId={user._id.toString()}
        initialEmail={user.email}
        initialUsername={user.username ?? ''}
        initialFullName={user.fullName ?? ''}
        initialAvatar={user.avatar ?? ''}
        initialRole={user.role}
        initialIsVerified={user.isVerified}
      />
    </main>
  )
}
