import type { Metadata } from 'next';
import { SHOWCASE_CATS } from '@/lib/site-data';
import {
  getPreviewPostsBySlugs,
  getLatestPreviewPosts,
  searchPreviewPosts,
} from '@/lib/home-posts';
import { previewToGridItem } from '@/lib/site-content';
import { HomeHeroBlock } from '@/components/HomeHeroBlock';
import { PreviewCardGrid } from '@/components/PreviewCardGrid';
import { HomeBottomSections } from '@/components/HomeBottomSections';
import { GalleryGrid } from '@/components/GalleryGrid';
import { HomePreviewData } from '@/components/home/HomePreviewProvider';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '탁월한 찬사 — 개인 홈페이지형 블로그',
  description: '일상, 가족, 자료, 프로그램, 수익 — 삶의 기록을 한곳에 모은 개인 홈페이지형 블로그',
};

const PREVIEW_SLUGS = [
  ...SHOWCASE_CATS.map(c => c.slug),
  'about-memoir', 'about-program', 'personal-archive', 'revenue',
  'family-grandson', 'family-children', 'family-photos', 'family-special',
];

interface Props {
  searchParams: Promise<{ s?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const { s } = await searchParams;
  const query = s?.trim();

  if (query) {
    const previews = await searchPreviewPosts(query, 12);
    const items = previews.map(previewToGridItem);

    return (
      <div className="nf-search-page">
        <div className="nf-archive-banner">
          <p className="nf-archive-banner__label">검색</p>
          <h1 className="nf-archive-banner__title">&quot;{query}&quot; 검색 결과</h1>
          <p className="nf-archive-banner__count">{previews.length}건</p>
        </div>
        <div className="nf-archive-shell" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
          {items.length > 0 ? (
            <GalleryGrid items={items} showCategory />
          ) : (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
              검색 결과가 없습니다.
            </p>
          )}
        </div>
      </div>
    );
  }

  const [postsBySlug, latestPosts, topicPosts, heroPostsRaw] = await Promise.all([
    getPreviewPostsBySlugs(PREVIEW_SLUGS, 16),
    getLatestPreviewPosts(6),
    getPreviewPostsBySlugs(['about-program'], 4).then(
      m => m['about-program'] ?? [],
    ),
    getPreviewPostsBySlugs(SHOWCASE_CATS.map(c => c.slug), 1),
  ]);

  const heroPosts = Object.fromEntries(
    SHOWCASE_CATS.map(c => [c.slug, heroPostsRaw[c.slug]?.[0] ?? null]),
  ) as Record<string, import('@/lib/home-posts').PreviewPost | null>;

  const topicLabel = topicPosts.length > 0 ? '프로그램 기록 · 주제 선택' : undefined;

  return (
    <>
      <HomePreviewData postsBySlug={postsBySlug} />

      <HomeHeroBlock heroPosts={heroPosts} />

      <section id="nf-showcase" className="nf-showcase">
        <div className="nf-showcase__inner">
          <div className="nf-showcase__head">
            <span className="nf-showcase__label">이미지형 카테고리</span>
            <h2 className="nf-showcase__title">8가지 콘텐츠 영역 — 클릭하여 미리보기</h2>
          </div>
          <PreviewCardGrid
            items={SHOWCASE_CATS}
            postsBySlug={postsBySlug}
            zone="showcase-r1"
            row2Zone="showcase-r2"
            splitRows
          />
        </div>
      </section>

      <HomeBottomSections
        postsBySlug={postsBySlug}
        latestPosts={latestPosts}
        topicLabel={topicLabel}
        topicPosts={topicPosts}
      />
    </>
  );
}
