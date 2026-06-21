'use client';
import { useState, useRef } from 'react';

interface FileItem { name: string; url: string; type: string; }

interface Props {
  onInsert: (url: string, name: string) => void;
  wpApiUrl: string;
}

export function FileTab({ onInsert, wpApiUrl }: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      const r = await fetch(`${wpApiUrl}/wp/v2/media`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const url = data.source_url ?? data.guid?.rendered ?? '';
      setFiles(list => [{ name: file.name, url, type: file.type }, ...list]);
    } catch {
      alert('업로드 실패 — WordPress 로그인 상태를 확인하세요.');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(uploadFile);
  };

  const filtered = search
    ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  return (
    <div className="nfw-file-tab">
      <div className="nfw-tmpl-toolbar">
        <input
          className="nfw-tmpl-input"
          placeholder="자료 검색…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input ref={fileRef} type="file" multiple hidden onChange={onFileChange} />
        <button className="nfw-btn nfw-btn--sm" onClick={() => fileRef.current?.click()}>
          📁 파일 찾기
        </button>
        {uploading && <span className="nfw-tmpl-actions__status">업로드 중…</span>}
      </div>

      {files.length === 0 && (
        <p className="nfw-panel-empty">파일을 업로드하면 여기에 표시됩니다.</p>
      )}

      <ul className="nfw-tmpl-list">
        {filtered.map((f, i) => (
          <li key={i} className="nfw-tmpl-item">
            <span className="nfw-tmpl-icon">
              {f.type.startsWith('image/') ? '🖼️' : f.type.includes('pdf') ? '📄' : '📎'}
            </span>
            <span className="nfw-tmpl-name">{f.name}</span>
            <button
              className="nfw-btn nfw-btn--sm nfw-btn--ghost"
              onClick={() => onInsert(f.url, f.name)}
            >초안에 링크</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
