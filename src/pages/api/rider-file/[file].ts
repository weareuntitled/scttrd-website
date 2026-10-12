import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import {
  isRiderGateTokenValid,
  RIDER_COOKIE,
  RIDER_PRIVATE_FILES,
} from '../../../lib/riderRequest.ts';

export const prerender = false;

const riderGateSecret = () =>
  import.meta.env.PAYLOAD_SECRET ||
  (typeof process !== 'undefined' ? (process as any).env?.PAYLOAD_SECRET : undefined);

const unavailable = (status: number) => new Response(null, {
  status,
  headers: { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' },
});

export const GET: APIRoute = async ({ params, cookies }) => {
  const file = params.file as keyof typeof RIDER_PRIVATE_FILES | undefined;
  if (!file || !(file in RIDER_PRIVATE_FILES)) return unavailable(404);

  const secret = riderGateSecret();
  const token = cookies.get(RIDER_COOKIE)?.value;
  if (!isRiderGateTokenValid(token, secret)) return unavailable(401);

  const filename = RIDER_PRIVATE_FILES[file];
  try {
    const content = await readFile(path.join(process.cwd(), 'private', 'rider', filename));
    const type = file === 'pdf' ? 'application/pdf' : 'text/html; charset=utf-8';
    return new Response(content, {
      headers: {
        'content-type': type,
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return unavailable(404);
  }
};
