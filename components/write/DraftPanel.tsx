'use client';

import { useState, useRef, useCallback } from 'react';
import type { DraftState, EditorCategory, EditorPost, InsertedImage, PreviewImage, WritePhase } from './WriteEditor';
import type { ImagePastePosition } from './ImagePreviewGrid';
import { ImagePreviewGrid } from './ImagePreviewGrid';
import { PostLoadPanel } from './PostLoadPanel';
import { BodyEditor } from './BodyEditor';
import { stripBodyPlain, bodyHtmlForPreview } from '@/lib/write-body-plain';
import { buildBodyImageFigureHtml, normalizeBodyImagesForEditor } from '@/lib/write-body-images';
import { useWriteMessage } from './WriteMessageContext';

interface Props {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  phase: WritePhase;
  setPhase: (p: WritePhase) => void;
  categories: EditorCategory[];
  onSave: () => void;
  onPublish: () => void;
  onBackToFinalize: () => void;
  onViewPost: () => void;
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
  categories, onSave, onPublish, onBackToFinalize, onViewPost,
  previewLoading, onRemovePreviewImage, onPasteStatus, onSelectBodyRevision,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [versions, setVersions] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const msg = useWriteMessage();

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
        setDraft(d => ({ ...d, body: normalizeBodyImagesForEditor(el.innerHTML) }));
        return;
      }
    }
    setDraft(d => ({
      ...d,
      body: position === 'top'
        ? normalizeBodyImagesForEditor(html + d.body)
        : normalizeBodyImagesForEditor(d.body + html),
    }));
  }, [setDraft]);

  const insertImageAtCursor = useCallback((url: string, alt: string) => {
    appendBodyHtml(buildBodyImageFigureHtml(url, alt), 'inline');
  }, [appendBodyHtml]);

  const saveVersion = useCallback(() => {
    if (!draft.body.trim()) return;
    setVersions(v => [draft.body, ...v].slice(0, 10));
    onSave();
  }, [draft.body, onSave]);

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
      body: normalizeBodyImagesForEditor(p.body),
      previewImages: images,
      images: [],
      bodyRevision: 0,
      bodySnapshots: [],
      viewingRevision: 0,
      categorySlug: p.categorySlug || d.categorySlug,
    }));
    setPickerOpen(false);
    setPhase('finalize');
    onPasteStatus?.(`✅ 「${stripHtml(p.title)}」 글을 에디터에 적용했습니다.`);
  }, [setDraft, setPhase, onPasteStatus]);

  const onBodyChange = useCallback((html: string) => {
    setDraft(d => ({ ...d, body: html }));
  }, [setDraft]);

  const pastePreviewToBody = useCallback((img: PreviewImage, position: ImagePastePosition) => {
    const alt = (img.alt || img.keyword || '이미지').slice(0, 100);
    const figure = buildBodyImageFigureHtml(img.url, alt);
    const entry: InsertedImage = {
      id: `img-${Date.now()}`,
      url: img.url,
      alt,
      position,
    };
    const posLabel = { inline: '커서 위치', top: '본문상', bottom: '본문하' }[position];

    appendBodyHtml(figure, position);
    setDraft(d => ({ ...d, images: [...d.images, entry] }));
    onPasteStatus?.(`✅ 「${img.keyword || alt}」 → ${posLabel}에 넣었습니다.`);
  }, [appendBodyHtml, setDraft, onPasteStatus]);

  const hasEditorContent = Boolean(
    draft.title.trim() || draft.excerpt.trim() || stripBodyPlain(draft.body).length > 0,
  );

  const catName = categories.find(c => c.slug === draft.categorySlug)?.name ?? '카테고리 없음';
  const inlineImgs = draft.images.filter(i => i.position === 'inline');

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

  return (
    <div className="nfw-draft">
      <div className="nfw-draft__head">
        <span className="nfw-draft__phase-label">
          {phase === 'finalize' ? '3차 · 글쓰기 완성' : '4차 · 배포-미리보기'}
        </span>
        <div className="nfw-draft__head-actions">
          {phase === 'finalize' && (
            <>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-btn--primary" onClick={goPreview}>
                배포/게시
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm" onClick={onViewPost}>
                게시글보기
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm" onClick={() => setPickerOpen(v => !v)}>
                등록글 가져오기
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm" onClick={saveVersion}>
                임시저장/버전관리
              </button>
            </>
          )}
          {phase === 'preview' && (
            <>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-btn--primary" onClick={onPublish}>
                게시하기
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm" onClick={onViewPost}>
                게시글보기
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm" onClick={onBackToFinalize}>
                재교정하기
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
          onClose={() => setPickerOpen(false)}
        />
      )}

      {phase === 'finalize' && (
        <div className="nfw-draft__body">
          {versions.length > 0 && (
            <div className="nfw-versions">
              <span className="nfw-versions__label">버전</span>
              {versions.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  className="nfw-versions__item"
                  onClick={() => setDraft(d => ({ ...d, body: v }))}
                  title={v.slice(0, 60)}
                >
                  v{versions.length - i}
                </button>
              ))}
            </div>
          )}

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
                <span className="nfw-field__label">이미지 미리보기</span>
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
              <span className="nfw-field__label">본문</span>
              {inlineImgs.length > 0 && (
                <div className="nfw-insert-bar">
                  <span className="nfw-insert-bar__label">📍 커서 삽입:</span>
                  {inlineImgs.map(img => (
                    <button
                      key={img.id}
                      type="button"
                      className="nfw-insert-bar__btn"
                      onClick={() => insertImageAtCursor(img.url, img.alt)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt} width={28} height={20} style={{ objectFit: 'cover', borderRadius: 3 }} />
                      삽입
                    </button>
                  ))}
                </div>
              )}
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

          {draft.images.length > 0 && (
            <div className="nfw-img-strip">
              <span className="nfw-img-strip__label">📎 삽입 ({draft.images.length})</span>
              <div className="nfw-img-strip__list">
                {draft.images.map(img => (
                  <div key={img.id} className="nfw-img-thumb" title={img.alt}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="nfw-img-thumb__img" />
                    <span className="nfw-img-thumb__pos">
                      {{ top: '상단', inline: '커서', bottom: '하단' }[img.position]}
                    </span>
                    <button
                      type="button"
                      className="nfw-img-thumb__del"
                      onClick={() => setDraft(d => ({ ...d, images: d.images.filter(x => x.id !== img.id) }))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'preview' && (
        <div className="nfw-draft__body nfw-draft__body--publish">
          <div className="nfw-publish-meta">
            <div className="nfw-publish-meta__row"><span>제목</span><strong>{draft.title || '—'}</strong></div>
            <div className="nfw-publish-meta__row"><span>카테고리</span><strong>{catName}</strong></div>
            <div className="nfw-publish-meta__row"><span>요약</span><strong>{draft.excerpt || '—'}</strong></div>
            <div className="nfw-publish-meta__row"><span>이미지</span><strong>{draft.images.length}개</strong></div>
            <div className="nfw-publish-meta__row"><span>글자</span><strong>{stripBodyPlain(draft.body).length}자</strong></div>
            {draft.postId && <div className="nfw-publish-meta__row"><span>포스트 ID</span><strong>#{draft.postId}</strong></div>}
          </div>

          <div className="nfw-preview">
            <h3 className="nfw-preview__title">{draft.title || '제목 없음'}</h3>
            {draft.excerpt && <p className="nfw-preview__excerpt">{draft.excerpt}</p>}
            {draft.images.filter(i => i.position === 'top').map(img => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt={img.alt} style={{ maxWidth: '100%', borderRadius: 8, marginBottom: '0.75rem' }} />
            ))}
            <div
              className="nfw-preview__body nfw-preview__body--final"
              dangerouslySetInnerHTML={{ __html: bodyHtmlForPreview(draft.body) }}
            />
            {draft.images.filter(i => i.position === 'bottom').map(img => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt={img.alt} style={{ maxWidth: '100%', borderRadius: 8, marginTop: '0.75rem' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
