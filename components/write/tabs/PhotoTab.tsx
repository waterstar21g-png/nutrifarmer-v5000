'use client';

import { useState, useRef } from 'react';
import {
  buildGoogleImageSearchUrl,
  pickExternalSearchQuery,
} from '@/lib/write-external-search';
import { MEDIA_FONT_SIZE_DEFAULT } from '@/lib/media-font-size';
import { MediaFontSizeSlider } from '@/components/write/MediaFontSizeSlider';

const DESC_MAX = 100;

interface Props {
  onInsert: (payload: { url: string; alt: string; descFontSize: number }) => void;
  draftBodyRef: React.RefObject<HTMLTextAreaElement> | null;
  mediaApiUrl: string;
}

export function PhotoTab({ onInsert, mediaApiUrl }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState('');
  const [descText, setDescText] = useState('');
  const [descFontSize, setDescFontSize] = useState(MEDIA_FONT_SIZE_DEFAULT);
  const [uploading, setUploading] = useState(false);
  const [uploadedList, setUploadedList] = useState<{ id: string; url: string; alt: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const openInternalSearch = () => fileRef.current?.click();

  const openExternalSearch = () => {
    const q = pickExternalSearchQuery(urlInput, descText);
    if (!q) return;
    window.open(buildGoogleImageSearchUrl(q), '_blank', 'noopener,noreferrer');
  };

  const onDescChange = (value: string) => {
    setDescText(value.slice(0, DESC_MAX));
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name.replace(/\.[^.]+$/, ''));
      const r = await fetch(mediaApiUrl, { method: 'POST', body: formData, credentials: 'same-origin' });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        throw new Error(data.message ?? `HTTP ${r.status}`);
      }
      const url = data.url as string;
      const alt = data.alt || file.name.replace(/\.[^.]+$/, '');
      setUploadedList(list => [{ id: String(data.id), url, alt }, ...list]);
      setPreview(url);
      setDescText((data.alt || file.name.replace(/\.[^.]+$/, '')).slice(0, DESC_MAX));
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
    setDescText(file.name.replace(/\.[^.]+$/, '').slice(0, DESC_MAX));
    uploadFile(file);
  };

  const showPreview = () => {
    if (urlInput.trim()) setPreview(urlInput.trim());
  };

  const doInsert = () => {
    const url = (urlInput || preview || uploadedList[0]?.url || '').trim();
    onInsert({
      url,
      alt: (descText || '이미지').slice(0, DESC_MAX),
      descFontSize,
    });
  };

  return (
    <div className="nfw-photo-tab">
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />

      <div className="nfw-media-form">
        <div className="nfw-media-form__label-box">검색</div>
        <div className="nfw-media-form__btn-stack">
          <button type="button" className="nfw-media-form__search-btn" onClick={openInternalSearch}>
            내부
          </button>
          <button type="button" className="nfw-media-form__search-btn" onClick={openExternalSearch}>
            외부
          </button>
        </div>
        <input
          className="nfw-tmpl-input nfw-media-form__url"
          type="text"
          placeholder="검색어 또는 이미지 URL 입력…"
          value={urlInput}
          onChange={e => { setUrlInput(e.target.value); setPreview(e.target.value); }}
        />
        <button
          type="button"
          className="nfw-btn nfw-btn--sm nfw-media-form__preview"
          onClick={showPreview}
        >
          미리보기
        </button>

        <div className="nfw-media-form__label-box nfw-media-form__label-box--wide">이미지설명</div>
        <div className="nfw-media-form__desc-wrap">
          <input
            id="nfw-photo-desc"
            className="nfw-tmpl-input"
            placeholder="이미지설명 (선택, 최대 100자)…"
            value={descText}
            maxLength={DESC_MAX}
            onChange={e => onDescChange(e.target.value)}
          />
          <MediaFontSizeSlider
            id="nfw-photo-font-size"
            value={descFontSize}
            onChange={setDescFontSize}
          />
        </div>
      </div>

      {preview && (
        <div className="nfw-photo-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={descText} className="nfw-photo-preview__img" />
        </div>
      )}

      <div className="nfw-tmpl-actions">
        {uploading && <span className="nfw-tmpl-actions__status">업로드 중…</span>}
        <button type="button" className="nfw-btn nfw-btn--primary nfw-btn--sm" onClick={doInsert}>
          우측 본문에 추가
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
                onClick={() => { setPreview(img.url); setUrlInput(img.url); setDescText(img.alt); }}
              >
                선택
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
