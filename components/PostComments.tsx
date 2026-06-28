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
  const [body, setBody] = useState('');

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
    setBody('');
    setName('');
    setEmail('');
    setError('');
    void loadComments();
  }, [postId, loadComments]);

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
          authorUrl: '',
          body,
        }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; comment?: Comment };
      if (!res.ok || !data.ok || !data.comment) {
        setError(data.message ?? '댓글 등록에 실패했습니다.');
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email }));
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
        <div className="nf-comments__head">
          <h2 className="nf-comments__title">댓글 남기기</h2>
          <button type="submit" form="nf-comment-form" className="nf-comments__submit" disabled={submitting}>
            {submitting ? '등록 중…' : '댓글 등록'}
          </button>
        </div>

        <form id="nf-comment-form" className="nf-comments__form" onSubmit={onSubmit}>
          <label className="nf-comments__field">
            <span className="nf-comments__label">댓글 *</span>
            <textarea
              required
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              className="nf-comments__textarea"
            />
          </label>

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

          {error && <p className="nf-comments__error" role="alert">{error}</p>}
        </form>
      </div>
    </section>
  );
}
