import { createHash, timingSafeEqual } from 'node:crypto'

export function canRevealRiderPhone(password: unknown, configuredPassword: string | undefined): boolean {
  if (typeof password !== 'string' || password.length > 512 || !configuredPassword) return false
  const provided = createHash('sha256').update(password).digest()
  const expected = createHash('sha256').update(configuredPassword).digest()
  return timingSafeEqual(provided, expected)
}

export function normalizeRiderPhone(value: string): { phone: string; tel: string } | null {
  const phone = value.trim()
  let tel = phone.replace(/[^\d+]/g, '')
  if (tel.startsWith('00')) tel = `+${tel.slice(2)}`
  else if (tel.startsWith('0')) tel = `+49${tel.slice(1)}`
  if (!/^\+[1-9]\d{6,14}$/.test(tel)) return null
  return { phone, tel }
}
