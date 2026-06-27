'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
} from 'react';
import { REVISION_LABELS } from '@/lib/write-body-diff';
import {
  clampBodyImgWidth,
  normalizeBodyImagesForEditor,
} from '@/lib/write-body-images';

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
  const propBodyRef = useRef(body);
  const revisionKeyRef = useRef(`${bodyRevision}:${viewingRevision}`);
  const isFocusedRef = useRef(false);
  const resizeRef = useRef<{ fig: HTMLElement; startX: number; startW: number } | null>(null);

  useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

  /** props → DOM: AI 반영·버전 전환 등 외부 변경만 반영 (클릭·입력 시 덮어쓰지 않음) */
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const revKey = `${bodyRevision}:${viewingRevision}`;
    const bodyChanged = body !== propBodyRef.current;
    const revChanged = revKey !== revisionKeyRef.current;
    if (!bodyChanged && !revChanged) return;
    /* 편집 중 클릭·입력 시 React props 동기화가 DOM을 덮어쓰지 않도록 (버전 전환은 예외) */
    if (isFocusedRef.current && !revChanged) return;

    propBodyRef.current = body;
    revisionKeyRef.current = revKey;

    const normalized = normalizeBodyImagesForEditor(body || '');
    if (el.innerHTML !== normalized) {
      el.innerHTML = normalized;
    }
  }, [body, bodyRevision, viewingRevision]);

  const pushHtml = useCallback((normalizeImages: boolean) => {
    const el = innerRef.current;
    if (!el) return;
    if (normalizeImages) {
      const normalized = normalizeBodyImagesForEditor(el.innerHTML);
      if (el.innerHTML !== normalized) el.innerHTML = normalized;
    }
    propBodyRef.current = el.innerHTML;
    onChange(el.innerHTML);
  }, [onChange]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const clearSelection = () => {
      el.querySelectorAll('.nfw-body-img.is-selected').forEach(n => n.classList.remove('is-selected'));
    };

    const removeFigure = (fig: Element | null) => {
      if (!fig) return;
      fig.remove();
      pushHtml(true);
    };

    const onPointerDown = (e: PointerEvent) => {
      const del = (e.target as HTMLElement).closest('.nfw-body-img__del');
      if (!del) return;
      e.preventDefault();
      e.stopPropagation();
      removeFigure(del.closest('.nfw-body-img'));
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest('.nfw-body-img__del')) return;
      if (target.classList.contains('nfw-body-img__width-in')) return;
      if (target.closest('.nfw-body-img__resize')) return;

      const fig = target.closest('.nfw-body-img') as HTMLElement | null;
      clearSelection();
      if (fig) {
        fig.classList.add('is-selected');
        e.stopPropagation();
      }
    };

    const onChangeWidth = (e: Event) => {
      const inp = e.target as HTMLInputElement;
      if (!inp.classList.contains('nfw-body-img__width-in')) return;
      const fig = inp.closest('.nfw-body-img') as HTMLElement | null;
      if (!fig) return;
      const w = clampBodyImgWidth(parseInt(inp.value, 10) || 320);
      inp.value = String(w);
      fig.style.width = `${w}px`;
      fig.dataset.width = String(w);
      pushHtml(true);
    };

    const onResizeDown = (e: MouseEvent) => {
      const handle = (e.target as HTMLElement).closest('.nfw-body-img__resize');
      if (!handle) return;
      e.preventDefault();
      e.stopPropagation();
      const fig = handle.closest('.nfw-body-img') as HTMLElement;
      fig.classList.add('is-selected');
      const startW = fig.offsetWidth;
      resizeRef.current = { fig, startX: e.clientX, startW };
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const onResizeMove = (e: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const delta = e.clientX - r.startX;
      const w = clampBodyImgWidth(r.startW + delta);
      r.fig.style.width = `${w}px`;
      r.fig.dataset.width = String(w);
      const inp = r.fig.querySelector('.nfw-body-img__width-in') as HTMLInputElement | null;
      if (inp) inp.value = String(w);
    };

    const onResizeUp = () => {
      if (!resizeRef.current) return;
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      pushHtml(true);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const selected = el.querySelector('.nfw-body-img.is-selected');
      if (!selected) return;
      e.preventDefault();
      selected.remove();
      pushHtml(true);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('click', onClick);
    el.addEventListener('change', onChangeWidth);
    el.addEventListener('mousedown', onResizeDown);
    el.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('click', onClick);
      el.removeEventListener('change', onChangeWidth);
      el.removeEventListener('mousedown', onResizeDown);
      el.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
    };
  }, [pushHtml]);

  const handleInput = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const html = el.innerHTML;
    /* 클릭만으로 input이 발생할 때 빈 값으로 본문이 지워지는 브라우저 quirks 방지 */
    if (isEditorHtmlEmpty(html) && propBodyRef.current && !isEditorHtmlEmpty(propBodyRef.current)) {
      const restored = normalizeBodyImagesForEditor(propBodyRef.current);
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
