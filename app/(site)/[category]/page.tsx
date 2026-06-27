import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PostContentImage } from '@/components/PostContentImage';
import { ALL_CATEGORY_SLUGS } from '@/lib/site-data';
import {
  getCategoryGallery,
  getSidebarPosts,
  galleryItemToGrid,
} from '@/lib/site-content';
import { getSiteCategory } from '@/lib/v5000-content/public-posts';
import { Suspense } from 'react';
import { GalleryGrid } from '@/components/GalleryGrid';
import { SidebarSearch } from '@/components/SidebarSearch';

export const dynamic = 'force-dynamic';

const PER_PAGE = 8;

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export function generateStaticParams() {
  return ALL_CATEGORY_SLUGS.map(category => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getSiteCategory(category);
  if (!cat) return {};
  return {
    title: cat.name,
    description: cat.desc ?? `${cat.name} 카테고리 포스트 목록`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));

  const cat = getSiteCategory(category);
  if (!cat) notFound();

  const [{ items, total, totalPages }, sidebarPosts] = await Promise.all([
    getCategoryGallery(category, page, PER_PAGE),
    getSidebarPosts(category),
  ]);

  if (total === 0) notFound();

  const galleryItems = items.map(galleryItemToGrid);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const basePath = `/${category}`;

  const firstImageUrl = galleryItems.find(g => g.imageUrl)?.imageUrl ?? null;

  return (
    <>
      <div className="nf-page-banner">
        <h1 className="nf-page-banner__title">{cat.name}</h1>
        <p className="nf-page-banner__count">총 {total}개 글</p>
      </div>

      <div className="nf-cat-single-wrap">
        <main className="nf-cat-single-main">
          <div className="nf-cat-single-hero">
            {firstImageUrl ? (
              <PostContentImage
                src={firstImageUrl}
                alt={`${cat.name} 대표 이미지`}
                fill
                priority
              />
            ) : (
              <div className="nf-cat-single-hero--empty">
                <span aria-hidden="true">📷</span>
                <p>대표 이미지 없음</p>
              </div>
            )}
          </div>
          <p className="nf-cat-single-desc">
            {cat.desc || `${cat.name} 카테고리의 최신 글을 확인하세요.`}
          </p>
        </main>

        <Suspense fallback={null}>
          <SidebarSearch
            posts={sidebarPosts}
            catSlug={category}
            catName={cat.name}
            currentSlug={items[0]?.post.slug ?? ''}
          />
        </Suspense>
      </div>

      <div className="nf-archive-shell">
        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '4rem', fontSize: '0.9rem' }}>
            포스트가 없습니다.
          </p>
        ) : (
          <div className="nf-archive-gallery-wrap">
            <GalleryGrid items={galleryItems} fourCol />

            {totalPages > 1 && (
              <>
                {hasPrev ? (
                  <Link
                    href={`${basePath}?page=${page - 1}`}
                    className="nf-cat-nav__arrow nf-cat-nav__arrow--prev"
                    aria-label={`이전 페이지 (${page - 1}/${totalPages})`}
                  >
                    <span className="nf-cat-nav__circle">‹</span>
                    <span className="nf-cat-nav__label">이전</span>
                  </Link>
                ) : (
                  <span className="nf-cat-nav__arrow nf-cat-nav__arrow--prev nf-cat-nav__arrow--disabled" aria-hidden="true" />
                )}

                {hasNext ? (
                  <Link
                    href={`${basePath}?page=${page + 1}`}
                    className="nf-cat-nav__arrow nf-cat-nav__arrow--next"
                    aria-label={`다음 페이지 (${page + 1}/${totalPages})`}
                  >
                    <span className="nf-cat-nav__circle">›</span>
                    <span className="nf-cat-nav__label">다음</span>
                  </Link>
                ) : (
                  <span className="nf-cat-nav__arrow nf-cat-nav__arrow--disabled" aria-hidden="true" />
                )}
              </>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="nf-cat-nav">
            <span className="nf-cat-nav__info">{page} / {totalPages} 페이지</span>
          </div>
        )}
      </div>
    </>
  );
}
