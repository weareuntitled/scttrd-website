export function normalizeRiderPhone(value: string): { phone: string; tel: string } | null {
  const phone = value.trim()
  let tel = phone.replace(/[^\d+]/g, '')
  if (tel.startsWith('00')) tel = `+${tel.slice(2)}`
  else if (tel.startsWith('0')) tel = `+49${tel.slice(1)}`
  if (!/^\+[1-9]\d{6,14}$/.test(tel)) return null
  return { phone, tel }
}
