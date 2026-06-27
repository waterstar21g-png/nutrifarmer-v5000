'use client';

import { useState } from 'react';
import {
  buildYouTubeSearchUrl,
  pickExternalSearchQuery,
} from '@/lib/write-external-search';
import { MEDIA_FONT_SIZE_DEFAULT } from '@/lib/media-font-size';
import { MediaFontSizeSlider } from '@/components/write/MediaFontSizeSlider';

const DESC_MAX = 100;

interface Props {
  onInsert: (payload: { url: string; title: string; descFontSize: number }) => void;
}

export function VideoTab({ onInsert }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState('');
  const [descText, setDescText] = useState('');
  const [descFontSize, setDescFontSize] = useState(MEDIA_FONT_SIZE_DEFAULT);

  const embedSrc = (raw: string) => {
    const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return raw;
  };

  const openInternalSearch = () => {
    const pasted = window.prompt('YouTube URL 또는 동영상 URL을 입력하세요.');
    if (!pasted?.trim()) return;
    setUrlInput(pasted.trim());
    setPreview(pasted.trim());
  };

  const openExternalSearch = () => {
    const q = pickExternalSearchQuery(urlInput, descText);
    if (!q) return;
    window.open(buildYouTubeSearchUrl(q), '_blank', 'noopener,noreferrer');
  };

  const showPreview = () => {
    if (urlInput.trim()) setPreview(urlInput.trim());
  };

  const doInsert = () => {
    const url = urlInput.trim() || preview;
    if (!url) {
      alert('동영상 URL을 입력하거나 검색해 주세요.');
      return;
    }
    onInsert({
      url,
      title: (descText || url).slice(0, DESC_MAX),
      descFontSize,
    });
  };

  return (
    <div className="nfw-video-tab">
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
          type="url"
          placeholder="YouTube URL 또는 동영상 URL 직접 입력…"
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

        <div className="nfw-media-form__label-box nfw-media-form__label-box--wide">동영상설명</div>
        <div className="nfw-media-form__desc-wrap">
          <input
            className="nfw-tmpl-input"
            placeholder="동영상설명 (선택, 최대 100자)…"
            value={descText}
            maxLength={DESC_MAX}
            onChange={e => setDescText(e.target.value.slice(0, DESC_MAX))}
          />
          <MediaFontSizeSlider
            id="nfw-video-font-size"
            value={descFontSize}
            onChange={setDescFontSize}
          />
        </div>
      </div>

      {preview && (
        <div className="nfw-video-preview">
          <iframe
            src={embedSrc(preview)}
            title={descText || '동영상 미리보기'}
            allowFullScreen
            width="100%"
            height="200"
            style={{ border: 'none', borderRadius: 8 }}
          />
        </div>
      )}

      <div className="nfw-tmpl-actions">
        <button
          type="button"
          className="nfw-btn nfw-btn--primary nfw-btn--sm"
          onClick={doInsert}
        >
          우측 본문에 추가
        </button>
      </div>
    </div>
  );
}
