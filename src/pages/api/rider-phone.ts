import type { APIRoute } from 'astro'
import { canRevealRiderPhone, normalizeRiderPhone } from '../../lib/riderPhone.ts'

export const prerender = false

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
    'x-content-type-options': 'nosniff',
  },
})

const configured = (key: string): string | undefined => {
  const buildValue = (import.meta.env as Record<string, string | undefined>)[key]
  const runtimeValue = typeof process !== 'undefined' ? (process as any).env?.[key] : undefined
  return buildValue || runtimeValue || undefined
}

export const POST: APIRoute = async ({ request }) => {
  let input: unknown
  try {
    input = await request.json()
  } catch {
    return json({ ok: false }, 400)
  }

  const password = input && typeof input === 'object' ? (input as Record<string, unknown>).password : undefined
  const configuredPassword = configured('RIDER_PHONE_PASSWORD')
  const phone = configured('RIDER_PHONE_NUMBER')
  const normalizedPhone = phone ? normalizeRiderPhone(phone) : null
  if (!configuredPassword || configuredPassword.length < 20 || !normalizedPhone) {
    return json({ ok: false }, 503)
  }
  if (!canRevealRiderPhone(password, configuredPassword)) return json({ ok: false }, 401)

  return json({ ok: true, ...normalizedPhone })
}
