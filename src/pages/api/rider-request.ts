import type { APIRoute } from 'astro';
import {
  RIDER_COOKIE,
  RIDER_FILES,
  riderRequestPayload,
  validateRiderRequest,
} from '../../lib/riderRequest.ts';

export const prerender = false;

const cmsBase = () => {
  const url =
    import.meta.env.PAYLOAD_URL ||
    (typeof process !== 'undefined' ? (process as any).env?.PAYLOAD_URL : undefined) ||
    'http://localhost:3000';
  return String(url).replace(/\/$/, '');
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function readInput(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return (await request.json()) as Record<string, unknown>;
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

async function logToCms(payload: ReturnType<typeof riderRequestPayload>) {
  try {
    const r = await fetch(`${cmsBase()}/api/rider-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) console.error('[rider-request] CMS antwortete mit', r.status);
  } catch (err) {
    // Der Download darf nicht am CMS scheitern — nur protokollieren.
    console.error('[rider-request] CMS nicht erreichbar:', err);
  }
}

export const POST: APIRoute = async ({ request, cookies, clientAddress, redirect }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  let input: Record<string, unknown> = {};
  try {
    input = await readInput(request);
  } catch {}

  const result = validateRiderRequest(input);
  if (!result.ok) {
    if (result.spam) {
      return wantsJson ? json({ ok: true, files: RIDER_FILES }) : redirect('/styleguide/#rider', 303);
    }
    return wantsJson
      ? json({ ok: false, errors: result.errors }, 400)
      : redirect('/styleguide/?rider=error#rider', 303);
  }

  let ip = '';
  try {
    ip = clientAddress;
  } catch {}
  await logToCms(
    riderRequestPayload(result.data, {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || ip,
    }),
  );

  cookies.set(RIDER_COOKIE, '1', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
  return wantsJson ? json({ ok: true, files: RIDER_FILES }) : redirect('/styleguide/#rider', 303);
};

export const GET: APIRoute = () => json({ ok: false, error: 'POST erwartet' }, 405);
