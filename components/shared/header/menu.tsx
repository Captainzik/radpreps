import { BookOpenCheck } from 'lucide-react'
import Link from 'next/link'

export default function Menu() {
  return (
    <div className='flex justify-end'>
      <nav className='flex gap-3 w-full'>
        <Link href='/login' className='flex items-center header-button'>
          Login
        </Link>

        <Link href='/quiz' className='header-button'>
          <div className='flex items-end'>
            <BookOpenCheck className='h-8 w-8' />
            Quiz
          </div>
        </Link>
      </nav>
    </div>
  )
}
