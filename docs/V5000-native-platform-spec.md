# V5000 Native Platform Spec

> **확정일:** 2026-06-24  
> **범위:** V5000 전용 — v4000 / v3000 / WordPress / Docker 와 **완전 분리**  
> **스택:** Cursor + Vercel + Cloudflare + Cloudflare R2 + **Vercel Postgres**

---

## 1. 확정 결정 (리스크 항목)

| 항목 | 결정 | 비고 |
|------|------|------|
| **DB** | **Vercel Postgres** | 사용자·글·메타·세션 토큰 등 트랜잭션 데이터 |
| **객체 저장** | **Cloudflare R2** | 이미지·첨부·초안 백업·export |
| **WordPress** | **사용 안 함** | REST·로그인·게시·미디어 **전부 제거** (과도기 브릿지 없음) |
| **WP 계정 이전** | **강제 비밀번호 재설정** | WP 비밀번호 해시 이전 불가 → 재설정 링크/코드 필수 |
| **회원가입** | **공개 가입** | `/login` 회원가입 패널 V5000 내장, `users_can_register` WP 설정 무관 |

---

## 2. 원칙

1. **명명:** 파일·env·API·쿠키·문서는 `V5000` / `v5000` / `nf-v5000-*` 만 사용.
2. **단일 진실:** 카테고리 UI는 `lib/site-data.ts`; **콘텐츠 본문·발행 상태**는 Postgres.
3. **배포:** Vercel Production. Docker·로컬 WordPress 개발 **불필요**.
4. **참조:** `www.nutrifarmer.kr` / v4000 코드는 **마이그레이션 소스·UX 참고만** — 런타임 의존 금지.

---

## 3. 아키텍처

```
[브라우저]
    ↓
[Vercel — Next.js 15 App Router]
    ├─ /api/v5000/auth/*     → Postgres (users, sessions, resets)
    ├─ /api/v5000/posts/*    → Postgres (posts, categories slug)
    ├─ /api/v5000/media/*    → R2 upload + Postgres (media meta)
    └─ Resend                → find / lost-password 메일
    ↓
[Vercel Postgres]          사용자·글·카테고리 매핑·세션
[Cloudflare R2]              바이너리·이미지
[Cloudflare CDN]             R2 public/custom domain
```

**제거 대상 (완료 시):**

- `lib/wp-session.ts`, `lib/wp-auth-proxy.ts`, `lib/wp-user-lookup.ts`
- `app/api/wp/[...path]/route.ts`
- `lib/wordpress.ts` 의 **런타임 fetch** (마이그레이션 스크립트만 예외)
- env: `WP_API_URL`, `WP_HOSTNAME`, `NF_V5000_SERVER_KEY` (WP 릴레이용)

---

## 4. 인증 (V5000 Native Auth)

### 4.1 세션

| 항목 | 값 |
|------|-----|
| 쿠키명 | `nf-v5000-session` |
| 방식 | httpOnly + HMAC 서명 ( `AUTH_SESSION_SECRET` ) |
| TTL | remember off: 2일 / on: 14일 |

### 4.2 API (신규 경로)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v5000/auth/register` | 공개 회원가입 + 자동 로그인 |
| POST | `/api/v5000/auth/login` | 로그인 |
| POST | `/api/v5000/auth/logout` | 로그아웃 |
| GET | `/api/v5000/auth/me` | 세션·프로필 |
| POST | `/api/v5000/auth/find-account` | 이메일 → ID 안내 (Resend) |
| POST | `/api/v5000/auth/lost-password` | 6자리 코드 발송 |
| POST | `/api/v5000/auth/verify-code` | 코드 확인 |
| POST | `/api/v5000/auth/reset-password` | 비밀번호 변경 |

### 4.3 사용자 필드 (Postgres)

- `login_id` — 공개 ID (별명/영문 ID, v4000 규칙 참고)
- `display_name`, `email` (unique)
- `password_hash` — bcrypt
- `role` — `author` | `admin`
- `must_reset_password` — WP 이전 계정 `true` → 첫 로그인 시 재설정 화면

### 4.4 회원가입 (공개)

- `/login?panel=register` — V5000 UI (WP 외부 링크 제거)
- 검증: 별명/ID 규칙, 이메일 중복, 비밀번호 4자+ (v4000 동일 UX)
- 가입 직후 `role=author`, `/write` redirect

### 4.5 WP 계정 마이그레이션 (1회)

