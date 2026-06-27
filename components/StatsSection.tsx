'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { STAT_ITEMS, SHOWCASE_CATS, FEATURE_PANELS } from '@/lib/site-data';
import type { PreviewPost } from '@/lib/home-posts';

import { postHref as buildPostHref } from '@/lib/post-href';

interface Props {
  heroPosts: Record<string, PreviewPost | null>;
}

function heroPostHref(heroPosts: Record<string, PreviewPost | null>, slug: string): string {
  const post = heroPosts[slug];
  if (!post) return `/${slug}`;
  return buildPostHref(post.categorySlug, post.slug, post.pid);
}

export function StatsSection({ heroPosts }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = (i: number) => {
    setActive(prev => {
      const next = prev === i ? null : i;
      return next;
    });
  };

  const panel = active !== null ? FEATURE_PANELS.find(p => p.statIndex === active) : null;

  return (
    <>
      <div className="nf-stats">
        <div className="nf-stats__inner">
          {STAT_ITEMS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={`nf-stat${active === i ? ' is-active' : ''}`}
              onClick={() => toggle(i)}
              aria-expanded={active === i}
              aria-label={`${s.label} — 클릭하여 안내 보기`}
            >
              <div className="nf-stat__num">{s.num}</div>
              <div className="nf-stat__label">{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {panel && (
        <div className="nf-features-panel-area" ref={panelRef} id="nf-features-panel-area">
          <div className="nf-features-panels-host">
            <div
              className={`nf-features-panel${panel.key === 'pillars' ? ' nf-features-panel--pillars' : ''}`}
              data-feature={panel.key}
            >
              <div
                className={`nf-features-panel-inner${panel.key === 'pillars' ? ' nf-features-panel-inner--pillars' : ''}`}
              >
                <div className="nf-features-panel-media">
                  <div className="nf-features-panel-media__ph" aria-hidden="true" />
                </div>
                <div className="nf-features-panel-body">
                  <h3 className="nf-features-panel-title">{panel.title}</h3>
                  <p className="nf-features-panel-lead">{panel.lead}</p>
                  <p className="nf-features-panel-philosophy">{panel.philosophy}</p>

                  {panel.key === 'categories' && (
                    <ul className="nf-features-cat-grid">
                      {SHOWCASE_CATS.map(cat => (
                        <li key={cat.slug}>
                          <Link
                            href={heroPostHref(heroPosts, cat.slug)}
                            className="nf-features-cat-link"
                          >
                            <span className="nf-features-cat-emoji" aria-hidden="true">
                              {cat.icon}
                            </span>
                            <span className="nf-features-cat-name">{cat.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {panel.ctas && panel.ctas.length > 0 && (
                    <div className="nf-features-cta-row">
                      {panel.ctas.map(cta => (
                        <Link
                          key={cta.slug}
                          href={heroPostHref(heroPosts, cta.slug)}
                          className="nf-features-cta-btn"
                        >
                          {cta.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {panel.pillars && (
                    <ul className="nf-features-pillar-grid" role="list">
                      {panel.pillars.map(p => (
                        <li key={p.key}>
                          <Link
                            href={heroPostHref(heroPosts, p.slug)}
                            className="nf-pillar-select-btn"
                            aria-label={`${p.title} 최신 글 보기`}
                          >
                            <span className="nf-features-pillar-emoji" aria-hidden="true">
                              {p.emoji}
                            </span>
                            <strong>{p.title}</strong>
                            <span>{p.subtitle}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
