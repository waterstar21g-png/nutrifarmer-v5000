'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WPCategory } from '@/lib/wordpress';
import { SHOWCASE_CATS } from '@/lib/site-data';

/* 네비게이션 고정 8개 카테고리 (WordPress 실제 여부와 무관하게 항상 이 순서로 표시) */
const NAV_CATS = SHOWCASE_CATS.map(c => ({
  id:    c.slug,
  name:  c.name,
  slug:  c.slug,
  count: 1,
  parent: 0,
}));

interface Props { categories: WPCategory[]; activeSlug?: string; }

export function SiteHeader({ categories: _wpCats, activeSlug }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  /* WP 카테고리는 무시하고 site-data 고정 8개 사용 */
  const mainCats = NAV_CATS;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/?s=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      {/* 탑바 */}
      <div className="nf-top-bar">
        <div className="nf-top-bar__inner">
          <span className="nf-top-bar__tagline">
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            삶의 기록, 따뜻한 이야기
          </span>
          <span className="nf-top-bar__links">일상 · 가족 · 성장 · 나눔</span>
          <div className="nf-top-bar__social">
            <a href="#" aria-label="유튜브">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0f2744" />
              </svg>
              <span>YouTube</span>
            </a>
            <a href="#" aria-label="인스타그램">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="#0f2744" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>

      {/* 네비바 */}
      <nav className="nf-nav-bar" aria-label="주요 내비게이션">
        <div className="nf-nav-bar__inner">
          <Link href="/" className="nf-nav-bar__brand">
            <span className="nf-nav-bar__brand-name">탁월한 찬사</span>
            <span className="nf-nav-bar__brand-sub">개인 홈페이지형 블로그 v5000</span>
          </Link>

          <div className="nf-nav-bar__cats">
            {mainCats.slice(0, 9).map(cat => (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className={`nf-nav-bar__cat${activeSlug === cat.slug ? ' is-active' : ''}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <input
              className="nf-nav-bar__search-input"
              type="search"
              placeholder="검색..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="검색"
            />
          </form>

          <Link href="/write" className="nf-nav-bar__write">글쓰기</Link>

          <button
            className="nf-nav-bar__hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div style={{ background: '#f8fafc', borderTop: '1px solid #dce5ef', padding: '0.5rem 1.25rem 1rem' }}>
            {mainCats.map(cat => (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.5rem', borderBottom: '1px solid #edf2f7', color: '#0f2744', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}
              >
                <span>{cat.name}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{cat.count}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
