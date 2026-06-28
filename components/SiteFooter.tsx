import Link from 'next/link';
import type { PreviewPost } from '@/lib/home-posts';
import { postHref } from '@/lib/post-href';

const MAIN_CATS = [
  { slug: 'daily-life',       name: '일상 기록'   },
  { slug: 'family-growth',    name: '가족·성장'   },
  { slug: 'personal-archive', name: '개인 자료'   },
  { slug: 'archive-dev',      name: '프로그램'    },
  { slug: 'life-photos',      name: '삶·사진'     },
  { slug: 'revenue',          name: '수익관리'    },
  { slug: 'pro-writing',      name: '전문 글쓰기' },
  { slug: 'fresh-news',       name: '주변 이야기' },
];

const STORY_CATS = [
  { slug: 'about-memoir',     name: '추억하며'    },
  { slug: 'about-program',    name: '프로그램 기록' },
  { slug: 'personal-archive', name: '개인 자료'   },
  { slug: 'revenue',          name: '수익 관리'   },
];

const FAMILY_CATS = [
  { slug: 'family-grandson',  name: '손자 성장일기' },
  { slug: 'family-children',  name: '자녀 이야기'  },
  { slug: 'family-photos',    name: '가족 사진'    },
  { slug: 'family-special',   name: '특별한 날'    },
];

interface Props {
  recentPosts?: PreviewPost[];
  postsBySlug?: Record<string, PreviewPost[]>;
}

function footerCategoryHref(slug: string, postsBySlug: Record<string, PreviewPost[]>): string {
  const post = postsBySlug[slug]?.[0];
  return post ? postHref(post.categorySlug, post.slug, post.pid ?? post.id) : '/';
}

export function SiteFooter({ recentPosts = [], postsBySlug = {} }: Props) {
  const recent = recentPosts.slice(0, 6);

  return (
    <footer className="nf-footer">
      <div className="nf-footer__inner">
        <div className="nf-footer__brand-col">
          <p className="nf-footer__brand-name">탁월한 찬사</p>
          <p className="nf-footer__brand-desc">
            탁월한 찬사,<br />
            개인 홈페이지형 블로그입니다.<br />
            일상, 가족, 자료, 프로그램, 수익 관리까지,<br />
            삶의 기록을 한곳에 모았습니다.
          </p>
        </div>

        <div>
          <p className="nf-footer__col-title">8가지 콘텐츠, 기록하는 삶</p>
          <ul className="nf-footer__links">
            {MAIN_CATS.map(cat => (
              <li key={cat.slug}>
                <Link href={footerCategoryHref(cat.slug, postsBySlug)}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="nf-footer__col-title">나누는 이야기</p>
          <ul className="nf-footer__links">
            {STORY_CATS.map(cat => (
              <li key={cat.slug + cat.name}>
                <Link href={footerCategoryHref(cat.slug, postsBySlug)}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="nf-footer__col-title">자녀·손자들의 성장 기록</p>
          <ul className="nf-footer__links">
            {FAMILY_CATS.map(cat => (
              <li key={cat.slug}>
                <Link href={footerCategoryHref(cat.slug, postsBySlug)}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="nf-footer__col-title">방금 올린 이야기들</p>
          <ul className="nf-footer__links">
            {recent.length > 0
              ? recent.map(post => (
                  <li key={post.id}>
                    <Link href={postHref(post.categorySlug, post.slug, post.pid ?? post.id)}>{post.title}</Link>
                  </li>
                ))
              : MAIN_CATS.slice(0, 6).map(cat => (
                  <li key={cat.slug + 'r'}>
                    <Link href={footerCategoryHref(cat.slug, postsBySlug)}>{cat.name}</Link>
                  </li>
                ))
            }
          </ul>
        </div>
      </div>

      <div className="nf-footer__bottom">
        © {new Date().getFullYear()} 탁월한 찬사 — Nutrifarmer Personal Blog. All rights reserved.
      </div>
    </footer>
  );
}
