import { supabase } from '@/lib/supabase';

export const COURSE_MEDIA_BUCKET = 'course-media';
export const CERTIFICATE_MEDIA_BUCKET = 'certificate-pdfs';
export const SIGNED_MEDIA_URL_TTL_SECONDS = 300;

export interface StorageReference {
  bucket: string;
  path: string;
}

export function parseStorageReference(
  value: string | null | undefined,
  defaultBucket = COURSE_MEDIA_BUCKET,
): StorageReference | null {
  const raw = value?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
      if (!match) return null;
      return {
        bucket: decodeURIComponent(match[1]),
        path: decodeURIComponent(match[2]),
      };
    } catch {
      return null;
    }
  }

  if (raw.startsWith('storage://')) {
    const withoutScheme = raw.slice('storage://'.length);
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex <= 0) return null;
    return {
      bucket: withoutScheme.slice(0, slashIndex),
      path: withoutScheme.slice(slashIndex + 1).replace(/^\/+/, ''),
    };
  }

  const normalized = raw.replace(/^\/+/, '');

  if (normalized.startsWith(`${COURSE_MEDIA_BUCKET}/`)) {
    return {
      bucket: COURSE_MEDIA_BUCKET,
      path: normalized.slice(COURSE_MEDIA_BUCKET.length + 1),
    };
  }

  if (normalized.startsWith(`${CERTIFICATE_MEDIA_BUCKET}/`)) {
    return {
      bucket: CERTIFICATE_MEDIA_BUCKET,
      path: normalized.slice(CERTIFICATE_MEDIA_BUCKET.length + 1),
    };
  }

  return {
    bucket: defaultBucket,
    path: normalized,
  };
}

export async function createSignedMediaUrl(
  value: string | null | undefined,
  options: {
    bucket?: string;
    expiresIn?: number;
  } = {},
): Promise<string | null> {
  const reference = parseStorageReference(value, options.bucket ?? COURSE_MEDIA_BUCKET);
  if (!reference) return null;

  const { data, error } = await supabase.storage
    .from(reference.bucket)
    .createSignedUrl(reference.path, options.expiresIn ?? SIGNED_MEDIA_URL_TTL_SECONDS);

  if (error) {
    console.error('Could not create signed media URL:', error);
    return null;
  }

  return data?.signedUrl ?? null;
}

