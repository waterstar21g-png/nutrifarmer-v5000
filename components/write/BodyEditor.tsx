'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
} from 'react';
import { REVISION_LABELS } from '@/lib/write-body-diff';
import { normalizeBodyForEditor } from '@/lib/write-body-blocks';
import {
  BODY_EMBED_SELECTOR,
  moveEmbedBlock,
} from '@/lib/write-body-block-ui';
import { clampBodyImgWidth } from '@/lib/write-body-images';

interface Props {
  body: string;
  bodyRevision: number;
  bodySnapshots: string[];
  viewingRevision: number;
  onSelectRevision: (rev: number) => void;
  onChange: (html: string) => void;
  placeholder?: string;
}

function revisionLabel(n: number): string {
  if (n <= 5) return REVISION_LABELS[n - 1]?.name ?? `${n}차 변경`;
  return `${n}차 변경`;
}

function revisionClass(n: number): string {
  return `nf-rev-${Math.min(Math.max(n, 1), 5)}`;
}

function isEditorHtmlEmpty(html: string): boolean {
  if (!html.trim()) return true;
  const stripped = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return stripped.length === 0;
}

function findEmbed(target: EventTarget | null): HTMLElement | null {
  return (target as HTMLElement | null)?.closest(BODY_EMBED_SELECTOR) as HTMLElement | null;
}

