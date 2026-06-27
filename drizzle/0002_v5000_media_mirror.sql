CREATE TABLE IF NOT EXISTS "v5000_media_mirror" (
  "id" serial PRIMARY KEY NOT NULL,
  "wp_url" varchar(1024) NOT NULL UNIQUE,
  "wp_media_id" integer,
  "r2_key" varchar(512) NOT NULL,
  "public_url" varchar(1024) NOT NULL,
  "mime" varchar(128),
  "alt" varchar(500),
  "size_bytes" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_v5000_media_mirror_wp_media_id" ON "v5000_media_mirror" ("wp_media_id");
