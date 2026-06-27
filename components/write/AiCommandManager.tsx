'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AI_COMMAND_KEYS,
  DEFAULT_AI_COMMANDS,
  loadAiCommands,
  resetAiCommands,
  saveAiCommands,
  type AiCommandDef,
  type AiCommandKey,
} from '@/lib/write-ai-commands';

interface Props {
  /** 팝업 창 전용 페이지 — 닫기는 window.close */
  standalone?: boolean;
  onClose?: () => void;
}

export function AiCommandManager({ standalone = false, onClose }: Props) {
  const [commands, setCommands] = useState<Record<AiCommandKey, AiCommandDef>>(DEFAULT_AI_COMMANDS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCommands(loadAiCommands());
    setSaved(false);
  }, []);

  const updatePrompt = useCallback((key: AiCommandKey, prompt: string) => {
    setCommands(prev => ({ ...prev, [key]: { ...prev[key], prompt } }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    saveAiCommands(commands);
    setSaved(true);
  }, [commands]);

  const handleReset = useCallback(() => {
    if (!confirm('모든 명령문을 기본값으로 되돌릴까요?')) return;
    setCommands(resetAiCommands());
    setSaved(true);
  }, []);

  const handleClose = useCallback(() => {
    if (standalone) {
      window.close();
      return;
    }
    onClose?.();
  }, [standalone, onClose]);

  return (
    <div className={`nfw-cmdmgr${standalone ? ' nfw-cmdmgr--standalone' : ''}`}>
      <header className="nfw-cmdmgr__head">
        <h1 className="nfw-cmdmgr__title">AI 버튼 — 명령문 조회/변경</h1>
        <button type="button" className="nfw-cmdmgr__close" onClick={handleClose} aria-label="닫기">
          ✕
        </button>
      </header>

      <p className="nfw-cmdmgr__lead">
        좌측 AI 버튼 클릭 시 아래 문장이 AI에게 직접 전달됩니다. 우측 본문은 명령의 참고 자료로 함께 보냅니다.
      </p>

      <div className="nfw-cmdmgr__list">
        {AI_COMMAND_KEYS.map(key => {
          const cmd = commands[key];
          return (
            <div key={key} className="nfw-cmdmgr__item">
              <label className="nfw-cmdmgr__label" htmlFor={`cmd-${key}`}>
                {cmd.label}
              </label>
              <textarea
                id={`cmd-${key}`}
                className="nfw-cmdmgr__textarea"
                rows={3}
                value={cmd.prompt}
                onChange={e => updatePrompt(key, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      <footer className="nfw-cmdmgr__foot">
        {saved && <span className="nfw-cmdmgr__saved">저장되었습니다. 글쓰기 창의 AI 버튼에 즉시 반영됩니다.</span>}
        <button type="button" className="nfw-btn nfw-btn--sm" onClick={handleReset}>기본값 복원</button>
        <button type="button" className="nfw-btn nfw-btn--sm nfw-btn--primary" onClick={handleSave}>저장</button>
        <button type="button" className="nfw-btn nfw-btn--sm" onClick={handleClose}>닫기</button>
      </footer>
    </div>
  );
}
