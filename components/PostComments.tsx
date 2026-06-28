'use client';

import { useCallback, useEffect, useState } from 'react';

type Comment = {
  id: number;
  authorName: string;
  authorUrl: string | null;
  body: string;
  createdAt: string;
};

const STORAGE_KEY = 'nf-comment-author';

interface Props {
  postId: number;
}

function loadSavedAuthor(): { name: string; email: string; url: string } {
  if (typeof window === 'undefined') return { name: '', email: '', url: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { name: '', email: '', url: '' };
    const data = JSON.parse(raw) as { name?: string; email?: string; url?: string };
    return {
      name: data.name ?? '',
      email: data.email ?? '',
      url: data.url ?? '',
    };
  } catch {
    return { name: '', email: '', url: '' };
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function PostComments({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [remember, setRemember] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v5000/comments?post_id=${postId}`, { cache: 'no-store' });
      const data = await res.json() as { ok?: boolean; comments?: Comment[] };
      setComments(data.comments ?? []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadComments();
    const saved = loadSavedAuthor();
    if (saved.name || saved.email) {
      setName(saved.name);
      setEmail(saved.email);
      setUrl(saved.url);
      setRemember(true);
    }
  }, [loadComments]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/v5000/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          authorName: name,
          authorEmail: email,
          authorUrl: url,
          body,
        }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; comment?: Comment };
      if (!res.ok || !data.ok || !data.comment) {
        setError(data.message ?? '댓글 등록에 실패했습니다.');
        return;
      }
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email, url }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      setComments(prev => [data.comment!, ...prev]);
      setBody('');
    } catch {
      setError('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="nf-comments" aria-label="댓글">
      {!loading && comments.length > 0 && (
        <ol className="nf-comments__list">
          {comments.map(c => (
            <li key={c.id} className="nf-comments__item">
              <div className="nf-comments__meta">
                {c.authorUrl ? (
                  <a href={c.authorUrl} className="nf-comments__author" rel="nofollow noopener noreferrer">
                    {c.authorName}
                  </a>
                ) : (
                  <strong className="nf-comments__author">{c.authorName}</strong>
                )}
                <time className="nf-comments__date" dateTime={c.createdAt}>
                  {formatDate(c.createdAt)}
                </time>
              </div>
              <p className="nf-comments__body">{c.body}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="nf-comments__box">
        <h2 className="nf-comments__title">댓글 남기기</h2>

        <form className="nf-comments__form" onSubmit={onSubmit}>
          <label className="nf-comments__field">
            <span className="nf-comments__label">댓글 *</span>
            <textarea
              required
              rows={8}
              value={body}
              onChange={e => setBody(e.target.value)}
              className="nf-comments__textarea"
            />
          </label>

          <p className="nf-comments__note">* 표시는 필수 입력 항목입니다.</p>

          <label className="nf-comments__field">
            <span className="nf-comments__label">이름 *</span>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="nf-comments__field">
            <span className="nf-comments__label">이메일 *</span>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="nf-comments__field">
            <span className="nf-comments__label">웹사이트</span>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              autoComplete="url"
            />
          </label>

          <label className="nf-comments__remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span>Save my name, email, and website in this browser for the next time I comment.</span>
          </label>

          {error && <p className="nf-comments__error" role="alert">{error}</p>}

          <button type="submit" className="nf-comments__submit" disabled={submitting}>
            {submitting ? '등록 중…' : '댓글 등록'}
          </button>
        </form>
      </div>
    </section>
  );
}
