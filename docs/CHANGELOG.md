# nutrifarmer-v5000 CHANGELOG

> 프로젝트: 개인 홈페이지형 블로그 V5000 (CURSOR + VERCEL + CLOUDFLARE + CLOUDFLARE R2)
> 저장소: https://github.com/waterstar21g-png/nutrifarmer-v5000
> 배포 URL: https://nutrifarmer-v5000.vercel.app
> 원본 참조: https://www.nutrifarmer.kr/

---

## V5.X.X.X 릴리스 (2026-06-28~)

| 버전 | git | 배포 ID | 요약 |
|---|---|---|---|
| **V5.0.0.0** | `0dff010` | `dpl_6hZXiMyxGp8tpac819PEoJ3vPiu5` | UI spec 1~10 반영 **이전** baseline |
| **V5.0.0.1** | `bc070b5` | `dpl_GpHbEsqCA9YrnQEnihessaq2HWty` | `/write` 전체 글자 +60% (×1.6) |

> **버전 파일:** `docs/V5000-VERSION.json` · **규칙:** V5 = 플랫폼 · MINOR = 공개 UI 배치 · PATCH = 글쓰기·도구 배치

---

> **Spec:** [`docs/V5000-native-platform-spec.md`](V5000-native-platform-spec.md)  
> **상태:** Phase C·D 완료 (2026-06-27) · git `d1448c8` · prod tag `prod-canonical-2026-06-27` → `dpl_CANs…`

> 본 CHANGELOG는 **V5000**(`nutrifarmer-v5000`) 전용. V3000/V4000은 마이그레이션·참조 언급 시에만 기록.

### 확정 결정 (2026-06-24)

| 항목 | 결정 |
|------|------|
| DB | **Vercel Postgres** |
| 미디어 | **Cloudflare R2** (`media.nutrifarmer.kr` CDN) |
| WordPress | **런타임 미사용** — app/ 에서 WP REST 제거 (2026-06-27) |
| 회원가입 | **공개 가입** |
| WP 계정 이전 | **강제 비밀번호 재설정** (해시 이전 없음) |

---

### 작업 로그 (보관)

#### 2026-06-24 — 플랫폼 방향 확정 · 인증 설계

- V5000 / v4000 / v3000 **완전 분리** 원칙 확정 (Docker·WordPress 불필요)
- `docs/V5000-native-platform-spec.md` 작성
- `.cursor/rules/project-context.mdc` — Native Platform·무 WP 반영
- 운영 진단: Vercel env (`WP_*`, `RESEND`, `NF_V5000_SERVER_KEY`) · WP 4.2.0 `auth_cookies` 부재 → **WP 브릿지 폐기 결정**

#### 2026-06-24~25 — Phase A: V5000 Native Auth

| 구분 | 내용 |
|------|------|
| DB | `drizzle/0000_v5000_auth.sql` — `v5000_users`, `v5000_password_resets` |
| ORM | Drizzle + `@neondatabase/serverless` |
| lib | `lib/v5000-auth/` — config · db · schema · session · password · validate · users · recovery · api |
| API | `/api/v5000/auth/login` · `register` · `logout` · `me` · `find` · `lost` · `verify-code` · `reset-password` |
| UI | `app/login/` · `components/auth/LoginHub.tsx` — **register 패널 V5000 내장** (WP 외부 링크 제거) |
| 세션 | 쿠키 `nf-v5000-session` (HMAC) · `middleware.ts` `/write` 보호 |
| 게이트 | `components/auth/WriteGate.tsx` → `/api/v5000/auth/me` |
| 팝업 | `lib/auth-navigation.ts` — 글쓰기/로그인 최대화 팝업 |
| 스크립트 | `scripts/db-migrate.mjs` · `scripts/setup-v5000-db.mjs` |
| env | `.env.example` — `POSTGRES_URL`, `AUTH_SESSION_SECRET`, Resend, R2 |
| 제거 | 레거시 `/api/auth/*`, `lib/wp-session.ts`, `lib/wp-auth-proxy.ts`, `/api/wp/*` |

#### 2026-06-25 — UI parity (nutrifarmer.kr 동작 재현)

