'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SHOWCASE_CATS } from '@/lib/site-data';
import type { V5000Category, V5000PostDto } from '@/lib/v5000-content/types';
import { AuthStatus } from '@/components/auth/AuthStatus';
import { bindWritePopupToOpener, goToMainHome, goToMainPostView } from '@/lib/write-popup';
import { openAuthFromWritePopup } from '@/lib/auth-navigation';
import { DraftPanel } from './DraftPanel';
import { ChatPanel } from './ChatPanel';
import { WriteInsertRail } from './WriteInsertRail';
import { WriteMessageProvider, useWriteMessage } from './WriteMessageContext';
import type { AiCmdId } from '@/lib/write-ai-local';
import { extractSummaryFromAi, extractTitleFromAi } from '@/lib/write-ai-commands';
import { applyRevisionDiff, commitRevisionOnDraftSave } from '@/lib/write-body-diff';
import { buildBodyImageFigureHtml } from '@/lib/write-body-images';
import { stripBodyPlain, bodyHtmlForPublish } from '@/lib/write-body-plain';
import { prependFeaturedImageIfMissing, resolveFeaturedImageUrl } from '@/lib/write-featured-image';
import {
  buildBodyFileBlockHtml,
  buildBodyVideoBlockHtml,
  normalizeBodyForEditor,
} from '@/lib/write-body-blocks';
import {
  formatAiAppendChunk,
  insertFigureAtDom,
  insertHtmlAtDom,
  mergeBodyHtml,
} from '@/lib/write-body-insert';
import type { InsertPosition } from '@/lib/write-insert-position';
import { INSERT_POSITION_LABEL } from '@/lib/write-insert-position';
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
  /** bodySnapshots[0]=원본, [n]=n차 변경 직후 */
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

type PublishedPostTarget = {
  id: number;
  slug: string;
  categorySlug: string;
  link: string;
};

function postTargetFromDto(post: V5000PostDto): PublishedPostTarget {
  return {
    id: post.id,
    slug: post.slug,
    categorySlug: post.categorySlug,
    link: post.link,
  };
}

export function WriteEditor() {
  return (
    <WriteMessageProvider>
      <WriteEditorInner />
    </WriteMessageProvider>
  );
}

