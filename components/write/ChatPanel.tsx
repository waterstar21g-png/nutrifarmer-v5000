'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { DraftState, InsertedImage, WpCategory } from './WriteEditor';
import { PhotoTab } from './tabs/PhotoTab';
import { VideoTab } from './tabs/VideoTab';
import { FileTab } from './tabs/FileTab';

type Mode = 'write' | 'photo' | 'video' | 'file';

/* AI 명령 버튼 — 1행 8개, 각각 고유 색상 */
const AI_CMDS = [
  { label: '✏️ 글쓰기',  cmd: '아래 주제로 블로그 글을 작성해줘.',                      color: '#2563eb' },
  { label: '🔧 교정',    cmd: '위 내용을 교정하고 자연스럽게 다듬어줘.',                  color: '#7c3aed' },
  { label: '📋 요약',    cmd: '위 내용을 3줄로 요약해줘.',                                color: '#059669' },
  { label: '🌐 번역',    cmd: '위 내용을 영어로 번역해줘.',                               color: '#0891b2' },
  { label: '🔍 SEO',     cmd: '위 내용을 SEO에 최적화된 형태로 다시 써줘.',               color: '#d97706' },
  { label: '🏷️ 제목',   cmd: '위 내용에 어울리는 제목 5개를 제안해줘.',                   color: '#c05621' },
  { label: '💼 전문화',  cmd: '위 내용을 더 전문적이고 설득력 있게 다시 써줘.',            color: '#4f46e5' },
  { label: '😊 쉽게',    cmd: '위 내용을 친근하고 쉬운 말로 바꿔줘.',                     color: '#be185d' },
];

const MODE_CFG: Record<Mode, { label: string; color: string; bg: string }> = {
  write: { label: '✏️ 글쓰기',   color: '#fff', bg: '#2563eb' },
  photo: { label: '📷 사진·이미지', color: '#fff', bg: '#059669' },
  video: { label: '🎬 동영상',    color: '#fff', bg: '#7c3aed' },
  file:  { label: '📁 파일·자료', color: '#fff', bg: '#c05621' },
};

interface Msg { role: 'user' | 'ai'; text: string; ts: number; }

interface Props {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  categories: WpCategory[];
  onInsertImage: (img: InsertedImage) => void;
  wpApiUrl: string;
}

/* WordPress 없는 로컬 AI 시뮬레이션 */
function localAI(prompt: string, context: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('요약'))    return `📋 요약:\n${(context || '(본문 없음)').slice(0, 150).trim()}…\n\n위 내용의 핵심은 일상 기록과 삶의 이야기를 담는 것입니다.`;
  if (p.includes('번역'))    return `🌐 Translation:\n"${(context || prompt).slice(0, 120).trim()}"\n\nThis is a personal blog recording daily life, family stories, and memories.`;
  if (p.includes('seo'))     return `🔍 SEO 최적화:\n제목에 핵심 키워드 포함, 소제목(H2/H3) 활용, 문단 3-5문장 유지,\n내부 링크 추가 권장.\n\n[최적화된 본문 시작]\n${(context || '').slice(0, 200)}`;
  if (p.includes('제목'))    return `🏷️ 제목 제안 5가지:\n1. ${context.slice(0,20) || '오늘의 기록'} — 특별한 하루\n2. 잊지 못할 그 순간\n3. 삶의 작은 조각들\n4. 기억 속의 이야기\n5. 소소하지만 특별한 하루`;
  if (p.includes('전문화'))  return `💼 전문화 버전:\n${(context || '내용을 입력하면 전문적으로 개선해드립니다.').replace(/\n/g, ' ').slice(0, 300)}\n\n→ 독자의 이해를 돕기 위해 구체적 사례와 데이터 인용을 권장합니다.`;
  if (p.includes('쉽게'))    return `😊 쉽게 바꾼 버전:\n${(context || '내용을 입력하세요.').slice(0, 200)}\n\n→ 어려운 단어를 쉬운 표현으로 바꾸고, 짧은 문장으로 정리했습니다.`;
  if (p.includes('교정'))    return `🔧 교정된 버전:\n${context || '(본문에 내용을 입력하면 교정해드립니다.)'}\n\n→ 맞춤법과 어색한 표현을 정리했습니다.`;
  if (p.includes('글쓰기') || p.includes('작성')) {
    return `✏️ 블로그 글 초안:\n\n## ${prompt.replace(/.*주제[로:]?\s*/,'').slice(0,30) || '오늘의 이야기'}\n\n오늘 하루도 소소하지만 특별한 순간들이 있었습니다.\n\n일상 속 작은 행복들을 기록하는 것, 그것이 이 블로그의 목적입니다.\n\n매일의 기록이 쌓여 나만의 소중한 역사가 됩니다.\n\n---\n*이 초안을 본문에 추가하고 직접 다듬어 보세요.*`;
  }
  return `🤖 AI 응답:\n"${prompt}"\n\n입력하신 내용을 분석했습니다. 본문에 내용이 있으면 더 구체적인 도움을 드릴 수 있습니다.\n\n현재 본문: ${context ? `${context.slice(0,80)}…` : '(없음)'}`;
}

