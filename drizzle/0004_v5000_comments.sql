CREATE TABLE IF NOT EXISTS "v5000_comments" (
  "id" serial PRIMARY KEY NOT NULL,
  "post_id" integer NOT NULL REFERENCES "v5000_posts"("id") ON DELETE CASCADE,
  "author_name" varchar(200) NOT NULL,
  "author_email" varchar(320) NOT NULL,
  "author_url" varchar(1024),
  "body" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'approved',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_v5000_comments_post_id" ON "v5000_comments" ("post_id");
