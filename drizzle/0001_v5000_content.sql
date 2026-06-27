CREATE TABLE IF NOT EXISTS "v5000_posts" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" varchar(200) NOT NULL UNIQUE,
  "title" varchar(500) NOT NULL,
  "body" text DEFAULT '' NOT NULL,
  "excerpt" text DEFAULT '' NOT NULL,
  "status" varchar(20) DEFAULT 'draft' NOT NULL,
  "author_id" integer NOT NULL REFERENCES "v5000_users"("id") ON DELETE CASCADE,
  "category_slug" varchar(64) NOT NULL,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_v5000_posts_author_id" ON "v5000_posts" ("author_id");
CREATE INDEX IF NOT EXISTS "idx_v5000_posts_category_slug" ON "v5000_posts" ("category_slug");
CREATE INDEX IF NOT EXISTS "idx_v5000_posts_status_published" ON "v5000_posts" ("status", "published_at" DESC);

CREATE TABLE IF NOT EXISTS "v5000_media" (
  "id" serial PRIMARY KEY NOT NULL,
  "r2_key" varchar(512) NOT NULL,
  "public_url" varchar(1024) NOT NULL,
  "mime" varchar(128) NOT NULL,
  "alt" varchar(500),
  "size_bytes" integer,
  "uploader_id" integer NOT NULL REFERENCES "v5000_users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_v5000_media_uploader_id" ON "v5000_media" ("uploader_id");
