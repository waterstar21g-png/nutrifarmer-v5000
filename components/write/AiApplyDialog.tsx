'use client';

interface Props {
  text: string;
  onReplace: () => void;
  onAppend: () => void;
  onCancel: () => void;
}

export function AiApplyDialog({ text, onReplace, onAppend, onCancel }: Props) {
  return (
    <div className="nfw-ai-apply-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="nfw-ai-apply"
        role="dialog"
        aria-labelledby="nfw-ai-apply-title"
        onClick={e => e.stopPropagation()}
      >
        <h3 id="nfw-ai-apply-title" className="nfw-ai-apply__title">AI 결과 적용</h3>
        <p className="nfw-ai-apply__lead">우측 [글쓰기 완성] 본문에 어떻게 반영할까요?</p>
        <pre className="nfw-ai-apply__preview">{text.slice(0, 1200)}{text.length > 1200 ? '…' : ''}</pre>
        <div className="nfw-ai-apply__actions">
          <button type="button" className="nfw-btn nfw-btn--primary" onClick={onReplace}>덮어쓰기</button>
          <button type="button" className="nfw-btn" onClick={onAppend}>기존 원문에 추가</button>
          <button type="button" className="nfw-btn nfw-btn--ghost" onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  );
}
