'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import type { DraftState, WpCategory, WpPost, InsertedImage } from './WriteEditor';

interface Props {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  tab: 'correct' | 'publish';
  setTab: (t: 'correct' | 'publish') => void;
  categories: WpCategory[];
  onSave: (publish: boolean) => Promise<void>;
  wpApiUrl: string;
}

export function DraftPanel({ draft, setDraft, tab, setTab, categories, onSave, wpApiUrl }: Props) {
  const [postList, setPostList] = useState<WpPost[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [versions, setVersions] = useState<string[]>([]);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /* 포스트 가져오기 */
  const fetchPosts = useCallback(async (catId?: number) => {
    const url = catId
      ? `${wpApiUrl}/wp/v2/posts?categories=${catId}&per_page=30&_fields=id,title,excerpt,content,categories,status,link`
      : `${wpApiUrl}/wp/v2/posts?per_page=30&_fields=id,title,excerpt,content,categories,status,link`;
    try {
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) return;
      const posts: WpPost[] = await r.json();
      setPostList(posts);
    } catch {}
  }, [wpApiUrl]);

  useEffect(() => {
    if (pickerOpen) fetchPosts(draft.categoryId || undefined);
  }, [pickerOpen, draft.categoryId, fetchPosts]);

  /* 버전 저장 */
  const saveVersion = useCallback(() => {
    if (!draft.body.trim()) return;
    setVersions(v => [draft.body, ...v].slice(0, 10));
  }, [draft.body]);

  /* 이미지 커서 위치 삽입 */
  const insertImageAtCursor = useCallback((url: string, alt: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const tag = `\n![${alt}](${url})\n`;
    const newBody = draft.body.slice(0, pos) + tag + draft.body.slice(pos);
    setDraft(d => ({ ...d, body: newBody }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(pos + tag.length, pos + tag.length);
    });
  }, [draft.body, setDraft]);

  /* 글 목록 필터 */
  const filteredPosts = pickerQuery
    ? postList.filter(p => p.title.rendered.toLowerCase().includes(pickerQuery.toLowerCase()))
    : postList;

  const catName = categories.find(c => c.id === draft.categoryId)?.name ?? '카테고리 없음';

  return (
    <div className="nfw-draft">
      {/* 탭 헤더 */}
      <div className="nfw-draft__head">
        <div className="nfw-draft__tabs">
          <button
            className={`nfw-draft__tab${tab === 'correct' ? ' is-active' : ''}`}
            onClick={() => setTab('correct')}
          >📝 교정 (초안)</button>
          <button
            className={`nfw-draft__tab${tab === 'publish' ? ' is-active' : ''}`}
            onClick={() => setTab('publish')}
          >🚀 배포</button>
        </div>
        <div className="nfw-draft__head-actions">
          {tab === 'correct' && (
            <>
              <button className="nfw-btn nfw-btn--sm" onClick={() => setPickerOpen(v => !v)}>
                가져오기
              </button>
              <button className="nfw-btn nfw-btn--sm" onClick={saveVersion}>버전저장</button>
              <button className="nfw-btn nfw-btn--sm" onClick={() => onSave(false)}>임시저장</button>
            </>
          )}
          {tab === 'publish' && (
            <>
              <button className="nfw-btn nfw-btn--sm" onClick={() => setTab('correct')}>← 교정</button>
              <button className="nfw-btn nfw-btn--sm nfw-btn--primary" onClick={() => onSave(true)}>게시</button>
            </>
          )}
        </div>
      </div>

      {/* 포스트 피커 */}
      {pickerOpen && (
        <div className="nfw-picker">
          <div className="nfw-picker__head">
            <span>기존 글 불러오기</span>
            <input
              className="nfw-picker__search"
              placeholder="제목 검색…"
              value={pickerQuery}
              onChange={e => setPickerQuery(e.target.value)}
              autoFocus
            />
            <button className="nfw-btn nfw-btn--sm" onClick={() => setPickerOpen(false)}>✕</button>
          </div>
          <ul className="nfw-picker__list">
            {filteredPosts.length === 0 && (
              <li className="nfw-picker__empty">글이 없습니다.</li>
            )}
            {filteredPosts.map(p => (
              <li key={p.id} className="nfw-picker__item">
                <button
                  className="nfw-picker__btn"
                  onClick={() => {
                    setDraft(d => ({
                      ...d,
                      postId: p.id,
                      title: p.title.rendered.replace(/<[^>]+>/g, ''),
                      excerpt: p.excerpt.rendered.replace(/<[^>]+>/g, ''),
                      body: p.content.rendered.replace(/<[^>]+>/g, ''),
                      categoryId: p.categories[0] ?? d.categoryId,
                    }));
                    setPickerOpen(false);
                  }}
                >
                  <span className="nfw-picker__title">{p.title.rendered.replace(/<[^>]+>/g, '')}</span>
                  <span className={`nfw-picker__status nfw-picker__status--${p.status}`}>{p.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 교정 탭 ── */}
      {tab === 'correct' && (
        <div className="nfw-draft__body">

          {/* 메타 필드 */}
          <div className="nfw-fields">
            <label className="nfw-field">
              <span className="nfw-field__label">카테고리</span>
              <select
                className="nfw-field__input"
                value={draft.categoryId}
                onChange={e => setDraft(d => ({ ...d, categoryId: Number(e.target.value) }))}
              >
                <option value={0}>— 선택 —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="nfw-field">
              <span className="nfw-field__label">제목</span>
              <input
                className="nfw-field__input"
                placeholder="제목 입력…"
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              />
            </label>

            <label className="nfw-field">
              <span className="nfw-field__label">요약</span>
              <input
                className="nfw-field__input"
                placeholder="요약 입력…"
                value={draft.excerpt}
                onChange={e => setDraft(d => ({ ...d, excerpt: e.target.value }))}
              />
            </label>
          </div>

          {/* 버전 히스토리 */}
          {versions.length > 0 && (
            <div className="nfw-versions">
              <span className="nfw-versions__label">버전 기록 ({versions.length})</span>
              {versions.map((v, i) => (
                <button
                  key={i}
                  className="nfw-versions__item"
                  onClick={() => setDraft(d => ({ ...d, body: v }))}
                  title={v.slice(0, 60)}
                >
                  v{versions.length - i}
                </button>
              ))}
            </div>
          )}

          {/* 이미지 삽입 위치 선택 바 */}
          <ImageInsertBar
            images={draft.images}
            onInsertAtCursor={insertImageAtCursor}
            onRemove={id => setDraft(d => ({ ...d, images: d.images.filter(img => img.id !== id) }))}
          />

          {/* 본문 textarea */}
          <label className="nfw-field nfw-field--body">
            <span className="nfw-field__label">
              본문
              <span className="nfw-field__hint"> (이미지: 사진·이미지 탭에서 삽입)</span>
            </span>
            <textarea
              ref={bodyRef}
              className="nfw-field__textarea"
              placeholder="본문을 입력하세요…"
              value={draft.body}
              onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
              spellCheck
            />
          </label>

          {/* 삽입된 이미지 스트립 */}
          {draft.images.length > 0 && (
            <div className="nfw-img-strip">
              <span className="nfw-img-strip__label">📎 삽입 이미지 ({draft.images.length})</span>
              <div className="nfw-img-strip__list">
                {draft.images.map(img => (
                  <div key={img.id} className="nfw-img-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="nfw-img-thumb__img" />
                    <span className="nfw-img-thumb__pos">{img.position}</span>
                    <button
                      className="nfw-img-thumb__del"
                      onClick={() => setDraft(d => ({ ...d, images: d.images.filter(x => x.id !== img.id) }))}
                      title="제거"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 배포 탭 ── */}
      {tab === 'publish' && (
        <div className="nfw-draft__body nfw-draft__body--publish">
          <div className="nfw-publish-meta">
            <div className="nfw-publish-meta__row"><span>제목</span><strong>{draft.title || '—'}</strong></div>
            <div className="nfw-publish-meta__row"><span>카테고리</span><strong>{catName}</strong></div>
            <div className="nfw-publish-meta__row"><span>요약</span><strong>{draft.excerpt || '—'}</strong></div>
            <div className="nfw-publish-meta__row"><span>이미지</span><strong>{draft.images.length}개</strong></div>
            <div className="nfw-publish-meta__row"><span>글자 수</span><strong>{draft.body.length}자</strong></div>
            {draft.postId && <div className="nfw-publish-meta__row"><span>포스트 ID</span><strong>#{draft.postId}</strong></div>}
          </div>

          {/* 미리보기 */}
          <div className="nfw-preview">
            <h3 className="nfw-preview__title">{draft.title || '제목 없음'}</h3>
            <p className="nfw-preview__excerpt">{draft.excerpt}</p>
            <div
              className="nfw-preview__body"
              dangerouslySetInnerHTML={{ __html: draft.body.replace(/\n/g, '<br>') }}
            />
          </div>

          <div className="nfw-publish-actions">
            <button className="nfw-btn nfw-btn--ghost" onClick={() => onSave(false)}>임시저장</button>
            <button className="nfw-btn nfw-btn--primary nfw-btn--lg" onClick={() => onSave(true)}>
              🚀 {draft.postId ? '업데이트 게시' : '새 글 게시'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* 이미지 삽입 위치 선택 바 */
function ImageInsertBar({ images, onInsertAtCursor, onRemove }: {
  images: InsertedImage[];
  onInsertAtCursor: (url: string, alt: string) => void;
  onRemove: (id: string) => void;
}) {
  if (images.length === 0) return null;
  const inlineImgs = images.filter(i => i.position === 'inline');
  if (inlineImgs.length === 0) return null;

  return (
    <div className="nfw-insert-bar">
      <span className="nfw-insert-bar__label">커서 위치에 삽입 가능한 이미지:</span>
      {inlineImgs.map(img => (
        <button
          key={img.id}
          className="nfw-insert-bar__btn"
          onClick={() => onInsertAtCursor(img.url, img.alt)}
          title="커서 위치에 삽입"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt} width={32} height={24} style={{ objectFit: 'cover', borderRadius: 4 }} />
          삽입
        </button>
      ))}
    </div>
  );
}
