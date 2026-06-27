'use client';

import { GalleryGrid } from '@/components/GalleryGrid';
import type { PreviewPost } from '@/lib/home-posts';

interface Props {
  posts: PreviewPost[];
  topicLabel?: string;
  topicPosts?: PreviewPost[];
}

function toGalleryItems(posts: PreviewPost[]) {
  return posts.map(p => ({
    post: {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      date: new Date().toISOString(),
    },
    categorySlug: p.categorySlug,
    categoryName: p.categoryName,
    imageUrl: p.imageUrl,
    pid: p.pid ?? p.id,
  }));
}

export function LatestPostsSection({ posts, topicLabel, topicPosts = [] }: Props) {
  const galleryItems = toGalleryItems(posts);
  const topicItems = toGalleryItems(topicPosts);

  return (
    <>
      {galleryItems.length > 0 && (
        <GalleryGrid items={galleryItems} fourCol />
      )}

      {topicItems.length > 0 && topicLabel && (
        <>
          <p className="nf-feature__desc" style={{ marginTop: '2rem' }}>{topicLabel}</p>
          <GalleryGrid items={topicItems} fourCol />
        </>
      )}
    </>
  );
}
