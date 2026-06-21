import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPosts, getCategoryBySlug, getCategories,
  getFeaturedImageUrl,
} from '@/lib/wordpress';
import { ABOUT_ITEMS, FAMILY_ITEMS } from '@/lib/site-data';
import { GalleryGrid } from '@/components/GalleryGrid';
import { CategorySearch } from '@/components/CategorySearch';

const PER_PAGE = 8;

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const cats = await getCategories(true);
  return cats
    .filter(c => c.slug !== 'uncategorized')
    .map(c => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return {};
  return {
    title: cat.name,
    description: cat.description || `${cat.name} 카테고리 포스트 목록`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));

  const cat = await getCategoryBySlug(category);
  if (!cat || cat.count === 0) notFound();

  const [{ posts, total, totalPages }, { posts: latestPosts }, { posts: allCatPosts }] = await Promise.all([
    getPosts({ page, perPage: PER_PAGE, categoryId: cat.id, embed: true }),
    getPosts({ perPage: 9, embed: true }),
    getPosts({ page: 1, perPage: 100, categoryId: cat.id, embed: true }),
  ]);

  const searchItems = allCatPosts.map(post => ({
    id: post.id,
    slug: post.slug,
    title: post.title.rendered.replace(/<[^>]+>/g, ''),
    imageUrl: getFeaturedImageUrl(post) || null,
  }));

  const galleryItems = posts.map(post => ({
    post,
    categorySlug: category,
    categoryName: cat.name,
    imageUrl: getFeaturedImageUrl(post) || null,
  }));

  const latestItems = latestPosts.map(post => {
    const c = post._embedded?.['wp:term']?.[0]?.[0];
    return {
      post,
      categorySlug: c?.slug ?? 'uncategorized',
      categoryName: c?.name,
      imageUrl: getFeaturedImageUrl(post) || null,
    };
  });

  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const basePath = `/${category}`;

  return (
    <>
      {/* 카테고리 배너 */}
      <div className="nf-archive-banner">
        <p className="nf-archive-banner__label">카테고리</p>
        <h1 className="nf-archive-banner__title">{cat.name}</h1>
        {cat.description && (
          <p style={{ margin: '0 0 0.4rem', opacity: 0.82, fontSize: '0.9rem', fontWeight: 500 }}>
            {cat.description}
          </p>
        )}
        <p className="nf-archive-banner__count">총 {total}개 글</p>
      </div>

      {/* 카테고리 내 검색 → 단일글 이동 */}
      <div className="nf-archive-shell" style={{ paddingTop: '1.5rem' }}>
        <CategorySearch posts={searchItems} catSlug={category} catName={cat.name} />
      </div>

      {/* 8카드 그리드 (4×2) */}
      <div className="nf-archive-shell">
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '4rem', fontSize: '0.9rem' }}>
            포스트가 없습니다.
          </p>
        ) : (
          <GalleryGrid items={galleryItems} fourCol />
        )}

        {/* 전체 창 좌우 끝 고정 화살표 */}
        {totalPages > 1 && (
          <>
            {/* 왼쪽 끝 — 이전 */}
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

            {/* 하단 중앙 페이지 정보 */}
            <div className="nf-cat-nav">
              <span className="nf-cat-nav__info">{page} / {totalPages} 페이지</span>
            </div>

            {/* 오른쪽 끝 — 다음 */}
            {hasNext ? (
              <Link
                href={`${basePath}?page=${page + 1}`}
                className="nf-cat-nav__arrow"
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

      {/* ③ 나를 소개합니다 */}
      <section className="nf-feature nf-feature--alt">
        <div className="nf-feature__inner">
          <div className="nf-feature__head">
            <span className="nf-feature__section-label">나를 소개합니다</span>
            <h2 className="nf-feature__title">기록하는 삶, 나누는 이야기</h2>
            <p className="nf-feature__desc">
              이 블로그는 개인 홈페이지이자 삶의 아카이브입니다.<br />
              추억, 프로그램, 자료, 수익까지 — 시간이 지나도 다시 꺼내볼 수 있는 기록을 담습니다.
            </p>
          </div>
          <div className="nf-feature__grid">
            {ABOUT_ITEMS.map(item => (
              <Link key={item.slug + item.name} href={`/${item.slug}`} className="nf-feature__card">
                <span className="nf-feature__card-icon">{item.icon}</span>
                <span className="nf-feature__card-title">{item.name}</span>
                <span className="nf-feature__card-desc">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ④ 가족 앨범 */}
      <section className="nf-feature">
        <div className="nf-feature__inner">
          <div className="nf-feature__head">
            <span className="nf-feature__section-label">가족 앨범</span>
            <h2 className="nf-feature__title">자녀·손자들의 성장 기록</h2>
          </div>
          <div className="nf-feature__grid">
            {FAMILY_ITEMS.map(item => (
              <Link key={item.slug} href={`/${item.slug}`} className="nf-feature__card">
                <span className="nf-feature__card-icon">{item.icon}</span>
                <span className="nf-feature__card-title">{item.name}</span>
                <span className="nf-feature__card-desc">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ⑤ 최신 글 */}
      <section className="nf-feature nf-feature--alt" style={{ borderBottom: 'none' }}>
        <div className="nf-feature__inner">
          <div className="nf-feature__head">
            <span className="nf-feature__section-label">최신 글</span>
            <h2 className="nf-feature__title">방금 올린 이야기들</h2>
          </div>
          <GalleryGrid items={latestItems} />
        </div>
      </section>
    </>
  );
}
