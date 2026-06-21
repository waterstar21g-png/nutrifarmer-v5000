import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts, getFeaturedImageUrl } from '@/lib/wordpress';
import { SHOWCASE_CATS, ABOUT_ITEMS, FAMILY_ITEMS } from '@/lib/site-data';
import { GalleryGrid } from '@/components/GalleryGrid';
import { HeroSlider } from '@/components/HeroSlider';
import { StatsSection } from '@/components/StatsSection';

export const metadata: Metadata = {
  title: '탁월한 찬사 — 개인 홈페이지형 블로그',
  description: '일상, 가족, 자료, 프로그램, 수익 — 삶의 기록을 한곳에 모은 개인 홈페이지형 블로그',
};


export default async function HomePage() {
  const { posts } = await getPosts({ perPage: 9, embed: true }).catch(
    () => ({ posts: [], total: 0, totalPages: 0 })
  );

  const galleryItems = posts.map(post => {
    const cat = post._embedded?.['wp:term']?.[0]?.[0];
    return {
      post,
      categorySlug: cat?.slug ?? 'uncategorized',
      categoryName: cat?.name,
      imageUrl: getFeaturedImageUrl(post) || null,
    };
  });

  return (
    <>
      {/* ① Hero 슬라이더 (3개) */}
      <HeroSlider />

      {/* ② 통계 카운터 (클릭시 8카드 표출) */}
      <StatsSection />

      {/* ③ 이미지형 카테고리 그리드 (shadcn/ui 카드 + hover zoom) */}
      <section className="nf-showcase">
        <div className="nf-showcase__inner">
          <div className="nf-showcase__head">
            <span className="nf-showcase__label">이미지형 카테고리</span>
            <h2 className="nf-showcase__title">8가지 콘텐츠 영역 — 클릭하여 미리보기</h2>
          </div>
          <div className="nf-showcase__grid">
            {SHOWCASE_CATS.map(cat => (
              <Link key={cat.slug} href={`/${cat.slug}`} className="nf-showcase__card">
                <span className="nf-showcase__icon">{cat.icon}</span>
                <span className="nf-showcase__name">{cat.name}</span>
                <span className="nf-showcase__desc">{cat.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ④ 나를 소개합니다 */}
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
              <Link key={`about-${item.slug}`} href={`/${item.slug}`} className="nf-feature__card">
                <span className="nf-feature__card-icon">{item.icon}</span>
                <span className="nf-feature__card-title">{item.name}</span>
                <span className="nf-feature__card-desc">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ⑤ 가족 앨범 */}
      <section className="nf-feature">
        <div className="nf-feature__inner">
          <div className="nf-feature__head">
            <span className="nf-feature__section-label">가족 앨범</span>
            <h2 className="nf-feature__title">자녀·손자들의 성장 기록</h2>
          </div>
          <div className="nf-feature__grid">
            {FAMILY_ITEMS.map(item => (
              <Link key={`family-${item.slug}`} href={`/${item.slug}`} className="nf-feature__card">
                <span className="nf-feature__card-icon">{item.icon}</span>
                <span className="nf-feature__card-title">{item.name}</span>
                <span className="nf-feature__card-desc">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ⑥ 최신 글 */}
      <section className="nf-feature nf-feature--alt" style={{ borderBottom: 'none' }}>
        <div className="nf-feature__inner">
          <div className="nf-feature__head">
            <span className="nf-feature__section-label">최신 글</span>
            <h2 className="nf-feature__title">방금 올린 이야기들</h2>
            <p className="nf-feature__desc">
              일상, 가족, 프로그램, 전문 글쓰기, 수익·뉴스 등<br />
              8개 카테고리에서 최신 글을 확인하세요.
            </p>
          </div>
          {galleryItems.length > 0 ? (
            <GalleryGrid items={galleryItems} />
          ) : (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem', fontSize: '0.9rem' }}>
              글을 불러오는 중입니다...
            </p>
          )}
        </div>
      </section>
    </>
  );
}
