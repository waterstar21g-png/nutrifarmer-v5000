'use client';

import { useEffect, useState } from 'react';
import type { PreviewPost } from '@/lib/home-posts';

import { closeHomePreview, subscribeHomePreview, type PreviewZone } from '@/lib/home-preview-bus';

import { CategoryPreviewPanel } from './CategoryPreviewPanel';



interface Props {

  zone: PreviewZone;

  postsBySlug: Record<string, PreviewPost[]>;

  catNames: Record<string, string>;

}



export function PreviewZoneArea({ zone, postsBySlug, catNames }: Props) {

  const [activeSlug, setActiveSlug] = useState<string | null>(null);



  useEffect(() => subscribeHomePreview(s => {

    if (s.zone === zone) setActiveSlug(s.slug);

    else if (s.zone === null) setActiveSlug(null);

  }), [zone]);



  if (!activeSlug) return null;



  const posts = postsBySlug[activeSlug] ?? [];



  return (

    <div className="nf-preview-area-host">

      <CategoryPreviewPanel

        catName={catNames[activeSlug] ?? activeSlug}

        catSlug={activeSlug}

        posts={posts}

        onClose={() => closeHomePreview(zone)}

      />

    </div>

  );

}