import { createHmac, timingSafeEqual } from 'node:crypto';

// Alle technischen Unterlagen werden nach Name, Venue und E-Mail freigeschaltet.
// Die Anfrage wird im CMS protokolliert und per Mail an die Band gemeldet.

export const RIDER_FILES = {
  html: '/api/rider-file/html',
  pdf: '/api/rider-file/pdf',
  hospitality: 'https://drive.google.com/drive/folders/1R8LF6_T1DeVFs72Bm3O-HAaX2_3jqp45',
} as const;

export const RIDER_PRIVATE_FILES = {
  html: 'scttrd-foh-rider.html',
  pdf: 'scttrd-foh-rider.pdf',
} as const;

export const RIDER_GATED = ['html', 'pdf', 'hospitality'] as const;

export const RIDER_COOKIE = 'scttrd_rider';
export const RIDER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function createRiderGateToken(secret: string, now = Date.now()): string {
  const expires = Math.floor(now / 1000) + RIDER_COOKIE_MAX_AGE;
  const signature = createHmac('sha256', secret).update(String(expires)).digest('base64url');
  return `${expires}.${signature}`;
}

export function isRiderGateTokenValid(token: string | undefined, secret: string | undefined, now = Date.now()): boolean {
  if (!token || !secret) return false;
  const [expiresText, signature, extra] = token.split('.');
  const expires = Number(expiresText);
  const nowSeconds = Math.floor(now / 1000);
  if (extra !== undefined || !Number.isSafeInteger(expires) || expires <= nowSeconds || expires > nowSeconds + RIDER_COOKIE_MAX_AGE) return false;

  const expected = createHmac('sha256', secret).update(String(expires)).digest();
  const actual = Buffer.from(signature || '', 'base64url');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type RiderRequestInput = {
  name?: unknown;
  venue?: unknown;
  email?: unknown;
  // Honeypot: Menschen sehen das Feld nicht, Bots füllen es aus.
  website?: unknown;
};

export type RiderRequest = { name: string; venue: string; email: string };

export type RiderValidation =
  | { ok: true; data: RiderRequest }
  | { ok: false; spam: boolean; errors: Record<string, string> };

const clean = (value: unknown, max: number) =>
  String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRiderRequest(input: RiderRequestInput): RiderValidation {
  if (clean(input.website, 200)) return { ok: false, spam: true, errors: {} };
  const data: RiderRequest = {
    name: clean(input.name, 120),
    venue: clean(input.venue, 160),
    email: clean(input.email, 200).toLowerCase(),
  };
  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = 'Bitte deinen Namen angeben.';
  if (data.venue.length < 2) errors.venue = 'Bitte Venue oder Veranstaltung angeben.';
  if (!EMAIL.test(data.email)) errors.email = 'Bitte eine gültige E-Mail-Adresse angeben.';
  return Object.keys(errors).length ? { ok: false, spam: false, errors } : { ok: true, data };
}

export function riderRequestPayload(
  data: RiderRequest,
  meta: { userAgent?: string | null; ip?: string | null },
) {
  return {
    ...data,
    file: 'rider',
    source: 'styleguide',
    userAgent: String(meta.userAgent ?? '').slice(0, 300),
    ip: String(meta.ip ?? '').split(',')[0].trim().slice(0, 64),
  };
}
