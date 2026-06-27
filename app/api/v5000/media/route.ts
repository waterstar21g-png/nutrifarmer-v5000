import { NextRequest, NextResponse } from 'next/server';
import { requireSession, withDatabase } from '@/lib/v5000-content/api';
import { isMediaStorageConfigured, uploadMedia } from '@/lib/v5000-content/media';
import { postErrorMessage } from '@/lib/v5000-content/validate';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  if (!isMediaStorageConfigured()) {
    return NextResponse.json(
      { ok: false, code: 'r2_unconfigured', message: postErrorMessage('r2_unconfigured') },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, code: 'invalid_form', message: postErrorMessage() }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { ok: false, code: 'missing_file', message: postErrorMessage('missing_file') },
      { status: 400 },
    );
  }

  const alt = (formData.get('alt') as string | null) ?? undefined;

  const result = await withDatabase(async () => {
    try {
      const uploaded = await uploadMedia(file, session.userId, alt);
      return NextResponse.json({
        ok: true,
        id: uploaded.id,
        url: uploaded.url,
        alt: uploaded.alt,
        mime: uploaded.mime,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'upload_failed';
      if (code === 'file_too_large' || code === 'unsupported_type') {
        return NextResponse.json(
          { ok: false, code, message: postErrorMessage(code) },
          { status: 400 },
        );
      }
      console.error('[v5000-media]', err);
      return NextResponse.json({ ok: false, code: 'upload_failed', message: postErrorMessage() }, { status: 500 });
    }
  });

  if (result instanceof NextResponse) return result;
  return result;
}