export function ChatPanel({ draft, setDraft, onInsertImage, wpApiUrl }: Props) {
  const [mode,       setMode]       = useState<Mode>('write');
  const [msgs,       setMsgs]       = useState<Msg[]>([]);
  const [input,      setInput]      = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [applied,    setApplied]    = useState<number | null>(null); // 적용된 msg ts
  const [chatH,      setChatH]      = useState(300); // 대화 로그 높이
  const logRef       = useRef<HTMLDivElement>(null);
  const dragY        = useRef<number | null>(null);
  const chatHRef     = useRef(chatH);
  chatHRef.current   = chatH;

  /* 수직 드래그 분리선 — 대화 영역 ↔ 모드 탭 */
  const onResizeDown = useCallback((e: React.MouseEvent) => {
    dragY.current = e.clientY;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    const move = (ev: MouseEvent) => {
      if (dragY.current === null) return;
      const delta = ev.clientY - dragY.current;
      dragY.current = ev.clientY;
      setChatH(h => Math.max(120, Math.min(600, h + delta)));
    };
    const up = () => {
      dragY.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, []);

  const scrollLog = () => {
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  };

  const pushMsg = useCallback((role: Msg['role'], text: string) => {
    const ts = Date.now();
    setMsgs(m => [...m, { role, text, ts }]);
    scrollLog();
    return ts;
  }, []);

  /* AI 전송 — WordPress 우선, 실패시 로컬 시뮬레이션 */
  const sendAI = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    pushMsg('user', prompt);
    setInput('');
    setAiLoading(true);
    let reply = '';
    try {
      const r = await fetch(`${wpApiUrl}/nutrifarmer/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: prompt, context: draft.body }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const data = await r.json();
        reply = data.reply ?? data.message ?? JSON.stringify(data);
      } else {
        reply = localAI(prompt, draft.body);
      }
    } catch {
      reply = localAI(prompt, draft.body);
    }
    pushMsg('ai', reply);
    setAiLoading(false);
  }, [wpApiUrl, draft.body, pushMsg]);

  /* 초안에 적용 — 확실한 업데이트 + 시각 피드백 */
  const applyToDraft = useCallback((text: string, ts: number) => {
    setDraft(prev => ({
      ...prev,
      body: prev.body ? `${prev.body}\n\n${text}` : text,
    }));
    setApplied(ts);
    setTimeout(() => setApplied(null), 2000);
  }, [setDraft]);

  return (
    <div className="nfw-chat">
      {/* AI 명령 버튼 — 1행 8개 */}
      <div className="nfw-chat__cmds">
        {AI_CMDS.map(c => (
          <button
            key={c.label}
            className="nfw-cmd"
            style={{ '--cmd-color': c.color } as React.CSSProperties}
            onClick={() => sendAI(c.cmd)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 대화 로그 — 높이 가변 */}
      <div
        ref={logRef}
        className="nfw-chat__log"
        style={{ height: chatH, minHeight: 120, overflowY: 'auto' }}
      >
        {msgs.length === 0 && (
          <p className="nfw-chat__empty">위 버튼을 클릭하거나 직접 메시지를 입력하세요.</p>
        )}
        {msgs.map(m => (
          <div key={m.ts} className={`nfw-msg nfw-msg--${m.role}`}>
            <span className="nfw-msg__role">{m.role === 'user' ? '나' : '🤖 AI'}</span>
            <p className="nfw-msg__text" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
            {m.role === 'ai' && (
              <button
                className={`nfw-msg__apply${applied === m.ts ? ' is-applied' : ''}`}
                onClick={() => applyToDraft(m.text, m.ts)}
              >
                {applied === m.ts ? '✅ 적용됨' : '초안에 적용 ↓'}
              </button>
            )}
          </div>
        ))}
        {aiLoading && (
          <div className="nfw-msg nfw-msg--ai">
            <span className="nfw-msg__role">🤖 AI</span>
            <p className="nfw-msg__text nfw-msg__text--loading">생성 중…</p>
          </div>
        )}
      </div>

      {/* 수직 드래그 분리선 */}
      <div className="nfw-vresize" onMouseDown={onResizeDown} title="드래그하여 높이 조절" />

      {/* 모드 탭 — 4개, 고유 색상 */}
      <div className="nfw-mode-tabs">
        {(Object.entries(MODE_CFG) as [Mode, typeof MODE_CFG[Mode]][]).map(([key, cfg]) => (
          <button
            key={key}
            className={`nfw-mode-tab${mode === key ? ' is-active' : ''}`}
            style={mode === key ? { background: cfg.bg, color: cfg.color } : {}}
            onClick={() => setMode(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* 모드 콘텐츠 */}
      <div className="nfw-mode-body">
        {mode === 'write' && (
          <div className="nfw-write-input">
            <textarea
              className="nfw-input"
              rows={4}
              placeholder="메시지를 입력하세요… (Ctrl+Enter 전송)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); sendAI(input); } }}
            />
            <div className="nfw-write-input__actions">
              <button className="nfw-btn nfw-btn--primary" onClick={() => sendAI(input)} disabled={aiLoading || !input.trim()}>
                전송
              </button>
              <button className="nfw-btn" onClick={() => setInput('')}>지우기</button>
              <button className="nfw-btn nfw-btn--ghost" onClick={() => setMsgs([])}>대화 초기화</button>
            </div>
          </div>
        )}
        {mode === 'photo' && (
          <PhotoTab onInsert={onInsertImage} draftBodyRef={null} wpApiUrl={wpApiUrl} />
        )}
        {mode === 'video' && (
          <VideoTab
            onInsert={(url, title) =>
              setDraft(d => ({ ...d, body: `${d.body}\n\n[동영상: ${title}](${url})\n` }))
            }
          />
        )}
        {mode === 'file' && (
          <FileTab
            onInsert={(url, name) =>
              setDraft(d => ({ ...d, body: `${d.body}\n\n[📎 ${name}](${url})\n` }))
            }
            wpApiUrl={wpApiUrl}
          />
        )}
      </div>
    </div>
  );
}
