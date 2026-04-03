'use client'

type Props = {
  onEdit: () => void
  onDelete: () => void
}

export default function AdminActions({ onEdit, onDelete }: Props) {
  return (
    <div className='flex items-center gap-2'>
      <button
        onClick={onEdit}
        className='rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50'
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className='rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50'
      >
        Delete
      </button>
    </div>
  )
}
