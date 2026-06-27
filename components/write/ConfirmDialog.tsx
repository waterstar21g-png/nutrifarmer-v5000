'use client';

import { useEffect } from 'react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="nfw-confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="nfw-confirm nfw-confirm--dialog"
        role="alertdialog"
        aria-labelledby="nfw-confirm-title"
        aria-describedby="nfw-confirm-desc"
        onClick={e => e.stopPropagation()}
      >
        <p id="nfw-confirm-title" className="nfw-confirm__title">{title}</p>
        <p id="nfw-confirm-desc" className="nfw-confirm__message">{message}</p>
        <div className="nfw-confirm__actions">
          <button type="button" className="nfw-btn nfw-btn--primary nfw-confirm__btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="nfw-btn nfw-confirm__btn" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
