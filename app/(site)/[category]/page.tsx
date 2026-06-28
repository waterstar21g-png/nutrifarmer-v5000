import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostContentImage } from '@/components/PostContentImage';
import { ALL_CATEGORY_SLUGS } from '@/lib/site-data';
import { getSidebarPosts } from '@/lib/site-content';
import { listPublishedByCategory } from '@/lib/v5000-content/posts';
import { getSiteCategory, firstImageFromBody } from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls } from '@/lib/v5000-content/media-mirror';
import { Suspense } from 'react';
import { SidebarSearch } from '@/components/SidebarSearch';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ category: string }>;
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
    description: cat.desc ?? `${cat.name} 카테고리`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  const cat = getSiteCategory(category);
  if (!cat) notFound();

  const [posts, sidebarPosts] = await Promise.all([
    listPublishedByCategory(category, 1),
    getSidebarPosts(category),
  ]);

  if (posts.length === 0) notFound();

  const latest = posts[0]!;
  const bodyHtml = await rewriteHtmlMediaUrls(latest.body);
  const firstImageUrl = firstImageFromBody(bodyHtml);

  return (
    <>
      <div className="nf-page-banner">
        <h1 className="nf-page-banner__title">{cat.name}</h1>
        <p className="nf-page-banner__count">총 {sidebarPosts.length}개 글</p>
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
            {cat.desc || `${cat.name} 카테고리의 글을 사이드바에서 선택하세요.`}
          </p>
        </main>

        <Suspense fallback={null}>
          <SidebarSearch
            posts={sidebarPosts}
            catSlug={category}
            catName={cat.name}
            currentSlug={latest.slug}
            currentPostId={latest.id}
          />
        </Suspense>
      </div>
    </>
  );
}
