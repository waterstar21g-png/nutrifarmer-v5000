import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPostBySlug, getCategoryBySlug, getFeaturedImageUrl, getPostCategories } from '@/lib/wordpress';

interface Props { params: Promise<{ category: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const imgUrl = getFeaturedImageUrl(post);
  return {
    title: post.title.rendered.replace(/<[^>]+>/g, ''),
    description: post.excerpt.rendered.replace(/<[^>]+>/g, '').slice(0, 160),
    openGraph: { type: 'article', publishedTime: post.date, images: imgUrl ? [{ url: imgUrl }] : [] },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug, category } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const imgUrl = getFeaturedImageUrl(post);
  const cats = getPostCategories(post);
  const cat = cats[0] ?? await getCategoryBySlug(category);
  const dateStr = new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <article className="nf-single-shell">
      <nav aria-label="위치" className="nf-single__breadcrumb">
        <Link href="/">홈</Link>
        {cat && (<><span>›</span><Link href={`/${cat.slug}`}>{cat.name}</Link></>)}
        <span>›</span>
        <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
      </nav>

      <header>
        {cat && <Link href={`/${cat.slug}`} className="nf-single__cat">{cat.name}</Link>}
        <h1 className="nf-single__title" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
        <time dateTime={post.date} className="nf-single__date">{dateStr}</time>
      </header>

      {imgUrl && (
        <div className="nf-single__thumb">
          <Image
            src={imgUrl}
            alt={post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || ''}
            fill
            priority
            sizes="(max-width:768px) 100vw, 820px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      <div className="wp-content" dangerouslySetInnerHTML={{ __html: post.content.rendered }} />

      {cat && (
        <Link href={`/${cat.slug}`} className="nf-single__back">
          ← {cat.name} 목록으로
        </Link>
      )}
    </article>
  );
}
