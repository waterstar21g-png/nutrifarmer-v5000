# nutrifarmer-v5000 CHANGELOG

> 프로젝트: 개인 홈페이지형 블로그 V5000 (CURSOR + VERCEL + CLOUDFLARE + CLOUDFLARE R2)
> 저장소: https://github.com/waterstar21g-png/nutrifarmer-v5000
> 배포 URL: https://nutrifarmer-v5000.vercel.app
> 원본 참조: https://www.nutrifarmer.kr/

---

## [미배포 대기] — 2026-06-21

### SiteHeader 네비게이션 카테고리 고정 8개로 변경
- **파일**: `components/SiteHeader.tsx`
- WordPress API 카테고리 대신 `SHOWCASE_CATS`(site-data.ts) 고정 사용
- 변경 전(WP 실제값 6개): 가족 사진 / 가족·성장 / 개인 자료 / 삶·사진 / 손자 성장일기 / 수익관리
- 변경 후(고정 8개): 일상 기록 / 가족·성장 / 개인 자료 / 프로그램 / 삶·사진 / 수익관리 / 전문 글쓰기 / 주변 이야기
- **배포 유보 중** (확인 후 `vercel --prod --yes` 실행)

---

## [v2.4] — 2026-06-21 AI 글쓰기 에디터 v2 (전면 개선)

### 배포 커밋: `9913816`

#### 수정 파일
- `components/write/WriteEditor.tsx`
- `components/write/ChatPanel.tsx`
- `components/write/DraftPanel.tsx`
- `app/write/write.css`

#### 변경 내용 (10가지)
1. **전체 글쓰기 흐름 연결**: 글쓰기→AI편집→이미지삽입→초안→미리보기→배포→재교정→초안→최종게시
2. **AI 명령 버튼 1행 8개**: flex 가로 배열, 각 버튼 고유 색상 (파란/보라/초록/청록/노랑/오렌지/남색/분홍)
3. **저장 실패(HTTP 401) 해결**: localStorage 기본 저장, WordPress는 선택적 게시
4. **"초안에 적용" 버그 수정**: 적용 시 `✅ 적용됨` 2초 시각 피드백
5. **모드 탭 4개 색상 구분**: ✏️파란 / 📷초록 / 🎬보라 / 📁오렌지, 폰트 확대
6. **수직 드래그 분리선**: AI대화↔모드탭 사이 높이 조절 핸들
7. **필드 라벨 간격 최소화**: 카테고리·제목·요약 3단 가로 1줄 배열
8. **이미지 삽입 바 위치 변경**: "커서 위치 삽입" 바를 본문 라벨 우측 인라인 배치
9. **재교정 버튼 흐름**: 배포탭 → "⬅ 재교정" → 초안탭 자동 복귀
10. **WordPress 없는 AI 시뮬레이션**: WP API 실패 시 로컬 AI 대응 (요약/번역/교정/SEO/제목/전문화/쉽게)

---

## [v2.3] — 2026-06-21 AI 글쓰기 에디터 v1 최초 구현

### 배포 커밋: `5719e49`

#### 신규 파일
- `app/write/layout.tsx` — 헤더/푸터 제외 전체화면 레이아웃
- `app/write/page.tsx` — 에디터 페이지 진입점
- `app/write/write.css` — 에디터 전용 스타일
- `components/write/WriteEditor.tsx` — 메인 에디터 컴포넌트
- `components/write/ChatPanel.tsx` — 좌측 AI 채팅 패널
- `components/write/DraftPanel.tsx` — 우측 스마트 초안 패널
- `components/write/tabs/PhotoTab.tsx` — 사진·이미지 탭
- `components/write/tabs/VideoTab.tsx` — 동영상 탭
- `components/write/tabs/FileTab.tsx` — 파일·자료 탭

#### 주요 기능
- 좌우 패널 스플리터 드래그 크기 조절
- AI 명령 8개 버튼 (글쓰기/교정/요약/번역/SEO/제목/전문화/쉽게)
- 이미지 삽입 위치 3가지 (상단/커서위치/하단)
- 기존 WP 게시글 불러오기 (가져오기)
- 버전 저장 (최대 10개)
- 배포 탭: 메타 정보 + HTML 미리보기 + 게시 버튼
- 원본 `nutrifarmer.kr/assistant/` 1:1 구현 기반

---

