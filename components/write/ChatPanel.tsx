'use client';
import { useState, useRef, useCallback } from 'react';
import type { DraftState, InsertedImage, WpCategory, WpPost } from './WriteEditor';
import { PhotoTab } from './tabs/PhotoTab';
import { VideoTab } from './tabs/VideoTab';
import { FileTab } from './tabs/FileTab';

type Mode = 'write' | 'photo' | 'video' | 'file';

const AI_CMDS = [
  { label: '✏️ 글쓰기',   cmd: '아래 주제로 블로그 글을 작성해줘.' },
  { label: '🔧 교정',     cmd: '위 내용을 교정하고 자연스럽게 다듬어줘.' },
  { label: '📋 요약',     cmd: '위 내용을 3줄로 요약해줘.' },
  { label: '🌐 번역',     cmd: '위 내용을 영어로 번역해줘.' },
  { label: '🔍 SEO',      cmd: '위 내용을 SEO에 최적화된 형태로 다시 써줘.' },
  { label: '🏷️ 제목',    cmd: '위 내용에 어울리는 제목 5개를 제안해줘.' },
  { label: '💼 전문화',   cmd: '위 내용을 더 전문적이고 설득력 있게 다시 써줘.' },
  { label: '😊 쉽게',     cmd: '위 내용을 친근하고 쉬운 말로 바꿔줘.' },
];

interface Msg { role: 'user' | 'ai'; text: string; }

interface Props {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  categories: WpCategory[];
  onInsertImage: (img: InsertedImage) => void;
  onLoadPost: (post: WpPost) => void;
  wpApiUrl: string;
}

export function ChatPanel({ draft, setDraft, categories, onInsertImage, onLoadPost, wpApiUrl }: Props) {
  const [mode, setMode] = useState<Mode>('write');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const appendMsg = useCallback((role: Msg['role'], text: string) => {
    setMsgs(m => [...m, { role, text }]);
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  }, []);

  /* AI 호출 (WordPress REST API - nutrifarmer-ai endpoint) */
  const sendAI = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    appendMsg('user', prompt);
    setInput('');
    setAiLoading(true);
    try {
      const r = await fetch(`${wpApiUrl}/nutrifarmer/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: prompt, context: draft.body }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      appendMsg('ai', data.reply ?? data.message ?? JSON.stringify(data));
    } catch {
      appendMsg('ai', '⚠️ AI 응답 실패 — WordPress 로그인 또는 AI 설정을 확인하세요.');
    } finally {
      setAiLoading(false);
    }
  }, [wpApiUrl, draft.body, appendMsg]);

  const onCmdClick = (cmd: string) => sendAI(cmd);
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); sendAI(input); }
  };

  /* AI 응답을 초안 본문에 추가 */
  const applyAiToDraft = useCallback((text: string) => {
    setDraft(d => ({ ...d, body: d.body ? d.body + '\n\n' + text : text }));
  }, [setDraft]);

  return (
    <div className="nfw-chat">
      {/* AI 명령 버튼 그리드 */}
      <div className="nfw-chat__cmds">
        {AI_CMDS.map(c => (
          <button key={c.label} className="nfw-cmd" onClick={() => onCmdClick(c.cmd)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* 대화 로그 */}
      <div className="nfw-chat__log" ref={logRef}>
        {msgs.length === 0 && (
          <p className="nfw-chat__empty">AI 명령 버튼을 클릭하거나 직접 입력하세요.</p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`nfw-msg nfw-msg--${m.role}`}>
            <span className="nfw-msg__role">{m.role === 'user' ? '나' : '🤖 AI'}</span>
            <p className="nfw-msg__text" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
            {m.role === 'ai' && (
              <button
                className="nfw-msg__apply"
                onClick={() => applyAiToDraft(m.text)}
                title="초안 본문에 추가"
              >
                초안에 적용 ↓
              </button>
            )}
          </div>
        ))}
        {aiLoading && <div className="nfw-msg nfw-msg--ai"><span className="nfw-msg__role">🤖 AI</span><p className="nfw-msg__text nfw-msg__text--loading">생성 중…</p></div>}
      </div>

      {/* 모드 탭 */}
      <div className="nfw-mode-tabs">
        {(['write', 'photo', 'video', 'file'] as Mode[]).map(m => (
          <button
            key={m}
            className={`nfw-mode-tab${mode === m ? ' is-active' : ''}`}
            onClick={() => setMode(m)}
          >
            {{ write: '✏️ 글쓰기', photo: '📷 사진·이미지', video: '🎬 동영상', file: '📁 파일·자료' }[m]}
          </button>
        ))}
      </div>

      {/* 모드별 탭 콘텐츠 */}
      <div className="nfw-mode-body">
        {mode === 'write' && (
          <div className="nfw-write-input">
            <textarea
              className="nfw-input"
              rows={5}
              placeholder="메시지를 입력하세요… (Ctrl+Enter 전송)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="nfw-write-input__actions">
              <button className="nfw-btn nfw-btn--primary" onClick={() => sendAI(input)} disabled={aiLoading}>
                전송
              </button>
              <button className="nfw-btn" onClick={() => setInput('')}>지우기</button>
            </div>
          </div>
        )}

        {mode === 'photo' && (
          <PhotoTab
            onInsert={onInsertImage}
            draftBodyRef={null}
            wpApiUrl={wpApiUrl}
          />
        )}

        {mode === 'video' && (
          <VideoTab
            onInsert={(url, title) =>
              setDraft(d => ({ ...d, body: d.body + `\n\n[동영상: ${title}](${url})\n` }))
            }
          />
        )}

        {mode === 'file' && (
          <FileTab
            onInsert={(url, name) =>
              setDraft(d => ({ ...d, body: d.body + `\n\n[📎 ${name}](${url})\n` }))
            }
            wpApiUrl={wpApiUrl}
          />
        )}
      </div>
    </div>
  );
}