| 구분 | 내용 |
|------|------|
| 헤더 nav 8 | `lib/home-hero-bus.ts` + `SiteHeader` — 홈에서 카테고리 클릭 시 **히어로 글 필터** (쇼케이스 미리보기 아님) |
| HOME 버튼 | `SiteHeader` — 홈 히어로 마케팅 슬라이드 복귀 |
| Stats 4 | `StatsSection` — 4개 버튼 각각 **안내 패널** (`FEATURE_PANELS` in `lib/site-data.ts`) |
| 쇼케이스 8 | `PreviewCardGrid` · `CategoryPreviewPanel` — 카드 아래 **인라인 미리보기** ·「아래 더 보기」확장 |
| 래퍼 | `components/HomeHeroBlock.tsx` — Hero + Stats 통합 |
| 히어로 | `HeroSlider` — nav 선택 시 해당 카테고리 최신 글 배너 |
| 데이터 | `lib/home-posts.ts` — 미러 URL 일괄 해석 |
| 배포 | `dpl_5EeGLojeMZwdV76m4GAPUdi3zcEy` · `dpl_Cc9p4CXNTgmvLbiaNNTKxzyLrPpr` |

#### 2026-06-25 — R2 미디어 마이그레이션 (속도 개선)

| 구분 | 내용 |
|------|------|
| DB | `drizzle/0002_v5000_media_mirror.sql` — `v5000_media_mirror` (wp_url → r2_key, public_url) |
| lib | `lib/v5000-content/media-mirror.ts` — `resolveMediaUrl`, `rewriteHtmlMediaUrls` |
| 스크립트 | `scripts/migrate-wp-images-to-r2.mjs` (`npm run media:migrate-wp`) |
| 실행 | WP 이미지 **807/808** → R2 `nutrifarmer-media` + DB 메타 (1건 WP 502) |
| CDN | `https://media.nutrifarmer.kr/uploads/...` — 홈·단일글 이미지 URL 전환 확인 |
| 배포 | `dpl_Cc9p4CXNTgmvLbiaNNTKxzyLrPpr` |

#### 2026-06-25 — R2 S3 키 교체 (보안)

| 구분 | 내용 |
|------|------|
| 문제 | Vercel R2 env 값 비어 있음 · 메모장 평문 Access Key 노출 |
| 조치 | Cloudflare R2 **User API Token** `nutrifarmer-v5000` 발급 |
| 스크립트 | `scripts/apply-r2-keys.mjs` (`npm run r2:apply`) · `scripts/rotate-r2-keys.mjs` (`npm run r2:rotate`) |
| Vercel | `R2_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY` · `R2_ACCOUNT_ID` · `R2_BUCKET_NAME` Production 교체 |
| 정리 | `NotePad_자료/` 평문 키 삭제 · `R2_ROTATION_KEYS.txt` 적용 후 비움 |
| 배포 | `dpl_8rH5frAHmoFQUEbRD2GcMiGKXotn` |
| 수동 | 구 토큰 `nutrifarmer-r2-wordpress` Cloudflare에서 **삭제 권장** |

#### 2026-06-25 — Phase B: 콘텐츠 API · Write 전환

| 구분 | 내용 |
|------|------|
| DB | `drizzle/0001_v5000_content.sql` — `v5000_posts`, `v5000_media` |
| DB | `drizzle/0002_v5000_media_mirror.sql` — WP 이미지 미러 메타 |
| lib | `lib/v5000-content/` — posts · schema · slug · categories · validate · r2 · blob · media · media-mirror |
| API | `/api/v5000/posts` · `/api/v5000/posts/[id]` · `/api/v5000/media` · `/api/v5000/files/[...key]` |
| Write | `WriteEditor` — `CONTENT_API=/api/v5000` (WP proxy 제거) |
| 탭 | `PhotoTab` · `FileTab` — `/api/v5000/media` 업로드 |
| AI | `/api/v5000/ai/complete` — OpenAI (`OPENAI_API_KEY`), 미설정 시 로컬 폴백 |
| R2 | `lib/v5000-content/r2.ts` · 스크립트 `migrate-wp-images-to-r2.mjs` · `rotate-r2-keys.mjs` · `apply-r2-keys.mjs` |
| 폴백 | `@vercel/blob` — R2 미설정 시 |
| 라우트 | `app/(site)/` route group — 홈·카테고리·단일글 레이아웃 분리 |

