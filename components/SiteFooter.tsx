import Link from 'next/link';
import type { WPCategory } from '@/lib/wordpress';

interface Props { categories?: WPCategory[]; }

export function SiteFooter({ categories = [] }: Props) {
  const mainCats = categories.filter(c => c.count > 0 && c.parent === 0).slice(0, 6);
  return (
    <footer className="nf-footer">
      <div className="nf-footer__inner">
        <div>
          <p className="nf-footer__brand-name">탁월한 찬사</p>
          <p className="nf-footer__brand-desc">
            일상·가족·성장·나눔의<br />따뜻한 기록을 담은 개인 블로그
          </p>
        </div>
        {mainCats.length > 0 && (
          <div>
            <p className="nf-footer__col-title">카테고리</p>
            <ul className="nf-footer__links">
              {mainCats.map(cat => (
                <li key={cat.id}><Link href={`/${cat.slug}`}>{cat.name}</Link></li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="nf-footer__col-title">안내</p>
          <ul className="nf-footer__links">
            <li><Link href="/">홈</Link></li>
            <li><Link href="/write">글쓰기</Link></li>
            <li><Link href="/sitemap.xml">사이트맵</Link></li>
          </ul>
        </div>
      </div>
      <div className="nf-footer__bottom">
        © {new Date().getFullYear()} 탁월한 찬사 · nutrifarmer-v5000
      </div>
    </footer>
  );
}
