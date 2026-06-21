'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { DraftPanel } from './DraftPanel';
import { ChatPanel } from './ChatPanel';

const WP = process.env.NEXT_PUBLIC_WP_API_URL ?? 'https://www.nutrifarmer.kr/wp-json';

export interface WpCategory { id: number; name: string; slug: string; }
export interface WpPost {
  id: number; title: { rendered: string }; content: { rendered: string };
  excerpt: { rendered: string }; categories: number[]; status: string; link: string;
}

export interface DraftState {
  categoryId: number;
  title: string;
  excerpt: string;
  body: string;
  images: InsertedImage[];
  postId: number | null;       // 기존 글 수정시
}

export interface InsertedImage {
  id: string;
  url: string;
  alt: string;
  position: 'top' | 'inline' | 'bottom';
}

const EMPTY_DRAFT: DraftState = {
  categoryId: 0, title: '', excerpt: '', body: '', images: [], postId: null,
};

/* ──────────────────────────────────────────── */
export function WriteEditor() {
  const [categories, setCategories] = useState<WpCategory[]>([]);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [tab, setTab] = useState<'correct' | 'publish'>('correct');
  const [splitPct, setSplitPct] = useState(50);
  const [status, setStatus] = useState('');
  const splitRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  /* 카테고리 로드 */
  useEffect(() => {
    fetch(`${WP}/wp/v2/categories?per_page=50&hide_empty=false`)
      .then(r => r.json())
      .then((cats: WpCategory[]) => setCategories(cats.filter(c => c.slug !== 'uncategorized')))
      .catch(() => {});
  }, []);

  /* 로컬 저장 */
  useEffect(() => {
    try { localStorage.setItem('nf-write-draft', JSON.stringify(draft)); } catch {}
  }, [draft]);

  /* 로컬 복원 */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nf-write-draft');
      if (saved) setDraft(JSON.parse(saved));
    } catch {}
  }, []);

  /* ── 스플리터 드래그 ── */
  const onSplitMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !splitRef.current) return;
      const parent = splitRef.current.parentElement!;
      const rect = parent.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(75, Math.max(25, pct)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  /* ── 기존 글 불러오기 ── */
  const loadPost = useCallback((post: WpPost) => {
    setDraft(d => ({
      ...d,
      postId: post.id,
      title: post.title.rendered.replace(/<[^>]+>/g, ''),
      excerpt: post.excerpt.rendered.replace(/<[^>]+>/g, ''),
      body: post.content.rendered.replace(/<[^>]+>/g, ''),
      categoryId: post.categories[0] ?? 0,
    }));
    setTab('correct');
    setStatus(`"${post.title.rendered.replace(/<[^>]+>/g, '')}" 불러옴`);
  }, []);

  /* ── WordPress에 저장/업데이트 ── */
  const saveToWP = useCallback(async (publish: boolean) => {
    setStatus('저장 중…');
    const body: Record<string, unknown> = {
      title: draft.title,
      content: buildContent(draft),
      excerpt: draft.excerpt,
      categories: draft.categoryId ? [draft.categoryId] : [],
      status: publish ? 'publish' : 'draft',
    };
    try {
      const endpoint = draft.postId
        ? `${WP}/wp/v2/posts/${draft.postId}`
        : `${WP}/wp/v2/posts`;
      const method = draft.postId ? 'PUT' : 'POST';
      const r = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const result: WpPost = await r.json();
      setDraft(d => ({ ...d, postId: result.id }));
      setStatus(publish ? `✅ 게시 완료 → ${result.link}` : '✅ 임시저장 완료');
    } catch (e) {
      setStatus(`❌ 저장 실패: ${e instanceof Error ? e.message : '네트워크 오류'}`);
    }
  }, [draft]);

  /* ── 이미지를 본문에 삽입 ── */
  const insertImage = useCallback((img: InsertedImage) => {
    setDraft(d => ({ ...d, images: [...d.images, img] }));
    const tag = `\n![${img.alt || '이미지'}](${img.url})\n`;
    setDraft(d => {
      const lines = d.body.split('\n');
      if (img.position === 'top') return { ...d, body: tag + d.body };
      if (img.position === 'bottom') return { ...d, body: d.body + tag };
      return d; // 'inline' → 커서 위치는 DraftPanel에서 처리
    });
  }, []);

  return (
    <div className="nfw-app">
      {/* ── 최상단 툴바 ── */}
      <header className="nfw-topbar">
        <div className="nfw-topbar__left">
          <Link href="/" className="nfw-topbar__home">← 홈</Link>
          <span className="nfw-topbar__badge">✨ AI 글쓰기</span>
          {draft.title && (
            <span className="nfw-topbar__doc-title">{draft.title}</span>
          )}
        </div>
        <div className="nfw-topbar__right">
          {status && <span className="nfw-topbar__status">{status}</span>}
          <button
            className="nfw-topbar__btn"
            onClick={() => { setDraft(EMPTY_DRAFT); setStatus('새 글 시작'); }}
          >새 글</button>
          <button
            className="nfw-topbar__btn"
            onClick={() => saveToWP(false)}
          >임시저장</button>
          <button
            className="nfw-topbar__btn nfw-topbar__btn--primary"
            onClick={() => { setTab('publish'); saveToWP(true); }}
          >게시</button>
          <a
            href="https://www.nutrifarmer.kr/wp-admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="nfw-topbar__btn"
          >WP 관리자</a>
        </div>
      </header>

      {/* ── 메인 레이아웃: 좌(채팅) | 스플리터 | 우(초안) ── */}
      <div className="nfw-layout">
        {/* 좌 — AI 채팅 + 탭 */}
        <div className="nfw-chat-col" style={{ flexBasis: `${splitPct}%`, maxWidth: `${splitPct}%` }}>
          <ChatPanel
            draft={draft}
            setDraft={setDraft}
            categories={categories}
            onInsertImage={insertImage}
            onLoadPost={loadPost}
            wpApiUrl={WP}
          />
        </div>

        {/* 스플리터 핸들 */}
        <div
          ref={splitRef}
          className="nfw-splitter"
          onMouseDown={onSplitMouseDown}
          title="좌우 드래그로 너비 조절"
        />

        {/* 우 — 스마트 초안 */}
        <div className="nfw-draft-col" style={{ flexBasis: `${100 - splitPct}%`, maxWidth: `${100 - splitPct}%` }}>
          <DraftPanel
            draft={draft}
            setDraft={setDraft}
            tab={tab}
            setTab={setTab}
            categories={categories}
            onSave={saveToWP}
            wpApiUrl={WP}
          />
        </div>
      </div>
    </div>
  );
}

/** 이미지 포지션을 반영해서 최종 본문 HTML 생성 */
function buildContent(draft: DraftState): string {
  const topImgs = draft.images
    .filter(i => i.position === 'top')
    .map(i => `<figure><img src="${i.url}" alt="${i.alt}" /></figure>`)
    .join('\n');
  const botImgs = draft.images
    .filter(i => i.position === 'bottom')
    .map(i => `<figure><img src="${i.url}" alt="${i.alt}" /></figure>`)
    .join('\n');
  return [topImgs, draft.body, botImgs].filter(Boolean).join('\n\n');
}
