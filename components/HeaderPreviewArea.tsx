'use client';

import { useEffect, useState } from 'react';
import { SHOWCASE_CATS } from '@/lib/site-data';
import { subscribeHomePreview } from '@/lib/home-preview-bus';
import { useHomePreviewPosts } from '@/components/home/HomePreviewProvider';
import { PreviewZoneArea } from '@/components/PreviewZoneArea';

const CAT_NAMES = Object.fromEntries(SHOWCASE_CATS.map(c => [c.slug, c.name]));

export function HeaderPreviewArea() {
  const { postsBySlug } = useHomePreviewPosts();
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeHomePreview(s => {
    setOpen(s.zone === 'header' && !!s.slug);
  }), []);

  if (!open) return null;

  return (
    <div className="nf-top-preview-area" id="nf-top-preview-area">
      <PreviewZoneArea zone="header" postsBySlug={postsBySlug} catNames={CAT_NAMES} />
    </div>
  );
}