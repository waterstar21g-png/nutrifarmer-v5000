'use client';

import { useState, useCallback, useMemo } from 'react';
import type { RefObject } from 'react';
import type { DraftState, EditorCategory, EditorPost, PreviewImage, WritePhase } from './WriteEditor';
import { ImagePreviewGrid } from './ImagePreviewGrid';
import { PostLoadPanel } from './PostLoadPanel';
import { BodyEditor } from './BodyEditor';
import { stripBodyPlain, bodyHtmlForPreview, bodyHtmlForPublish } from '@/lib/write-body-plain';
import { resolveFeaturedImageUrl, firstImageUrlFromHtml } from '@/lib/write-featured-image';
import { buildBodyImageFigureHtml } from '@/lib/write-body-images';
import { normalizeBodyForEditor } from '@/lib/write-body-blocks';
import type { InsertPosition } from '@/lib/write-insert-position';
import { countBodyImages, mergeBodyHtml } from '@/lib/write-body-insert';
import { useWriteMessage } from './WriteMessageContext';

interface Props {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  phase: WritePhase;
  setPhase: (p: WritePhase) => void;
  categories: EditorCategory[];
  bodyRef: RefObject<HTMLDivElement | null>;
  insertPosition: InsertPosition;
  onSave: () => void;
  onPublish: () => void;
  onBackToFinalize: () => void;
  onViewPost: () => Promise<{ ok: boolean; silent?: boolean }>;
  previewLoading?: boolean;
  onRemovePreviewImage: (id: string) => void;
  onPasteStatus?: (msg: string) => void;
  onSelectBodyRevision: (rev: number) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export function DraftPanel({
  draft, setDraft, phase, setPhase,
  categories, bodyRef, insertPosition,
  onSave, onPublish, onBackToFinalize, onViewPost,
  previewLoading, onRemovePreviewImage, onPasteStatus, onSelectBodyRevision,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadPreviewActive, setLoadPreviewActive] = useState(false);
  const msg = useWriteMessage();

  const imageCount = useMemo(() => countBodyImages(draft.body), [draft.body]);

  const appendBodyHtml = useCallback((html: string, position: 'inline' | 'top' | 'bottom') => {
    const el = bodyRef.current;
    if (position === 'inline' && el) {
      el.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const node = tpl.content.firstChild;
        if (node) {
          range.insertNode(node);
          range.setStartAfter(node);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        setDraft(d => ({ ...d, body: normalizeBodyForEditor(el.innerHTML) }));
        return;
      }
    }
    setDraft(d => {
      const body = mergeBodyHtml(d.body, html, position === 'inline' ? 'bottom' : position);
      return { ...d, body };
    });
  }, [bodyRef, setDraft, insertPosition]);

  const clearEditorForLoad = useCallback(() => {
    setDraft({
      categorySlug: '',
      title: '',
      excerpt: '',
      body: '',
      bodyRevision: 0,
      bodySnapshots: [],
      viewingRevision: 0,
      images: [],
      previewImages: [],
      postId: null,
      postSlug: '',
    });
  }, [setDraft]);

  const applyLoadedPost = useCallback((p: EditorPost, images: PreviewImage[]) => {
    setDraft(d => ({
      ...d,
      postId: p.id,
      postSlug: p.slug,
      title: stripHtml(p.title),
      excerpt: stripHtml(p.excerpt),
      body: normalizeBodyForEditor(p.body),
      previewImages: images,
      images: [],
      bodyRevision: 0,
      bodySnapshots: [],
      viewingRevision: 0,
      categorySlug: p.categorySlug || d.categorySlug,
    }));
    setPickerOpen(false);
    setLoadPreviewActive(false);
    setPhase('finalize');
    onPasteStatus?.(`✅ 「${stripHtml(p.title)}」 글을 에디터에 적용했습니다.`);
  }, [setDraft, setPhase, onPasteStatus]);

  const previewLoadedPost = useCallback((p: EditorPost, images: PreviewImage[]) => {
    setDraft(d => ({
      ...d,
      postId: p.id,
      postSlug: p.slug,
      title: stripHtml(p.title),
      excerpt: stripHtml(p.excerpt),
      body: normalizeBodyForEditor(p.body),
      previewImages: images,
      images: [],
      bodyRevision: 0,
      bodySnapshots: [],
      viewingRevision: 0,
      categorySlug: p.categorySlug || d.categorySlug,
    }));
    setLoadPreviewActive(true);
  }, [setDraft]);

  const handleLoadPostDeleted = useCallback((postId: number) => {
    setLoadPreviewActive(false);
    if (draft.postId === postId) {
      clearEditorForLoad();
    }
  }, [draft.postId, clearEditorForLoad]);

  const onBodyChange = useCallback((html: string) => {
    setDraft(d => ({ ...d, body: html }));
  }, [setDraft]);

  const pastePreviewToBody = useCallback((img: PreviewImage) => {
    const alt = (img.alt || img.keyword || '이미지').slice(0, 100);
    const figure = buildBodyImageFigureHtml(img.url, alt);
    const posLabel = { inline: '커서', top: '상', bottom: '하' }[insertPosition];
    appendBodyHtml(figure, insertPosition);
    onPasteStatus?.(`✅ 「${img.keyword || alt}」 → ${posLabel}에 넣었습니다.`);
  }, [appendBodyHtml, insertPosition, onPasteStatus]);

  const hasEditorContent = Boolean(
    draft.title.trim() || draft.excerpt.trim() || stripBodyPlain(draft.body).length > 0,
  );

  const catName = categories.find(c => c.slug === draft.categorySlug)?.name ?? '카테고리 없음';

  const featuredImageUrl = useMemo(
    () => resolveFeaturedImageUrl(draft.body, draft.previewImages.map(p => p.url)),
    [draft.body, draft.previewImages],
  );

  const previewBodyHtml = useMemo(() => bodyHtmlForPreview(draft.body), [draft.body]);

  /** 본문에 이미지가 있으면 대표 히어로를 생략 — 상·하 중복 표시 방지 */
  const previewHeroUrl = useMemo(() => {
    const published = bodyHtmlForPublish(draft.body);
    if (firstImageUrlFromHtml(published)) return null;
    return featuredImageUrl;
  }, [draft.body, featuredImageUrl]);

  const showMainEditor = (!pickerOpen || loadPreviewActive) && phase !== 'preview';

  const openPicker = () => {
    setLoadPreviewActive(false);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setLoadPreviewActive(false);
  };

  const goPreview = async () => {
    if (!draft.categorySlug) {
      await msg.alert({
        screen: '3차 · 글쓰기 완성',
        message: '카테고리를 선택하지 않았습니다.',
        guidance: '카테고리 드롭다운에서 게시할 분류를 선택한 뒤 [배포/게시]를 눌러 주세요.',
        confirmLabel: '확인',
      });
      return;
    }
    setPhase('preview');
  };

  const handleViewPost = async () => {
    const result = await onViewPost();
    if (result.ok || result.silent) return;
    await msg.alert({
      screen: phase === 'preview' ? '4차 · 배포-미리보기' : '3차 · 글쓰기 완성',
      message: '게시된 글을 열 수 없습니다.',
      guidance: '먼저 [게시하기]로 글을 게시한 뒤 다시 시도해 주세요. 카테고리가 선택되어 있는지도 확인해 주세요.',
      confirmLabel: '확인',
    });
  };

  return (
    <div className="nfw-draft">
      <div className="nfw-draft__head">
        <span className="nfw-draft__phase-label">
          {phase === 'finalize' ? '3차 · 글쓰기 완성' : '4차 · 배포-미리보기'}
        </span>
        <div className="nfw-draft__head-actions">
          {phase === 'finalize' && (
            <>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-btn--primary nfw-publish-action-btn nfw-write-action-btn" onClick={goPreview}>
                배포/게시
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-publish-action-btn nfw-write-action-btn" onClick={() => void handleViewPost()}>
                게시글보기
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-publish-action-btn nfw-write-action-btn" onClick={openPicker}>
                게시글 가져오기
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-publish-action-btn nfw-write-action-btn" onClick={onSave}>
                임시저장
              </button>
            </>
          )}
          {phase === 'preview' && (
            <>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-btn--primary nfw-write-action-btn" onClick={onPublish}>
                게시하기
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-write-action-btn" onClick={() => void handleViewPost()}>
                게시글보기
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-write-action-btn" onClick={onBackToFinalize}>
                글 수정하기
              </button>
            </>
          )}
        </div>
      </div>

      {pickerOpen && (
        <PostLoadPanel
          categories={categories}
          hasEditorContent={hasEditorContent}
          onClearEditor={clearEditorForLoad}
          onApply={applyLoadedPost}
          onPreviewSelect={previewLoadedPost}
          onPostDeleted={handleLoadPostDeleted}
          onClose={closePicker}
          onStatus={onPasteStatus}
        />
      )}

      <div className={`nfw-draft__body${!showMainEditor ? ' nfw-draft__body--hidden' : ''}`}>
        <div className="nfw-fields-row">
          <div className="nfw-fields-row__pair">
            <label className="nfw-field nfw-field--cat">
              <span className="nfw-field__label">카테고리</span>
              <select
                className="nfw-field__input"
                value={draft.categorySlug}
                onChange={e => setDraft(d => ({ ...d, categorySlug: e.target.value }))}
              >
                <option value="">— 선택 —</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="nfw-field nfw-field--title">
              <span className="nfw-field__label">제목</span>
              <input
                className="nfw-field__input nfw-content-text"
                placeholder="제목 입력…"
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              />
            </label>
          </div>
          <div className="nfw-fields-row__summary">
            <label className="nfw-field nfw-field--excerpt">
              <span className="nfw-field__label">요약</span>
              <input
                className="nfw-field__input nfw-content-text"
                placeholder="요약 입력…"
                value={draft.excerpt}
                onChange={e => setDraft(d => ({ ...d, excerpt: e.target.value }))}
              />
            </label>
            <div className="nfw-field nfw-field--img-grid">
              <span className="nfw-field__label">미리보기 - 이미지</span>
              <ImagePreviewGrid
                images={draft.previewImages}
                loading={previewLoading}
                onRemove={onRemovePreviewImage}
                onPasteToBody={pastePreviewToBody}
              />
            </div>
          </div>
        </div>

        <div className="nfw-field nfw-field--body">
          <div className="nfw-field__body-header">
            <span className="nfw-field__label">본문 (이미지 {imageCount}개)</span>
          </div>
          <BodyEditor
            ref={bodyRef}
            body={draft.body}
            bodyRevision={draft.bodyRevision}
            bodySnapshots={draft.bodySnapshots}
            viewingRevision={draft.viewingRevision}
            onSelectRevision={onSelectBodyRevision}
            onChange={onBodyChange}
            placeholder="본문을 입력하세요… (좌측 AI 명령 → 우측 본문 즉시 반영)"
          />
        </div>
      </div>

      {phase === 'preview' && (
        <div className="nfw-draft__body nfw-draft__body--publish">
          <div className="nfw-publish-meta">
            <div className="nfw-publish-meta__row"><span>제목</span><strong>{draft.title || '—'}</strong></div>
            <div className="nfw-publish-meta__row"><span>카테고리</span><strong>{catName}</strong></div>
            <div className="nfw-publish-meta__row"><span>요약</span><strong>{draft.excerpt || '—'}</strong></div>
            <div className="nfw-publish-meta__row"><span>이미지</span><strong>{imageCount}개</strong></div>
            <div className="nfw-publish-meta__row">
              <span>대표이미지</span>
              <strong>{featuredImageUrl ? '있음' : '없음'}</strong>
            </div>
            <div className="nfw-publish-meta__row"><span>글자</span><strong>{stripBodyPlain(draft.body).length}자</strong></div>
            {draft.postId && <div className="nfw-publish-meta__row"><span>포스트 ID</span><strong>#{draft.postId}</strong></div>}
          </div>

          <div className="nfw-preview">
            <h3 className="nfw-preview__title">{draft.title || '제목 없음'}</h3>
            {draft.excerpt && <p className="nfw-preview__excerpt">{draft.excerpt}</p>}
            {previewHeroUrl ? (
              <div className="nfw-preview__hero" aria-label="대표 이미지">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewHeroUrl} alt={draft.title || '대표 이미지'} className="nfw-preview__hero-img" />
              </div>
            ) : !firstImageUrlFromHtml(bodyHtmlForPublish(draft.body)) ? (
              <div className="nfw-preview__hero nfw-preview__hero--empty" aria-label="대표 이미지 없음">
                <span aria-hidden="true">📷</span>
                <p>대표 이미지 없음</p>
              </div>
            ) : null}
            <div
              className="nfw-preview__body nfw-preview__body--final"
              dangerouslySetInnerHTML={{ __html: previewBodyHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
