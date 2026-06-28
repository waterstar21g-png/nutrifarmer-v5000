'use client';



import Link from 'next/link';

import { useState } from 'react';

import { useRouter, usePathname } from 'next/navigation';

import { SHOWCASE_CATS } from '@/lib/site-data';

import { openWriteWindow } from '@/lib/write-popup';

import { closeAllHomePreviews } from '@/lib/home-preview-bus';

import { postHref } from '@/lib/post-href';

import { HeaderSearch } from '@/components/HeaderSearch';

import { HeaderSocialIcons } from '@/components/HeaderSocialIcons';



const NAV_CATS = SHOWCASE_CATS.map(c => ({

  id: c.slug,

  name: c.name,

  slug: c.slug,

  count: 1,

  parent: 0,

}));



interface Props { activeSlug?: string; }

export function SiteHeader({ activeSlug }: Props) {

  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();

  const pathname = usePathname();

  const isHome = pathname === '/';

  const mainCats = NAV_CATS;



  const currentSlug = activeSlug ?? (() => {

    const seg = pathname.split('/').filter(Boolean)[0];

    return seg && NAV_CATS.some(c => c.slug === seg) ? seg : undefined;

  })();



  async function onNavCat(slug: string) {

    setMenuOpen(false);

    closeAllHomePreviews();

    try {

      const res = await fetch(

        `/api/v5000/posts/latest?category_slug=${encodeURIComponent(slug)}`,

        { cache: 'no-store' },

      );

      const data = await res.json() as {

        ok?: boolean;

        post?: { id: number; slug: string; categorySlug: string };

      };

      if (res.ok && data.ok && data.post) {

        router.push(postHref(data.post.categorySlug, data.post.slug, data.post.id));

        return;

      }

    } catch {

      /* fallback below */

    }

    router.push(`/${slug}`);

  }



  function onHomeClick(e: React.MouseEvent) {

    e.preventDefault();

    closeAllHomePreviews();

    if (isHome) {

      window.scrollTo({ top: 0, behavior: 'auto' });

      return;

    }

    router.push('/');

  }



  return (

    <>

      <div className="nf-top-bar nf-top-bar--accent">

        <div className="nf-top-bar__inner nf-top-bar__inner--3col">

          <span className="nf-top-bar__tagline">
            <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
              <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            삶의 기록, 따뜻한 이야기
          </span>

          <span className="nf-top-bar__links">일상 · 가족 · 성장 · 나눔</span>

          <div className="nf-top-bar__social-wrap">
            <HeaderSocialIcons />
          </div>

        </div>

      </div>



      <nav className="nf-nav-bar" aria-label="주요 내비게이션">

        <div className="nf-nav-bar__inner">

          <div className="nf-nav-bar__left">

            <div className="nf-nav-bar__brand-row">

              <div className="nf-nav-bar__brand-stack">

                <a
                  href="mailto:blog@nutrifarmer.local"
                  className="nf-nav-bar__brand-email"
                  title="blog@nutrifarmer.local"
                >
                  blog@nutrifarmer.local
                </a>

                <Link href="/" className="nf-nav-bar__brand-name-link" onClick={onHomeClick}>
                  <span className="nf-nav-bar__brand-name">탁월한 찬사</span>
                </Link>

                <span className="nf-nav-bar__brand-sub">개인홈페이지형 블로그</span>

              </div>

              <Link href="/" className="nf-home-btn" id="nf-home-btn" aria-label="홈으로" onClick={onHomeClick}>

                HOME

              </Link>

            </div>

          </div>



          <div className="nf-nav-bar__cats nf-top-categories">

            {mainCats.map(cat => (

              <button

                key={cat.id}

                type="button"

                className={`nf-nav-bar__cat nf-top-cat-btn${currentSlug === cat.slug ? ' is-active' : ''}`}

                onClick={() => onNavCat(cat.slug)}

              >

                {cat.name}

              </button>

            ))}

          </div>



          <div className="nf-nav-bar__actions">

            <div className="nf-nav-bar__actions-col">

              <div className="nf-nav-bar__actions-row">

                <HeaderSearch />

                <button type="button" className="nf-nav-bar__write" onClick={openWriteWindow}>글쓰기</button>

              </div>

            </div>

            <button

              className="nf-nav-bar__hamburger"

              onClick={() => setMenuOpen(v => !v)}

              aria-label="메뉴"

              aria-expanded={menuOpen}

            >

              {menuOpen ? '✕' : '☰'}

            </button>

          </div>

        </div>



        {menuOpen && (

          <div className="nf-nav-mobile-menu">

            {mainCats.map(cat => (

              <button

                key={cat.id}

                type="button"

                onClick={() => onNavCat(cat.slug)}

                className="nf-nav-mobile-item"

              >

                <span>{cat.name}</span>

              </button>

            ))}

          </div>

        )}

      </nav>

    </>

  );

}


