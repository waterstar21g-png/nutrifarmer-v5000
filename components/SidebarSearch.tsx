'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { postHref } from '@/lib/post-href';

interface SidebarPost {
  key?: string;
  id: number;
  slug: string;
  title: { rendered: string };
  pid?: number;
}

interface Props {
  posts: SidebarPost[];
  catSlug: string;
  catName: string;
  currentSlug: string;
}

export function SidebarSearch({ posts, catSlug, catName, currentSlug }: Props) {
  const [query, setQuery] = useState('');
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const pathname = usePathname();

  const urlSlug = useMemo(() => {
    const prefix = `/${catSlug}/`;
    if (!pathname.startsWith(prefix)) return currentSlug;
    const segment = pathname.slice(prefix.length).split('/')[0]?.split('?')[0] ?? '';
    return segment || currentSlug;
  }, [pathname, catSlug, currentSlug]);

  const activeSlug = pendingSlug ?? urlSlug;

  useEffect(() => {
    if (pendingSlug && urlSlug === pendingSlug) {
      setPendingSlug(null);
    }
  }, [pendingSlug, urlSlug]);

  const annotated = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.map(p => {
      const title = p.title.rendered.replace(/<[^>]+>/g, '');
      const match = q.length > 0 && title.toLowerCase().includes(q);
      return { ...p, title, match };
    });
  }, [posts, query]);

  const isSearching = query.trim().length > 0;
  const matchCount = annotated.filter(p => p.match).length;

  return (
    <aside className="nf-sidebar" aria-label="카테고리 글 검색">
      <div className="nf-sidebar-search-panel">
        <div className="nf-sidebar__search nf-sidebar__search--inline">
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
            type="button"
            className="nf-sidebar__search-icon"
            onClick={() => setQuery('')}
            aria-label={query ? '검색 초기화' : '검색'}
            title={query ? '초기화' : '검색'}
          >
            {query ? '✕' : '🔍'}
          </button>
        </div>
        {isSearching && (
          <div className="nf-sidebar__search-info">
            {matchCount > 0 ? `${matchCount}개 일치` : '일치하는 글 없음'}
          </div>
        )}
      </div>

      <div className="nf-sidebar-categories-panel">
        <Link href={`/${catSlug}`} className="nf-sidebar__cat-badge">
          {catName}
        </Link>

        <ul className="nf-sidebar__list nf-sidebar-post-list">
          {annotated.map(p => {
            const isActive = p.slug === activeSlug;
            const isMatch = isSearching && p.match;
            const isDim = isSearching && !p.match && !isActive;
            const itemKey = p.key ?? `${p.pid ? 'v5000' : 'wp'}-${p.id}`;

            return (
              <li
                key={itemKey}
                className={[
                  'nf-sidebar__list-item',
                  'nf-sidebar-post-item',
                  isActive ? 'is-active' : '',
                  isMatch ? 'is-match' : '',
                  isDim ? 'is-dim' : '',
                ].filter(Boolean).join(' ')}
              >
                <Link
                  href={postHref(catSlug, p.slug, p.pid)}
                  className="nf-sidebar-post-link"
                  onClick={() => setPendingSlug(p.slug)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {p.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
