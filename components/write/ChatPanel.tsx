'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { DraftState } from './WriteEditor';
import { MEDIA_API } from './WriteEditor';
import { PhotoTab } from './tabs/PhotoTab';
import { VideoTab } from './tabs/VideoTab';
import { FileTab } from './tabs/FileTab';
import { runWriteAi } from '@/lib/write-ai';
import type { AiCmdId } from '@/lib/write-ai-local';
import {
  AI_COMMANDS_UPDATED,
  getCommandPrompt,
  loadAiCommands,
  type AiCommandKey,
} from '@/lib/write-ai-commands';
import { openAiCommandsWindow } from '@/lib/write-ai-window';
import { stripBodyPlain } from '@/lib/write-body-plain';

type MaterialMode = 'write' | 'photo' | 'video' | 'file';

interface AiTurn {
  id: number;
  prompt: string;
  commandText?: string;
  reply: string;
  loading?: boolean;
}

interface Props {
  draft: DraftState;
  onInsertImage: (payload: { url: string; alt: string; descFontSize: number }) => void;
  onInsertVideo: (payload: { url: string; title: string; descFontSize: number }) => void;
  onInsertFile: (payload: { url: string; name: string; descFontSize: number }) => void;
  onNewDraft: () => boolean | Promise<boolean>;
  onAiApply: (text: string, cmdId: AiCmdId) => void;
  onRecommendImages: () => Promise<string>;
  onPromptSubmitReady: (submit: () => void) => void;
  imageRecommendLoading?: boolean;
}

type SideBtn =
  | { id: 'prompt'; label: string; action: 'toggle-input' }
  | { id: AiCommandKey; label: string; action: 'run' }
  | { id: 'images'; label: string; action: 'recommend-images' }
  | { id: 'clear'; label: string; action: 'clear' };

function buildSideButtons(): SideBtn[] {
  const cmds = loadAiCommands();
  return [
    { id: 'prompt', label: '일반명령문', action: 'toggle-input' },
    { id: 'complete', label: cmds.complete.label, action: 'run' },
    { id: 'edit', label: cmds.edit.label, action: 'run' },
    { id: 'rewrite', label: cmds.rewrite.label, action: 'run' },
    { id: 'title', label: cmds.title.label, action: 'run' },
    { id: 'summary', label: cmds.summary.label, action: 'run' },
    { id: 'author', label: cmds.author.label, action: 'run' },
    { id: 'images', label: '사진/이미지', action: 'recommend-images' },
    { id: 'clear', label: '대화 초기화', action: 'clear' },
  ];
}

