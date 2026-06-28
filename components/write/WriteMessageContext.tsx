'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface WriteMessagePayload {
  screen: string;
  message: string;
  guidance?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 새글쓰기 확인 — 모달 레이아웃(스크린 2) */
  variant?: 'default' | 'new-draft';
}

export interface WriteMessageAPI {
  alert: (payload: WriteMessagePayload) => Promise<void>;
  confirm: (payload: WriteMessagePayload) => Promise<boolean>;
}

const WriteMessageContext = createContext<WriteMessageAPI | null>(null);

interface Pending {
  payload: WriteMessagePayload;
  mode: 'alert' | 'confirm';
  resolve: (v: boolean) => void;
}

export function WriteMessageProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const queueRef = useRef<Pending[]>([]);

  const flush = useCallback(() => {
    if (pending) return;
    const next = queueRef.current.shift();
    if (next) setPending(next);
  }, [pending]);

  const enqueue = useCallback((item: Pending) => {
    queueRef.current.push(item);
    setPending(cur => cur ?? item);
  }, []);

  const alert = useCallback((payload: WriteMessagePayload) => {
    return new Promise<void>(resolve => {
      enqueue({
        payload,
        mode: 'alert',
        resolve: () => resolve(),
      });
    });
  }, [enqueue]);

  const confirm = useCallback((payload: WriteMessagePayload) => {
    return new Promise<boolean>(resolve => {
      enqueue({
        payload,
        mode: 'confirm',
        resolve,
      });
    });
  }, [enqueue]);

  const close = useCallback((result: boolean) => {
    pending?.resolve(result);
    setPending(null);
    requestAnimationFrame(flush);
  }, [pending, flush]);

  return (
    <WriteMessageContext.Provider value={{ alert, confirm }}>
      {children}
      {pending && typeof document !== 'undefined' && createPortal(
        <WriteMessageDialog
          {...pending.payload}
          mode={pending.mode}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />,
        document.body,
      )}
    </WriteMessageContext.Provider>
  );
}

export function useWriteMessage(): WriteMessageAPI {
  const ctx = useContext(WriteMessageContext);
  if (!ctx) {
    return {
      alert: async p => { window.alert(`${p.screen}\n\n${p.message}`); },
      confirm: async p => window.confirm(`${p.screen}\n\n${p.message}`),
    };
  }
  return ctx;
}

interface DialogProps extends WriteMessagePayload {
  mode: 'alert' | 'confirm';
  onConfirm: () => void;
  onCancel: () => void;
}

function WriteMessageDialog({
  screen,
  message,
  guidance,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
  mode,
  onConfirm,
  onCancel,
}: DialogProps) {
  const dismiss = mode === 'alert' ? onConfirm : onCancel;
  useDialogEscape(dismiss);

  if (variant === 'new-draft' && mode === 'confirm') {
    return (
      <div className="nfw-msg-backdrop nfw-msg-backdrop--modal" role="presentation" onClick={onCancel}>
        <div
          className="nfw-write-dialog nfw-write-dialog--modal nfw-write-dialog--new-draft"
          role="alertdialog"
          aria-label="새 글쓰기 확인"
          aria-describedby="nfw-new-draft-body"
          onClick={e => e.stopPropagation()}
        >
          <div id="nfw-new-draft-body" className="nfw-modal__body">
            <p className="nfw-modal__message">본문에 작성중인 글이 있습니다.</p>
            <p className="nfw-modal__guide">
              <span className="nfw-modal__highlight">새 글쓰기</span>
              {' 를 시작할까요?'}
            </p>
          </div>
          <div className="nfw-modal__actions">
            <button type="button" className="nfw-modal__btn nfw-modal__btn--cancel" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button type="button" className="nfw-modal__btn nfw-modal__btn--confirm" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="nfw-msg-backdrop nfw-msg-backdrop--modal"
      role="presentation"
      onClick={mode === 'alert' ? onConfirm : onCancel}
    >
      <div
        className="nfw-write-dialog nfw-write-dialog--modal"
        role="alertdialog"
        aria-labelledby="nfw-modal-title"
        aria-describedby="nfw-modal-body"
        onClick={e => e.stopPropagation()}
      >
        <div className="nfw-modal__head">
          <h2 id="nfw-modal-title" className="nfw-modal__title">{screen}</h2>
          <button
            type="button"
            className="nfw-modal__close"
            onClick={mode === 'alert' ? onConfirm : onCancel}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div id="nfw-modal-body" className="nfw-modal__body">
          <p className="nfw-modal__message">{message}</p>
          {guidance && <p className="nfw-modal__guide">{guidance}</p>}
        </div>
        <div className="nfw-modal__actions">
          {mode === 'confirm' && (
            <button type="button" className="nfw-modal__btn nfw-modal__btn--cancel" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button type="button" className="nfw-modal__btn nfw-modal__btn--confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function useDialogEscape(onDismiss: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);
}
