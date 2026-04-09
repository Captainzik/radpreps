import Link from 'next/link'
import CreateUserForm from '@/components/admin/forms/create-user-form'

export default function NewAdminUserPage() {
  return (
    <main className='space-y-4'>
      <div className='flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm'>
        <h1 className='text-xl font-semibold'>Create User</h1>
        <Link href='/admin/users' className='rounded border px-3 py-1 text-sm'>
          Back
        </Link>
      </div>

      <CreateUserForm />
    </main>
  )
}