## [v2.2] — 2026-06-21 전체화면 레이아웃 + Hero 드래그 슬라이더

### 배포 커밋: `a68295d`

#### 변경 파일
- `app/globals.css`
- `components/HeroSlider.tsx`

#### CSS 전체화면 레이아웃 (`--nf-px` 변수)
| 섹션 | 변경 전 | 변경 후 |
|------|---------|---------|
| 카테고리 배너/쉘 | `max-width: 62%` | `width: 100%` |
| Stats Inner | `max-width: 860px` | `width: 100%` |
| Showcase Inner | `max-width: 1100px` | `width: 100%` |
| Feature Inner | `max-width: 1100px` | `width: 100%` |
| Footer Inner | `max-width: 1280px` | `width: 100%` |
| Home Shell | `max-width: 1280px` | `width: 100%` |

- `--nf-px: clamp(1.25rem, 3.5vw, 3rem)` 전역 패딩 변수 추가
- 쇼케이스 그리드: 4컬럼 → **8컬럼** (대형화면 1행 8개)
- 갤러리 그리드: 3컬럼 → **4컬럼**

#### HeroSlider 드래그 슬라이딩 트랙 방식 재작성
- `nf-hero-track` flex 트랙: 3개 슬라이드 가로 나열
- 드래그 중 `translateX` 실시간 업데이트 (손에 붙어 움직임)
- 드래그 중 자동 슬라이드 일시정지
- `0.42s cubic-bezier` 스냅 애니메이션

---

## [v2.1] — 2026-06-21 Stats 섹션 오렌지 배경 + 밑줄 활성화

### 배포 커밋: `(이전 커밋)`

#### 변경 파일: `app/globals.css`
- `.nf-stats` 배경: `#ffffff` → `var(--nf-accent)` (오렌지 `#c05621`)
- 개별 카드 테두리/배경 제거 → 전체화면 오렌지 배경
- 활성 표시: 오렌지 밑줄 → **흰색 밑줄** (`background: #fff`)
- 선택 상태: `background: rgba(255,255,255,0.16)` + 흰 밑줄

---

## [v2.0] — 2026-06-21 카테고리 페이지 개선 (검색, 고정 화살표)

### 배포 커밋: `a30409b`

#### 신규 컴포넌트
- `components/CategorySearch.tsx` — 카테고리 내 검색 드롭다운
- `components/SidebarSearch.tsx` — 단일글 우측 사이드바 검색 (역상 하이라이트)

#### 화살표 → 전체 창 좌우 끝 고정 배치
- `position: fixed; left/right: 0; top: 50%` 뷰포트 고정
- 반원형 버튼, hover 시 너비 확장 애니메이션
- 비활성 화살표 `display: none`

#### 검색 기능
- 카테고리 페이지: 검색창 → 드롭다운 결과 → 단일글 이동
- 단일글 사이드바: 실시간 검색 → 역상(흰배경+오렌지텍스트) 하이라이트
- 비매칭 항목 35% 투명 dim 처리

---

## [v1.5] — 2026-06-21 네비게이션 카테고리 버튼 폰트 확대

### 변경 파일: `app/globals.css`
- `.nf-nav-bar__cat` font-size: `0.88rem` → `1rem`
- padding: `0.7rem` → `0.8rem`

---

## [v1.4] — 2026-06-21 쇼케이스 카드 그리드 4×2 레이아웃

### 배포 커밋: `6238c70`

#### 변경 파일: `app/globals.css`
- `.nf-showcase__grid`: `repeat(8, 1fr)` → `repeat(4, 1fr)` (4컬럼 × 2행)
- 카드 패딩: compact → `2rem 1.5rem` 원복
- 아이콘: 2.2rem → 3rem
- 카드명 폰트: 0.88rem → 1.05rem
- 모바일(767px↓): 2컬럼 × 4행 유지

---

## [v1.3] — 2026-06-21 사이드바 검색 역상 처리

### 배포 커밋: `83e8625`

#### 신규 파일: `components/SidebarSearch.tsx`
- 단일글 페이지 우측 사이드바 검색 클라이언트 컴포넌트
- 검색어 입력 → 일치 항목 역상(오렌지 배경 + 흰 텍스트)
- 비일치 항목 흐리게(opacity 35%)
- 매칭 수 표시, ✕ 초기화 버튼

---

