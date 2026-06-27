'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SHOWCASE_CATS } from '@/lib/site-data';
import type { V5000Category, V5000PostDto } from '@/lib/v5000-content/types';
import { AuthStatus } from '@/components/auth/AuthStatus';
import { bindWritePopupToOpener, goToMainHome, goToMainPostView } from '@/lib/write-popup';
import { openAuthFromWritePopup } from '@/lib/auth-navigation';
import { DraftPanel } from './DraftPanel';
import { ChatPanel } from './ChatPanel';
import { NewDraftConfirmDialog } from './NewDraftConfirmDialog';
import { WriteMessageProvider } from './WriteMessageContext';
import type { AiCmdId } from '@/lib/write-ai-local';
import { extractSummaryFromAi, extractTitleFromAi } from '@/lib/write-ai-commands';
import { applyRevisionDiff } from '@/lib/write-body-diff';
import { stripBodyPlain, bodyHtmlForPublish } from '@/lib/write-body-plain';
import { fetchSuggestedImages } from '@/lib/write-image-suggest';

export const CONTENT_API = '/api/v5000';
export const MEDIA_API = `${CONTENT_API}/media`;
export const POSTS_API = `${CONTENT_API}/posts`;

export type { V5000Category as EditorCategory, V5000PostDto as EditorPost };
export type WritePhase = 'finalize' | 'preview';

export interface InsertedImage {
  id: string;
  url: string;
  alt: string;
  position: 'top' | 'inline' | 'bottom';
}

export interface PreviewImage {
  id: string;
  url: string;
  alt: string;
  keyword: string;
}

export interface DraftState {
  categorySlug: string;
  title: string;
  excerpt: string;
  body: string;
  bodyRevision: number;
  /** bodySnapshots[0]=원본, [n]=n차 AI 반영 직후 */
  bodySnapshots: string[];
  viewingRevision: number;
  images: InsertedImage[];
  previewImages: PreviewImage[];
  postId: number | null;
  postSlug: string;
}

const EMPTY_DRAFT: DraftState = {
  categorySlug: '', title: '', excerpt: '', body: '', bodyRevision: 0,
  bodySnapshots: [], viewingRevision: 0,
  images: [], previewImages: [], postId: null, postSlug: '',
};

const LS_DRAFT_KEY = 'nf-write-draft-v5';
const CATEGORIES: V5000Category[] = SHOWCASE_CATS.map(c => ({ slug: c.slug, name: c.name }));

const PHASE_LABEL: Record<WritePhase, string> = {
  finalize: '3차 · 글쓰기 완성',
  preview: '4차 · 배포-미리보기',
};

