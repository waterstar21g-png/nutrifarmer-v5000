'use client';

import { useEffect } from 'react';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export function NewDraftConfirmDialog({ onConfirm, onCancel }: Props) {
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
        className="nfw-confirm nfw-confirm--new-draft"
        role="alertdialog"
        aria-labelledby="nfw-new-draft-title"
        aria-describedby="nfw-new-draft-desc"
        onClick={e => e.stopPropagation()}
      >
        <p id="nfw-new-draft-title" className="nfw-confirm__title">새 글 쓰기</p>
        <p id="nfw-new-draft-desc" className="nfw-confirm__message">
          우측 본문에 작성 중인 내용이 있습니다.<br />새 글을 시작할까요?
        </p>
        <div className="nfw-confirm__actions">
          <button type="button" className="nfw-btn nfw-btn--primary nfw-confirm__btn" onClick={onConfirm}>
            초기화
          </button>
          <button type="button" className="nfw-btn nfw-confirm__btn" onClick={onCancel}>
            유지
          </button>
        </div>
      </div>
    </div>
  );
}
