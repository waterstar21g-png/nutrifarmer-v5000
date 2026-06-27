import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSidebarPosts } from '@/lib/site-content';
import {
  findPublishedPostById,
  findPublishedPostBySlug,
} from '@/lib/v5000-content/posts';
import type { V5000PostRow } from '@/lib/v5000-content/schema';
import { SHOWCASE_CATS } from '@/lib/site-data';
import { getSiteCategory } from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls, resolveMediaUrlSync } from '@/lib/v5000-content/media-mirror';
import { SidebarSearch } from '@/components/SidebarSearch';
import { SinglePostFromWrite } from '@/components/SinglePostFromWrite';

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

function firstImgFromHtml(html: string): string | null {
  const tag = html.match(/<img\b[^>]*>/i)?.[0];
  if (!tag) return null;
  const src =
    tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ??
    tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ??
    tag.match(/\bsrcset=["']([^"'\s,]+)/i)?.[1] ??
    '';
  return src ? resolveMediaUrlSync(src.replace(/&amp;/g, '&')) : null;
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
  const imgUrl = firstImgFromHtml(bodyHtml);
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
  const [rawBodyHtml, sidePosts] = await Promise.all([
    rewriteHtmlMediaUrls(post.body),
    getSidebarPosts(canonicalCat),
  ]);
  const displayImgUrl = firstImgFromHtml(rawBodyHtml);
  const bodyHtml = displayImgUrl ? removeFirstImageBlock(rawBodyHtml) : rawBodyHtml;
  const title = post.title;

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
              <Image
                src={displayImgUrl}
                alt={title}
                fill
                priority
                sizes="(max-width: 900px) 100vw, calc(100vw - 340px)"
                style={{ objectFit: 'contain' }}
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

          {cat && (
            <Link href={`/${cat.slug}`} className="nf-single__back">
              ← {cat.name} 목록으로
            </Link>
          )}
        </article>

        {cat && (
          <SidebarSearch
            posts={sidePosts}
            catSlug={cat.slug}
            catName={cat.name}
            currentSlug={canonicalSlug}
          />
        )}
      </div>
    </div>
  );
}
