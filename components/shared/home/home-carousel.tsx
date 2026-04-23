'use client'

import * as React from 'react'
import Image from 'next/image'
import Autoplay from 'embla-carousel-autoplay'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type HomeCarouselItem = {
  image: string
  url: string
  title: string
  buttonCaption: string
}

export function HomeCarousel({ items }: { items: HomeCarouselItem[] }) {
  const plugin = React.useRef(
    Autoplay({ delay: 3500, stopOnInteraction: true, stopOnMouseEnter: true }),
  )

  return (
    <Carousel dir='ltr' plugins={[plugin.current]} className='mx-auto w-full'>
      <CarouselContent>
        {items.map((item) => (
          <CarouselItem key={item.title}>
            <Link href={item.url} className='block'>
              <div className='relative aspect-video overflow-hidden rounded-xl bg-slate-100 shadow-sm dark:bg-slate-900'>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className='object-cover'
                  priority
                />

                <div className='absolute inset-0 bg-linear-to-r from-black/65 via-black/30 to-transparent' />

                <div className='absolute left-4 top-1/2 w-[80%] -translate-y-1/2 sm:left-8 sm:w-[55%] lg:left-12 lg:w-[42%]'>
                  <h2 className='text-xl font-bold leading-tight text-white sm:text-3xl lg:text-5xl'>
                    {item.title}
                  </h2>
                  <Button className='mt-3 h-8 px-3 text-xs sm:mt-4 sm:h-9 sm:px-4 sm:text-sm'>
                    {item.buttonCaption}
                  </Button>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className='left-2 top-1/2 -translate-y-1/2 md:left-4' />
      <CarouselNext className='right-2 top-1/2 -translate-y-1/2 md:right-4' />
    </Carousel>
  )
}
