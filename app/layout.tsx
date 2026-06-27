import type { Metadata } from 'next';
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto',
  preload: false,
});

const notoSerifKR = Noto_Serif_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-serif',
  preload: false,
});

export const metadata: Metadata = {
  title: { default: '탁월한 찬사', template: '%s — 탁월한 찬사' },
  description: '일상·가족·성장·나눔의 따뜻한 기록을 담은 개인 홈페이지형 블로그',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://nutrifarmer-v5000.vercel.app',
  ),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} ${notoSerifKR.variable}`}>
      <body>{children}</body>
    </html>
  );
}
