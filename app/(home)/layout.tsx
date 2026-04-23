import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>
        {/* CHANGED: inner page padding scales down on mobile and grows on larger screens. */}
        <div className='mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
