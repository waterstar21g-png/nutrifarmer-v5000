import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSidebarPosts } from '@/lib/site-content';
import {
  findPublishedPostById,
  findPublishedPostBySlug,
  listPublishedByCategory,
} from '@/lib/v5000-content/posts';
import type { V5000PostRow } from '@/lib/v5000-content/schema';
import { SHOWCASE_CATS } from '@/lib/site-data';
import { firstImageFromBody, getSiteCategory } from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls } from '@/lib/v5000-content/media-mirror';
import { Suspense } from 'react';
import { SidebarSearch } from '@/components/SidebarSearch';
import { SinglePostFromWrite } from '@/components/SinglePostFromWrite';
import { PostComments } from '@/components/PostComments';
import { PostAdjacentNav } from '@/components/PostAdjacentNav';

interface Props {
  params: Promise<{ category: string; slug: string }>;
  searchParams: Promise<{ pid?: string; from?: string }>;
}

function pathSeg(v: string): string {
  try {
    return decodeURIComponent(v).trim();
  } catch {
    return v.trim();
  }
}

function removeFirstImageBlock(html: string): string {
  if (!html) return html;

  const figureWithImage = /<figure\b[^>]*>[\s\S]*?<img\b[\s\S]*?<\/figure>/i;
  if (figureWithImage.test(html)) {
    return html.replace(figureWithImage, '').trimStart();
  }

  return html.replace(/<img\b[^>]*>/i, '').trimStart();
}

async function resolvePost(slug: string, postId?: number): Promise<V5000PostRow | null> {
  if (postId) {
    const byId = await findPublishedPostById(postId).catch(() => null);
    if (byId) return byId;
  }
  return findPublishedPostBySlug(slug).catch(() => null);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  noStore();
  const { slug } = await params;
  const { pid } = await searchParams;
  const postId = pid ? parseInt(pid, 10) : undefined;
  const post = await resolvePost(slug, Number.isFinite(postId) ? postId : undefined);
  if (!post) return {};

  const bodyHtml = await rewriteHtmlMediaUrls(post.body);
  const imgUrl = firstImageFromBody(bodyHtml);
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      images: imgUrl ? [{ url: imgUrl }] : [],
    },
  };
}

export default async function PostPage({ params, searchParams }: Props) {
  noStore();
  const { slug, category } = await params;
  const { pid } = await searchParams;
  const postId = pid ? parseInt(pid, 10) : undefined;
  const post = await resolvePost(slug, Number.isFinite(postId) ? postId : undefined);

  if (!post) notFound();

  const canonicalSlug = post.slug;
  const canonicalCat = post.categorySlug;
  const resolvedByPid = Number.isFinite(postId) && post.id === postId;
  const catMismatch = pathSeg(canonicalCat) !== pathSeg(category);
  const slugMismatch = pathSeg(canonicalSlug) !== pathSeg(slug);

  if (!resolvedByPid && (catMismatch || slugMismatch)) {
    const q = new URLSearchParams();
    q.set('pid', String(post.id));
    redirect(`/${canonicalCat}/${canonicalSlug}?${q.toString()}`);
  }

  const cat = getSiteCategory(canonicalCat)
    ?? SHOWCASE_CATS.find(c => c.slug === category);
  const [rawBodyHtml, sidePosts, catPosts] = await Promise.all([
    rewriteHtmlMediaUrls(post.body),
    getSidebarPosts(canonicalCat),
    listPublishedByCategory(canonicalCat, 100),
  ]);
  const displayImgUrl = firstImageFromBody(rawBodyHtml);
  const bodyHtml = displayImgUrl ? removeFirstImageBlock(rawBodyHtml) : rawBodyHtml;
  const title = post.title;

  const idx = catPosts.findIndex(p => p.id === post.id);
  const older = idx >= 0 && idx < catPosts.length - 1 ? catPosts[idx + 1] : null;
  const newer = idx > 0 ? catPosts[idx - 1] : null;
  const prevPost = older
    ? { id: older.id, slug: older.slug, categorySlug: older.categorySlug, title: older.title }
    : null;
  const nextPost = newer
    ? { id: newer.id, slug: newer.slug, categorySlug: newer.categorySlug, title: newer.title }
    : null;

  return (
    <div className="nf-single-page nf-single-compact">
      <SinglePostFromWrite />
      <div className="nf-single-layout nf-single-main-wide">
        <article className="nf-single-main">
          <div className="nf-page-banner nf-page-banner--single" id="nf-single-banner-band">
            <div className="nf-page-banner__content">
              <h1 className="nf-page-banner__title">{title}</h1>
            </div>
          </div>

          {displayImgUrl ? (
            <div className="nf-single-hero" aria-label={`${title} 대표 이미지`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImgUrl}
                alt={title}
                className="nf-single-hero__img"
              />
            </div>
          ) : (
            <div className="nf-single-hero nf-single-hero--empty">
              <span aria-hidden="true">📷</span>
              <p>대표 이미지 없음</p>
            </div>
          )}

          {bodyHtml.replace(/<[^>]+>/g, '').trim().length > 0 && (
            <div
              className="wp-content nf-single-body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          )}

          <PostAdjacentNav prev={prevPost} next={nextPost} />

          <PostComments postId={post.id} />

          {cat && (
            <Link href={`/${cat.slug}`} className="nf-single__back">
              ← {cat.name} 목록으로
            </Link>
          )}
        </article>

        {cat && (
          <Suspense fallback={null}>
            <SidebarSearch
              posts={sidePosts}
              catSlug={cat.slug}
              catName={cat.name}
              currentSlug={canonicalSlug}
              currentPostId={post.id}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
