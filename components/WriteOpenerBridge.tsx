'use client';

import { useEffect } from 'react';
import { scrollToSingleBanner } from '@/lib/scroll-to-single-banner';
import { normalizePostViewPath } from '@/lib/write-popup';

/** 글쓰기 팝업 → 메인 창 이동 (opener.location.assign) */
export function WriteOpenerBridge() {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const { type, path } = e.data ?? {};

      if (type === 'nf-scroll-single-banner') {
        scrollToSingleBanner('smooth');
        window.focus();
        return;
      }

      if (type !== 'nf-open-post' || typeof path !== 'string') return;

      try {
        const u = new URL(path, window.location.origin);
        const nextNorm = normalizePostViewPath(u.pathname, u.search);
        const curNorm = normalizePostViewPath(window.location.pathname, window.location.search);

        if (nextNorm === curNorm) {
          scrollToSingleBanner('smooth');
          window.focus();
          return;
        }

        window.location.assign(`${u.pathname}${u.search}`);
      } catch {
        window.location.assign(path);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return null;
}
