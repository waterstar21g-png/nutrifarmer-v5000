'use client';

import { useEffect, useRef } from 'react';

/** 글쓰기 [게시글보기] → 본문 위치로 1회 스크롤 (URL 정리, 새로고침 없음) */
export function SinglePostFromWrite() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const u = new URL(window.location.href);
    if (u.searchParams.get('from') !== 'write') return;
    done.current = true;

    u.searchParams.delete('from');
    const clean = u.pathname + (u.search ? u.search : '');
    window.history.replaceState(null, '', clean);

    requestAnimationFrame(() => {
      document.querySelector('.nf-single-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  return null;
}
