import { HomeCarousel } from '@/components/shared/home/home-carousel'
import data from '@/lib/data'

export default async function Page() {
  return (
    <section className='space-y-6 sm:space-y-8'>
      {/* CHANGED: homepage card padding now shrinks on smaller devices. */}
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6 md:p-6'>
        <HomeCarousel items={data.carousels} />
      </div>
    </section>
  )
}
