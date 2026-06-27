'use client';

import { useState, useRef } from 'react';
import type { InsertedImage } from '../WriteEditor';

const ALT_MAX = 100;

type InsertPos = 'top' | 'inline' | 'bottom';

interface Props {
  onInsert: (img: InsertedImage) => void;
  draftBodyRef: React.RefObject<HTMLTextAreaElement> | null;
  mediaApiUrl: string;
}

export function PhotoTab({ onInsert, mediaApiUrl }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState('');
  const [altText, setAltText] = useState('');
  const [position, setPosition] = useState<InsertPos>('inline');
  const [uploading, setUploading] = useState(false);
  const [uploadedList, setUploadedList] = useState<{ id: string; url: string; alt: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const openInternalSearch = () => fileRef.current?.click();

  const openExternalSearch = () => {
    const q = window.prompt('구글 등에서 검색할 이미지 키워드를 입력하세요.');
    if (!q?.trim()) return;
    window.open(
      `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q.trim())}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const onAltChange = (value: string) => {
    setAltText(value.slice(0, ALT_MAX));
  };
  const uploadFile = async (file: File) => {

    setUploading(true);

    try {

      const formData = new FormData();

      formData.append('file', file);

      formData.append('alt', file.name.replace(/\.[^.]+$/, ''));

      const r = await fetch(mediaApiUrl, { method: 'POST', body: formData });

      const data = await r.json();

      if (!r.ok || !data.ok) {

        throw new Error(data.message ?? `HTTP ${r.status}`);

      }

      const url = data.url as string;

      const alt = data.alt || file.name.replace(/\.[^.]+$/, '');

      setUploadedList(list => [{ id: String(data.id), url, alt }, ...list]);

      setPreview(url);

      setAltText((data.alt || file.name.replace(/\.[^.]+$/, '')).slice(0, ALT_MAX));

      setUrlInput(url);

    } catch (e) {

      alert(e instanceof Error ? e.message : '업로드 실패 — R2 설정을 확인하거나 URL로 직접 입력해 주세요.');

    } finally {

      setUploading(false);

    }

  };



  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) return;

    const localUrl = URL.createObjectURL(file);

    setPreview(localUrl);

    setAltText(file.name.replace(/\.[^.]+$/, '').slice(0, ALT_MAX));

    uploadFile(file);

  };



  const doInsert = () => {

    const url = urlInput.trim() || preview;

    if (!url) { alert('이미지 URL이 없습니다.'); return; }

    onInsert({

      id: Date.now().toString(),

      url,

      alt: (altText || '이미지').slice(0, ALT_MAX),

      position,

    });

    alert(`이미지가 [글쓰기-완성] ${position === 'top' ? '상단' : position === 'bottom' ? '하단' : '커서 위치'}에 추가되었습니다.`);

  };



  return (

    <div className="nfw-photo-tab">

      <div className="nfw-tmpl-toolbar">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
        <button type="button" className="nfw-btn nfw-btn--sm" onClick={openInternalSearch}>
          [내부 검색]
        </button>
        <button type="button" className="nfw-btn nfw-btn--sm" onClick={openExternalSearch}>
          [외부 검색]
        </button>
        <input
          className="nfw-tmpl-input"
          type="url"
          placeholder="또는 이미지 URL 직접 입력…"
          value={urlInput}
          onChange={e => { setUrlInput(e.target.value); setPreview(e.target.value); }}
        />
        <button
          type="button"
          className="nfw-btn nfw-btn--sm"
          onClick={() => { if (urlInput.trim()) setPreview(urlInput.trim()); }}
        >
          미리보기
        </button>
      </div>


      {preview && (

        <div className="nfw-photo-preview">

          {/* eslint-disable-next-line @next/next/no-img-element */}

          <img src={preview} alt={altText} className="nfw-photo-preview__img" />

        </div>

      )}



      <div className="nfw-tmpl-toolbar nfw-tmpl-toolbar--alt">
        <label className="nfw-field__label nfw-field__label--alt" htmlFor="nfw-photo-alt">
          이미지설명
        </label>
        <input
          id="nfw-photo-alt"
          className="nfw-tmpl-input"
          placeholder="이미지설명 (선택, 최대 100자)…"
          value={altText}
          maxLength={ALT_MAX}
          onChange={e => onAltChange(e.target.value)}
        />
        <span className="nfw-alt-count">{altText.length}/{ALT_MAX}</span>
      </div>


      <div className="nfw-insert-pos">

        <span className="nfw-insert-pos__label">삽입 위치</span>

        {(['top', 'inline', 'bottom'] as InsertPos[]).map(p => (

          <label key={p} className={`nfw-insert-pos__opt${position === p ? ' is-active' : ''}`}>

            <input type="radio" name="insertPos" value={p} checked={position === p}

              onChange={() => setPosition(p)} hidden />

            {{ top: '⬆ 상단', inline: '📍 커서 위치', bottom: '⬇ 하단' }[p]}

          </label>

        ))}

      </div>



      <div className="nfw-tmpl-actions">

        {uploading && <span className="nfw-tmpl-actions__status">업로드 중…</span>}

        <button className="nfw-btn nfw-btn--primary nfw-btn--sm" onClick={doInsert} disabled={!preview}>

          글쓰기-완성 커서 위치에 추가

        </button>

      </div>



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

