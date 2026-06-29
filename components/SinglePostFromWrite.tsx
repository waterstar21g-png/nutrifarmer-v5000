'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { scrollToSingleBanner } from '@/lib/scroll-to-single-banner';

function scrubWriteParams() {
  const u = new URL(window.location.href);
  let changed = false;
  for (const key of ['from', '_nfv']) {
    if (u.searchParams.has(key)) {
      u.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const qs = u.searchParams.toString();
  window.history.replaceState(null, '', u.pathname + (qs ? `?${qs}` : ''));
}

function scrollBanner() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollToSingleBanner('auto'));
  });
}

/** 글쓰기 게시글보기·단일글 진입 — URL 변경마다 배너 스크롤·from 파라미터 정리 */
export function SinglePostFromWrite() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'nf-scroll-single-banner' || e.data?.type === 'nf-open-post') {
        scrollBanner();
      }
    };

    scrubWriteParams();
    scrollBanner();

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pathname, searchKey]);

  return null;
}
