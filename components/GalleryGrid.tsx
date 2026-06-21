'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { WPPost } from '@/lib/wordpress';

interface GalleryItem {
  post: WPPost;
  categorySlug: string;
  categoryName?: string;
  imageUrl?: string | null;
}

interface Props {
  items: GalleryItem[];
  className?: string;
}

export function GalleryGrid({ items, className }: Props) {
  return (
    <div className={`nf-gallery-grid ${className ?? ''}`}>
      {items.map(({ post, categorySlug, categoryName, imageUrl }) => {
        const date = new Date(post.date).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
        const href = `/${categorySlug}/${post.slug}`;
        const title = post.title.rendered.replace(/<[^>]+>/g, '');
        const excerpt = post.excerpt?.rendered.replace(/<[^>]+>/g, '').trim();

        return (
          <Card key={post.id}>
            {/* 썸네일 */}
            <Link href={href} className="nf-gallery-card__thumb" aria-label={title}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  sizes="(max-width:480px) 100vw, (max-width:1024px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="nf-gallery-card__empty">📷</div>
              )}
              {categoryName && (
                <span className="nf-gallery-card__badge">{categoryName}</span>
              )}
            </Link>

            {/* 본문 */}
            <CardContent>
              {categoryName && (
                <Link href={`/${categorySlug}`} className="nf-gallery-card__cat">
                  {categoryName}
                </Link>
              )}
              <h2 className="nf-gallery-card__title">
                <Link href={href}>{title}</Link>
              </h2>
              {excerpt && (
                <p className="nf-gallery-card__excerpt">{excerpt}</p>
              )}
              <time dateTime={post.date} className="nf-gallery-card__date">{date}</time>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
