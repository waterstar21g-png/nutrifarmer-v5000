import { isBlobConfigured, uploadMediaBlob } from './blob';
import { isR2Configured, uploadMedia as uploadMediaR2, type UploadResult } from './r2';

export type { UploadResult };

export function isMediaStorageConfigured(): boolean {
  return isR2Configured() || isBlobConfigured();
}

/** R2 우선, 없으면 Vercel Blob (과도기) */
export async function uploadMedia(
  file: File,
  uploaderId: number,
  alt?: string,
): Promise<UploadResult> {
  if (isR2Configured()) {
    return uploadMediaR2(file, uploaderId, alt);
  }
  if (isBlobConfigured()) {
    return uploadMediaBlob(file, uploaderId, alt);
  }
  throw new Error('storage_unconfigured');
}