#### 2026-06-27 — 배포·버전 관리 정리

| 시각 (KST) | 배포 ID | git | 작업 요약 | 비고 |
|---|---|---|---|---|
| 11:37 | `dpl_9e87eM5gU9Pw87s3A9M9BBG1TXH2` | — | Phase C — Postgres 단독 읽기 | WP 런타임 제거 |
| 12:48 | `dpl_8RymUqKBPMEfRHhRd77fiSiRanme` | — | `waterstar21@naver.com` 최대 4계정 | `0003_shared_email_accounts` |
| 12:58 | `dpl_ASM7HRb7MuvgkrapN5vvUM3S9x4p` | — | 글쓰기 등급 표시 (샛별/일반/관리자) | |
| 13:33 | `dpl_4reidaw4qhWfC4aRjdAydgKCcV5h` | — | 글쓰기 9항목 (덧붙이기·등록글·글수정 등) | **사이드바 pill 정상 마지막** |
| **13:42** | `dpl_AprW9ECz32bpwPQMCMwyxA6HwJz3` | — | 바탕 투명·글씨 검정 공통 CSS | **pill 깨짐** (`cat-badge` plain 덮음) |
| 14:04 | `dpl_CNL8tWSPesfxGHuxB8uRGixjdUUf` | — | 삽입 위치 레일 (상/커서/하) | |
| 14:22 | `dpl_FZvHxAWCMV9HAULw5fEEd5rEmAi6` | — | 사이드바 `pid` 네비·전체 로드 | |
| 14:30 | `dpl_8VTV5QgqCH9bHax52C7ux1L5QTbu` | — | 등록글 가져오기 3박스 UI | |
| 14:39~15:38 | `dpl_9rxR…` 등 | — | 대표이미지·게시글 가져오기·파일 업로드 등 | 연속 배포 |
| **19:13** | **`dpl_CANsJcBgwfh65ryfBipHPduqP35P`** | tag | 새글쓰기·모달 70% · **롤백 안정 기준** | **www 현재 가동** |
| 19:35 | `dpl_BynmbNBwCfn17sLCgGjY5yHAsGQw` | — | 외부검색·복귀 버튼 | 불안정 → 롤백 |
| 20:24 | `dpl_FooRsYvrNb7VCicuDA7HmzYM6wbH` | — | 모달 수정 | www 별칭 미연결 |
| 22:24 | `dpl_FXVxTRrjhkHDkkgSzmoGwZ63v2uM` | — | 모달·불안정 기능 제거 시도 | www 별칭 미연결 |

- **당일 Vercel production 배포:** 59회 (00:17~22:24 KST)
- **git 동기화:** `d1448c8` (2026-06-27, 로컬 전체 스냅샷) — 배포별 커밋 없음
- **운영 기준 tag:** `prod-canonical-2026-06-27` → Vercel **`dpl_CANs…`** (19:13)
- **규칙:** `.cursor/rules/deploy-git-versioning.mdc` — 이후 **커밋 → 배포 → CHANGELOG**

#### 2026-06-27 — Phase D: 데이터·운영 마무리

| 구분 | 내용 |
|------|------|
| 글 import | `old.nutrifarmer.kr` WP REST — **229건 published** (216 WP + 기존 V5000 글, slug 중복 skip) |
| 사용자 | `waterstar21` — V5000 기존 계정 `migration_source=wp` 표시 (`users:migrate-wp --mark-existing`) |
| 스크립트 | `scripts/v5000-migrate-users-from-wp.mjs` · `_wp-api.mjs` (old 호스트 fallback) |
| R2 | `r2:backfill-hosts` — www/old URL 별칭 **807→1614** mirror rows, 본문 gap **0건** |
| R2 | `r2:retry-missing` — 미러 누락 URL 재업로드 (R2 env 필요) |
| npm | `users:migrate-wp` · `db:status` · `r2:backfill-hosts` · `r2:retry-missing` |
| 수동 | Cloudflare **`nutrifarmer-r2-wordpress`** 구 API 토큰 삭제 (대시보드) |
| 선택 | `scripts/wp-user-emails.json` + `WP_APP_USER/PASSWORD` — admin 등 추가 WP 계정 import |