export const BodyEditor = forwardRef<HTMLDivElement, Props>(function BodyEditor(
  {
    body,
    bodyRevision,
    bodySnapshots,
    viewingRevision,
    onSelectRevision,
    onChange,
    placeholder,
  },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  const propBodyRef = useRef<string | null>(null);
  const revisionKeyRef = useRef(`${bodyRevision}:${viewingRevision}`);
  const isFocusedRef = useRef(false);
  const resizeRef = useRef<{ fig: HTMLElement; startX: number; startW: number } | null>(null);
  const dragRef = useRef<{ block: HTMLElement } | null>(null);
  const dropLineRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const revKey = `${bodyRevision}:${viewingRevision}`;
    const bodyChanged = body !== propBodyRef.current;
    const revChanged = revKey !== revisionKeyRef.current;
    if (!bodyChanged && !revChanged) return;
    const externalClear = body === '' && Boolean(propBodyRef.current);
    if (isFocusedRef.current && !revChanged && !externalClear) return;

    propBodyRef.current = body;
    revisionKeyRef.current = revKey;

    const normalized = normalizeBodyForEditor(body || '');
    if (el.innerHTML !== normalized) {
      el.innerHTML = normalized;
    }
  }, [body, bodyRevision, viewingRevision]);

  const pushHtml = useCallback((normalizeBlocks: boolean) => {
    const el = innerRef.current;
    if (!el) return;
    if (normalizeBlocks) {
      const normalized = normalizeBodyForEditor(el.innerHTML);
      if (el.innerHTML !== normalized) el.innerHTML = normalized;
    }
    propBodyRef.current = el.innerHTML;
    onChange(el.innerHTML);
  }, [onChange]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const clearSelection = () => {
      el.querySelectorAll(`${BODY_EMBED_SELECTOR}.is-selected`).forEach(n => n.classList.remove('is-selected'));
    };

    const removeBlock = (block: Element | null) => {
      if (!block) return;
      block.remove();
      pushHtml(true);
    };

    const setBlockWidth = (fig: HTMLElement, w: number) => {
      const width = clampBodyImgWidth(w);
      fig.style.width = `${width}px`;
      fig.dataset.width = String(width);
      const inp = fig.querySelector('.nfw-body-block__width-in, .nfw-body-img__width-in') as HTMLInputElement | null;
      if (inp) inp.value = String(width);
    };

    const onPointerDown = (e: PointerEvent) => {
      const del = (e.target as HTMLElement).closest('.nfw-body-block__del, .nfw-body-img__del');
      if (!del) return;
      e.preventDefault();
      e.stopPropagation();
      removeBlock(del.closest(BODY_EMBED_SELECTOR));
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.nfw-body-block__del, .nfw-body-img__del')) return;
      if (target.classList.contains('nfw-body-block__width-in') || target.classList.contains('nfw-body-img__width-in')) return;
      if (target.closest('.nfw-body-block__resize, .nfw-body-img__resize')) return;
      if (target.closest('.nfw-body-block__drag, .nfw-body-img__drag')) return;

      const fig = findEmbed(target);
      clearSelection();
      if (fig) {
        fig.classList.add('is-selected');
        e.stopPropagation();
      }
    };

    const onChangeWidth = (e: Event) => {
      const inp = e.target as HTMLInputElement;
      if (!inp.classList.contains('nfw-body-block__width-in') && !inp.classList.contains('nfw-body-img__width-in')) return;
      const fig = inp.closest(BODY_EMBED_SELECTOR) as HTMLElement | null;
      if (!fig) return;
      setBlockWidth(fig, parseInt(inp.value, 10) || 320);
      pushHtml(true);
    };

    const onResizeDown = (e: MouseEvent) => {
      const handle = (e.target as HTMLElement).closest('.nfw-body-block__resize, .nfw-body-img__resize');
      if (!handle) return;
      e.preventDefault();
      e.stopPropagation();
      const fig = handle.closest(BODY_EMBED_SELECTOR) as HTMLElement;
      fig.classList.add('is-selected');
      resizeRef.current = { fig, startX: e.clientX, startW: fig.offsetWidth };
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const onResizeMove = (e: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      setBlockWidth(r.fig, r.startW + (e.clientX - r.startX));
    };

    const onResizeUp = () => {
      if (!resizeRef.current) return;
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      pushHtml(true);
    };

    const ensureDropLine = (): HTMLDivElement => {
      if (!dropLineRef.current) {
        const line = document.createElement('div');
        line.className = 'nfw-body-drop-line';
        dropLineRef.current = line;
      }
      return dropLineRef.current;
    };

    const hideDropLine = () => {
      dropLineRef.current?.remove();
      dropLineRef.current = null;
    };

    const onDragDown = (e: MouseEvent) => {
      const handle = (e.target as HTMLElement).closest('.nfw-body-block__drag, .nfw-body-img__drag');
      if (!handle) return;
      e.preventDefault();
      e.stopPropagation();
      const block = handle.closest(BODY_EMBED_SELECTOR) as HTMLElement;
      block.classList.add('is-selected', 'is-dragging');
      dragRef.current = { block };
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const onDragMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const line = ensureDropLine();
      const rect = el.getBoundingClientRect();
      line.style.top = `${Math.min(Math.max(e.clientY - rect.top, 0), rect.height)}px`;
      if (!line.parentElement) el.appendChild(line);
    };

    const onDragUp = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      d.block.classList.remove('is-dragging');
      dragRef.current = null;
      hideDropLine();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      moveEmbedBlock(d.block, el, e.clientX, e.clientY);
      d.block.classList.add('is-selected');
      pushHtml(true);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const selected = el.querySelector(`${BODY_EMBED_SELECTOR}.is-selected`);
      if (!selected) return;
      e.preventDefault();
      selected.remove();
      pushHtml(true);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('click', onClick);
    el.addEventListener('change', onChangeWidth);
    el.addEventListener('mousedown', onResizeDown);
    el.addEventListener('mousedown', onDragDown);
    el.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('click', onClick);
      el.removeEventListener('change', onChangeWidth);
      el.removeEventListener('mousedown', onResizeDown);
      el.removeEventListener('mousedown', onDragDown);
      el.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragUp);
      hideDropLine();
    };
  }, [pushHtml]);

  const handleInput = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (isEditorHtmlEmpty(html) && propBodyRef.current && !isEditorHtmlEmpty(propBodyRef.current)) {
      const restored = normalizeBodyForEditor(propBodyRef.current);
      if (el.innerHTML !== restored) el.innerHTML = restored;
      return;
    }
    propBodyRef.current = html;
    onChange(html);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    const el = innerRef.current;
    if (!el) return;
    propBodyRef.current = el.innerHTML;
    onChange(el.innerHTML);
  }, [onChange]);

  const hasOriginal = bodySnapshots[0] !== undefined;
  const revisionButtons = Array.from({ length: bodyRevision }, (_, i) => i + 1);

  return (
    <div className="nfw-body-editor">
      {bodyRevision > 0 && (
        <div className="nfw-rev-legend" aria-label="변경 구분 — 버전 불러오기">
          <span className="nfw-rev-legend__title">변경 구분</span>
          {hasOriginal && (
            <button
              type="button"
              className={`nfw-rev-legend__btn nfw-rev-legend__btn--orig${viewingRevision === 0 ? ' is-active' : ''}`}
              onClick={() => onSelectRevision(0)}
            >
              원본
            </button>
          )}
          {revisionButtons.map(n => (
            <button
              key={n}
              type="button"
              className={`nfw-rev-legend__btn nfw-rev-legend__item ${revisionClass(n)}${viewingRevision === n ? ' is-active' : ''}`}
              onClick={() => onSelectRevision(n)}
              disabled={bodySnapshots[n] === undefined}
            >
              {revisionLabel(n)}
            </button>
          ))}
          <span
            className="nfw-rev-legend__item nf-rev-del-sample"
            title="AI 수정 시 삭제된 문구는 본문에서 취소선으로 표시됩니다"
          >
            삭제선
          </span>
        </div>
      )}
      <div
        ref={innerRef}
        className="nfw-field__textarea nfw-body-rich nfw-content-text"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
      />
    </div>
  );
});