## [v1.2] — 2026-06-21 2차 UI 개선 (Stats, Hero, 사이드바)

### 주요 변경
- **Stats 카운터**: 4개 항목 클릭 시 하단 8개 카드 확장 (StatsSection 컴포넌트)
- **Hero 슬라이더**: 마우스 드래그 방식, 좌우 화살표 제거
- **단일글 우측 사이드바**: 2컬럼 레이아웃 (본문 + 사이드바)
- **카테고리 페이지**: 4×2 카드 그리드 + 화살표 페이지네이션
- **글쓰기 버튼**: /write 페이지 연결
- **lib/site-data.ts**: SHOWCASE_CATS, ABOUT_ITEMS, FAMILY_ITEMS, STAT_ITEMS 중앙화

---

## [v1.0] — 2026-06-21 V5000 프로젝트 최초 구축

### 기술 스택
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Font**: Noto Sans KR (Google Fonts)
- **배포**: Vercel
- **데이터**: WordPress REST API (www.nutrifarmer.kr)
- **스타일**: shadcn/ui 기반 커스텀 CSS (`--nf-*` 변수 체계)

### 구현된 페이지
| 경로 | 설명 |
|------|------|
| `/` | 홈 (Hero슬라이더 + Stats + Showcase + About + Family + Latest) |
| `/[category]` | 카테고리 목록 (8카드 + 검색 + 섹션들) |
| `/[category]/[slug]` | 단일글 (본문 + 우측 사이드바) |
| `/write` | AI 글쓰기 에디터 |
| `/not-found` | 404 페이지 |

### 구현된 컴포넌트
| 컴포넌트 | 역할 |
|----------|------|
| `SiteHeader` | 상단 네비게이션 (검색, 카테고리, 글쓰기) |
| `SiteFooter` | 5컬럼 푸터 |
| `HeroSlider` | 3슬라이드 드래그 캐러셀 |
| `StatsSection` | 통계 카운터 + 동적 카드 |
| `GalleryGrid` | 갤러리 카드 그리드 (3/4컬럼) |
| `CategorySearch` | 카테고리 페이지 내 검색 |
| `SidebarSearch` | 단일글 사이드바 검색 |

---

## 현재 프로젝트 파일 구조

```
nutrifarmer-v5000/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (Noto Sans KR, SiteHeader/Footer)
│   ├── page.tsx                # 홈페이지
│   ├── globals.css             # 전역 CSS (--nf-* 변수 체계)
│   ├── not-found.tsx           # 404
│   ├── write/
│   │   ├── layout.tsx          # 헤더/푸터 제외 레이아웃
│   │   ├── page.tsx            # AI 글쓰기 진입
│   │   └── write.css           # 에디터 전용 스타일
│   └── [category]/
│       ├── page.tsx            # 카테고리 목록
│       └── [slug]/page.tsx     # 단일글
├── components/
│   ├── SiteHeader.tsx          # ← nav 8개 고정 (배포 유보)
│   ├── SiteFooter.tsx
│   ├── HeroSlider.tsx          # 드래그 슬라이더
│   ├── StatsSection.tsx        # 통계 카운터
│   ├── GalleryGrid.tsx
│   ├── CategorySearch.tsx
│   ├── SidebarSearch.tsx
│   └── write/
│       ├── WriteEditor.tsx
│       ├── ChatPanel.tsx
│       ├── DraftPanel.tsx
│       └── tabs/
│           ├── PhotoTab.tsx
│           ├── VideoTab.tsx
│           └── FileTab.tsx
├── lib/
│   ├── site-data.ts            # 카테고리/섹션 고정 데이터 (단일 진실의 원천)
│   └── wordpress.ts            # WP REST API 함수
└── docs/
    └── CHANGELOG.md            # ← 현재 파일
```

---

## 다음 세션 시작 시 붙여넣기용 컨텍스트

```
V5000 작업 재개.
경로: D:/함께온라인/My_BLOG/nutrifarmer-v5000
GitHub: https://github.com/waterstar21g-png/nutrifarmer-v5000
배포URL: https://nutrifarmer-v5000.vercel.app
CHANGELOG: docs/CHANGELOG.md 참조

[배포 유보 중]
- SiteHeader nav 8개 수정 완료, 배포만 안 됨
  → 배포 명령: cd nutrifarmer-v5000 && vercel --prod --yes

[다음 작업]
- (여기에 입력)
```
