CREATE TABLE IF NOT EXISTS "v5000_users" (
  "id" serial PRIMARY KEY NOT NULL,
  "login_id" varchar(64) NOT NULL UNIQUE,
  "display_name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255),
  "role" varchar(20) DEFAULT 'author' NOT NULL,
  "must_reset_password" boolean DEFAULT false NOT NULL,
  "migration_source" varchar(20),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_v5000_users_display_name" ON "v5000_users" ("display_name");

CREATE TABLE IF NOT EXISTS "v5000_password_resets" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "v5000_users"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "code_hash" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_v5000_password_resets_user_id" ON "v5000_password_resets" ("user_id");
