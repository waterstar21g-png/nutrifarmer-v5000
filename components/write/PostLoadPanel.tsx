'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EditorCategory, EditorPost, PreviewImage } from './WriteEditor';
import { POSTS_API } from './WriteEditor';
import { ConfirmDialog } from './ConfirmDialog';
import { PostListGrid } from './PostListGrid';
import { extractImagesFromHtml, toPreviewImages } from '@/lib/write-post-images';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

interface Props {
  categories: EditorCategory[];
  onApply: (post: EditorPost, images: PreviewImage[]) => void;
  onClose: () => void;
  hasEditorContent: boolean;
  onClearEditor: () => void;
}

async function fetchPosts(params: Record<string, string>): Promise<EditorPost[]> {
  const q = new URLSearchParams({ mine: '0', status: 'publish', ...params });
  const r = await fetch(`${POSTS_API}?${q}`, { credentials: 'same-origin' });
  if (!r.ok) return [];
  const data = await r.json();
  return data.ok && Array.isArray(data.posts) ? data.posts : [];
}

export function PostLoadPanel({
  categories,
  onApply,
  onClose,
  hasEditorContent,
  onClearEditor,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(hasEditorContent);
  const [pickerCat, setPickerCat] = useState('');
  const [titleQ, setTitleQ] = useState('');
  const [bodyQ, setBodyQ] = useState('');
  const [catPosts, setCatPosts] = useState<EditorPost[]>([]);
  const [titlePosts, setTitlePosts] = useState<EditorPost[]>([]);
  const [bodyPosts, setBodyPosts] = useState<EditorPost[]>([]);
  const [selected, setSelected] = useState<EditorPost | null>(null);
  const [loadImages, setLoadImages] = useState<PreviewImage[]>([]);

  const resetPanel = useCallback(() => {
    setPickerCat('');
    setTitleQ('');
    setBodyQ('');
    setCatPosts([]);
    setTitlePosts([]);
    setBodyPosts([]);
    setSelected(null);
    setLoadImages([]);
  }, []);

  const selectPost = useCallback((p: EditorPost) => {
    setSelected(p);
    if (p.categorySlug) setPickerCat(p.categorySlug);
    setTitleQ(stripHtml(p.title));
    setBodyQ(stripHtml(p.excerpt));
    const imgs = toPreviewImages(extractImagesFromHtml(p.body));
    setLoadImages(imgs);
  }, []);

  useEffect(() => {
    if (confirmOpen) return;
    resetPanel();
  }, [confirmOpen, resetPanel]);

  useEffect(() => {
    if (confirmOpen || !pickerCat) {
      setCatPosts([]);
      return;
    }
    void fetchPosts({ category_slug: pickerCat }).then(posts => {
      setCatPosts(posts);
    });
  }, [pickerCat, confirmOpen]);

  const searchTitle = () => {
    if (!titleQ.trim()) return;
    void fetchPosts({ search_title: titleQ.trim() }).then(posts => {
      setTitlePosts(posts);
    });
  };

  const searchBody = () => {
    if (!bodyQ.trim()) return;
    void fetchPosts({ search_body: bodyQ.trim() }).then(posts => {
      setBodyPosts(posts);
    });
  };

  const imageSummary = useMemo(() => {
    if (!selected) return '';
    if (loadImages.length === 0) return '이미지 없음';
    return `${loadImages.length}개 이미지`;
  }, [selected, loadImages.length]);

  const handleConfirmReset = () => {
    onClearEditor();
    setConfirmOpen(false);
  };

  const handleCancelReset = () => {
    setConfirmOpen(false);
  };

  const handleApply = () => {
    if (!selected) return;
    onApply(selected, loadImages);
    onClose();
  };

  if (confirmOpen) {
    return (
      <ConfirmDialog
        title="등록글 가져오기"
        message="우측에 작성 중인 내용이 있습니다. 가져오기 창을 열면 하단 검색·미리보기는 초기화됩니다. 에디터 내용도 초기화할까요?"
        confirmLabel="초기화"
        cancelLabel="유지"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    );
  }

  return (
    <div className="nfw-load-panel">
      <div className="nfw-load-panel__head">
        <span className="nfw-load-panel__title">등록글 가져오기</span>
        <div className="nfw-load-panel__head-actions">
          {selected && (
            <button type="button" className="nfw-btn nfw-btn--sm nfw-btn--primary" onClick={handleApply}>
              에디터에 적용
            </button>
          )}
          <button type="button" className="nfw-btn nfw-btn--sm" onClick={onClose}>닫기</button>
        </div>
      </div>

      <div className="nfw-load-rows nfw-load-rows--compact">
        <div className="nfw-load-row nfw-load-row--top">
          <label className="nfw-load-row__ctrl">
            <span className="nfw-load-row__label">카테고리</span>
            <select
              className="nfw-field__input"
              value={pickerCat}
              onChange={e => setPickerCat(e.target.value)}
            >
              <option value=""></option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="nfw-load-row__ctrl">
            <span className="nfw-load-row__label">제목</span>
            <div className="nfw-load-row__inline">
              <input
                className="nfw-field__input nfw-content-text"
                value={titleQ}
                onChange={e => setTitleQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') searchTitle(); }}
              />
              <button type="button" className="nfw-btn nfw-btn--sm" onClick={searchTitle}>검색</button>
            </div>
          </label>
        </div>

        {(catPosts.length > 0 || titlePosts.length > 0 || bodyPosts.length > 0) && (
          <div className="nfw-load-results">
            {catPosts.length > 0 && (
              <PostListGrid
                posts={catPosts}
                selectedId={selected?.id ?? null}
                onSelect={selectPost}
              />
            )}
            {titlePosts.length > 0 && (
              <PostListGrid
                posts={titlePosts}
                selectedId={selected?.id ?? null}
                onSelect={selectPost}
              />
            )}
            {bodyPosts.length > 0 && (
              <PostListGrid
                posts={bodyPosts}
                selectedId={selected?.id ?? null}
                onSelect={selectPost}
              />
            )}
          </div>
        )}

        <div className="nfw-load-row">
          <label className="nfw-load-row__ctrl">
            <span className="nfw-load-row__label">요약</span>
            <div className="nfw-load-row__inline">
              <input
                className="nfw-field__input nfw-content-text"
                value={bodyQ}
                onChange={e => setBodyQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') searchBody(); }}
              />
              <button type="button" className="nfw-btn nfw-btn--sm" onClick={searchBody}>검색</button>
            </div>
          </label>
        </div>

        <div className="nfw-load-row nfw-load-row--images">
          <div className="nfw-load-row__ctrl">
            <span className="nfw-load-row__label">사진/이미지</span>
            <input className="nfw-field__input nfw-content-text" value={imageSummary} readOnly />
          </div>
          <div className="nfw-load-img-grid" role="list" aria-label="선택 글 이미지">
            {loadImages.map(img => (
              <span
                key={img.id}
                role="listitem"
                className="nfw-load-img-grid__cell"
                title={img.alt}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="nfw-load-img-grid__img" loading="lazy" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