export function ChatPanel({
  draft, onInsertImage, onInsertVideo, onInsertFile,
  onNewDraft, onAiApply, onRecommendImages, onPromptSubmitReady, imageRecommendLoading,
}: Props) {
  const [mode, setMode] = useState<MaterialMode>('write');
  const [turns, setTurns] = useState<AiTurn[]>([]);
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [promptHeight, setPromptHeight] = useState(150);
  const [sideButtons, setSideButtons] = useState<SideBtn[]>(buildSideButtons);
  const logRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const turnSeq = useRef(0);

  useEffect(() => {
    const refresh = () => setSideButtons(buildSideButtons());
    window.addEventListener(AI_COMMANDS_UPDATED, refresh);
    return () => window.removeEventListener(AI_COMMANDS_UPDATED, refresh);
  }, []);

  const scrollLog = () => {
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  };

  const runAi = useCallback(async (
    commandText: string,
    displayLabel: string,
    cmdId: AiCmdId,
    applyToRight = true,
  ) => {
    const trimmed = commandText.trim();
    if (!trimmed && cmdId === 'prompt') return;

    const id = ++turnSeq.current;
    setTurns(prev => [...prev, {
      id,
      prompt: displayLabel,
      commandText: trimmed,
      reply: '',
      loading: true,
    }]);
    setAiLoading(true);
    scrollLog();

    await new Promise(r => setTimeout(r, 120));

    const context = stripBodyPlain(draft.body);
    const { text: body } = await runWriteAi(cmdId, trimmed, context);

    setTurns(prev =>
      prev.map(t => (t.id === id ? { ...t, reply: body, loading: false } : t)),
    );
    setAiLoading(false);
    scrollLog();

    if (applyToRight && body && !body.startsWith('⚠️')) {
      onAiApply(body, cmdId);
    }
  }, [draft.body, onAiApply]);

  const onAiBtn = (item: SideBtn) => {
    if (item.action === 'toggle-input') {
      setShowInput(v => !v);
      setMode('write');
      return;
    }
    if (item.action === 'clear') {
      setTurns([]);
      return;
    }
    if (item.action === 'recommend-images') {
      setMode('write');
      const id = ++turnSeq.current;
      setTurns(prev => [...prev, {
        id,
        prompt: '사진/이미지',
        reply: '',
        loading: true,
      }]);
      scrollLog();
      void onRecommendImages().then(reply => {
        setTurns(prev =>
          prev.map(t => (t.id === id ? { ...t, reply, loading: false } : t)),
        );
        scrollLog();
      });
      return;
    }
    if (item.action === 'run') {
      const cmdText = getCommandPrompt(item.id);
      runAi(cmdText, item.label, item.id, true);
    }
  };

  /** 전송 — 사용자 입력을 AI에 보내고 결과를 우측 창에 반영 */
  const sendPrompt = useCallback(() => {
    const text = input.trim();
    if (!text || aiLoading) return;
    runAi(text, `일반명령문: ${text.slice(0, 40)}${text.length > 40 ? '…' : ''}`, 'prompt', true);
    setInput('');
  }, [aiLoading, input, runAi]);

  useEffect(() => {
    onPromptSubmitReady(sendPrompt);
  }, [onPromptSubmitReady, sendPrompt]);

  const startNewWrite = useCallback(async () => {
    const ok = await Promise.resolve(onNewDraft());
    setMode('write');
    setShowInput(true);
    if (ok) {
      setTurns([]);
      setInput('');
    }
    requestAnimationFrame(() => promptRef.current?.focus());
  }, [onNewDraft]);

  const onMaterial = (m: MaterialMode) => {
    if (m === 'write') {
      void startNewWrite();
      return;
    }
    setMode(m);
  };

  const onPromptResizeDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = promptHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const move = (ev: MouseEvent) => {
      const next = startHeight + (ev.clientY - startY);
      setPromptHeight(Math.min(360, Math.max(86, next)));
    };
    const up = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [promptHeight]);

  return (
    <div className="nfw-chat">
      <div className="nfw-phase1-bar">
        <div className="nfw-phase1-bar__lead">
          <button type="button" className={`nfw-phase1-btn nfw-main-mode-btn nfw-phase1-btn--new${mode === 'write' ? ' is-active' : ''}`} onClick={() => void startNewWrite()}>
            새글 쓰기
          </button>
        </div>
        <div className="nfw-phase1-bar__rest">
        <button type="button" className={`nfw-phase1-btn nfw-main-mode-btn${mode === 'photo' ? ' is-active' : ''}`} onClick={() => onMaterial('photo')}>
          사진/이미지
        </button>
        <button type="button" className={`nfw-phase1-btn nfw-main-mode-btn${mode === 'video' ? ' is-active' : ''}`} onClick={() => onMaterial('video')}>
          동영상
        </button>
        <button type="button" className={`nfw-phase1-btn nfw-main-mode-btn${mode === 'file' ? ' is-active' : ''}`} onClick={() => onMaterial('file')}>
          파일/자료
        </button>
        </div>
      </div>

      <div className="nfw-phase2">
        <aside className="nfw-ai-sidebar" aria-label="AI 명령">
          {sideButtons.map(c => (
            <button
              key={c.id}
              type="button"
              className={`nfw-ai-side-btn${c.id === 'prompt' && showInput ? ' is-active' : ''}${c.id === 'images' ? ' nfw-ai-side-btn--images' : ''}`}
              onClick={() => onAiBtn(c)}
              disabled={
                (aiLoading && c.action !== 'clear' && c.action !== 'recommend-images') ||
                (imageRecommendLoading && c.action === 'recommend-images')
              }
            >
              {c.action === 'recommend-images' && imageRecommendLoading ? '검색 중…' : c.label}
            </button>
          ))}
          <button
            type="button"
            className="nfw-ai-sidebar__open-btn"
            onClick={openAiCommandsWindow}
            title="AI 버튼 — 명령문 조회/변경 (새 창)"
          >
            2차 AI명령
          </button>
        </aside>

        <div className={`nfw-phase2-body${mode === 'write' ? ' nfw-phase2-body--write' : ''}`}>
          {mode === 'write' && (
            <>
              {showInput && (
                <>
                  <div className="nfw-prompt-grid" style={{ height: promptHeight }}>
                    <label className="nfw-prompt-grid__label">일반명령문</label>
                    <textarea
                      ref={promptRef}
                      className="nfw-input nfw-content-text"
                      rows={4}
                      placeholder="AI에 전달할 구체적 요구사항을 입력하세요… (Enter 전송 → AI 응답을 우측 창에 반영, Shift+Enter 줄바꿈)"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendPrompt();
                        }
                      }}
                    />
                    <div className="nfw-prompt-grid__actions">
                      <button
                        type="button"
                        className="nfw-btn nfw-btn--sm"
                        disabled={turns.length === 0 && !aiLoading}
                        onClick={() => {
                          setTurns([]);
                          if (logRef.current) logRef.current.scrollTop = 0;
                        }}
                      >
                        지우기
                      </button>
                    </div>
                  </div>
                  <div
                    className="nfw-vresize nfw-vresize--prompt"
                    onMouseDown={onPromptResizeDown}
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="입력창 높이 조절"
                  />
                </>
              )}

              <div ref={logRef} className="nfw-chat__log nfw-chat__log--flex" aria-label="AI 대화">
                {turns.length === 0 && !aiLoading && (
                  <p className="nfw-chat__empty">AI 명령 버튼 또는 일반 명령문으로 요구사항을 전달하세요.</p>
                )}
                {turns.map(turn => (
                  <div key={turn.id} className="nfw-ai-turn">
                    <p className="nfw-ai-turn__prompt nfw-content-text">{turn.prompt}</p>
                    {turn.commandText && turn.commandText !== turn.prompt && (
                      <p className="nfw-ai-turn__cmd nfw-content-text">↳ AI 전달: {turn.commandText}</p>
                    )}
                    <p className={`nfw-ai-turn__reply nfw-content-text${turn.loading ? ' is-loading' : ''}`}>
                      {turn.loading ? '생성 중…' : turn.reply}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {mode === 'photo' && (
            <PhotoTab onInsert={onInsertImage} draftBodyRef={null} mediaApiUrl={MEDIA_API} />
          )}
          {mode === 'video' && (
            <VideoTab onInsert={onInsertVideo} />
          )}
          {mode === 'file' && (
            <FileTab onInsert={onInsertFile} mediaApiUrl={MEDIA_API} />
          )}
        </div>
      </div>
    </div>
  );
}
