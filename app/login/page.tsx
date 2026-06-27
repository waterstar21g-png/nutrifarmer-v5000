import type { Metadata } from 'next';
import './login.css';
import { LoginPageClient } from './LoginPageClient';

export const metadata: Metadata = {
  title: '글쓰기 — 로그인',
  description: '이름 · 별명 · 이메일로 로그인하고 AI 글쓰기를 시작하세요.',
};

/** 로그인 페이지 — 헤더/푸터 없이 전체화면 */
export default function LoginPage() {
  return (
    <div className="nf-auth-page-root">
      <LoginPageClient />
    </div>
  );
}
