'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PostItem {
  id: number;
  slug: string;
  title: string;
  imageUrl: string | null;
}

interface Props {
  posts: PostItem[];
  catSlug: string;
  catName: string;
}

export function CategorySearch({ posts, catSlug, catName }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return posts.filter(p => p.title.toLowerCase().includes(q));
  }, [posts, query]);

  const showDrop = focused && query.trim().length > 0;

  return (
    <div className="nf-catsearch">
      {/* 검색 인풋 */}
      <div className="nf-catsearch__bar">
        <svg className="nf-catsearch__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
        <input
          type="search"
          className="nf-catsearch__input"
          placeholder={`"${catName}" 글 검색...`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          autoComplete="off"
          aria-label={`${catName} 카테고리 검색`}
        />
        {query && (
          <button
            className="nf-catsearch__clear"
            onClick={() => setQuery('')}
            aria-label="검색 초기화"
          >
            ✕
          </button>
        )}
      </div>

      {/* 드롭다운 결과 */}
      {showDrop && (
        <div className="nf-catsearch__drop">
          {results.length === 0 ? (
            <p className="nf-catsearch__empty">일치하는 글이 없습니다.</p>
          ) : (
            <>
              <p className="nf-catsearch__count">{results.length}개 검색됨 — 클릭하면 단일글 + 목록 보기</p>
              <ul className="nf-catsearch__list">
                {results.map(p => (
                  <li key={p.id} className="nf-catsearch__item">
                    <Link
                      href={`/${catSlug}/${p.slug}`}
                      className="nf-catsearch__link"
                    >
                      {p.imageUrl && (
                        <div className="nf-catsearch__thumb">
                          <Image
                            src={p.imageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <span className="nf-catsearch__title">{p.title}</span>
                      <span className="nf-catsearch__arrow">›</span>
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
