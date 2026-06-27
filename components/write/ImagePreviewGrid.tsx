'use client';

import { useRef } from 'react';
import type { PreviewImage } from './WriteEditor';

interface Props {
  images: PreviewImage[];
  loading?: boolean;
  onRemove: (id: string) => void;
  onPasteToBody: (img: PreviewImage) => void;
}

export function ImagePreviewGrid({ images, loading, onRemove, onPasteToBody }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

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
      <div className="nfw-img-grid nfw-img-grid--empty" aria-label="미리보기 - 이미지" />
    );
  }

  return (
    <div ref={gridRef} className="nfw-img-grid" role="list" aria-label="미리보기 - 이미지">
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
              onClick={() => onPasteToBody(img)}
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
        </figure>
      ))}
    </div>
  );
}
