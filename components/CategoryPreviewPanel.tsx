'use client';



import { useEffect } from 'react';

import type { PreviewPost } from '@/lib/home-posts';

import { PreviewCarousel } from './PreviewCarousel';



interface Props {

  catName: string;

  catSlug: string;

  posts: PreviewPost[];

  onClose: () => void;

}



export function CategoryPreviewPanel({ catName, catSlug, posts, onClose }: Props) {

  return (

    <div className="nf-preview-panel" data-slug={catSlug}>

      <div className="nf-preview-toolbar">

        <h3 className="nf-preview-panel-title">

          {catName}

          <span className="nf-preview-panel-sub"> — 최근 글 · 화살표로 더 보기</span>

        </h3>

        <button type="button" className="nf-preview-close" onClick={onClose} aria-label="미리보기 닫기">

          미리보기 닫기 ✕

        </button>

      </div>

      <PreviewCarousel posts={posts} catName={catName} resetKey={catSlug} />

    </div>

  );

}


