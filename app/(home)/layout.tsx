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
        <div className='mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8'>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