function WriteEditorInner() {
  const msg = useWriteMessage();
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [phase, setPhase] = useState<WritePhase>('finalize');
  const [insertPosition, setInsertPosition] = useState<InsertPosition>('inline');
  const [splitPct, setSplitPct] = useState(50);
  const [statusMsg, setStatusMsg] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPublishedRef = useRef<PublishedPostTarget | null>(null);

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
        if (parsed.postId && parsed.postSlug && parsed.categorySlug) {
          lastPublishedRef.current = {
            id: parsed.postId,
            slug: parsed.postSlug,
            categorySlug: parsed.categorySlug,
            link: `/${parsed.categorySlug}/${parsed.postSlug}`,
          };
        }
        setDraft({
          ...EMPTY_DRAFT,
          ...parsed,
          bodyRevision: parsed.bodyRevision ?? 0,
          bodySnapshots: parsed.bodySnapshots ?? [],
          viewingRevision: parsed.viewingRevision ?? parsed.bodyRevision ?? 0,
          postSlug: parsed.postSlug ?? '',
          previewImages: parsed.previewImages ?? [],
          images: [],
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
      if (!isDragging.current || !layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(72, Math.max(28, pct)));
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

  const insertImage = useCallback((payload: { url: string; alt: string; descFontSize: number }) => {
    const pos = insertPosition;
    const el = bodyRef.current;
    setDraft(prev => {
      let body = prev.body;
      const figure = buildBodyImageFigureHtml(payload.url, payload.alt, undefined, payload.descFontSize);
      if (el) {
        body = insertFigureAtDom(el, payload.url, payload.alt, pos, payload.descFontSize);
      } else {
        body = mergeBodyHtml(body, figure, pos === 'inline' ? 'bottom' : pos);
      }
      return { ...prev, body, images: [] };
    });
    setStatusMsg(`✅ 이미지 → ${INSERT_POSITION_LABEL[pos]}에 추가했습니다.`);
  }, [insertPosition]);

  const insertVideo = useCallback((payload: { url: string; title: string; descFontSize: number }) => {
    const pos = insertPosition;
    const block = buildBodyVideoBlockHtml(payload.url, payload.title, undefined, payload.descFontSize);
    const el = bodyRef.current;
    setDraft(prev => ({
      ...prev,
      body: el
        ? insertHtmlAtDom(el, block, pos)
        : mergeBodyHtml(prev.body, block, pos === 'inline' ? 'bottom' : pos),
    }));
    setStatusMsg(`✅ 동영상 → ${INSERT_POSITION_LABEL[pos]}에 추가했습니다.`);
  }, [insertPosition]);

  const insertFile = useCallback((payload: { url: string; name: string; descFontSize: number }) => {
    const pos = insertPosition;
    const block = buildBodyFileBlockHtml(payload.url, payload.name, undefined, payload.descFontSize);
    const el = bodyRef.current;
    setDraft(prev => ({
      ...prev,
      body: el
        ? insertHtmlAtDom(el, block, pos)
        : mergeBodyHtml(prev.body, block, pos === 'inline' ? 'bottom' : pos),
    }));
    setStatusMsg(`✅ 파일 → ${INSERT_POSITION_LABEL[pos]}에 추가했습니다.`);
  }, [insertPosition]);

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

    /** 일반명령문 — 위치 지정(상·커서·하) 기준 추가 (덮어쓰기 없음) */
    if (cmdId === 'prompt') {
      const pos = insertPosition;
      let revNum = 1;
      setDraft(prev => {
        revNum = prev.bodyRevision + 1;
        const snapshots = prev.bodySnapshots.slice(0, prev.bodyRevision + 1);
        if (snapshots[0] === undefined) {
          snapshots[0] = prev.body;
        }
        const chunk = formatAiAppendChunk(clean, revNum);
        const el = bodyRef.current;
        let body = prev.body;
        if (el) {
          body = insertHtmlAtDom(el, chunk, pos);
        } else {
          body = mergeBodyHtml(body, chunk, pos === 'inline' ? 'bottom' : pos);
        }
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
      setStatusMsg(`✅ 일반명령문 결과 → ${INSERT_POSITION_LABEL[pos]}에 추가했습니다. (${revNum}차)`);
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
  }, [insertPosition]);

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
      const rawBody = bodyRef.current?.innerHTML ?? draft.body;
      const { next, newRev } = commitRevisionOnDraftSave(draft, rawBody, normalizeBodyForEditor);
      setDraft(next);
      localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(next));
      setStatusMsg(
        newRev
          ? `✅ 임시저장 완료 — ${newRev}차 변경 기록`
          : '✅ 임시저장 완료',
      );
    } catch {
      setStatusMsg('❌ 저장 실패');
    }
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
      lastPublishedRef.current = postTargetFromDto(post);
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
    bodyRef.current?.blur();
    setDraft(EMPTY_DRAFT);
    setPhase('finalize');
    try {
      localStorage.removeItem(LS_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    lastPublishedRef.current = null;
    setStatusMsg('1차 · 새 글 쓰기 — 화면을 초기화했습니다.');
  }, []);

  const newDraft = useCallback(async (): Promise<boolean> => {
    const hasContent = Boolean(
      draft.title.trim()
      || draft.excerpt.trim()
      || stripBodyPlain(draft.body).length > 0
      || draft.previewImages.length > 0
      || draft.postId,
    );
    if (!hasContent) {
      resetDraft();
      return true;
    }
    const ok = await msg.confirm({
      variant: 'new-draft',
      screen: '1차 · 새 글 쓰기',
      message: '',
      confirmLabel: '초기화',
      cancelLabel: '기존글 유지',
    });
    if (ok) resetDraft();
    return ok;
  }, [
    draft.title,
    draft.excerpt,
    draft.body,
    draft.previewImages.length,
    draft.postId,
    resetDraft,
    msg,
  ]);

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
      setDraft(d => ({
        ...d,
        previewImages: [...d.previewImages, ...images],
      }));
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
    setStatusMsg('⬅ [글 수정하기]로 돌아왔습니다.');
  }, []);

  const viewPublishedPost = useCallback(async (): Promise<{ ok: boolean; silent?: boolean }> => {
    const remembered = lastPublishedRef.current;
    if (!draft.categorySlug && !draft.postId && !remembered) {
      setStatusMsg('⚠️ 카테고리를 선택해 주세요.');
      return { ok: false, silent: true };
    }

    let categorySlug = draft.categorySlug || remembered?.categorySlug || '';
    let slug = draft.postSlug.trim() || remembered?.slug || '';
    let postId = draft.postId ?? remembered?.id ?? null;
    let directLink = remembered?.link;

    try {
      const r = await fetch(
        postId ? `${POSTS_API}/${postId}` : `${POSTS_API}?mine=1&status=publish&category_slug=${encodeURIComponent(categorySlug)}`,
        { credentials: 'same-origin' },
      );
      const data = await r.json();
      if (r.status === 401) {
        setStatusMsg('⚠️ 로그인이 만료되었습니다.');
        openAuthFromWritePopup(`/login?redirect_to=${encodeURIComponent('/write')}`);
        return { ok: false, silent: true };
      }
      if (postId && r.ok && data.ok && data.post) {
        if (data.post.status !== 'publish') {
          setStatusMsg('⚠️ 게시된 글이 없습니다. 먼저 게시하기를 실행해 주세요.');
          return { ok: false, silent: true };
        }
        const target = postTargetFromDto(data.post as V5000PostDto);
        lastPublishedRef.current = target;
        categorySlug = data.post.categorySlug || categorySlug;
        slug = data.post.slug;
        postId = data.post.id;
        directLink = data.post.link;
      } else if (!postId && r.ok && data.ok && Array.isArray(data.posts) && data.posts.length > 0) {
        const latest = data.posts[0] as V5000PostDto;
        const target = postTargetFromDto(latest);
        lastPublishedRef.current = target;
        categorySlug = latest.categorySlug || categorySlug;
        slug = latest.slug;
        postId = latest.id;
        directLink = latest.link;
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
      /* draft에 저장된 slug·postId 로 진행 */
    }

    if ((!slug || !categorySlug) && directLink) {
      goToMainPostView(directLink);
      setStatusMsg(`👁 방금 게시글 → ${directLink}`);
      return { ok: true };
    }

    if (!slug || !categorySlug) {
      setStatusMsg('⚠️ 게시 후 게시글보기를 이용할 수 있습니다.');
      return { ok: false };
    }

    const path = postId
      ? `/${categorySlug}/${slug}?pid=${postId}`
      : `/${categorySlug}/${slug}`;
    goToMainPostView(path);
    setStatusMsg(`👁 방금 게시글 → ${path}`);
    return { ok: true };
  }, [draft.categorySlug, draft.postId, draft.postSlug]);

  return (
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

      <div ref={layoutRef} className="nfw-layout">
        <div className="nfw-chat-col" style={{ flexBasis: `${splitPct}%`, maxWidth: `${splitPct}%` }}>
          <ChatPanel
            draft={draft}
            onInsertImage={insertImage}
            onInsertVideo={insertVideo}
            onInsertFile={insertFile}
            onHome={goToMainHome}
            onNewDraft={newDraft}
            onAiApply={handleAiApply}
            onRecommendImages={recommendImages}
            imageRecommendLoading={previewLoading}
          />
        </div>

        <WriteInsertRail
          position={insertPosition}
          onChange={setInsertPosition}
          onResizeStart={onSplitDown}
        />

        <div className="nfw-draft-col" style={{ flexBasis: `${100 - splitPct}%`, maxWidth: `${100 - splitPct}%` }}>
          <DraftPanel
            draft={draft}
            setDraft={setDraft}
            phase={phase}
            setPhase={setPhase}
            categories={CATEGORIES}
            bodyRef={bodyRef}
            insertPosition={insertPosition}
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
    </div>
  );
}

function buildContent(draft: DraftState): string {
  const previewUrls = draft.previewImages.map(p => p.url);
  const featured = resolveFeaturedImageUrl(draft.body, previewUrls);
  let bodyHtml = featured
    ? prependFeaturedImageIfMissing(
        draft.body,
        featured,
        draft.previewImages[0]?.alt || draft.title || '대표 이미지',
      )
    : bodyHtmlForPublish(draft.body);
  if (bodyHtml && !/<img\b/i.test(bodyHtml) && !/<br\b/i.test(bodyHtml)) {
    bodyHtml = bodyHtml.replace(/\n/g, '<br>');
  }
  return bodyHtml;
}