#### 2026-06-27 — Phase C: Postgres 단독 읽기 (WP 런타임 제거)

| 구분 | 내용 |
|------|------|
| lib | `lib/site-content.ts` — `v5000_posts` 단독 (WP 병합 레이어 삭제) |
| lib | `lib/site-post-card.ts` — `WPPost` UI 타입 대체 |
| 페이지 | `app/(site)/[category]/*` — WP 폴백·`getCategoryBySlug` 제거 |
| 검색 | `/api/search/posts` · 홈 검색 — Postgres `searchPublishedPosts` |
| 격리 | `lib/wordpress.ts` — **마이그레이션 스크립트 전용** (app/ import 없음) |
| 배포 | `dpl_9e87eM5gU9Pw87s3A9M9BBG1TXH2` → https://www.nutrifarmer.kr |

#### 2026-06-25 — 미완 · 다음 (Phase D~)

| 항목 | 상태 |
|------|------|
| WP 글 Postgres import | ⚠️ Production DB 확인 필요 — 로컬 `.env.local` DB는 published 0건 (2026-06-27) |
| WP REST | `nutrifarmer.kr` WP JSON **403** — import 스크립트 재실행 시 소스 접근 필요 |
| WP 사용자 import + 재설정 메일 | 미실행 |
| 구 R2 API 토큰 폐기 | `nutrifarmer-r2-wordpress` — Cloudflare에서 수동 삭제 권장 |
| Git commit | `d1448c8` (2026-06-27 스냅샷) · tag `prod-canonical-2026-06-27` |

---

### Phase 체크리스트

**Phase A — Auth**

- [x] Drizzle 스키마 + 마이그레이션 SQL
- [x] `lib/v5000-auth/` + `/api/v5000/auth/*`
- [x] `nf-v5000-session` · middleware · LoginHub register
- [x] 레거시 WP auth 브릿지 코드 제거
- [x] Production Postgres migrate (`0000`~`0002`)
- [x] `AUTH_SESSION_SECRET` · Resend Production
- [x] `vercel --prod` 다회 배포 (최신 `dpl_8rH5frAHmoFQUEbRD2GcMiGKXotn`)

**Phase B — Write·미디어**

- [x] `v5000_posts` / `v5000_media` 스키마 + API
- [x] WriteEditor · PhotoTab · FileTab v5000 API 전환
- [x] R2 업로드 + Vercel Blob 폴백
- [x] R2 Production env + S3 키 교체 (`nutrifarmer-v5000`)
- [x] WP 이미지 R2 마이그레이션 (807/808) + `v5000_media_mirror`

**Phase B+ — UI parity (nutrifarmer.kr)**

- [x] 헤더 nav 8 → 히어로 필터
- [x] Stats 4 → 안내 패널
- [x] 쇼케이스 8 → 인라인 미리보기 + 아래 더 보기

**Phase C — 읽기**

- [x] `lib/site-content.ts` — Postgres `v5000_posts` 단독 읽기
- [x] `lib/wordpress.ts` app/ 런타임 import 제거 (스크립트 전용)

**Phase D — 마이그레이션**

- [x] WP 글 Postgres — 229 published (Production DB 확인 2026-06-27)
- [x] WP 사용자 — 주 계정 `waterstar21` migration_source 표시
- [x] R2 mirror host 별칭 (www/old) — 본문 gap 0
- [ ] WP admin 등 추가 계정 — `wp-user-emails.json` 또는 WP_APP 인증 시 import
- [ ] Cloudflare 구 R2 토큰 `nutrifarmer-r2-wordpress` 수동 삭제
- [x] CHANGELOG v3.0 배포표 · Git tag `prod-canonical-2026-06-27`

---

