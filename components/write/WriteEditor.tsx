'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { DraftPanel } from './DraftPanel';
import { ChatPanel } from './ChatPanel';

export const WP_API = process.env.NEXT_PUBLIC_WP_API_URL ?? 'https://www.nutrifarmer.kr/wp-json';

export interface WpCategory { id: number; name: string; slug: string; }
export interface WpPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories: number[];
  status: string;
  link: string;
}

export interface InsertedImage {
  id: string;
  url: string;
  alt: string;
  position: 'top' | 'inline' | 'bottom';
}

export interface DraftState {
  categoryId: number;
  title: string;
  excerpt: string;
  body: string;
  images: InsertedImage[];
  postId: number | null;
}

const EMPTY_DRAFT: DraftState = {
  categoryId: 0, title: '', excerpt: '', body: '', images: [], postId: null,
};

const LS_DRAFT_KEY = 'nf-write-draft-v2';

/* ───────────────────────────────────────── */
export function WriteEditor() {
  const [categories, setCategories] = useState<WpCategory[]>([]);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [tab, setTab]     = useState<'correct' | 'publish'>('correct');
  const [splitPct, setSplitPct] = useState(50);
  const [statusMsg, setStatusMsg] = useState('');
  const splitRef   = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  /* 상태 메시지 자동 소멸 */
  useEffect(() => {
    if (!statusMsg) return;
    const t = setTimeout(() => setStatusMsg(''), 4000);
    return () => clearTimeout(t);
  }, [statusMsg]);

  /* 카테고리 로드 (실패해도 무시) */
  useEffect(() => {
    fetch(`${WP_API}/wp/v2/categories?per_page=50&hide_empty=false`)
      .then(r => r.ok ? r.json() : [])
      .then((cats: WpCategory[]) =>
        setCategories(cats.filter((c: WpCategory) => c.slug !== 'uncategorized'))
      )
      .catch(() => {});
  }, []);

  /* localStorage 복원 (초기 1회) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY);
      if (raw) setDraft(JSON.parse(raw));
    } catch {}
  }, []);

  /* localStorage 자동 저장 */
  useEffect(() => {
    try { localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft)); } catch {}
  }, [draft]);

  /* ── 스플리터 드래그 ── */
  const onSplitDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const move = (e: MouseEvent) => {
      if (!isDragging.current || !splitRef.current) return;
      const rect = splitRef.current.parentElement!.getBoundingClientRect();
      const pct  = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(74, Math.max(26, pct)));
    };
    const up = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, []);

  /* ── 이미지 삽입 ── */
  const insertImage = useCallback((img: InsertedImage) => {
    setDraft(prev => {
      const tag = `\n![${img.alt || '이미지'}](${img.url})\n`;
      let body = prev.body;
      if (img.position === 'top')    body = tag + body;
      if (img.position === 'bottom') body = body + tag;
      return { ...prev, images: [...prev.images, img], body };
    });
  }, []);

  /* ── localStorage 저장 ── */
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft));
      setStatusMsg('✅ 임시저장 완료 (로컬)');
    } catch { setStatusMsg('❌ 저장 실패'); }
  }, [draft]);

  /* ── WordPress 게시 (선택적 — 실패해도 로컬 저장은 유지) ── */
  const publishToWP = useCallback(async () => {
    setStatusMsg('게시 중…');
    const body: Record<string, unknown> = {
      title:      draft.title || '(제목 없음)',
      content:    buildContent(draft),
      excerpt:    draft.excerpt,
      categories: draft.categoryId ? [draft.categoryId] : [],
      status:     'publish',
    };
    try {
      const url    = draft.postId ? `${WP_API}/wp/v2/posts/${draft.postId}` : `${WP_API}/wp/v2/posts`;
      const method = draft.postId ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (r.status === 401) {
        setStatusMsg('⚠️ WordPress 로그인 필요 → WP 관리자에서 로그인 후 재시도');
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const result: WpPost = await r.json();
      setDraft(d => ({ ...d, postId: result.id }));
      setStatusMsg(`✅ WordPress 게시 완료 → ${result.link}`);
    } catch (e) {
      setStatusMsg(`❌ WP 게시 실패: ${e instanceof Error ? e.message : '연결 오류'} (로컬 저장은 유지됨)`);
    }
  }, [draft]);

  /* ── 새 글 ── */
  const newDraft = useCallback(() => {
    if (draft.title || draft.body) {
      if (!confirm('현재 작성 중인 글을 지우고 새 글을 시작할까요?')) return;
    }
    setDraft(EMPTY_DRAFT);
    setTab('correct');
    setStatusMsg('새 글 시작');
  }, [draft]);

  /* ── 재교정: 배포 → 초안 ── */
  const goBackToCorrect = useCallback(() => {
    setTab('correct');
    setStatusMsg('⬅ 초안으로 돌아왔습니다. 내용을 수정하세요.');
  }, []);

  return (
    <div className="nfw-app">
      {/* 최상단 툴바 */}
      <header className="nfw-topbar">
        <div className="nfw-topbar__left">
          <Link href="/" className="nfw-topbar__home">← 홈</Link>
          <span className="nfw-topbar__badge">✨ AI 글쓰기</span>
          {draft.title && <span className="nfw-topbar__doc-title">{draft.title}</span>}
        </div>
        <div className="nfw-topbar__right">
          {statusMsg && <span className="nfw-topbar__status">{statusMsg}</span>}
          <button className="nfw-topbar__btn" onClick={newDraft}>새 글</button>
          <button className="nfw-topbar__btn" onClick={saveDraft}>임시저장</button>
          <button
            className="nfw-topbar__btn nfw-topbar__btn--primary"
            onClick={() => { setTab('publish'); publishToWP(); }}
          >게시</button>
          <a href="https://www.nutrifarmer.kr/wp-admin/" target="_blank" rel="noopener noreferrer"
            className="nfw-topbar__btn">WP 관리자</a>
        </div>
      </header>

      {/* 메인 레이아웃 */}
      <div className="nfw-layout">
        <div className="nfw-chat-col" style={{ flexBasis: `${splitPct}%`, maxWidth: `${splitPct}%` }}>
          <ChatPanel
            draft={draft}
            setDraft={setDraft}
            categories={categories}
            onInsertImage={insertImage}
            wpApiUrl={WP_API}
          />
        </div>

        <div ref={splitRef} className="nfw-splitter" onMouseDown={onSplitDown} />

        <div className="nfw-draft-col" style={{ flexBasis: `${100 - splitPct}%`, maxWidth: `${100 - splitPct}%` }}>
          <DraftPanel
            draft={draft}
            setDraft={setDraft}
            tab={tab}
            setTab={setTab}
            categories={categories}
            onSave={saveDraft}
            onPublish={publishToWP}
            onBackToCorrect={goBackToCorrect}
            wpApiUrl={WP_API}
          />
        </div>
      </div>
    </div>
  );
}

function buildContent(draft: DraftState): string {
  const top = draft.images.filter(i => i.position === 'top')
    .map(i => `<figure><img src="${i.url}" alt="${i.alt}" /></figure>`).join('\n');
  const bot = draft.images.filter(i => i.position === 'bottom')
    .map(i => `<figure><img src="${i.url}" alt="${i.alt}" /></figure>`).join('\n');
  return [top, draft.body.replace(/\n/g, '<br>'), bot].filter(Boolean).join('\n\n');
}
