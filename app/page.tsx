import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts, getCategories, getFeaturedImageUrl } from '@/lib/wordpress';
import { GalleryGrid } from '@/components/GalleryGrid';

export const metadata: Metadata = {
  title: '탁월한 찬사 — 일상, 가족, 자료, 프로그램, 수익',
  description: '기록에서 수익으로 블로그를 확장하다',
};

export default async function HomePage() {
  const [{ posts }, categories] = await Promise.all([
    getPosts({ perPage: 12, embed: true }),
    getCategories(true),
  ]);

  const mainCats = categories.filter(c => c.count > 0 && c.parent === 0).slice(0, 8);

  const galleryItems = posts.map(post => {
    const cat = (post._embedded?.['wp:term']?.[0]?.[0]);
    return {
      post,
      categorySlug: cat?.slug ?? 'uncategorized',
      categoryName: cat?.name,
      imageUrl: getFeaturedImageUrl(post) || null,
    };
  });

  return (
    <>
      {/* 히어로 */}
      <section className="nf-hero">
        <div className="nf-hero__inner">
          <h1 className="nf-hero__title">
            기록에서 수익으로,<br />블로그를 확장하다
          </h1>
          <p className="nf-hero__desc">
            전문 글쓰기, 자료 공유, 주변 뉴스 큐레이션으로<br />
            개인 브랜드를 키우고 수익 창출까지 이어갑니다.
          </p>
          <div className="nf-hero__btns">
            <Link href="/write" className="nf-hero__btn nf-hero__btn--primary">글쓰기 시작</Link>
            <Link href="/about" className="nf-hero__btn nf-hero__btn--ghost">블로그 소개</Link>
          </div>
        </div>
      </section>

      <div className="nf-home-shell">
        {/* 카테고리 칩 */}
        <div className="nf-cat-chips">
          {mainCats.map(cat => (
            <Link key={cat.id} href={`/${cat.slug}`} className="nf-cat-chip">
              {cat.name}
              <span className="nf-cat-chip__count">{cat.count}</span>
            </Link>
          ))}
        </div>

        {/* 갤러리 그리드 */}
        <section className="nf-section">
          <div className="nf-section__head">
            <div>
              <p className="nf-section__label">최신 글</p>
              <h2 className="nf-section__title">방금 올린 이야기들</h2>
            </div>
          </div>
          <GalleryGrid items={galleryItems} />
        </section>
      </div>
    </>
  );
}
