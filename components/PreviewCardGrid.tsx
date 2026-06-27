'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CatItem } from '@/lib/site-data';
import type { PreviewPost } from '@/lib/home-posts';
import {
  closeAllHomePreviews,
  getHomePreviewState,
  openHomePreview,
  subscribeHomePreview,
  type PreviewZone,
} from '@/lib/home-preview-bus';
import { scrollElementBelowNav } from '@/lib/scroll-under-nav';
import { PreviewZoneArea } from './PreviewZoneArea';

interface Props {
  items: CatItem[];
  postsBySlug: Record<string, PreviewPost[]>;
  zone: PreviewZone;
  splitRows?: boolean;
  row2Zone?: PreviewZone;
  gridClass?: string;
  cardClass?: string;
  iconClass?: string;
  nameClass?: string;
  descClass?: string;
}

function CardButton({
  item,
  isActive,
  cardClass,
  iconClass,
  nameClass,
  descClass,
  onSelect,
}: {
  item: CatItem;
  isActive: boolean;
  cardClass: string;
  iconClass: string;
  nameClass: string;
  descClass: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`${cardClass}${isActive ? ' is-active' : ''}`}
      onClick={onSelect}
      aria-expanded={isActive}
    >
      <span className={iconClass}>{item.icon}</span>
      <span className={nameClass}>{item.name}</span>
      {item.desc && <span className={descClass}>{item.desc}</span>}
    </button>
  );
}

function RowBlock({
  rowItems,
  zone,
  postsBySlug,
  catNames,
  activeSlug,
  onSelect,
  gridClass,
  cardClass,
  iconClass,
  nameClass,
  descClass,
}: {
  rowItems: CatItem[];
  zone: PreviewZone;
  postsBySlug: Record<string, PreviewPost[]>;
  catNames: Record<string, string>;
  activeSlug: string | null;
  onSelect: (zone: PreviewZone, slug: string, rowEl: HTMLElement | null) => void;
  gridClass: string;
  cardClass: string;
  iconClass: string;
  nameClass: string;
  descClass: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const previewOpen = !!activeSlug;

  return (
    <div className={`nf-bottom-group${previewOpen ? ' nf-bottom-group--open' : ''}`}>
      <div ref={rowRef} className={`${gridClass} nf-bottom-row${previewOpen ? ' nf-bottom-row--open' : ''}`}>
        {rowItems.map(item => (
          <CardButton
            key={item.slug}
            item={item}
            isActive={activeSlug === item.slug}
            cardClass={cardClass}
            iconClass={iconClass}
            nameClass={nameClass}
            descClass={descClass}
            onSelect={() => onSelect(zone, item.slug, rowRef.current)}
          />
        ))}
      </div>
      {previewOpen && (
        <PreviewZoneArea zone={zone} postsBySlug={postsBySlug} catNames={catNames} />
      )}
    </div>
  );
}

export function PreviewCardGrid({
  items,
  postsBySlug,
  zone,
  splitRows = false,
  row2Zone,
  gridClass = 'nf-showcase__grid',
  cardClass = 'nf-showcase__card',
  iconClass = 'nf-showcase__icon',
  nameClass = 'nf-showcase__name',
  descClass = 'nf-showcase__desc',
}: Props) {
  const [active, setActive] = useState<{ zone: PreviewZone; slug: string } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const catNames = Object.fromEntries(items.map(i => [i.slug, i.name]));

  useEffect(() => subscribeHomePreview(s => {
    if (s.zone && s.slug) setActive({ zone: s.zone, slug: s.slug });
    else setActive(null);
  }), []);

  const select = useCallback((z: PreviewZone, slug: string, rowEl: HTMLElement | null) => {
    const cur = getHomePreviewState();
    if (cur.zone === z && cur.slug === slug) {
      closeAllHomePreviews();
      return;
    }
    closeAllHomePreviews();
    openHomePreview(z, slug);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollElementBelowNav(rowEl));
    });
  }, []);

  if (splitRows && row2Zone) {
    const anyOpen = active?.zone === zone || active?.zone === row2Zone;
    return (
      <div className={`nf-bottom-categories${anyOpen ? ' nf-bottom-categories--preview-open' : ''}`}>
        <RowBlock
          rowItems={items.slice(0, 4)}
          zone={zone}
          postsBySlug={postsBySlug}
          catNames={catNames}
          activeSlug={active?.zone === zone ? active.slug : null}
          onSelect={select}
          gridClass={gridClass}
          cardClass={cardClass}
          iconClass={iconClass}
          nameClass={nameClass}
          descClass={descClass}
        />
        <RowBlock
          rowItems={items.slice(4, 8)}
          zone={row2Zone}
          postsBySlug={postsBySlug}
          catNames={catNames}
          activeSlug={active?.zone === row2Zone ? active.slug : null}
          onSelect={select}
          gridClass={gridClass}
          cardClass={cardClass}
          iconClass={iconClass}
          nameClass={nameClass}
          descClass={descClass}
        />
      </div>
    );
  }

  const activeSlug = active?.zone === zone ? active.slug : null;

  return (
    <div className={`nf-bottom-categories${activeSlug ? ' nf-bottom-categories--preview-open' : ''}`}>
      <div className={`nf-bottom-group${activeSlug ? ' nf-bottom-group--open' : ''}`}>
        <div
          ref={rowRef}
          className={`${gridClass} nf-bottom-row${activeSlug ? ' nf-bottom-row--open' : ''}`}
        >
          {items.map(item => (
            <CardButton
              key={item.slug}
              item={item}
              isActive={activeSlug === item.slug}
              cardClass={cardClass}
              iconClass={iconClass}
              nameClass={nameClass}
              descClass={descClass}
              onSelect={() => select(zone, item.slug, rowRef.current)}
            />
          ))}
        </div>
        {activeSlug && (
          <PreviewZoneArea zone={zone} postsBySlug={postsBySlug} catNames={catNames} />
        )}
      </div>
    </div>
  );
}
