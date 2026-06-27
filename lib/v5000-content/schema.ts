import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { v5000Users } from '@/lib/v5000-auth/schema';

export const v5000Posts = pgTable('v5000_posts', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  body: text('body').notNull().default(''),
  excerpt: text('excerpt').notNull().default(''),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  authorId: integer('author_id')
    .notNull()
    .references(() => v5000Users.id, { onDelete: 'cascade' }),
  categorySlug: varchar('category_slug', { length: 64 }).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const v5000Media = pgTable('v5000_media', {
  id: serial('id').primaryKey(),
  r2Key: varchar('r2_key', { length: 512 }).notNull(),
  publicUrl: varchar('public_url', { length: 1024 }).notNull(),
  mime: varchar('mime', { length: 128 }).notNull(),
  alt: varchar('alt', { length: 500 }),
  sizeBytes: integer('size_bytes'),
  uploaderId: integer('uploader_id')
    .notNull()
    .references(() => v5000Users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** WordPress 원본 URL → R2/CDN (1회 마이그레이션 후 런타임 조회) */
export const v5000MediaMirror = pgTable('v5000_media_mirror', {
  id: serial('id').primaryKey(),
  wpUrl: varchar('wp_url', { length: 1024 }).notNull().unique(),
  wpMediaId: integer('wp_media_id'),
  r2Key: varchar('r2_key', { length: 512 }).notNull(),
  publicUrl: varchar('public_url', { length: 1024 }).notNull(),
  mime: varchar('mime', { length: 128 }),
  alt: varchar('alt', { length: 500 }),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type V5000PostRow = typeof v5000Posts.$inferSelect;
export type NewV5000PostRow = typeof v5000Posts.$inferInsert;
export type V5000MediaRow = typeof v5000Media.$inferSelect;
export type V5000MediaMirrorRow = typeof v5000MediaMirror.$inferSelect;
