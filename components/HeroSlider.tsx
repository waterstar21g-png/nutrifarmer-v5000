'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    bg: 'linear-gradient(135deg, #0f2744 0%, #1a5fa8 100%)',
    title: '삶의 기록,\n따뜻한 이야기',
    desc: '일상과 가족, 자료, 프로그램, 삶의 기록을 한곳에 모아\n나만의 이야기를 남기고, 수익으로 확장해 나가는 공간입니다.',
    btns: [
      { href: '/daily-life',    label: '일상 기록 보기', v: 'primary' },
      { href: '/family-growth', label: '가족 앨범',      v: 'ghost'   },
    ],
  },
  {
    bg: 'linear-gradient(135deg, #5c3317 0%, #9c6b3c 100%)',
    title: '자녀와 손자들의\n성장 이야기',
    desc: '소중한 순간과 사진, 성장의 발자취를\n세대를 이어 기록하는 가족 앨범입니다.',
    btns: [
      { href: '/family-growth', label: '성장 기록', v: 'primary' },
    ],
  },
  {
    bg: 'linear-gradient(135deg, #0f3d2e 0%, #1a7d54 100%)',
    title: '기록에서 수익으로,\n블로그를 확장하다',
    desc: '전문 글쓰기, 자료 공유, 주변 뉴스 큐레이션으로\n개인 브랜드를 키우고 수익 창출까지 이어갑니다.',
    btns: [
      { href: '/revenue',     label: '수익·뉴스',   v: 'primary' },
      { href: '/pro-writing', label: '전문 글쓰기', v: 'ghost'   },
    ],
  },
];

const DRAG_THRESHOLD = 50;
const AUTO_INTERVAL  = 5200;

export function HeroSlider() {
  const [cur,       setCur]       = useState(0);
  const [dragDelta, setDragDelta] = useState(0);   // px, 드래그 중 오프셋
  const [isDragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((i: number) => {
    setCur(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);
  const goNext = useCallback(() => goTo(cur + 1), [cur, goTo]);
  const goPrev = useCallback(() => goTo(cur - 1), [cur, goTo]);

  /* 자동 슬라이드 — 드래그 중 정지 */
  useEffect(() => {
    if (isDragging) return;
    const id = setInterval(goNext, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [isDragging, goNext]);

  /* ── 드래그 핸들러 ── */
  const onStart = (x: number) => {
    startX.current = x;
    setDragging(true);
    setDragDelta(0);
  };

  const onMove = (x: number) => {
    if (startX.current === null) return;
    setDragDelta(x - startX.current);
  };

  const onEnd = (x: number) => {
    if (startX.current === null) return;
    const diff = x - startX.current;
    if      (diff < -DRAG_THRESHOLD) goNext();
    else if (diff >  DRAG_THRESHOLD) goPrev();
    startX.current = null;
    setDragging(false);
    setDragDelta(0);
  };

  /* 트랙 translateX: 현재 슬라이드 * -100% + 드래그 오프셋(%) */
  const trackWidth = trackRef.current?.offsetWidth ?? 0;
  const dragPct    = trackWidth > 0 ? (dragDelta / trackWidth) * 100 : 0;
  const translateX = -(cur * 100) + dragPct;

  return (
    <div
      className="nf-hero-slider"
      style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      /* Mouse */
      onMouseDown  ={e => onStart(e.clientX)}
      onMouseMove  ={e => isDragging && onMove(e.clientX)}
      onMouseUp    ={e => onEnd(e.clientX)}
      onMouseLeave ={() => { if (isDragging) { setDragging(false); setDragDelta(0); startX.current = null; } }}
      /* Touch */
      onTouchStart ={e => onStart(e.touches[0].clientX)}
      onTouchMove  ={e => onMove(e.touches[0].clientX)}
      onTouchEnd   ={e => onEnd(e.changedTouches[0].clientX)}
    >
      {/* 슬라이드 트랙 — 좌우로 슬라이딩 */}
      <div
        ref={trackRef}
        className="nf-hero-track"
        style={{
          transform:  `translateX(${translateX}%)`,
          transition: isDragging ? 'none' : 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      >
        {SLIDES.map((s, i) => (
          <div key={i} className="nf-hero-slide">
            <div className="nf-hero" style={{ background: s.bg }}>
              <div className="nf-hero__inner">
                <h1 className="nf-hero__title" style={{ whiteSpace: 'pre-line' }}>
                  {s.title}
                </h1>
                <p className="nf-hero__desc" style={{ whiteSpace: 'pre-line' }}>
                  {s.desc}
                </p>
                <div className="nf-hero__btns">
                  {s.btns.map(btn => (
                    <Link
                      key={btn.href}
                      href={btn.href}
                      className={`nf-hero__btn nf-hero__btn--${btn.v}`}
                      onMouseDown={e => e.stopPropagation()}
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

      {/* 하단 점 내비게이션 */}
      <div className="nf-hero-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`nf-hero-dot${i === cur ? ' is-active' : ''}`}
            onClick={() => goTo(i)}
            onMouseDown={e => e.stopPropagation()}
            aria-label={`슬라이드 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
