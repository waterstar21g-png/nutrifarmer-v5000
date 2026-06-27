import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 900, color: '#0f2744', marginBottom: '0.5rem' }}>404</h1>
      <p style={{ color: '#4a5568', marginBottom: '1.5rem' }}>페이지를 찾을 수 없습니다.</p>
      <Link href="/" style={{ background: '#0f2744', color: '#fff', padding: '0.65rem 1.75rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem' }}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
