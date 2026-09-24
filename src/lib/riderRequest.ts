// Rider-Gate: Die HTML-Version des Technical Riders ist frei aufrufbar.
// PDF und Hospitality Rider gibt es erst, wenn Name, Venue und E-Mail hinterlegt sind.
// Kein Mailversand — die Anfrage wird im CMS (rider-requests) protokolliert.

export const RIDER_FILES = {
  html: '/styleguide/assets/rider/scttrd-foh-rider.html',
  pdf: '/styleguide/assets/rider/scttrd-foh-rider.pdf',
  hospitality: 'https://drive.google.com/drive/folders/1R8LF6_T1DeVFs72Bm3O-HAaX2_3jqp45',
} as const;

// Nur diese Dateien liegen hinter dem Formular.
export const RIDER_GATED = ['pdf', 'hospitality'] as const;

export const RIDER_COOKIE = 'scttrd_rider';

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
