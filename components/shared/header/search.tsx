import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { APP_NAME } from '@/lib/constants'

const categories = ['ARDMS', 'Sonography Canada', 'CAMRT', 'ARRT', 'CPD']

export default function Search() {
  return (
    // CHANGED: search now fits mobile width better and keeps theme-aware colors.
    <form
      action='/search'
      method='GET'
      className='flex h-10 w-full items-stretch rounded-md'
      role='search'
      aria-label='Site search'
    >
      <Select name='category' defaultValue='all'>
        <SelectTrigger className='h-full w-24 rounded-r-none rounded-l-md border-r border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 sm:w-28'>
          <SelectValue placeholder='All' />
        </SelectTrigger>
        <SelectContent position='popper'>
          <SelectItem value='all'>All</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        className='h-full flex-1 rounded-none border-x-0 border-slate-300 bg-slate-100 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50'
        placeholder={`Search ${APP_NAME}`}
        name='q'
        type='search'
        autoComplete='off'
      />

      <button
        type='submit'
        className='h-full rounded-l-none rounded-r-md bg-slate-900 px-3 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
        aria-label='Submit search'
      >
        <SearchIcon className='h-5 w-5' />
      </button>
    </form>
  )
}
