'use client';

import type { EditorPost } from './WriteEditor';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function formatPublishMeta(post: EditorPost): string {
  const name = post.authorDisplayName?.trim() || '—';
  if (post.status !== 'publish' || !post.publishedAt) {
    return post.status === 'draft' ? `${name} · 초안` : name;
  }
  const d = new Date(post.publishedAt);
  const date = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${name} · ${date} · ${time}`;
}

interface Props {
  posts: EditorPost[];
  selectedId: number | null;
  emptyLabel?: string;
  onSelect: (post: EditorPost) => void;
}

export function PostListGrid({ posts, selectedId, emptyLabel = '목록 없음', onSelect }: Props) {
  if (posts.length === 0) {
    return <div className="nfw-load-grid nfw-load-grid--empty">{emptyLabel}</div>;
  }

  return (
    <ul className="nfw-load-grid" role="listbox" aria-label="글 목록">
      {posts.map(p => {
        const title = stripHtml(p.title) || '(제목 없음)';
        const active = p.id === selectedId;
        return (
          <li key={p.id} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={active}
              className={`nfw-load-grid__item${active ? ' is-active' : ''}`}
              onClick={() => onSelect(p)}
              title={title}
            >
              <span className="nfw-load-grid__title">{title}</span>
              <span className="nfw-load-grid__meta">{formatPublishMeta(p)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
