import { getLatestPreviewPosts } from '@/lib/home-posts';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HomePreviewProvider } from '@/components/home/HomePreviewProvider';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const recentPosts = await getLatestPreviewPosts(6).catch(() => []);
  return (
    <HomePreviewProvider>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter recentPosts={recentPosts} />
    </HomePreviewProvider>
  );
}

