'use client';

import { useRef, useState } from 'react';
import {
  buildGoogleWebSearchUrl,
  pickExternalSearchQuery,
} from '@/lib/write-external-search';
import { MEDIA_FONT_SIZE_DEFAULT } from '@/lib/media-font-size';
import { MediaFontSizeSlider } from '@/components/write/MediaFontSizeSlider';

const DESC_MAX = 100;

interface FileItem {
  name: string;
  url: string;
  type: string;
}

interface Props {
  onInsert: (payload: { url: string; name: string; descFontSize: number }) => void;
  mediaApiUrl: string;
}

const FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.txt,.csv,.zip,.rtf,.jpg,.jpeg,.png,.gif,.webp,.mp4';

export function FileTab({ onInsert, mediaApiUrl }: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState('');
  const [descText, setDescText] = useState('');
  const [descFontSize, setDescFontSize] = useState(MEDIA_FONT_SIZE_DEFAULT);
  const [listFilter, setListFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openInternalSearch = () => fileRef.current?.click();

  const openExternalSearch = () => {
    const q = pickExternalSearchQuery(urlInput, descText);
    if (!q) return;
    window.open(buildGoogleWebSearchUrl(q), '_blank', 'noopener,noreferrer');
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', (file.name.replace(/\.[^.]+$/, '') || file.name).slice(0, DESC_MAX));
      const r = await fetch(mediaApiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      let data: { ok?: boolean; message?: string; code?: string; url?: string };
      try {
        data = await r.json();
      } catch {
        throw new Error(`HTTP ${r.status} — 서버 응답을 읽을 수 없습니다.`);
      }
      if (r.status === 401) {
        throw new Error('로그인이 필요합니다. 상단에서 다시 로그인해 주세요.');
      }
      if (!r.ok || !data.ok || !data.url) {
        throw new Error(data.message ?? `HTTP ${r.status}`);
      }
      const url = data.url;
      const mime = file.type || 'application/octet-stream';
      const label = file.name.replace(/\.[^.]+$/, '') || file.name;
      setFiles(list => [{ name: file.name, url, type: mime }, ...list]);
      setUrlInput(url);
      setPreview(url);
      setDescText(label.slice(0, DESC_MAX));
    } catch (e) {
      alert(e instanceof Error ? e.message : '업로드 실패 — 파일 형식·용량(15MB 이하)을 확인해 주세요.');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    for (const file of picked) {
      await uploadFile(file);
    }
  };

  const showPreview = () => {
    if (urlInput.trim()) setPreview(urlInput.trim());
  };

  const doInsert = () => {
    const url = urlInput.trim() || preview;
    if (!url) {
      alert('파일 URL을 입력하거나 파일을 선택해 주세요.');
      return;
    }
    onInsert({
      url,
      name: (descText || url.split('/').pop() || '파일').slice(0, DESC_MAX),
      descFontSize,
    });
  };

  const filtered = listFilter
    ? files.filter(f => f.name.toLowerCase().includes(listFilter.toLowerCase()))
    : files;

  return (
    <div className="nfw-file-tab">
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={FILE_ACCEPT}
        hidden
        onChange={e => void onFileChange(e)}
      />

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
          placeholder="또는 파일 URL 직접 입력·업로드 목록 검색…"
          value={urlInput}
          onChange={e => {
            const v = e.target.value;
            setUrlInput(v);
            setPreview(v);
            setListFilter(v);
          }}
        />
        <button
          type="button"
          className="nfw-btn nfw-btn--sm nfw-media-form__preview"
          onClick={showPreview}
        >
          미리보기
        </button>

        <div className="nfw-media-form__label-box nfw-media-form__label-box--wide">파일설명</div>
        <div className="nfw-media-form__desc-wrap">
          <input
            className="nfw-tmpl-input"
            placeholder="파일설명 (선택, 최대 100자)…"
            value={descText}
            maxLength={DESC_MAX}
            onChange={e => setDescText(e.target.value.slice(0, DESC_MAX))}
          />
          <MediaFontSizeSlider
            id="nfw-file-font-size"
            value={descFontSize}
            onChange={setDescFontSize}
          />
        </div>
      </div>

      {preview && (
        <p className="nfw-file-preview">
          <span className="nfw-file-preview__label">미리보기:</span>{' '}
          {descText || preview.split('/').pop() || preview}
        </p>
      )}

      <div className="nfw-tmpl-actions">
        {uploading && <span className="nfw-tmpl-actions__status">업로드 중…</span>}
        <button
          type="button"
          className="nfw-btn nfw-btn--primary nfw-btn--sm"
          onClick={doInsert}
        >
          우측 본문에 추가
        </button>
      </div>

      {files.length === 0 && !uploading && (
        <p className="nfw-panel-empty">파일을 업로드하면 여기에 표시됩니다. (PDF·DOC·HWP·ZIP 등)</p>
      )}

      <ul className="nfw-tmpl-list">
        {filtered.map(f => (
          <li key={f.url} className="nfw-tmpl-item">
            <span className="nfw-tmpl-icon">
              {f.type.startsWith('image/') ? '🖼️' : f.type.includes('pdf') ? '📄' : '📎'}
            </span>
            <span className="nfw-tmpl-name">{f.name}</span>
            <button
              type="button"
              className="nfw-btn nfw-btn--sm nfw-btn--ghost"
              onClick={() => {
                setUrlInput(f.url);
                setPreview(f.url);
                setDescText((f.name.replace(/\.[^.]+$/, '') || f.name).slice(0, DESC_MAX));
              }}
            >
              선택
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
