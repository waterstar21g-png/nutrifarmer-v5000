import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { getCategories } from '@/lib/wordpress';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

const notoSansKR = Noto_Sans_KR({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto',
  preload: false,
});

export const metadata: Metadata = {
  title: { default: '탁월한 찬사', template: '%s — 탁월한 찬사' },
  description: '일상·가족·성장·나눔의 따뜻한 기록을 담은 개인 홈페이지형 블로그',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nutrifarmer-v5000.vercel.app'),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories(true).catch(() => []);
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body>
        <SiteHeader categories={categories} />
        <main>{children}</main>
        <SiteFooter categories={categories} />
      </body>
    </html>
  );
}
