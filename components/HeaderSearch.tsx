'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { postHref as buildPostHref } from '@/lib/post-href';

interface SearchHit {
  id: number;
  slug: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
  pid?: number;
}

export function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/posts?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json() as { posts: SearchHit[] };
      setResults(data.posts ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(() => fetchResults(q), 280);
    return () => window.clearTimeout(t);
  }, [query, fetchResults]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        // 딜레이: 클릭 이벤트(링크 이동 등)가 먼저 처리된 후 닫힘
        setTimeout(() => setOpen(false), 120);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (results.length === 1) {
      const p = results[0];
      router.push(buildPostHref(p.categorySlug, p.slug, p.pid));
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!results.length && !loading) fetchResults(q);
  }

  const showDrop = open && query.trim().length > 0;

  return (
    <div className="nf-nav-bar__search-wrap" ref={wrapRef}>
      <form onSubmit={submit} className="nf-nav-bar__search-form">
        <input
          className="nf-nav-bar__search-input"
          type="search"
          placeholder="검색..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          aria-label="글 검색"
          autoComplete="off"
        />
        <button
          type="submit"
          className="nf-nav-bar__search-icon"
          aria-label="검색"
        >
          🔍
        </button>
      </form>

      {showDrop && (
        <div className="nf-nav-bar__search-drop">
          {loading ? (
            <p className="nf-nav-bar__search-msg">검색 중…</p>
          ) : results.length === 0 ? (
            <p className="nf-nav-bar__search-msg">일치하는 글이 없습니다.</p>
          ) : (
            <>
              <p className="nf-nav-bar__search-count">
                {results.length}개 — 클릭하면 단일글 + 목록 보기
              </p>
              <ul className="nf-nav-bar__search-list">
                {results.map(p => (
                  <li key={p.pid ? `v5000-${p.id}` : `wp-${p.id}`}>
                    <Link
                      href={buildPostHref(p.categorySlug, p.slug, p.pid)}
                      className="nf-nav-bar__search-link"
                      onClick={() => setOpen(false)}
                    >
                      {p.imageUrl && (
                        <span className="nf-nav-bar__search-thumb">
                          <Image src={p.imageUrl} alt="" fill sizes="32px" style={{ objectFit: 'cover' }} />
                        </span>
                      )}
                      <span className="nf-nav-bar__search-title">{p.title}</span>
                      {p.categoryName && (
                        <span className="nf-nav-bar__search-cat">{p.categoryName}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