## [v2.5] — 2026-06-21 SiteHeader nav 8개 고정 배포
- **파일**: `components/SiteHeader.tsx`
- WordPress API 카테고리 대신 `SHOWCASE_CATS`(site-data.ts) 고정 사용
- 변경 전(WP 실제값 6개): 가족 사진 / 가족·성장 / 개인 자료 / 삶·사진 / 손자 성장일기 / 수익관리
- 변경 후(고정 8개): 일상 기록 / 가족·성장 / 개인 자료 / 프로그램 / 삶·사진 / 수익관리 / 전문 글쓰기 / 주변 이야기
- **배포 완료**: `vercel --prod` → https://nutrifarmer-v5000.vercel.app (dpl_DaazMfTT9w9iUFvyLeG3e7NpJRzg)

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

## 현재 프로젝트 파일 구조 (v3.0 작업 반영 · 2026-06-25)

```
nutrifarmer-v5000/
├── app/
│   ├── (site)/                 # 홈·카테고리·단일글 (Postgres 읽기)
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── [category]/
│   ├── login/                  # V5000 로그인 허브
│   ├── write/                  # AI 글쓰기 (v5000 API 게시)
│   ├── api/v5000/
│   │   ├── auth/               # Native Auth 8 routes
│   │   ├── posts/              # Postgres CRUD
│   │   ├── media/              # R2 업로드
│   │   └── files/[...key]/     # R2 파일 서빙
│   └── layout.tsx
├── components/
│   ├── auth/                   # LoginHub · WriteGate
│   ├── write/
│   ├── HomeHeroBlock.tsx
│   ├── PreviewCardGrid.tsx
│   ├── CategoryPreviewPanel.tsx
│   └── ...
├── lib/
│   ├── v5000-auth/             # 인증 (Postgres)
│   ├── v5000-content/          # 글·미디어 (Postgres + R2)
│   ├── site-data.ts            # 카테고리 UI 고정 8개 · FEATURE_PANELS
│   ├── home-hero-bus.ts        # 홈 nav → 히어로 필터
│   ├── home-posts.ts           # 미러 URL 일괄 해석
│   ├── auth-navigation.ts
│   └── wordpress.ts            # 마이그레이션 스크립트 전용
├── drizzle/
│   ├── 0000_v5000_auth.sql
│   ├── 0001_v5000_content.sql
│   └── 0002_v5000_media_mirror.sql
├── scripts/
│   ├── db-migrate.mjs
│   ├── setup-v5000-db.mjs
│   ├── migrate-wp-images-to-r2.mjs   # npm run media:migrate-wp
│   ├── apply-r2-keys.mjs             # npm run r2:apply
│   └── rotate-r2-keys.mjs            # npm run r2:rotate
└── docs/
    ├── CHANGELOG.md
    └── V5000-native-platform-spec.md
```

---

## 다음 세션 시작 시 붙여넣기용 컨텍스트

```
V5000 작업 재개.
경로: D:/함께온라인/My_BLOG/nutrifarmer-v5000
GitHub: https://github.com/waterstar21g-png/nutrifarmer-v5000
배포URL: https://nutrifarmer-v5000.vercel.app
SPEC: docs/V5000-native-platform-spec.md
CHANGELOG: docs/CHANGELOG.md (v3.0 작업 로그 보관)

[확정 — v3.0]
- DB: Vercel Postgres | 미디어: R2 | WP 런타임 제거 목표
- 공개 회원가입 | WP 계정 → 강제 비밀번호 재설정

[완료 — Production 2026-06-25]
- Phase A/B: Auth + Write + Postgres migrate
- R2: 이미지 807개 마이그레이션 + CDN media.nutrifarmer.kr
- R2: S3 키 교체 (nutrifarmer-v5000) + Vercel env
- UI: nutrifarmer.kr parity (헤더·Stats·쇼케이스)
- 배포: dpl_8rH5frAHmoFQUEbRD2GcMiGKXotn

[완료 — 2026-06-27]
- Phase D: 글 229 · 사용자 wp 표시 · R2 host 별칭 1614 rows

[미완 — 수동/선택]
- Cloudflare: 구 토큰 nutrifarmer-r2-wordpress 삭제
- WP admin import (wp-user-emails.json)
- Git tag v3.0
```
