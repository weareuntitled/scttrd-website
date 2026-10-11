import { createHash, timingSafeEqual } from 'node:crypto'

export function canRevealRiderPhone(password: unknown, configuredPassword: string | undefined): boolean {
  if (typeof password !== 'string' || password.length > 512 || !configuredPassword) return false
  const provided = createHash('sha256').update(password).digest()
  const expected = createHash('sha256').update(configuredPassword).digest()
  return timingSafeEqual(provided, expected)
}
