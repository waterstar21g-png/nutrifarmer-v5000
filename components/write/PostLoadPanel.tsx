'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorCategory, EditorPost, PreviewImage } from './WriteEditor';
import { POSTS_API } from './WriteEditor';
import { ConfirmDialog } from './ConfirmDialog';
import { PostListGrid } from './PostListGrid';
import { extractImagesFromHtml, toPreviewImages } from '@/lib/write-post-images';
import { sortPostsByPublishDate } from '@/lib/v5000-content/post-sort';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

interface Props {
  categories: EditorCategory[];
  onApply: (post: EditorPost, images: PreviewImage[]) => void;
  onClose: () => void;
  hasEditorContent: boolean;
  onClearEditor: () => void;
  onPreviewSelect: (post: EditorPost, images: PreviewImage[]) => void;
  onPostDeleted?: (postId: number) => void;
  onStatus?: (msg: string) => void;
}

async function fetchPosts(
  params: Record<string, string>,
  onError?: (msg: string) => void,
): Promise<EditorPost[]> {
  const q = new URLSearchParams({ mine: '0', status: 'publish', ...params });
  try {
    const r = await fetch(`${POSTS_API}?${q}`, { credentials: 'same-origin' });
    const data = await r.json();
    if (!r.ok || !data.ok) {
      onError?.(data.message ?? `검색 실패 (HTTP ${r.status})`);
      return [];
    }
    return Array.isArray(data.posts) ? data.posts : [];
  } catch {
    onError?.('검색 요청 중 오류가 발생했습니다.');
    return [];
  }
}

