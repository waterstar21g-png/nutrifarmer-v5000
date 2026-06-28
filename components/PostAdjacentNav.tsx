import Link from 'next/link';
import { postHref } from '@/lib/post-href';

interface Props {
  prev?: { id: number; slug: string; categorySlug: string; title: string } | null;
  next?: { id: number; slug: string; categorySlug: string; title: string } | null;
}

export function PostAdjacentNav({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <nav className="nf-post-adjacent" aria-label="이전·다음 글">
      {prev ? (
        <Link
          href={postHref(prev.categorySlug, prev.slug, prev.id)}
          className="nf-post-adjacent__btn nf-post-adjacent__btn--prev"
        >
          이전 글
        </Link>
      ) : (
        <span className="nf-post-adjacent__spacer" aria-hidden="true" />
      )}
      {next ? (
        <Link
          href={postHref(next.categorySlug, next.slug, next.id)}
          className="nf-post-adjacent__btn nf-post-adjacent__btn--next"
        >
          다음 글
        </Link>
      ) : (
        <span className="nf-post-adjacent__spacer" aria-hidden="true" />
      )}
    </nav>
  );
}
