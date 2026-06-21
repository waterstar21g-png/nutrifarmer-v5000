'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { DraftState, WpCategory, WpPost, InsertedImage } from './WriteEditor';

interface Props {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  tab: 'correct' | 'publish';
  setTab: (t: 'correct' | 'publish') => void;
  categories: WpCategory[];
  onSave: () => void;
  onPublish: () => void;
  onBackToCorrect: () => void;
  wpApiUrl: string;
}

export function DraftPanel({
  draft, setDraft, tab, setTab,
  categories, onSave, onPublish, onBackToCorrect, wpApiUrl,
}: Props) {
  const [postList,    setPostList]    = useState<WpPost[]>([]);
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [pickerQ,     setPickerQ]     = useState('');
  const [versions,    setVersions]    = useState<string[]>([]);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /* 글 목록 가져오기 */
  const fetchPosts = useCallback(async () => {
    const url = draft.categoryId
      ? `${wpApiUrl}/wp/v2/posts?categories=${draft.categoryId}&per_page=30&_fields=id,title,excerpt,content,categories,status,link`
      : `${wpApiUrl}/wp/v2/posts?per_page=30&_fields=id,title,excerpt,content,categories,status,link`;
    try {
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) return;
      setPostList(await r.json());
    } catch {}
  }, [wpApiUrl, draft.categoryId]);

  useEffect(() => { if (pickerOpen) fetchPosts(); }, [pickerOpen, fetchPosts]);

  /* 버전 저장 */
  const saveVersion = useCallback(() => {
    if (!draft.body.trim()) return;
    setVersions(v => [draft.body, ...v].slice(0, 10));
  }, [draft.body]);

  /* 커서 위치에 이미지 삽입 */
  const insertImageAtCursor = useCallback((url: string, alt: string) => {
    const ta = bodyRef.current;
    if (!ta) { setDraft(d => ({ ...d, body: `${d.body}\n![${alt}](${url})\n` })); return; }
    const pos = ta.selectionStart ?? draft.body.length;
    const tag  = `\n![${alt}](${url})\n`;
    setDraft(d => ({
      ...d,
      body: d.body.slice(0, pos) + tag + d.body.slice(pos),
    }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(pos + tag.length, pos + tag.length);
    });
  }, [draft.body, setDraft]);

  /* 기존 글 불러와 초안에 적용 */
  const loadPost = useCallback((p: WpPost) => {
    setDraft(d => ({
      ...d,
      postId: p.id,
      title:   p.title.rendered.replace(/<[^>]+>/g, ''),
      excerpt: p.excerpt.rendered.replace(/<[^>]+>/g, ''),
      body:    p.content.rendered.replace(/<[^>]+>/g, ''),
      categoryId: p.categories[0] ?? d.categoryId,
    }));
    setPickerOpen(false);
    setTab('correct');
  }, [setDraft, setTab]);

  const filtered = pickerQ
    ? postList.filter(p => p.title.rendered.toLowerCase().includes(pickerQ.toLowerCase()))
    : postList;

  const catName = categories.find(c => c.id === draft.categoryId)?.name ?? '카테고리 없음';

  /* 인라인 삽입 대기 이미지 */
  const inlineImgs = draft.images.filter(i => i.position === 'inline');

  return (
    <div className="nfw-draft">
      {/* 탭 헤더 */}
      <div className="nfw-draft__head">
        <div className="nfw-draft__tabs">
          <button className={`nfw-draft__tab${tab === 'correct' ? ' is-active' : ''}`} onClick={() => setTab('correct')}>
            📝 교정 (초안)
          </button>
          <button className={`nfw-draft__tab${tab === 'publish' ? ' is-active' : ''}`} onClick={() => setTab('publish')}>
            🚀 배포
          </button>
        </div>
        <div className="nfw-draft__head-actions">
          {tab === 'correct' && (
            <>
              <button className="nfw-btn nfw-btn--sm" onClick={() => setPickerOpen(v => !v)}>가져오기</button>
              <button className="nfw-btn nfw-btn--sm" onClick={saveVersion}>버전저장</button>
              <button className="nfw-btn nfw-btn--sm" onClick={onSave}>임시저장</button>
            </>
          )}
          {tab === 'publish' && (
            <>
              <button className="nfw-btn nfw-btn--sm" onClick={onBackToCorrect}>⬅ 재교정</button>
              <button className="nfw-btn nfw-btn--sm nfw-btn--primary" onClick={onPublish}>🚀 게시</button>
            </>
          )}
        </div>
      </div>

      {/* 포스트 피커 */}
      {pickerOpen && (
        <div className="nfw-picker">
          <div className="nfw-picker__head">
            <span>기존 글 불러오기</span>
            <input className="nfw-picker__search" placeholder="제목 검색…" value={pickerQ}
              onChange={e => setPickerQ(e.target.value)} autoFocus />
            <button className="nfw-btn nfw-btn--sm" onClick={() => setPickerOpen(false)}>✕</button>
          </div>
          <ul className="nfw-picker__list">
            {filtered.length === 0 && <li className="nfw-picker__empty">글이 없거나 WP 로그인 필요</li>}
            {filtered.map(p => (
              <li key={p.id} className="nfw-picker__item">
                <button className="nfw-picker__btn" onClick={() => loadPost(p)}>
                  <span className="nfw-picker__title">{p.title.rendered.replace(/<[^>]+>/g, '')}</span>
                  <span className={`nfw-picker__status nfw-picker__status--${p.status}`}>{p.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 교정(초안) 탭 ── */}
      {tab === 'correct' && (
        <div className="nfw-draft__body">
          {/* 버전 히스토리 */}
          {versions.length > 0 && (
            <div className="nfw-versions">
              <span className="nfw-versions__label">버전</span>
              {versions.map((v, i) => (
                <button key={i} className="nfw-versions__item"
                  onClick={() => setDraft(d => ({ ...d, body: v }))} title={v.slice(0, 60)}>
                  v{versions.length - i}
                </button>
              ))}
            </div>
          )}

          {/* 메타 필드: 카테고리·제목·요약 — 3단 한 줄 */}
          <div className="nfw-fields-row">
            <label className="nfw-field">
              <span className="nfw-field__label">카테고리</span>
              <select className="nfw-field__input"
                value={draft.categoryId}
                onChange={e => setDraft(d => ({ ...d, categoryId: Number(e.target.value) }))}>
                <option value={0}>— 선택 —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="nfw-field">
              <span className="nfw-field__label">제목</span>
              <input className="nfw-field__input" placeholder="제목 입력…"
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            </label>
            <label className="nfw-field">
              <span className="nfw-field__label">요약</span>
              <input className="nfw-field__input" placeholder="요약 입력…"
                value={draft.excerpt}
                onChange={e => setDraft(d => ({ ...d, excerpt: e.target.value }))} />
            </label>
          </div>

          {/* 본문 — 라벨 우측에 이미지 삽입 바 */}
          <label className="nfw-field nfw-field--body">
            <div className="nfw-field__body-header">
              <span className="nfw-field__label">본문</span>
              {/* 이미지 삽입 바 — 본문 라벨 우측 */}
              {inlineImgs.length > 0 && (
                <div className="nfw-insert-bar">
                  <span className="nfw-insert-bar__label">📍 커서 삽입:</span>
                  {inlineImgs.map(img => (
                    <button key={img.id} className="nfw-insert-bar__btn"
                      onClick={() => insertImageAtCursor(img.url, img.alt)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt} width={28} height={20}
                        style={{ objectFit: 'cover', borderRadius: 3 }} />
                      삽입
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              ref={bodyRef}
              className="nfw-field__textarea"
              placeholder="본문을 입력하세요… (사진·이미지 탭에서 이미지 삽입 가능)"
              value={draft.body}
              onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
              spellCheck
            />
          </label>

          {/* 삽입된 이미지 스트립 */}
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
                    <button className="nfw-img-thumb__del"
                      onClick={() => setDraft(d => ({ ...d, images: d.images.filter(x => x.id !== img.id) }))}>
                      ✕
                    </button>
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
            <div className="nfw-publish-meta__row"><span>글자</span><strong>{draft.body.length}자</strong></div>
            {draft.postId && <div className="nfw-publish-meta__row"><span>포스트 ID</span><strong>#{draft.postId}</strong></div>}
          </div>

          {/* 미리보기 */}
          <div className="nfw-preview">
            <h3 className="nfw-preview__title">{draft.title || '제목 없음'}</h3>
            {draft.excerpt && <p className="nfw-preview__excerpt">{draft.excerpt}</p>}
            {/* 상단 이미지 */}
            {draft.images.filter(i => i.position === 'top').map(img => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt={img.alt}
                style={{ maxWidth: '100%', borderRadius: 8, marginBottom: '0.75rem' }} />
            ))}
            <div className="nfw-preview__body"
              dangerouslySetInnerHTML={{ __html: draft.body.replace(/\n/g, '<br>').replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:6px;margin:0.5rem 0;" />') }}
            />
            {/* 하단 이미지 */}
            {draft.images.filter(i => i.position === 'bottom').map(img => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt={img.alt}
                style={{ maxWidth: '100%', borderRadius: 8, marginTop: '0.75rem' }} />
            ))}
          </div>

          <div className="nfw-publish-actions">
            <button className="nfw-btn nfw-btn--ghost" onClick={onBackToCorrect}>⬅ 재교정 (초안으로)</button>
            <button className="nfw-btn nfw-btn--sm" onClick={onSave}>임시저장</button>
            <button className="nfw-btn nfw-btn--primary nfw-btn--lg" onClick={onPublish}>
              🚀 {draft.postId ? '업데이트 게시' : '새 글 게시'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
