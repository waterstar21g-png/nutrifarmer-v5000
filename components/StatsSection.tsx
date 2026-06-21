'use client';
import { useState } from 'react';
import Link from 'next/link';
import { STAT_ITEMS } from '@/lib/site-data';

export function StatsSection() {
  const [active, setActive] = useState<number | null>(null);

  const toggle = (i: number) => setActive(prev => prev === i ? null : i);

  return (
    <div className="nf-stats">
      {/* 4개 통계 박스 */}
      <div className="nf-stats__inner">
        {STAT_ITEMS.map((s, i) => (
          <div
            key={s.label}
            role="button"
            tabIndex={0}
            className={`nf-stat${active === i ? ' is-active' : ''}`}
            onClick={() => toggle(i)}
            onKeyDown={e => e.key === 'Enter' && toggle(i)}
            aria-expanded={active === i}
            aria-label={`${s.label} - 클릭하여 관련 카테고리 보기`}
          >
            <div className="nf-stat__num">{s.num}</div>
            <div className="nf-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 선택된 통계: 상단 강조 카드 → 하단 8개 카드 */}
      {active !== null && (
        <div className="nf-stats-expanded">
          {/* 선택 항목 굵은 테두리 강조 */}
          <div className="nf-stats-selected-header">
            <div className="nf-stat nf-stat--hero">
              <div className="nf-stat__num">{STAT_ITEMS[active].num}</div>
              <div className="nf-stat__label">{STAT_ITEMS[active].label}</div>
            </div>
          </div>

          {/* 8개 카드 */}
          <div className="nf-showcase__grid nf-stats-cards">
            {STAT_ITEMS[active].cards.map(card => (
              <Link
                key={card.slug + card.name}
                href={`/${card.slug}`}
                className="nf-showcase__card"
              >
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
