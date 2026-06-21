import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '글쓰기 — 탁월한 찬사',
  description: 'WordPress 관리자에서 새 글을 작성합니다.',
};

const WP_WRITE_URL = 'https://www.nutrifarmer.kr/wp-admin/post-new.php';

export default function WritePage() {
  return (
    <div style={{
      maxWidth: 560,
      margin: '5rem auto',
      padding: '2.5rem 2rem',
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #dce5ef',
      textAlign: 'center',
      boxShadow: '0 4px 24px rgba(15,39,68,0.08)',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✍️</div>
      <h1 style={{
        fontSize: '1.5rem', fontWeight: 900, color: '#0f2744',
        letterSpacing: '-0.025em', marginBottom: '0.75rem',
      }}>
        글쓰기
      </h1>
      <p style={{ color: '#4a5568', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '2rem' }}>
        WordPress 관리자 페이지에서<br />새 글 및 이미지를 작성할 수 있습니다.
      </p>

      <a
        href={WP_WRITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#c05621',
          color: '#fff',
          padding: '0.75rem 2.2rem',
          borderRadius: 50,
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.95rem',
          transition: 'background 0.15s',
          letterSpacing: '-0.01em',
        }}
      >
        WordPress에서 글쓰기 →
      </a>

      <div style={{ marginTop: '1.5rem' }}>
        <Link
          href="/"
          style={{ color: '#94a3b8', fontSize: '0.83rem', textDecoration: 'none' }}
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
