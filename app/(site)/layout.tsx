import { getLatestPreviewPosts, getPreviewPostsBySlugs } from '@/lib/home-posts';
import { ABOUT_ITEMS, FAMILY_ITEMS, SHOWCASE_CATS } from '@/lib/site-data';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HomePreviewProvider } from '@/components/home/HomePreviewProvider';

const FOOTER_CATEGORY_SLUGS = [
  ...new Set([
    ...SHOWCASE_CATS.map(cat => cat.slug),
    ...ABOUT_ITEMS.map(cat => cat.slug),
    ...FAMILY_ITEMS.map(cat => cat.slug),
  ]),
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [recentPosts, footerPostsBySlug] = await Promise.all([
    getLatestPreviewPosts(6).catch(() => []),
    getPreviewPostsBySlugs(FOOTER_CATEGORY_SLUGS, 1).catch(() => ({})),
  ]);

  return (
    <HomePreviewProvider>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter recentPosts={recentPosts} postsBySlug={footerPostsBySlug} />
    </HomePreviewProvider>
  );
}

