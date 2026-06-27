-- waterstar21@naver.com 등 동일 이메일 다계정 허용 (login_id는 계속 unique)
ALTER TABLE "v5000_users" DROP CONSTRAINT IF EXISTS "v5000_users_email_unique";
ALTER TABLE "v5000_users" DROP CONSTRAINT IF EXISTS "v5000_users_email_key";

CREATE INDEX IF NOT EXISTS "idx_v5000_users_email_lower" ON "v5000_users" (lower("email"));
