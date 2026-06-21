'use client';
import { useState } from 'react';
import Link from 'next/link';

const STAT_CARDS = [
  {
    num: '8+', label: '콘텐츠 카테고리',
    cards: [
      { slug: 'daily-life',       name: '일상 기록',   desc: '매일의 소소한 이야기',       icon: '📔' },
      { slug: 'family-growth',    name: '가족·성장',   desc: '자녀·손자 성장 기록',         icon: '🏡' },
      { slug: 'personal-archive', name: '개인 자료',   desc: '개인 자료 보관함',            icon: '📁' },
      { slug: 'archive-dev',      name: '프로그램',    desc: '프로그램 구축 자료',          icon: '💻' },
      { slug: 'life-photos',      name: '삶·사진',     desc: '삶의 기록과 사진',            icon: '📷' },
      { slug: 'revenue',          name: '수익관리',    desc: '수익 기록·분석',              icon: '💰' },
      { slug: 'pro-writing',      name: '전문 글쓰기', desc: '전문적인 글과 칼럼',          icon: '✍️' },
      { slug: 'fresh-news',       name: '주변 이야기', desc: '주변 사람들의 신선한 이야기', icon: '📰' },
    ],
  },
  {
    num: '365', label: '일상 기록 가능일',
    cards: [
      { slug: 'daily-life',    name: '일상 기록',     desc: '매일의 소소한 이야기',    icon: '📔' },
      { slug: 'life-photos',   name: '삶·사진',       desc: '삶의 기록과 사진',        icon: '📷' },
      { slug: 'about-memoir',  name: '추억하며',      desc: '삶의 추억과 회고',        icon: '🕯️' },
      { slug: 'pro-writing',   name: '전문 글쓰기',   desc: '전문적인 글과 칼럼',      icon: '✍️' },
      { slug: 'fresh-news',    name: '주변 이야기',   desc: '신선한 주변 이야기',      icon: '📰' },
      { slug: 'revenue',       name: '수익관리',      desc: '수익 기록·분석',          icon: '💰' },
      { slug: 'archive-dev',   name: '프로그램',      desc: '프로그램 구축 자료',      icon: '💻' },
      { slug: 'personal-archive', name: '개인 자료',  desc: '개인 자료 보관함',        icon: '📁' },
    ],
  },
  {
    num: '∞', label: '가족·삶의 추억',
    cards: [
      { slug: 'family-growth',   name: '가족·성장',     desc: '자녀·손자 성장 기록',  icon: '🏡' },
      { slug: 'family-grandson', name: '손자 성장일기', desc: '손자들의 성장 기록',   icon: '👶' },
      { slug: 'family-children', name: '자녀 이야기',   desc: '자녀들의 이야기',      icon: '👨‍👧' },
      { slug: 'family-photos',   name: '가족 사진',     desc: '소중한 가족의 순간',   icon: '📸' },
      { slug: 'family-special',  name: '특별한 날',     desc: '특별한 날의 기록',     icon: '🎉' },
      { slug: 'life-photos',     name: '삶·사진',       desc: '삶의 기록과 사진',     icon: '📷' },
      { slug: 'about-memoir',    name: '추억하며',      desc: '삶의 추억과 회고',     icon: '🕯️' },
      { slug: 'about-program',   name: '프로그램 기록', desc: '개발 기록과 성장 노트', icon: '💡' },
    ],
  },
  {
    num: '4', label: '일상·가족·성장·나눔',
    cards: [
      { slug: 'daily-life',       name: '일상 기록',    desc: '매일의 소소한 이야기',   icon: '📔' },
      { slug: 'family-growth',    name: '가족·성장',    desc: '자녀·손자 성장 기록',    icon: '🏡' },
      { slug: 'about-memoir',     name: '추억하며',     desc: '삶의 추억과 회고',       icon: '🕯️' },
      { slug: 'fresh-news',       name: '주변 이야기',  desc: '신선한 주변 이야기',     icon: '📰' },
      { slug: 'pro-writing',      name: '전문 글쓰기',  desc: '전문적인 글과 칼럼',     icon: '✍️' },
      { slug: 'revenue',          name: '수익관리',     desc: '수익 기록·분석',         icon: '💰' },
      { slug: 'personal-archive', name: '개인 자료',    desc: '개인 자료 보관함',       icon: '📁' },
      { slug: 'archive-dev',      name: '프로그램',     desc: '프로그램 구축 자료',     icon: '💻' },
    ],
  },
];

export function StatsSection() {
  const [active, setActive] = useState<number | null>(null);

  function toggle(i: number) {
    setActive(prev => prev === i ? null : i);
  }

  return (
    <div className="nf-stats">
      <div className="nf-stats__inner">
        {STAT_CARDS.map((s, i) => (
          <button
            key={s.label}
            className={`nf-stat${active === i ? ' is-active' : ''}`}
            onClick={() => toggle(i)}
            aria-expanded={active === i}
            style={{ cursor: 'pointer', border: 'none', textAlign: 'center', width: '100%', font: 'inherit' }}
          >
            <div className="nf-stat__num">{s.num}</div>
            <div className="nf-stat__label">{s.label}</div>
          </button>
        ))}
      </div>

      {active !== null && (
        <div className="nf-stats-cards">
          <div className="nf-showcase__grid" style={{ maxWidth: '960px', margin: '0 auto', padding: '0' }}>
            {STAT_CARDS[active].cards.map(card => (
              <Link key={card.slug + card.name} href={`/${card.slug}`} className="nf-showcase__card">
                <span className="nf-showcase__icon">{card.icon}</span>
                <span className="nf-showcase__name">{card.name}</span>
                <span className="nf-showcase__desc">{card.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