1. WP export: `email`, `display_name`, `nf_login_id` meta
2. Postgres insert: `password_hash = NULL`, `must_reset_password = true`, `migration_source = 'wp'`
3. 일괄 메일: 「V5000 전환 — 비밀번호 재설정」 Resend
4. 로그인 시도 시: `must_reset_password` → `/login?panel=reset` 또는 lost-password 유도
5. **WP 비밀번호로는 V5000 로그인 불가** (명시 안내)

---

## 5. 콘텐츠 (WP REST 없음)

### 5.1 Postgres 테이블 (개요)

- `v5000_posts` — title, slug, body, excerpt, status, author_id, category_slug, published_at
- `v5000_categories` — slug, name (site-data.ts와 동기 또는 seed)
- `v5000_media` — r2_key, mime, alt, uploader_id

### 5.2 페이지 데이터 소스 전환

| 페이지 | 현재 | 목표 |
|--------|------|------|
| `/`, `/[category]`, `/[category]/[slug]` | WP REST | Postgres + R2 URL |
| `/write` | WP proxy 게시 | `/api/v5000/posts` |
| 홈 Latest | WP posts | Postgres `ORDER BY published_at` |

### 5.3 마이그레이션 (1회)

- WP REST export → Postgres `v5000_posts` + R2 이미지 복사
- slug·category_slug 유지 (URL 호환)
- 스크립트: `scripts/v5000-migrate-from-wp.ts` (오프라인, WP는 **읽기 1회만**)

---

## 6. 환경 변수 (Vercel Production)

```env
# 필수 — Auth
AUTH_SESSION_SECRET=
POSTGRES_URL=                    # Vercel Postgres (pooled)

# 필수 — Mail
RESEND_API_KEY=
MAIL_FROM=

# 필수 — Site
NEXT_PUBLIC_SITE_URL=

# 필수 — R2 (미디어)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
NEXT_PUBLIC_CDN_URL=             # R2 custom domain 또는 public URL

# 제거 예정 (WP)
# WP_API_URL, WP_HOSTNAME, NF_V5000_SERVER_KEY, WP_APP_USER, WP_APP_PASSWORD
```

---

## 7. 구현 Phase (확정 순서)

### Phase A — Postgres + Auth (1주)

- [ ] Vercel Postgres 프로비저닝 + Drizzle/Prisma 스키마
- [ ] `lib/v5000-auth/` + `/api/v5000/auth/*`
- [ ] `LoginHub` → register 패널 V5000 내장, WP 링크 제거
- [ ] `WriteGate` / `middleware` → `nf-v5000-session`
- [ ] `AUTH_SESSION_SECRET` Production 설정

### Phase B — 콘텐츠 API (1~2주)

- [ ] `/api/v5000/posts/*` CRUD + publish
- [ ] `WriteEditor` WP proxy 제거
- [ ] R2 upload API

### Phase C — 읽기 페이지 전환 (1주)

- [ ] `lib/v5000-content.ts` — 홈·카테고리·단일글 Postgres
- [ ] `lib/wordpress.ts` 런타임 제거

### Phase D — WP 마이그레이션 + 브릿지 삭제 (3~5일)

- [ ] 사용자 import + 강제 재설정 메일
- [ ] 글·이미지 import
- [ ] `app/api/wp`, wp-session 등 삭제
- [ ] CHANGELOG v3.0 릴리스

---

## 8. v4000 / v3000 경계

| | V5000 | v4000/v3000 |
|---|--------|-------------|
| 작업 repo | `nutrifarmer-v5000` | `nutrifarmer_blog_thema_v4000` |
| 배포 | Vercel | (레거시 WP 서버) |
| 인증 | Postgres + nf-v5000-session | WP users + cookies |
| 문서 | 본 spec + `docs/CHANGELOG.md` | 참고만 |

---

## 9. 성공 기준 (v3.0)

- [ ] `nutrifarmer-v5000.vercel.app` 에서 **WP HTTP 요청 0건** (빌드·런타임)
- [ ] 공개 회원가입 → 로그인 → `/write` → Postgres 발행
- [ ] WP 이전 사용자: 이메일 재설정 후 로그인
- [ ] 홈·카테고리·단일글 Postgres 서빙

---

## 10. 참고

- UX·문구·패널 흐름: v4000 `/login/` (듀얼 패널) **복제**, 구현은 V5000 only
- CHANGELOG: `[v3.0]` Native Platform 항목과 동기화
