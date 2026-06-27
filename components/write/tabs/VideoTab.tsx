'use client';
import { useState } from 'react';

interface Props {
  onInsert: (url: string, title: string) => void;
}

export function VideoTab({ onInsert }: Props) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const embedSrc = () => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return url;
  };

  return (
    <div className="nfw-video-tab">
      <div className="nfw-tmpl-toolbar">
        <input
          className="nfw-tmpl-input"
          type="url"
          placeholder="YouTube URL 또는 동영상 URL…"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <input
          className="nfw-tmpl-input"
          placeholder="제목 (선택)…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ maxWidth: '160px' }}
        />
      </div>

      {url && (
        <div className="nfw-video-preview">
          <iframe
            src={embedSrc()}
            title={title || '동영상 미리보기'}
            allowFullScreen
            width="100%"
            height="200"
            style={{ border: 'none', borderRadius: 8 }}
          />
        </div>
      )}

      <div className="nfw-tmpl-actions">
        <button
          className="nfw-btn nfw-btn--primary nfw-btn--sm"
          disabled={!url}
          onClick={() => onInsert(url, title || url)}
        >
          글쓰기-완성 커서 위치에 추가
        </button>
      </div>
    </div>
  );
}
