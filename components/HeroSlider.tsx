'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    cls: '',
    bg: 'linear-gradient(135deg, #0f2744 0%, #1a5fa8 100%)',
    title: '삶의 기록,\n따뜻한 이야기',
    desc: '일상과 가족, 자료, 프로그램, 삶의 기록을 한곳에 모아\n나만의 이야기를 남기고, 수익으로 확장해 나가는 공간입니다.',
    btns: [
      { href: '/daily-life', label: '일상 기록 보기', v: 'primary' },
      { href: '/family-growth', label: '가족 앨범', v: 'ghost' },
    ],
  },
  {
    cls: 'nf-hero--warm',
    bg: 'linear-gradient(135deg, #5c3317 0%, #9c6b3c 100%)',
    title: '자녀와 손자들의\n성장 이야기',
    desc: '소중한 순간과 사진, 성장의 발자취를\n세대를 이어 기록하는 가족 앨범입니다.',
    btns: [
      { href: '/family-growth', label: '성장 기록', v: 'primary' },
    ],
  },
  {
    cls: 'nf-hero--revenue',
    bg: 'linear-gradient(135deg, #0f3d2e 0%, #1a7d54 100%)',
    title: '기록에서 수익으로,\n블로그를 확장하다',
    desc: '전문 글쓰기, 자료 공유, 주변 뉴스 큐레이션으로\n개인 브랜드를 키우고 수익 창출까지 이어갑니다.',
    btns: [
      { href: '/revenue', label: '수익·뉴스', v: 'primary' },
      { href: '/pro-writing', label: '전문 글쓰기', v: 'ghost' },
    ],
  },
];

export function HeroSlider() {
  const [cur, setCur] = useState(0);

  const next = useCallback(() => setCur(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCur(c => (c - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const id = setInterval(next, 5200);
    return () => clearInterval(id);
  }, [next]);

  const slide = SLIDES[cur];

  return (
    <div className="nf-hero-slider">
      {SLIDES.map((s, i) => (
        <div key={i} className={`nf-hero-slide${i === cur ? ' is-active' : ''}`}>
          <div
            className={`nf-hero ${s.cls}`}
            style={{ background: s.bg }}
          >
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
                    key={btn.href + btn.label}
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

      {/* 좌우 화살표 */}
      <div className="nf-hero-arrows">
        <button className="nf-hero-arrow" onClick={prev} aria-label="이전 슬라이드">‹</button>
        <button className="nf-hero-arrow" onClick={next} aria-label="다음 슬라이드">›</button>
      </div>

      {/* 하단 점 */}
      <div className="nf-hero-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`nf-hero-dot${i === cur ? ' is-active' : ''}`}
            onClick={() => setCur(i)}
            aria-label={`슬라이드 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
