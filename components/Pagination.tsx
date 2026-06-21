import Link from 'next/link';

interface Props { currentPage: number; totalPages: number; basePath: string; }

export function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (currentPage <= 4) return i + 1;
    if (currentPage >= totalPages - 3) return totalPages - 6 + i;
    return currentPage - 3 + i;
  });
  return (
    <nav aria-label="페이지 이동" className="nf-pagination">
      {currentPage > 1 && (
        <Link href={currentPage === 2 ? basePath : `${basePath}/page/${currentPage - 1}`}>‹</Link>
      )}
      {pages.map(p => (
        <Link
          key={p}
          href={p === 1 ? basePath : `${basePath}/page/${p}`}
          className={p === currentPage ? 'is-active' : ''}
        >{p}</Link>
      ))}
      {currentPage < totalPages && (
        <Link href={`${basePath}/page/${currentPage + 1}`}>›</Link>
      )}
    </nav>
  );
}
