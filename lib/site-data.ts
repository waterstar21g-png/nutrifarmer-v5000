/**
 * site-data.ts — 사이트 전역 정적 데이터 (단일 진실의 원천)
 * 카테고리/섹션 데이터를 한 곳에서 관리합니다.
 */

export interface CatItem {
  slug: string;
  name: string;
  desc: string;
  icon: string;
}

export interface StatItem {
  num: string;
  label: string;
  cards: CatItem[];
}

/** 8가지 메인 카테고리 쇼케이스 */
export const SHOWCASE_CATS: CatItem[] = [
  { slug: 'daily-life',       name: '일상 기록',   desc: '매일의 소소한 이야기',          icon: '📔' },
  { slug: 'family-growth',    name: '가족·성장',   desc: '자녀·손자 성장 기록',            icon: '🏡' },
  { slug: 'personal-archive', name: '개인 자료',   desc: '개인 자료 보관함',               icon: '📁' },
  { slug: 'archive-dev',      name: '프로그램',    desc: '프로그램 구축 자료',             icon: '💻' },
  { slug: 'life-photos',      name: '삶·사진',     desc: '삶의 기록과 사진',               icon: '📷' },
  { slug: 'revenue',          name: '수익관리',    desc: '수익 기록·분석',                 icon: '💰' },
  { slug: 'pro-writing',      name: '전문 글쓰기', desc: '전문적인 글과 칼럼',             icon: '✍️' },
  { slug: 'fresh-news',       name: '주변 이야기', desc: '주변 사람들의 신선한 이야기',    icon: '📰' },
];

/** 나를 소개합니다 섹션 */
export const ABOUT_ITEMS: CatItem[] = [
  { slug: 'about-memoir',     name: '추억하며',      desc: '삶의 추억과 회고',         icon: '🕯️' },
  { slug: 'about-program',    name: '프로그램 기록', desc: '개발 기록과 성장 노트',    icon: '💡' },
  { slug: 'personal-archive', name: '개인 자료',     desc: '개인 자료 보관함',         icon: '📁' },
  { slug: 'revenue',          name: '수익 관리',     desc: '수익 기록·분석',           icon: '📊' },
];

/** 가족 앨범 섹션 */
export const FAMILY_ITEMS: CatItem[] = [
  { slug: 'family-grandson',  name: '손자 성장일기', desc: '손자들의 성장 기록',       icon: '👶' },
  { slug: 'family-children',  name: '자녀 이야기',   desc: '자녀들의 따뜻한 이야기',  icon: '👨‍👧' },
  { slug: 'family-photos',    name: '가족 사진',     desc: '소중한 가족의 순간',       icon: '📸' },
  { slug: 'family-special',   name: '특별한 날',     desc: '특별한 날의 기록',         icon: '🎉' },
];

/** 통계 카운터 + 관련 카드 */
export const STAT_ITEMS: StatItem[] = [
  {
    num: '8+', label: '콘텐츠 카테고리',
    cards: SHOWCASE_CATS,
  },
  {
    num: '365', label: '일상 기록 가능일',
    cards: [
      { slug: 'daily-life',       name: '일상 기록',   desc: '매일의 소소한 이야기',   icon: '📔' },
      { slug: 'life-photos',      name: '삶·사진',     desc: '삶의 기록과 사진',       icon: '📷' },
      { slug: 'about-memoir',     name: '추억하며',    desc: '삶의 추억과 회고',       icon: '🕯️' },
      { slug: 'pro-writing',      name: '전문 글쓰기', desc: '전문적인 글과 칼럼',     icon: '✍️' },
      { slug: 'fresh-news',       name: '주변 이야기', desc: '신선한 주변 이야기',     icon: '📰' },
      { slug: 'revenue',          name: '수익관리',    desc: '수익 기록·분석',         icon: '💰' },
      { slug: 'archive-dev',      name: '프로그램',    desc: '프로그램 구축 자료',     icon: '💻' },
      { slug: 'personal-archive', name: '개인 자료',   desc: '개인 자료 보관함',       icon: '📁' },
    ],
  },
  {
    num: '∞', label: '가족·삶의 추억',
    cards: [
      { slug: 'family-growth',   name: '가족·성장',     desc: '자녀·손자 성장 기록',   icon: '🏡' },
      { slug: 'family-grandson', name: '손자 성장일기', desc: '손자들의 성장 기록',    icon: '👶' },
      { slug: 'family-children', name: '자녀 이야기',   desc: '자녀들의 이야기',       icon: '👨‍👧' },
      { slug: 'family-photos',   name: '가족 사진',     desc: '소중한 가족의 순간',    icon: '📸' },
      { slug: 'family-special',  name: '특별한 날',     desc: '특별한 날의 기록',      icon: '🎉' },
      { slug: 'life-photos',     name: '삶·사진',       desc: '삶의 기록과 사진',      icon: '📷' },
      { slug: 'about-memoir',    name: '추억하며',      desc: '삶의 추억과 회고',      icon: '🕯️' },
      { slug: 'about-program',   name: '프로그램 기록', desc: '개발 기록과 노트',      icon: '💡' },
    ],
  },
  {
    num: '4', label: '일상·가족·성장·나눔',
    cards: [
      { slug: 'daily-life',       name: '일상 기록',    desc: '매일의 소소한 이야기',  icon: '📔' },
      { slug: 'family-growth',    name: '가족·성장',    desc: '자녀·손자 성장 기록',   icon: '🏡' },
      { slug: 'about-memoir',     name: '추억하며',     desc: '삶의 추억과 회고',      icon: '🕯️' },
      { slug: 'fresh-news',       name: '주변 이야기',  desc: '신선한 주변 이야기',    icon: '📰' },
      { slug: 'pro-writing',      name: '전문 글쓰기',  desc: '전문적인 글과 칼럼',    icon: '✍️' },
      { slug: 'revenue',          name: '수익관리',     desc: '수익 기록·분석',        icon: '💰' },
      { slug: 'personal-archive', name: '개인 자료',    desc: '개인 자료 보관함',      icon: '📁' },
      { slug: 'archive-dev',      name: '프로그램',     desc: '프로그램 구축 자료',    icon: '💻' },
    ],
  },
];

/** 메인 카테고리 슬러그 목록 (nav/footer용) */
export const MAIN_CAT_SLUGS = SHOWCASE_CATS.map(c => c.slug);
