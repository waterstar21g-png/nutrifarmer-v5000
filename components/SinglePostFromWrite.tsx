'use client';

import { useEffect, useRef } from 'react';
import { scrollToSingleBanner } from '@/lib/scroll-to-single-banner';

/** 카드·메뉴 등 → 단일글 진입 시 상단 배너로 스크롤 (글쓰기 게시글보기 URL 정리 포함) */
export function SinglePostFromWrite() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const u = new URL(window.location.href);
    if (u.searchParams.get('from') === 'write') {
      u.searchParams.delete('from');
      const clean = u.pathname + (u.search ? u.search : '');
      window.history.replaceState(null, '', clean);
    }

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToSingleBanner('auto'));
    });
  }, []);

  return null;
}
