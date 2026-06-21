'use client';
import { useState, useRef } from 'react';
import type { InsertedImage } from '../WriteEditor';

type InsertPos = 'top' | 'inline' | 'bottom';

interface Props {
  onInsert: (img: InsertedImage) => void;
  draftBodyRef: React.RefObject<HTMLTextAreaElement> | null;
  wpApiUrl: string;
}

export function PhotoTab({ onInsert, wpApiUrl }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState('');
  const [altText, setAltText] = useState('');
  const [position, setPosition] = useState<InsertPos>('inline');
  const [uploading, setUploading] = useState(false);
  const [uploadedList, setUploadedList] = useState<{ id: string; url: string; alt: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  /* 파일 업로드 → WordPress media API */
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^.]+$/, ''));
      const r = await fetch(`${wpApiUrl}/wp/v2/media`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const url = data.source_url ?? data.guid?.rendered ?? '';
      const alt = data.alt_text || file.name.replace(/\.[^.]+$/, '');
      setUploadedList(list => [{ id: String(data.id), url, alt }, ...list]);
      setPreview(url);
      setAltText(alt);
      setUrlInput(url);
    } catch {
      alert('업로드 실패 — WordPress 로그인 상태를 확인하세요.');
    } finally {
      setUploading(false);
    }
  };

  /* 로컬 파일 선택시 미리보기 */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setAltText(file.name.replace(/\.[^.]+$/, ''));
    uploadFile(file);
  };

  const doInsert = () => {
    const url = urlInput.trim() || preview;
    if (!url) { alert('이미지 URL이 없습니다.'); return; }
    onInsert({
      id: Date.now().toString(),
      url,
      alt: altText || '이미지',
      position,
    });
    alert(`이미지가 "${position === 'top' ? '상단' : position === 'bottom' ? '하단' : '커서 위치'}"에 등록되었습니다.`);
  };

  return (
    <div className="nfw-photo-tab">
      {/* 파일 찾기 + URL 입력 */}
      <div className="nfw-tmpl-toolbar">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onFileChange}
        />
        <button
          className="nfw-btn nfw-btn--sm"
          onClick={() => fileRef.current?.click()}
        >
          📁 파일 찾기
        </button>
        <input
          className="nfw-tmpl-input"
          type="url"
          placeholder="또는 이미지 URL 직접 입력…"
          value={urlInput}
          onChange={e => { setUrlInput(e.target.value); setPreview(e.target.value); }}
        />
        <button
          className="nfw-btn nfw-btn--sm"
          onClick={() => { if (urlInput.trim()) setPreview(urlInput.trim()); }}
        >미리보기</button>
      </div>

      {/* 미리보기 영역 */}
      {preview && (
        <div className="nfw-photo-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={altText} className="nfw-photo-preview__img" />
        </div>
      )}

      {/* alt 텍스트 */}
      <div className="nfw-tmpl-toolbar">
        <label className="nfw-field__label" style={{ flexShrink: 0 }}>alt</label>
        <input
          className="nfw-tmpl-input"
          placeholder="이미지 설명 (alt text)…"
          value={altText}
          onChange={e => setAltText(e.target.value)}
        />
      </div>

      {/* 삽입 위치 선택 ← 핵심 추가 기능 */}
      <div className="nfw-insert-pos">
        <span className="nfw-insert-pos__label">삽입 위치</span>
        {(['top', 'inline', 'bottom'] as InsertPos[]).map(p => (
          <label key={p} className={`nfw-insert-pos__opt${position === p ? ' is-active' : ''}`}>
            <input
              type="radio"
              name="insertPos"
              value={p}
              checked={position === p}
              onChange={() => setPosition(p)}
              hidden
            />
            {{ top: '⬆ 상단', inline: '📍 커서 위치', bottom: '⬇ 하단' }[p]}
          </label>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="nfw-tmpl-actions">
        {uploading && <span className="nfw-tmpl-actions__status">업로드 중…</span>}
        <button className="nfw-btn nfw-btn--primary nfw-btn--sm" onClick={doInsert} disabled={!preview}>
          초안에 등록
        </button>
      </div>

      {/* 업로드된 이미지 목록 */}
      {uploadedList.length > 0 && (
        <ul className="nfw-tmpl-list">
          {uploadedList.map(img => (
            <li key={img.id} className="nfw-tmpl-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="nfw-tmpl-thumb" />
              <span className="nfw-tmpl-name">{img.alt}</span>
              <button
                className="nfw-btn nfw-btn--sm nfw-btn--ghost"
                onClick={() => { setPreview(img.url); setUrlInput(img.url); setAltText(img.alt); }}
              >선택</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