export function WriteEditor() {
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [phase, setPhase] = useState<WritePhase>('finalize');
  const [splitPct, setSplitPct] = useState(50);
  const [statusMsg, setStatusMsg] = useState('');
  const [newDraftConfirmOpen, setNewDraftConfirmOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const newDraftResolveRef = useRef<((ok: boolean) => void) | null>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    bindWritePopupToOpener();
  }, []);

  useEffect(() => {
    if (!statusMsg) return;
    const t = setTimeout(() => setStatusMsg(''), 4000);
    return () => clearTimeout(t);
  }, [statusMsg]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftState;
        setDraft({
          ...EMPTY_DRAFT,
          ...parsed,
          bodyRevision: parsed.bodyRevision ?? 0,
          bodySnapshots: parsed.bodySnapshots ?? [],
          viewingRevision: parsed.viewingRevision ?? parsed.bodyRevision ?? 0,
          postSlug: parsed.postSlug ?? '',
          previewImages: parsed.previewImages ?? [],
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft)); } catch {}
  }, [draft]);

  const onSplitDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const move = (e: MouseEvent) => {
      if (!isDragging.current || !splitRef.current) return;
      const rect = splitRef.current.parentElement!.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
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

  const insertImage = useCallback((img: InsertedImage) => {
    setDraft(prev => {
      const tag = `\n![${img.alt || '이미지'}](${img.url})\n`;
      let body = prev.body;
      if (img.position === 'top') body = tag + body;
      if (img.position === 'bottom') body = body + tag;
      return { ...prev, images: [...prev.images, img], body };
    });
  }, []);

  const handleAiApply = useCallback((text: string, cmdId: AiCmdId) => {
    const clean = text.trim();
    if (!clean || clean.startsWith('⚠️')) {
      setStatusMsg(clean.split('\n')[0] || '⚠️ AI 응답을 적용하지 못했습니다.');
      return;
    }

    if (cmdId === 'title') {
      setDraft(prev => ({ ...prev, title: extractTitleFromAi(clean) }));
      setPhase('finalize');
      setStatusMsg('✅ AI 제목을 우측 [제목]에 반영했습니다.');
      return;
    }
    if (cmdId === 'summary') {
      setDraft(prev => ({ ...prev, excerpt: extractSummaryFromAi(clean) }));
      setPhase('finalize');
      setStatusMsg('✅ AI 요약을 우측 [요약]에 반영했습니다.');
      return;
    }

    let revNum = 1;
    setDraft(prev => {
      revNum = prev.bodyRevision + 1;
      const snapshots = prev.bodySnapshots.slice(0, prev.bodyRevision + 1);
      if (snapshots[0] === undefined) {
        snapshots[0] = prev.body;
      }
      const body = applyRevisionDiff(prev.body, clean, revNum);
      snapshots[revNum] = body;
      return {
        ...prev,
        body,
        bodyRevision: revNum,
        bodySnapshots: snapshots,
        viewingRevision: revNum,
      };
    });
    setPhase('finalize');
    setStatusMsg(`✅ AI 결과를 우측 [본문]에 반영했습니다. (${revNum}차 변경 표시)`);
  }, []);

  const selectBodyRevision = useCallback((rev: number) => {
    setDraft(d => {
      const snap = d.bodySnapshots[rev];
      if (snap === undefined) return d;
      return { ...d, body: snap, viewingRevision: rev };
    });
    const label = rev === 0 ? '원본' : `${rev}차 변경`;
    setStatusMsg(`✅ ${label} 버전을 본문에 불러왔습니다.`);
  }, []);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft));
      setStatusMsg('✅ 임시저장 완료');
    } catch { setStatusMsg('❌ 저장 실패'); }
  }, [draft]);

  const publishPost = useCallback(async () => {
    if (!draft.categorySlug) {
      setStatusMsg('⚠️ 카테고리를 선택해 주세요.');
      setPhase('finalize');
      return;
    }

    setStatusMsg('게시 중…');
    const payload = {
      title: draft.title || '(제목 없음)',
      body: buildContent(draft),
      excerpt: draft.excerpt,
      categorySlug: draft.categorySlug,
      status: 'publish' as const,
    };

    try {
      const url = draft.postId ? `${POSTS_API}/${draft.postId}` : POSTS_API;
      const method = draft.postId ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      let data: { ok?: boolean; post?: V5000PostDto; message?: string; code?: string };
      try {
        data = await r.json();
      } catch {
        throw new Error(`HTTP ${r.status}`);
      }

      if (r.status === 401) {
        setStatusMsg('⚠️ 로그인이 만료되었습니다.');
        openAuthFromWritePopup(`/login?redirect_to=${encodeURIComponent('/write')}`);
        return;
      }
      if (!r.ok || !data.ok || !data.post) throw new Error(data.message ?? `HTTP ${r.status}`);

      const post = data.post;
      setDraft(d => ({
        ...d,
        postId: post.id,
        postSlug: post.slug,
        categorySlug: post.categorySlug || d.categorySlug,
      }));
      setStatusMsg(`✅ 게시 완료 → ${post.link}`);
      setPhase('finalize');
    } catch (e) {
      setStatusMsg(`❌ 게시 실패: ${e instanceof Error ? e.message : '연결 오류'}`);
    }
  }, [draft]);

  const resetDraft = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setPhase('finalize');
    setStatusMsg('1차 · 새 글 쓰기 — 화면을 초기화했습니다.');
  }, []);

  const newDraft = useCallback((): boolean | Promise<boolean> => {
    const hasBody = stripBodyPlain(draft.body).length > 0;
    if (!hasBody) {
      resetDraft();
      return true;
    }
    return new Promise(resolve => {
      newDraftResolveRef.current = resolve;
      setNewDraftConfirmOpen(true);
    });
  }, [draft.body, resetDraft]);

  const confirmNewDraft = useCallback(() => {
    setNewDraftConfirmOpen(false);
    resetDraft();
    newDraftResolveRef.current?.(true);
    newDraftResolveRef.current = null;
  }, [resetDraft]);

  const cancelNewDraft = useCallback(() => {
    setNewDraftConfirmOpen(false);
    newDraftResolveRef.current?.(false);
    newDraftResolveRef.current = null;
  }, []);

  const recommendImages = useCallback(async (): Promise<string> => {
    const context = stripBodyPlain(draft.body);
    const title = draft.title.trim();
    const excerpt = draft.excerpt.trim();
    if (!context && !title && !excerpt) {
      const msg = '⚠️ 본문·제목·요약 중 하나 이상 입력 후 [사진/이미지]를 사용하세요.';
      setStatusMsg(msg);
      return msg;
    }

    setPreviewLoading(true);
    setStatusMsg('🖼 본문에 맞는 이미지를 찾는 중…');
    try {
      const images = await fetchSuggestedImages({ title, excerpt, body: context });
      setDraft(d => ({ ...d, previewImages: images }));
      const msg = `✅ 추천 이미지 ${images.length}장 — 우측 [이미지 미리보기] 그리드에 반영했습니다.`;
      setStatusMsg(msg);
      return `${msg}\n키워드: ${images.map(i => i.keyword).join(', ')}`;
    } catch (e) {
      const err = e instanceof Error ? e.message : '연결 오류';
      if (err === 'LOGIN_REQUIRED') {
        const msg = '⚠️ 로그인이 필요합니다. 상단 [로그인] 후 다시 시도해 주세요.';
        setStatusMsg(msg);
        openAuthFromWritePopup(`/login?redirect_to=${encodeURIComponent('/write')}`);
        return msg;
      }
      const msg = `❌ 이미지 추천 실패: ${err}`;
      setStatusMsg(msg);
      return msg;
    } finally {
      setPreviewLoading(false);
    }
  }, [draft.body, draft.title, draft.excerpt]);

  const removePreviewImage = useCallback((id: string) => {
    setDraft(d => ({ ...d, previewImages: d.previewImages.filter(x => x.id !== id) }));
  }, []);

  const goFinalize = useCallback(() => {
    setPhase('finalize');
    setStatusMsg('⬅ [글쓰기 완성]으로 돌아왔습니다.');
  }, []);

  const viewPublishedPost = useCallback(async () => {
    if (!draft.categorySlug && !draft.postId) {
      setStatusMsg('⚠️ 카테고리를 선택해 주세요.');
      return;
    }

    let categorySlug = draft.categorySlug;
    let slug = draft.postSlug.trim();
    let postId = draft.postId;

    try {
      const r = await fetch(
        postId ? `${POSTS_API}/${postId}` : `${POSTS_API}?mine=1&status=publish&category_slug=${encodeURIComponent(categorySlug)}`,
        { credentials: 'same-origin' },
      );
      const data = await r.json();
      if (r.status === 401) {
        setStatusMsg('⚠️ 로그인이 만료되었습니다.');
        openAuthFromWritePopup(`/login?redirect_to=${encodeURIComponent('/write')}`);
        return;
      }
      if (postId && r.ok && data.ok && data.post) {
        if (data.post.status !== 'publish') {
          setStatusMsg('⚠️ 게시된 글이 없습니다. 먼저 게시하기를 실행해 주세요.');
          return;
        }
        categorySlug = data.post.categorySlug || categorySlug;
        slug = data.post.slug;
        postId = data.post.id;
      } else if (!postId && r.ok && data.ok && Array.isArray(data.posts) && data.posts.length > 0) {
        const latest = data.posts[0] as V5000PostDto;
        categorySlug = latest.categorySlug || categorySlug;
        slug = latest.slug;
        postId = latest.id;
      }
      if (slug && postId) {
        setDraft(d => ({
          ...d,
          postSlug: slug,
          postId,
          categorySlug: categorySlug || d.categorySlug,
        }));
      }
    } catch {
      /* fallback to stored slug */
    }

    if (!slug || !categorySlug) {
      setStatusMsg('⚠️ 게시 후 게시글보기를 이용할 수 있습니다.');
      return;
    }

    const path = postId
      ? `/${categorySlug}/${slug}?pid=${postId}`
      : `/${categorySlug}/${slug}`;
    goToMainPostView(path);
    setStatusMsg(`👁 방금 게시글 → ${path}`);
  }, [draft.categorySlug, draft.postId, draft.postSlug]);

  return (
    <WriteMessageProvider>
    <div className="nfw-app">
      <header className="nfw-topbar">
        <div className="nfw-topbar__left">
          <button type="button" className="nfw-topbar__home-btn" onClick={goToMainHome}>
            HOME
          </button>
          <span className="nfw-topbar__badge">✨ AI 글쓰기</span>
          <span className="nfw-topbar__phase">{PHASE_LABEL[phase]}</span>
          {draft.title && <span className="nfw-topbar__doc-title">{draft.title}</span>}
        </div>
        <div className="nfw-topbar__right">
          {statusMsg && <span className="nfw-topbar__status">{statusMsg}</span>}
          <AuthStatus />
        </div>
      </header>

      <div className="nfw-layout">
        <div className="nfw-chat-col" style={{ flexBasis: `${splitPct}%`, maxWidth: `${splitPct}%` }}>
          <ChatPanel
            draft={draft}
            setDraft={setDraft}
            onInsertImage={insertImage}
            onNewDraft={newDraft}
            onAiApply={handleAiApply}
            onRecommendImages={recommendImages}
            imageRecommendLoading={previewLoading}
          />
        </div>

        <div ref={splitRef} className="nfw-splitter" onMouseDown={onSplitDown} />

        <div className="nfw-draft-col" style={{ flexBasis: `${100 - splitPct}%`, maxWidth: `${100 - splitPct}%` }}>
          <DraftPanel
            draft={draft}
            setDraft={setDraft}
            phase={phase}
            setPhase={setPhase}
            categories={CATEGORIES}
            onSave={saveDraft}
            onPublish={publishPost}
            onBackToFinalize={goFinalize}
            onViewPost={viewPublishedPost}
            previewLoading={previewLoading}
            onRemovePreviewImage={removePreviewImage}
            onPasteStatus={setStatusMsg}
            onSelectBodyRevision={selectBodyRevision}
          />
        </div>
      </div>

      {newDraftConfirmOpen && (
        <NewDraftConfirmDialog
          onConfirm={confirmNewDraft}
          onCancel={cancelNewDraft}
        />
      )}
    </div>
    </WriteMessageProvider>
  );
}

function buildContent(draft: DraftState): string {
  const top = draft.images.filter(i => i.position === 'top')
    .map(i => `<figure><img src="${i.url}" alt="${i.alt}" /></figure>`).join('\n');
  const bot = draft.images.filter(i => i.position === 'bottom')
    .map(i => `<figure><img src="${i.url}" alt="${i.alt}" /></figure>`).join('\n');
  let bodyHtml = bodyHtmlForPublish(draft.body);
  if (bodyHtml && !/<img\b/i.test(bodyHtml) && !/<br\b/i.test(bodyHtml)) {
    bodyHtml = bodyHtml.replace(/\n/g, '<br>');
  }
  return [top, bodyHtml, bot].filter(Boolean).join('\n\n');
}
