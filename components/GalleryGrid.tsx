'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { SitePostCard } from '@/lib/site-post-card';
import { postHref } from '@/lib/post-href';

interface GalleryItem {
  key?: string;
  post: SitePostCard;
  categorySlug: string;
  categoryName?: string;
  imageUrl?: string | null;
  pid?: number;
}

interface Props {
  items: GalleryItem[];
  className?: string;
  fourCol?: boolean;
  showCategory?: boolean;
}

export function GalleryGrid({ items, className, fourCol, showCategory = false }: Props) {
  return (
    <div className={`nf-gallery-grid${fourCol ? ' nf-gallery-grid--4col' : ''} ${className ?? ''}`}>
      {items.map(({ key, post, categorySlug, categoryName, imageUrl, pid }) => {
        const date = new Date(post.date).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
        const href = postHref(categorySlug, post.slug, pid);
        const itemKey = key ?? `post-${post.id}`;

        return (
          <Link key={itemKey} href={href} className="nf-gallery-card-link" aria-label={post.title}>
            <Card>
              <div className="nf-gallery-card__thumb">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width:480px) 100vw, (max-width:1024px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="nf-gallery-card__empty">📷</div>
                )}
                {showCategory && categoryName && (
                  <span className="nf-gallery-card__badge">{categoryName}</span>
                )}
              </div>
              <CardContent>
                {showCategory && categoryName && (
                  <span className="nf-gallery-card__cat">{categoryName}</span>
                )}
                <h2 className="nf-gallery-card__title">{post.title}</h2>
                {post.excerpt && (
                  <p className="nf-gallery-card__excerpt">{post.excerpt}</p>
                )}
                <time dateTime={post.date} className="nf-gallery-card__date">{date}</time>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
