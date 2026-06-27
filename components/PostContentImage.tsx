interface Props {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}

/** 게시글·썸네일 — 본문 이미지 URL 직접 로드 (next/image 도메인 제한 회피) */
export function PostContentImage({ src, alt, fill, className, priority, style }: Props) {
  const combinedStyle: React.CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : style;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={combinedStyle}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