export function PostLoadPanel({
  categories,
  onApply,
  onClose,
  hasEditorContent,
  onClearEditor,
  onPreviewSelect,
  onPostDeleted,
  onStatus,
}: Props) {
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(hasEditorContent);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pickerCat, setPickerCat] = useState('');
  const [titleQ, setTitleQ] = useState('');
  const [bodyQ, setBodyQ] = useState('');
  const [catPosts, setCatPosts] = useState<EditorPost[]>([]);
  const [titlePosts, setTitlePosts] = useState<EditorPost[]>([]);
  const [bodyPosts, setBodyPosts] = useState<EditorPost[]>([]);
  const [selected, setSelected] = useState<EditorPost | null>(null);
  const [editBody, setEditBody] = useState('');
  const [loadImages, setLoadImages] = useState<PreviewImage[]>([]);
  const [selectedImgId, setSelectedImgId] = useState<string | null>(null);
  const [titleSearched, setTitleSearched] = useState(false);
  const [bodySearched, setBodySearched] = useState(false);
  const [busy, setBusy] = useState(false);

  const allResults = useMemo(() => {
    let list: EditorPost[];
    if (pickerCat && !titleSearched && !bodySearched) {
      list = catPosts;
    } else {
      const map = new Map<number, EditorPost>();
      if (titleSearched) {
        for (const p of titlePosts) map.set(p.id, p);
      }
      if (bodySearched) {
        for (const p of bodyPosts) map.set(p.id, p);
      }
      if (!titleSearched && !bodySearched) {
        for (const p of catPosts) map.set(p.id, p);
      }
      list = [...map.values()];
    }
    if (pickerCat) {
      list = list.filter(p => p.categorySlug === pickerCat);
    }
    return sortPostsByPublishDate(list);
  }, [catPosts, titlePosts, bodyPosts, pickerCat, titleSearched, bodySearched]);

  const resetPanel = useCallback(() => {
    setPickerCat('');
    setTitleQ('');
    setBodyQ('');
    setCatPosts([]);
    setTitlePosts([]);
    setBodyPosts([]);
    setTitleSearched(false);
    setBodySearched(false);
    setSelected(null);
    setEditBody('');
    setLoadImages([]);
    setSelectedImgId(null);
  }, []);

  const selectPost = useCallback((p: EditorPost) => {
    setSelected(p);
    setEditBody(p.body);
    if (p.categorySlug) setPickerCat(p.categorySlug);
    setTitleQ(stripHtml(p.title));
    setBodyQ(stripHtml(p.excerpt));
    const imgs = toPreviewImages(extractImagesFromHtml(p.body));
    setLoadImages(imgs);
    setSelectedImgId(null);
    onPreviewSelect(p, imgs);
  }, [onPreviewSelect]);

  useEffect(() => {
    if (confirmOpen) return;
    resetPanel();
  }, [confirmOpen, resetPanel]);

  const searchParams = useCallback((extra: Record<string, string>) => {
    const base = { ...extra };
    if (pickerCat) base.category_slug = pickerCat;
    return base;
  }, [pickerCat]);

  const onPickerCatChange = useCallback((value: string) => {
    setPickerCat(value);
    setTitleQ('');
    setBodyQ('');
    setTitlePosts([]);
    setBodyPosts([]);
    setTitleSearched(false);
    setBodySearched(false);
    setSelected(null);
    setEditBody('');
    setLoadImages([]);
    setSelectedImgId(null);
  }, []);

  useEffect(() => {
    if (confirmOpen || !pickerCat) {
      setCatPosts([]);
      return;
    }
    void fetchPosts({ category_slug: pickerCat }, onStatus).then(setCatPosts);
  }, [pickerCat, confirmOpen, onStatus]);

  const searchTitle = () => {
    if (!titleQ.trim()) {
      onStatus?.('제목 검색어를 입력해 주세요.');
      return;
    }
    void fetchPosts(searchParams({ search_title: titleQ.trim() }), onStatus).then(rows => {
      const filtered = rows.filter(p => !pickerCat || p.categorySlug === pickerCat);
      setTitleSearched(true);
      setTitlePosts(filtered);
      if (filtered.length === 0) onStatus?.('제목 검색 결과가 없습니다.');
    });
  };

  const searchBody = () => {
    if (!bodyQ.trim()) {
      onStatus?.('요약 검색어를 입력해 주세요.');
      return;
    }
    void fetchPosts(searchParams({ search_body: bodyQ.trim() }), onStatus).then(rows => {
      const filtered = rows.filter(p => !pickerCat || p.categorySlug === pickerCat);
      setBodySearched(true);
      setBodyPosts(filtered);
      if (filtered.length === 0) onStatus?.('요약 검색 결과가 없습니다.');
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

  const handleApply = () => {
    if (!selected) return;
    onApply({ ...selected, body: editBody }, loadImages);
    onClose();
  };

  const handleDeleteConfirm = async () => {
    const post = selected;
    if (!post || busy) return;
    setDeleteConfirmOpen(false);
    setBusy(true);
    try {
      const r = await fetch(`${POSTS_API}/${post.id}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.message ?? `HTTP ${r.status}`);
      onStatus?.(`✅ 「${stripHtml(post.title)}」 글을 삭제했습니다.`);
      setSelected(null);
      setEditBody('');
      setLoadImages([]);
      setCatPosts(prev => prev.filter(p => p.id !== post.id));
      setTitlePosts(prev => prev.filter(p => p.id !== post.id));
      setBodyPosts(prev => prev.filter(p => p.id !== post.id));
      onPostDeleted?.(post.id);
    } catch (e) {
      onStatus?.(`❌ 삭제 실패: ${e instanceof Error ? e.message : '오류'}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`${POSTS_API}/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: stripHtml(selected.title),
          body: editBody,
          excerpt: stripHtml(selected.excerpt),
          categorySlug: selected.categorySlug,
          status: 'publish',
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.message ?? `HTTP ${r.status}`);
      onStatus?.(`✅ 「${stripHtml(selected.title)}」 글을 저장했습니다.`);
      if (data.post) {
        setSelected(prev => ({
          ...data.post,
          authorDisplayName: data.post.authorDisplayName ?? prev?.authorDisplayName ?? null,
        }));
      }
    } catch (e) {
      onStatus?.(`❌ 저장 실패: ${e instanceof Error ? e.message : '오류'}`);
    } finally {
      setBusy(false);
    }
  };

  const replaceImageInBody = (oldUrl: string, newUrl: string, newAlt: string) => {
    setEditBody(prev => prev.split(oldUrl).join(newUrl));
    setLoadImages(prev =>
      prev.map(img =>
        img.url === oldUrl ? { ...img, url: newUrl, alt: newAlt, keyword: newAlt } : img,
      ),
    );
  };

  const onReplaceFile = async (file: File) => {
    if (!selectedImgId || busy) return;
    const target = loadImages.find(i => i.id === selectedImgId);
    if (!target) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name.replace(/\.[^.]+$/, ''));
      const r = await fetch('/api/v5000/media', { method: 'POST', body: formData });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.message ?? `HTTP ${r.status}`);
      replaceImageInBody(target.url, data.url as string, (data.alt || target.alt).slice(0, 100));
      onStatus?.('✅ 이미지를 교체했습니다. [저장] 또는 [에디터에 적용]으로 반영하세요.');
    } catch (e) {
      onStatus?.(`❌ 이미지 교체 실패: ${e instanceof Error ? e.message : '오류'}`);
    } finally {
      setBusy(false);
    }
  };

  if (confirmOpen) {
    return (
      <ConfirmDialog
        title="게시글 가져오기"
        message="우측에 작성 중인 내용이 있습니다. 가져오기 창을 열면 하단 검색·미리보기는 초기화됩니다. 에디터 내용도 초기화할까요?"
        confirmLabel="초기화"
        cancelLabel="유지"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmOpen(false)}
      />
    );
  }

  return (
    <div className="nfw-load-panel">
      <div className="nfw-load-panel__head">
        <span className="nfw-load-panel__title">게시글 가져오기</span>
        <div className="nfw-load-panel__head-actions">
          <button type="button" className="nfw-btn nfw-btn--sm" onClick={onClose}>닫기</button>
        </div>
      </div>

      <section className="nfw-load-section nfw-load-section--search" aria-label="검색 조건">
        <span className="nfw-load-section__tab">검색 조건</span>
        <div className="nfw-load-section__inner">
          <div className="nfw-load-search-grid">
            <label className="nfw-load-field nfw-load-field--cat">
              <span className="nfw-load-field__label">카테고리</span>
              <select
                className="nfw-field__input"
                value={pickerCat}
                onChange={e => onPickerCatChange(e.target.value)}
              >
                <option value="">— 선택 —</option>
                {categories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="nfw-load-field nfw-load-field--title">
              <span className="nfw-load-field__label">제 목</span>
              <input
                className="nfw-field__input nfw-content-text"
                value={titleQ}
                onChange={e => setTitleQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') searchTitle(); }}
              />
              <button type="button" className="nfw-btn nfw-btn--sm nfw-load-field__search" onClick={searchTitle}>
                검색
              </button>
            </label>
            <label className="nfw-load-field nfw-load-field--summary">
              <span className="nfw-load-field__label">요 약</span>
              <input
                className="nfw-field__input nfw-content-text"
                value={bodyQ}
                onChange={e => setBodyQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') searchBody(); }}
              />
              <button type="button" className="nfw-btn nfw-btn--sm nfw-load-field__search" onClick={searchBody}>
                검색
              </button>
            </label>
          </div>
        </div>
      </section>

      <section className="nfw-load-section nfw-load-section--results" aria-label="검색 결과">
        <span className="nfw-load-section__tab">검색 결과</span>
        <div className="nfw-load-section__inner nfw-load-results-scroll">
          {allResults.length === 0 ? (
            <p className="nfw-load-section__empty">검색 조건을 입력하면 결과가 표시됩니다.</p>
          ) : (
            <PostListGrid
              posts={allResults}
              selectedId={selected?.id ?? null}
              onSelect={selectPost}
            />
          )}
        </div>
      </section>

      <section className="nfw-load-section nfw-load-section--content" aria-label="검색 내용">
        <span className="nfw-load-section__tab">검색 내용</span>
        <div className="nfw-load-section__inner">
        {!selected ? (
          <p className="nfw-load-section__empty">검색결과에서 글을 선택하면 내용이 표시됩니다.</p>
        ) : (
          <div className="nfw-load-content">
            <div className="nfw-load-content__actions">
              <button type="button" className="nfw-btn nfw-btn--sm nfw-btn--primary" onClick={handleApply} disabled={busy}>
                에디터에 적용
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm" onClick={handleSaveEdit} disabled={busy}>
                글 수정 저장
              </button>
              <button type="button" className="nfw-btn nfw-btn--sm nfw-btn--danger" onClick={() => setDeleteConfirmOpen(true)} disabled={busy}>
                글 삭제
              </button>
            </div>

            <label className="nfw-load-row__ctrl">
              <span className="nfw-load-row__label">제목</span>
              <input className="nfw-field__input nfw-content-text" value={stripHtml(selected.title)} readOnly />
            </label>

            <label className="nfw-load-row__ctrl">
              <span className="nfw-load-row__label">내용</span>
              <input className="nfw-field__input nfw-content-text" value={stripHtml(selected.excerpt)} readOnly />
            </label>

            <div className="nfw-load-row nfw-load-row--images">
              <div className="nfw-load-row__ctrl">
                <span className="nfw-load-row__label">이미지</span>
                <input className="nfw-field__input nfw-content-text" value={imageSummary} readOnly />
              </div>
              <div className="nfw-load-img-grid" role="list" aria-label="선택 글 이미지">
                {loadImages.map(img => (
                  <button
                    key={img.id}
                    type="button"
                    role="listitem"
                    className={`nfw-load-img-grid__cell${selectedImgId === img.id ? ' is-selected' : ''}`}
                    title={img.alt}
                    onClick={() => setSelectedImgId(img.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="nfw-load-img-grid__img" loading="lazy" />
                  </button>
                ))}
              </div>
              <div className="nfw-load-content__img-actions">
                <input
                  ref={replaceFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void onReplaceFile(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  className="nfw-btn nfw-btn--sm"
                  disabled={!selectedImgId || busy}
                  onClick={() => replaceFileRef.current?.click()}
                >
                  선택 이미지 교체
                </button>
              </div>
            </div>

            <label className="nfw-load-row__ctrl nfw-load-row__ctrl--body">
              <span className="nfw-load-row__label">글의본문</span>
              <textarea
                className="nfw-field__textarea nfw-content-text nfw-load-content__body"
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                rows={8}
                spellCheck={false}
              />
            </label>
          </div>
        )}
        </div>
      </section>

      {deleteConfirmOpen && (
        <ConfirmDialog
          title="글 삭제"
          message="목록에서 글과 그림을 삭제 하시겠습니까?"
          confirmLabel="삭제"
          cancelLabel="아니오"
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}
