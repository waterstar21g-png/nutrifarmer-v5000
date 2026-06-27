'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface WriteMessagePayload {
  screen: string;
  message: string;
  guidance?: string;
  confirmLabel?: string;
  cancelLabel?: string;
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
      {pending && (
        <WriteMessageDialog
          {...pending.payload}
          mode={pending.mode}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
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
  mode,
  onConfirm,
  onCancel,
}: DialogProps) {
  return (
    <div className="nfw-msg-backdrop" role="presentation" onClick={mode === 'alert' ? onConfirm : onCancel}>
      <div
        className="nfw-msg"
        role="alertdialog"
        aria-labelledby="nfw-msg-screen"
        aria-describedby="nfw-msg-body"
        onClick={e => e.stopPropagation()}
      >
        <dl className="nfw-msg__grid">
          <div className="nfw-msg__row">
            <dt>화면</dt>
            <dd id="nfw-msg-screen">{screen}</dd>
          </div>
          <div className="nfw-msg__row">
            <dt>내용</dt>
            <dd id="nfw-msg-body">{message}</dd>
          </div>
          {guidance && (
            <div className="nfw-msg__row nfw-msg__row--guide">
              <dt>조치</dt>
              <dd>{guidance}</dd>
            </div>
          )}
        </dl>
        <div className="nfw-msg__actions">
          {mode === 'confirm' && (
            <button type="button" className="nfw-btn nfw-msg__btn" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button type="button" className="nfw-btn nfw-btn--primary nfw-msg__btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
