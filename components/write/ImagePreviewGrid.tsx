'use client';

import { useEffect, useRef, useState } from 'react';
import type { PreviewImage } from './WriteEditor';

export type ImagePastePosition = 'inline' | 'top' | 'bottom';

const PASTE_OPTIONS: { pos: ImagePastePosition; label: string }[] = [
  { pos: 'inline', label: '커서 위치' },
  { pos: 'top', label: '본문상' },
  { pos: 'bottom', label: '본문하' },
];

interface Props {
  images: PreviewImage[];
  loading?: boolean;
  onRemove: (id: string) => void;
  onPasteToBody: (img: PreviewImage, position: ImagePastePosition) => void;
}

export function ImagePreviewGrid({ images, loading, onRemove, onPasteToBody }: Props) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuId) return;
    const close = (e: MouseEvent) => {
      if (!gridRef.current?.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuId]);

  if (loading) {
    return (
      <div className="nfw-img-grid" aria-busy="true" aria-label="이미지 추천 중">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="nfw-img-grid__cell nfw-img-grid__cell--loading" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="nfw-img-grid nfw-img-grid--empty" aria-label="이미지 미리보기">
        <span className="nfw-img-grid__hint">좌측 [사진/이미지] → 본문 맞춤 추천</span>
      </div>
    );
  }

  return (
    <div ref={gridRef} className="nfw-img-grid" role="list" aria-label="이미지 미리보기">
      {images.map(img => (
        <figure key={img.id} className="nfw-img-grid__cell" role="listitem">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt} className="nfw-img-grid__img" loading="lazy" />
          <figcaption className="nfw-img-grid__cap" title={img.alt}>
            {img.keyword || img.alt}
          </figcaption>
          <div className="nfw-img-grid__actions">
            <button
              type="button"
              className="nfw-img-grid__btn nfw-img-grid__btn--paste"
              onClick={() => setMenuId(menuId === img.id ? null : img.id)}
              aria-expanded={menuId === img.id}
              aria-haspopup="menu"
            >
              붙여넣기
            </button>
            <button
              type="button"
              className="nfw-img-grid__btn nfw-img-grid__btn--del"
              onClick={() => onRemove(img.id)}
              title="제거"
              aria-label="제거"
            >
              ✕
            </button>
          </div>
          {menuId === img.id && (
            <div className="nfw-img-grid__paste-menu" role="menu" aria-label="붙여넣기 위치">
              {PASTE_OPTIONS.map(({ pos, label }) => (
                <button
                  key={pos}
                  type="button"
                  role="menuitem"
                  className="nfw-img-grid__paste-opt"
                  onClick={() => {
                    onPasteToBody(img, pos);
                    setMenuId(null);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </figure>
      ))}
    </div>
  );
}
