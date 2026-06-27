'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { navigateAfterWriteLogout, openAuthFromWritePopup } from '@/lib/auth-navigation';

const AUTH_API = '/api/v5000/auth';

export function AuthStatus() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch(`${AUTH_API}/me`)
      .then(r => r.json())
      .then(data => setName(data.loggedIn ? (data.user?.name ?? '회원') : null))
      .catch(() => setName(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function logout() {
    await fetch(`${AUTH_API}/logout`, { method: 'POST' });
    setName(null);
    if (window.location.pathname.startsWith('/write')) {
      navigateAfterWriteLogout();
      return;
    }
    router.refresh();
    router.push('/');
  }

  if (loading) return <span className="nf-auth-chip nf-auth-chip--muted">…</span>;

  if (!name) {
    return (
      <button
        type="button"
        className="nf-auth-chip nf-auth-chip--login"
        onClick={() => openAuthFromWritePopup('/login?redirect_to=/write')}
      >
        로그인
      </button>
    );
  }

  return (
    <div className="nf-auth-chip-group">
      <span className="nf-auth-chip nf-auth-chip--user">{name}님</span>
      <button type="button" className="nf-auth-chip nf-auth-chip--logout" onClick={logout}>
        로그아웃
      </button>
    </div>
  );
}
