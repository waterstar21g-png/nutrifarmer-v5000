import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts, getFeaturedImageUrl } from '@/lib/wordpress';
import { GalleryGrid } from '@/components/GalleryGrid';
import { HeroSlider } from '@/components/HeroSlider';

export const metadata: Metadata = {
  title: '탁월한 찬사 — 개인 홈페이지형 블로그',
  description: '일상, 가족, 자료, 프로그램, 수익 — 삶의 기록을 한곳에 모은 개인 홈페이지형 블로그',
};

const SHOWCASE_CATS = [
  { slug: 'daily-life',       name: '일상 기록',   desc: '매일의 소소한 이야기',          icon: '📔' },
  { slug: 'family-growth',    name: '가족·성장',   desc: '자녀·손자 성장 기록',            icon: '🏡' },
  { slug: 'personal-archive', name: '개인 자료',   desc: '개인 자료 보관함',               icon: '📁' },
  { slug: 'archive-dev',      name: '프로그램',    desc: '프로그램 구축 자료',             icon: '💻' },
  { slug: 'life-photos',      name: '삶·사진',     desc: '삶의 기록과 사진',              icon: '📷' },
  { slug: 'revenue',          name: '수익관리',    desc: '수익 기록·분석',                 icon: '💰' },
  { slug: 'pro-writing',      name: '전문 글쓰기', desc: '전문적인 글과 칼럼',             icon: '✍️' },
  { slug: 'fresh-news',       name: '주변 이야기', desc: '주변 사람들의 신선한 이야기',    icon: '📰' },
];

const ABOUT_ITEMS = [
  { slug: 'about-memoir',     name: '추억하며',     desc: '삶의 추억과 회고',        icon: '🕯️' },
  { slug: 'about-program',    name: '프로그램 기록', desc: '개발 기록과 성장 노트',   icon: '💡' },
  { slug: 'personal-archive', name: '개인 자료',    desc: '개인 자료 보관함',        icon: '📁' },
  { slug: 'revenue',          name: '수익 관리',    desc: '수익 기록·분석',          icon: '📊' },
];

const FAMILY_ITEMS = [
  { slug: 'family-grandson',  name: '손자 성장일기', desc: '손자들의 성장 기록',   icon: '👶' },
  { slug: 'family-children',  name: '자녀 이야기',   desc: '자녀들의 따뜻한 이야기', icon: '👨‍👧' },
  { slug: 'family-photos',    name: '가족 사진',     desc: '소중한 가족의 순간',   icon: '📸' },
  { slug: 'family-special',   name: '특별한 날',     desc: '특별한 날의 기록',     icon: '🎉' },
];

const STATS = [
  { num: '8+', label: '콘텐츠 카테고리' },
  { num: '365', label: '일상 기록 가능일' },
  { num: '∞', label: '가족·삶의 추억' },
  { num: '4', label: '일상·가족·성장·나눔' },
];

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

      {/* ② 통계 카운터 */}
      <div className="nf-stats">
        <div className="nf-stats__inner">
          {STATS.map(s => (
            <div key={s.label} className="nf-stat">
              <div className="nf-stat__num">{s.num}</div>
              <div className="nf-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

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
