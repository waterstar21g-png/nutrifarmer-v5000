import { ABOUT_ITEMS, FAMILY_ITEMS } from '@/lib/site-data';
import type { PreviewPost } from '@/lib/home-posts';
import { PreviewCardGrid } from '@/components/PreviewCardGrid';
import { LatestPostsSection } from '@/components/LatestPostsSection';

interface Props {
  postsBySlug: Record<string, PreviewPost[]>;
  latestPosts: PreviewPost[];
  topicLabel?: string;
  topicPosts?: PreviewPost[];
}

export function HomeBottomSections({
  postsBySlug,
  latestPosts,
  topicLabel,
  topicPosts,
}: Props) {
  return (
    <>
      <section className="nf-feature nf-feature--alt">
        <div className="nf-feature__inner">
          <div className="nf-feature__head">
            <span className="nf-feature__section-label">나를 소개합니다</span>
            <h2 className="nf-feature__title">기록하는 삶, 나누는 이야기</h2>
            <p className="nf-feature__desc">
              이 블로그는 개인 홈페이지이자 삶의 아카이브입니다.<br />
              추억, 프로그램, 자료, 수익까지 — 시간이 지나도 다시 꺼내볼 수 있는 기록을 담습니다.
            </p>
          </div>
          <PreviewCardGrid
            items={ABOUT_ITEMS}
            postsBySlug={postsBySlug}
            zone="about"
            gridClass="nf-feature__grid"
            cardClass="nf-feature__card"
            iconClass="nf-feature__card-icon"
            nameClass="nf-feature__card-title"
            descClass="nf-feature__card-desc"
          />
        </div>
      </section>

      <section className="nf-feature">
        <div className="nf-feature__inner">
          <div className="nf-feature__head">
            <span className="nf-feature__section-label">가족 앨범</span>
            <h2 className="nf-feature__title">자녀·손자들의 성장 기록</h2>
          </div>
          <PreviewCardGrid
            items={FAMILY_ITEMS}
            postsBySlug={postsBySlug}
            zone="family"
            gridClass="nf-feature__grid"
            cardClass="nf-feature__card"
            iconClass="nf-feature__card-icon"
            nameClass="nf-feature__card-title"
            descClass="nf-feature__card-desc"
          />
        </div>
      </section>

      <section className="nf-feature nf-feature--alt" style={{ borderBottom: 'none' }}>
        <div className="nf-feature__inner">
          <div className="nf-feature__head">
            <span className="nf-feature__section-label">최신 글</span>
            <h2 className="nf-feature__title">방금 올린 이야기들</h2>
            <p className="nf-feature__desc">
              일상, 가족, 프로그램, 전문 글쓰기, 수익·뉴스 등<br />
              8개 카테고리에서 최신 글을 확인하세요.
            </p>
          </div>
          <LatestPostsSection
            posts={latestPosts}
            topicLabel={topicLabel}
            topicPosts={topicPosts}
          />
        </div>
      </section>
    </>
  );
}
