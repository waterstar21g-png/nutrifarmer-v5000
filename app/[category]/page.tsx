import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPosts, getCategoryBySlug, getCategories, getFeaturedImageUrl } from '@/lib/wordpress';
import { GalleryGrid } from '@/components/GalleryGrid';
import { Pagination } from '@/components/Pagination';

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const cats = await getCategories(true);
  return cats.map(c => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return {};
  return { title: cat.name, description: cat.description || `${cat.name} 카테고리 포스트 목록` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? '1', 10);

  const cat = await getCategoryBySlug(category);
  if (!cat || cat.count === 0) notFound();

  const { posts, total, totalPages } = await getPosts({ page, perPage: 12, categoryId: cat.id, embed: true });

  const galleryItems = posts.map(post => ({
    post,
    categorySlug: category,
    categoryName: cat.name,
    imageUrl: getFeaturedImageUrl(post) || null,
  }));

  return (
    <>
      <div className="nf-archive-banner">
        <p className="nf-archive-banner__label">카테고리</p>
        <h1 className="nf-archive-banner__title">{cat.name}</h1>
        {cat.description && (
          <p style={{ margin: '0 0 0.4rem', opacity: 0.82, fontSize: '0.9rem' }}>{cat.description}</p>
        )}
        <p className="nf-archive-banner__count">총 {total}개 글</p>
      </div>

      <div className="nf-archive-shell">
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '4rem' }}>포스트가 없습니다.</p>
        ) : (
          <GalleryGrid items={galleryItems} />
        )}
        <Pagination currentPage={page} totalPages={totalPages} basePath={`/${category}`} />
      </div>
    </>
  );
}
