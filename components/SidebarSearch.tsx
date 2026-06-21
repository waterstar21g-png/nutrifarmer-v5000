'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

interface SidebarPost {
  id: number;
  slug: string;
  title: { rendered: string };
}

interface Props {
  posts: SidebarPost[];
  catSlug: string;
  catName: string;
  currentSlug: string;
}

export function SidebarSearch({ posts, catSlug, catName, currentSlug }: Props) {
  const [query, setQuery] = useState('');

  const annotated = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.map(p => {
      const title = p.title.rendered.replace(/<[^>]+>/g, '');
      const match = q.length > 0 && title.toLowerCase().includes(q);
      return { ...p, title, match };
    });
  }, [posts, query]);

  const isSearching = query.trim().length > 0;
  const matchCount  = annotated.filter(p => p.match).length;

  return (
    <aside className="nf-sidebar">
      {/* 검색창 */}
      <div className="nf-sidebar__search">
        <input
          type="search"
          className="nf-sidebar__search-input"
          placeholder="검색..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="글 제목 검색"
          autoComplete="off"
        />
        <button
          className="nf-sidebar__search-btn"
          onClick={() => setQuery('')}
          aria-label={query ? '검색 초기화' : '검색'}
          title={query ? '초기화' : '검색'}
        >
          {query ? '✕' : '🔍'}
        </button>
      </div>

      {/* 카테고리 배지 (타원형) */}
      <Link href={`/${catSlug}`} className="nf-sidebar__cat-badge">
        {catName}
      </Link>

      {/* 검색 중 결과 수 표시 */}
      {isSearching && (
        <div className="nf-sidebar__search-info">
          {matchCount > 0 ? `${matchCount}개 일치` : '일치하는 글 없음'}
        </div>
      )}

      {/* 글 목록 — 검색어 입력시 역상(하이라이트) 처리 */}
      <ul className="nf-sidebar__list">
        {annotated.map(p => {
          const isActive = p.slug === currentSlug;
          const isDim    = isSearching && !p.match;
          const isMatch  = isSearching && p.match;

          return (
            <li
              key={p.id}
              className={[
                'nf-sidebar__list-item',
                isActive ? 'is-active' : '',
                isMatch  ? 'is-match'  : '',
                isDim    ? 'is-dim'    : '',
              ].filter(Boolean).join(' ')}
            >
              <Link href={`/${catSlug}/${p.slug}`}>{p.title}</Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
