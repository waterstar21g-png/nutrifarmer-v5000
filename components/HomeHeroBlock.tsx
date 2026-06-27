'use client';



import type { PreviewPost } from '@/lib/home-posts';

import { HeroSlider } from '@/components/HeroSlider';

import { StatsSection } from '@/components/StatsSection';



interface Props {

  heroPosts: Record<string, PreviewPost | null>;

}



export function HomeHeroBlock({ heroPosts }: Props) {

  return (

    <div className="nf-home-hero-block">

      <HeroSlider />

      <StatsSection heroPosts={heroPosts} />

    </div>

  );

}


