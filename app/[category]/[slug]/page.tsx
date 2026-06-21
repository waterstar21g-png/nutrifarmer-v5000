import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getPostBySlug, getCategoryBySlug, getPosts,
  getFeaturedImageUrl, getPostCategories,
} from '@/lib/wordpress';
import { SidebarSearch } from '@/components/SidebarSearch';

interface Props { params: Promise<{ category: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const imgUrl = getFeaturedImageUrl(post);
  return {
    title: post.title.rendered.replace(/<[^>]+>/g, ''),
    description: post.excerpt.rendered.replace(/<[^>]+>/g, '').slice(0, 160),
    openGraph: {
      type: 'article',
      publishedTime: post.date,
      images: imgUrl ? [{ url: imgUrl }] : [],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug, category } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) redirect(`/${category}`);

  const imgUrl = getFeaturedImageUrl(post);
  const cats = getPostCategories(post);
  const cat = cats[0] ?? await getCategoryBySlug(category);
  const dateStr = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const title = post.title.rendered.replace(/<[^>]+>/g, '');

  const { posts: sidePosts } = cat
    ? await getPosts({ categoryId: cat.id, perPage: 20, embed: false }).catch(
        () => ({ posts: [], total: 0, totalPages: 0 })
      )
    : { posts: [] };

  return (
    <>
      {/* 상단 배너 (원본 동일: 배경이미지 + 제목 + 날짜 + 카테고리) */}
      <div className="nf-post-banner">
        {imgUrl && (
          <Image
            src={imgUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="nf-post-banner__bg"
            style={{ objectFit: 'cover' }}
          />
        )}
        <div className="nf-post-banner__overlay" />
        <div className="nf-post-banner__content">
          <h1 className="nf-post-banner__title">{title}</h1>
          <div className="nf-post-banner__meta">
            <span>|</span>
            <time dateTime={post.date}>{dateStr}</time>
            <span>|</span>
            {cat && (
              <Link href={`/${cat.slug}`} className="nf-post-banner__cat">
                {cat.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2컬럼: 좌측 본문 + 우측 사이드바 */}
      <div className="nf-single-layout">

        {/* 좌측 본문 */}
        <article className="nf-single-main">
          <nav aria-label="위치" className="nf-single__breadcrumb" style={{ marginTop: '1.5rem' }}>
            <Link href="/">홈</Link>
            {cat && (
              <>
                <span>›</span>
                <Link href={`/${cat.slug}`}>{cat.name}</Link>
              </>
            )}
            <span>›</span>
            <span>{title}</span>
          </nav>

          {imgUrl && (
            <div className="nf-single__thumb">
              <Image
                src={imgUrl}
                alt={title}
                fill
                sizes="(max-width:768px) 100vw, 820px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}

          <div
            className="wp-content"
            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
          />

          {cat && (
            <Link href={`/${cat.slug}`} className="nf-single__back">
              ← {cat.name} 목록으로
            </Link>
          )}
        </article>

        {/* 우측 사이드바 — 검색 + 역상 하이라이트 */}
        {cat && (
          <SidebarSearch
            posts={sidePosts}
            catSlug={cat.slug}
            catName={cat.name}
            currentSlug={slug}
          />
        )}
      </div>
    </>
  );
}
