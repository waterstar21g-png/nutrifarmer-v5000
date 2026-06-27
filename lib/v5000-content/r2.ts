import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SITE_URL } from '@/lib/v5000-auth/config';
import { getDb } from '@/lib/v5000-auth/db';
import { v5000Media } from './schema';

const MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/zip',
  'video/mp4',
]);

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID?.trim() &&
    process.env.R2_ACCESS_KEY_ID?.trim() &&
    process.env.R2_SECRET_ACCESS_KEY?.trim() &&
    process.env.R2_BUCKET_NAME?.trim()
  );
}

function cdnBase(): string {
  const cdn = process.env.NEXT_PUBLIC_CDN_URL?.trim();
  if (cdn) return cdn.replace(/\/$/, '');
  const account = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (account && bucket) {
    return `https://${account}.r2.cloudflarestorage.com/${bucket}`;
  }
  return '';
}

/** R2 버킷 Public Access + 커스텀 도메인 활성화 시 true */
export function useR2PublicCdn(): boolean {
  return process.env.R2_PUBLIC_ACCESS?.trim() === 'true';
}

/** 비공개 버킷: Vercel 프록시 URL / 공개 버킷: CDN 직링크 */
export function publicMediaUrl(key: string): string {
  if (useR2PublicCdn()) {
    const base = cdnBase();
    if (base) return `${base}/${key}`;
  }
  const site = SITE_URL.replace(/\/$/, '');
  return `${site}/api/v5000/files/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function r2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

function safeFilename(name: string): string {
  return name.replace(/[^\w.\uAC00-\uD7A3-]/g, '_').slice(0, 120) || 'file';
}

export interface UploadResult {
  id: number;
  url: string;
  key: string;
  mime: string;
  alt: string;
  sizeBytes: number;
}

export async function uploadMedia(
  file: File,
  uploaderId: number,
  alt?: string,
): Promise<UploadResult> {
  if (!isR2Configured()) {
    throw new Error('R2 is not configured');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('file_too_large');
  }
  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error('unsupported_type');
  }

  const key = `media/${uploaderId}/${Date.now()}-${safeFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!.trim(),
      Key: key,
      Body: buffer,
      ContentType: mime,
    }),
  );

  const publicUrl = publicMediaUrl(key);
  const altText = alt?.trim() || file.name.replace(/\.[^.]+$/, '');

  const db = getDb();
  const rows = await db
    .insert(v5000Media)
    .values({
      r2Key: key,
      publicUrl,
      mime,
      alt: altText,
      sizeBytes: file.size,
      uploaderId,
    })
    .returning();

  const row = rows[0]!;
  return {
    id: row.id,
    url: row.publicUrl,
    key: row.r2Key,
    mime: row.mime,
    alt: row.alt ?? altText,
    sizeBytes: row.sizeBytes ?? file.size,
  };
}

export async function getR2Object(key: string) {
  const result = await r2Client().send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!.trim(),
      Key: key,
    }),
  );
  return {
    body: result.Body,
    contentType: result.ContentType || 'application/octet-stream',
  };
}

/** 마이그레이션·서버 업로드용 — DB 행 없이 R2에만 저장 */
export async function putR2Object(
  key: string,
  body: Buffer,
  mime: string,
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error('R2 is not configured');
  }
  await r2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!.trim(),
      Key: key,
      Body: body,
      ContentType: mime,
    }),
  );
  return publicMediaUrl(key);
}
