import { HomeCarousel } from '@/components/shared/home/home-carousel'
import data from '@/lib/data'

export default async function Page() {
  return (
    <section className='space-y-8'>
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6'>
        <HomeCarousel items={data.carousels} />
      </div>
    </section>
  )
}
