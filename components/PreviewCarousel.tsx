'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PostContentImage } from '@/components/PostContentImage';
import type { PreviewPost } from '@/lib/home-posts';
import { postHref } from '@/lib/post-href';

const PAGE_SIZE = 8;

interface Props {
  posts: PreviewPost[];
  catName: string;
  /** 패널 전환 시 1페이지로 */
  resetKey?: string;
}

export function PreviewCarousel({ posts, catName, resetKey }: Props) {
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  const go = useCallback(
    (delta: number) => setPage(p => Math.max(0, Math.min(totalPages - 1, p + delta))),
    [totalPages],
  );

  if (posts.length === 0) {
    return <p className="nf-preview-empty">이 카테고리에 아직 글이 없습니다.</p>;
  }

  const start = page * PAGE_SIZE;
  const visible = posts.slice(start, start + PAGE_SIZE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;
  const showNav = posts.length > PAGE_SIZE;

  return (
    <div className="nf-preview-carousel" data-page-size={PAGE_SIZE}>
      {showNav && (
        <button
          type="button"
          className="nf-preview-nav nf-preview-nav--up"
          aria-label="위로 더 보기"
          hidden={!hasPrev}
          disabled={!hasPrev}
          onClick={() => go(-1)}
        >
          <span className="nf-preview-nav-icon" aria-hidden="true">↑</span>
        </button>
      )}

      {showNav && (
        <button
          type="button"
          className="nf-preview-nav nf-preview-nav--prev"
          aria-label="이전 이미지"
          hidden={!hasPrev}
          disabled={!hasPrev}
          onClick={() => go(-1)}
        >
          <span className="nf-preview-nav-icon" aria-hidden="true">‹</span>
        </button>
      )}

      <div className="nf-preview-carousel-stage">
        <div className="nf-preview-grid nf-preview-grid--carousel">
          {visible.map(post => (
            <article key={post.id} className="nf-preview-card">
              <Link href={postHref(post.categorySlug, post.slug, post.pid ?? post.id)} className="nf-preview-card-link">
                <div className="nf-preview-card-thumb">
                  {post.imageUrl ? (
                    <PostContentImage
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                    />
                  ) : (
                    <span className="nf-preview-card-placeholder" aria-hidden="true">📷</span>
                  )}
                </div>
                <h4 className="nf-preview-card-title">{post.title}</h4>
                {post.excerpt && (
                  <p className="nf-preview-card-excerpt">{post.excerpt.slice(0, 90)}…</p>
                )}
              </Link>
            </article>
          ))}
        </div>
      </div>

      {showNav && (
        <button
          type="button"
          className="nf-preview-nav nf-preview-nav--next"
          aria-label="다음 이미지"
          hidden={!hasNext}
          disabled={!hasNext}
          onClick={() => go(1)}
        >
          <span className="nf-preview-nav-icon" aria-hidden="true">›</span>
        </button>
      )}

      {showNav && (
        <button
          type="button"
          className="nf-preview-nav nf-preview-nav--down"
          aria-label="아래 더 보기"
          hidden={!hasNext}
          disabled={!hasNext}
          onClick={() => go(1)}
        >
          <span className="nf-preview-nav-icon" aria-hidden="true">↓</span>
        </button>
      )}

      {showNav && (
        <div className="nf-preview-carousel-foot">
          <span className="nf-preview-page-label">{page + 1} / {totalPages}</span>
        </div>
      )}

      {!showNav && posts.length > 0 && (
        <div className="nf-preview-carousel-foot">
          <Link href={`/${posts[0].categorySlug}`} className="nf-preview-more-link">
            {catName} 전체 보기 →
          </Link>
        </div>
      )}
    </div>
  );
}

