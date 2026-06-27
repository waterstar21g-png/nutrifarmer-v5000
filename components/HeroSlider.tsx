'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    bg: 'linear-gradient(135deg, #deeaf7 0%, #eef5fb 100%)',
    title: '삶의 기록,\n따뜻한 이야기',
    desc: '일상과 가족, 자료, 프로그램, 삶의 기록을 한곳에 모아\n나만의 이야기를 남기고, 수익으로 확장해 나가는 공간입니다.',
    btns: [
      { href: '/daily-life', label: '일상 기록 보기', v: 'primary' as const },
      { href: '/family-growth', label: '가족 앨범', v: 'ghost' as const },
    ],
  },
  {
    bg: 'linear-gradient(135deg, #fdf0e4 0%, #fef6ee 100%)',
    title: '자녀와 손자들의\n성장 이야기',
    desc: '소중한 순간과 사진, 성장의 발자취를\n세대를 이어 기록하는 가족 앨범입니다.',
    btns: [{ href: '/family-growth', label: '성장 기록', v: 'primary' as const }],
  },
  {
    bg: 'linear-gradient(135deg, #e2f5ee 0%, #edfaf4 100%)',
    title: '기록에서 수익으로,\n블로그를 확장하다',
    desc: '전문 글쓰기, 자료 공유, 주변 뉴스 큐레이션으로\n개인 브랜드를 키우고 수익 창출까지 이어갑니다.',
    btns: [
      { href: '/revenue', label: '수익·뉴스', v: 'primary' as const },
      { href: '/pro-writing', label: '전문 글쓰기', v: 'ghost' as const },
    ],
  },
];

const N = SLIDES.length;
const AUTO_INTERVAL = 10000;
const DRAG_THRESHOLD = 14;
const TRANSITION = 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94)';

// 무한 루프용: [clone-last, S0, S1, S2, clone-first]
const ITEMS = [SLIDES[N - 1], ...SLIDES, SLIDES[0]];
const TOTAL = ITEMS.length; // N + 2

function isInteractiveTarget(el: EventTarget | null) {
  return el instanceof HTMLElement && !!el.closest('a, button');
}

export function HeroSlider() {
  // pos: 1~N = 실제 슬라이드, 0 = clone-last, N+1 = clone-first
  const [pos, setPos] = useState(1);
  const [transition, setTransition] = useState(TRANSITION);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const didDrag = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const skipNext = useRef(false);

  const goNext = useCallback(() => {
    setTransition(TRANSITION);
    setPos(p => p + 1);
  }, []);

  const goPrev = useCallback(() => {
    setTransition(TRANSITION);
    setPos(p => p - 1);
  }, []);

  // 클론 끝에 도달하면 애니메이션 없이 실제 위치로 순간 이동
  useEffect(() => {
    if (pos === TOTAL - 1) {
      // clone-first → 실제 1번(첫 슬라이드)으로 순간이동
      const id = setTimeout(() => {
        setTransition('none');
        setPos(1);
        skipNext.current = true;
      }, 430);
      return () => clearTimeout(id);
    }
    if (pos === 0) {
      // clone-last → 실제 마지막 슬라이드로 순간이동
      const id = setTimeout(() => {
        setTransition('none');
        setPos(N);
        skipNext.current = true;
      }, 430);
      return () => clearTimeout(id);
    }
  }, [pos]);

  // 자동 재생
  useEffect(() => {
    if (isDragging) return;
    const id = setInterval(goNext, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [isDragging, goNext]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (isInteractiveTarget(e.target)) return;
    startX.current = e.clientX;
    didDrag.current = false;
    setDragging(true);
    setDragDelta(0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const diff = e.clientX - startX.current;
    if (Math.abs(diff) > DRAG_THRESHOLD) didDrag.current = true;
    setDragDelta(diff);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const diff = e.clientX - startX.current;
    if (didDrag.current) {
      if (diff < -DRAG_THRESHOLD) goNext();
      else if (diff > DRAG_THRESHOLD) goPrev();
    }
    startX.current = null;
    setDragging(false);
    setDragDelta(0);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const trackWidth = trackRef.current?.offsetWidth ?? 0;
  const dragPct = trackWidth > 0 ? (dragDelta / trackWidth) * 100 : 0;
  const translateX = -(pos * 100) + dragPct;

  return (
    <div className="nf-hero-slider" style={{ overflow: 'hidden' }}>
      <div
        ref={trackRef}
        className="nf-hero-track"
        style={{
          display: 'flex',
          width: `${TOTAL * 100}%`,
          transform: `translateX(${translateX / TOTAL}%)`,
          transition: isDragging ? 'none' : transition,
        }}
      >
        {ITEMS.map((s, i) => (
          <div key={i} style={{ width: `${100 / TOTAL}%`, flexShrink: 0 }}>
            <div className="nf-hero" style={{ background: s.bg }}>
              <div
                className="nf-hero__drag-layer"
                style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-hidden="true"
              />
              <div className="nf-hero__inner">
                <h1 className="nf-hero__title" style={{ whiteSpace: 'pre-line' }}>{s.title}</h1>
                <p className="nf-hero__desc" style={{ whiteSpace: 'pre-line' }}>{s.desc}</p>
                <div className="nf-hero__btns">
                  {s.btns.map(btn => (
                    <Link
                      key={btn.href}
                      href={btn.href}
                      className={`nf-hero__btn nf-hero__btn--${btn.v}`}
                    >
                      {btn.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
