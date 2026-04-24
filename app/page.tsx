import Link from 'next/link'
import data from '@/lib/data'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import Footer from '@/components/shared/footer'

export default function HomePage() {
  const carouselItems = data.carousels
    .filter((item) => item.isPublished)
    .map((item) => ({
      image: item.image,
      url: item.url,
      title: item.title,
      buttonCaption: item.buttonCaption,
    }))

  return (
    <section className='space-y-6 sm:space-y-8'>
      {/* CHANGED: hero card now uses smaller padding on mobile and scales up on larger screens. */}
      <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8'>
        <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>
          RadPreps - Gamified Exam Preparation and Continuous Learning
        </h1>
        <p className='mt-3 max-w-2xl text-slate-600 dark:text-slate-300'>
          Practice over 10k Registry Standard Questions for ARDMS, CAMRT,
          Sonography Canada, ARRT, CCI and our Fun-curated CPD.
        </p>

        {/* CHANGED: action buttons wrap naturally on narrow screens and keep full tap targets. */}
        <div className='mt-6 flex flex-wrap gap-3'>
          <Link
            href='/quiz'
            className='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
          >
            CAMRT
          </Link>
          <Link
            href='/quiz'
            className='rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
          >
            ARDMS
          </Link>
          <Link
            href='/quiz'
            className='rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
          >
            Sonography Canada
          </Link>
        </div>
      </div>

      <HomeCarousel items={carouselItems} />
      <Footer />
    </section>
  )
}
