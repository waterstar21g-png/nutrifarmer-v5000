'use client';

import { GalleryGrid } from '@/components/GalleryGrid';
import type { PreviewPost } from '@/lib/home-posts';

interface Props {
  posts: PreviewPost[];
  topicPosts?: PreviewPost[];
}

const SECTION_DESC = (
  <>
    일상, 가족, 프로그램, 전문 글쓰기, 수익·뉴스 등
    <br />
    8개 카테고리에서 최신 글을 확인하세요.
  </>
);

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

export function LatestPostsSection({ posts, topicPosts = [] }: Props) {
  const galleryItems = toGalleryItems(posts);
  const topicItems = toGalleryItems(topicPosts);

  return (
    <>
      {galleryItems.length > 0 && (
        <GalleryGrid items={galleryItems} fourCol className="nf-home-latest-cards" />
      )}

      {topicItems.length > 0 && (
        <>
          <div className="nf-feature__head nf-feature__head--topic">
            <span className="nf-feature__section-label">프로그램 기록</span>
            <h2 className="nf-feature__title">주제 선택</h2>
            <p className="nf-feature__desc">{SECTION_DESC}</p>
          </div>
          <GalleryGrid items={topicItems} fourCol className="nf-home-latest-cards" />
        </>
      )}
    </>
  );
}
