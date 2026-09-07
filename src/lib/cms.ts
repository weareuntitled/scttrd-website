import { getCollection } from 'astro:content'

const cmsBase = () => {
  const url = import.meta.env.PAYLOAD_URL || (typeof process !== 'undefined' ? (process as any).env?.PAYLOAD_URL : undefined) || 'http://localhost:3000'
  return url.replace(/\/$/, '')
}

export const showSlug = (venue: string, date: string) => `${venue}-${date}`
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export async function getPage(slug: string) {
  const base = cmsBase()
  try {
    const r = await fetch(`${base}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&depth=1&limit=1`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) return ((await r.json()) as any).docs?.[0] ?? null
  } catch {}
  return null
}

export async function getGallery() {
  const page: any = await getPage('about')
  if (page?.gallery?.length) {
    const base = cmsBase()
    return page.gallery.map((item: any) => ({
      src: /^https?:\/\//i.test(item.image?.url ?? '') ? item.image.url : new URL(item.image?.url ?? '', base).href,
      alt: item.alt || item.image?.alt || 'SCTTRD',
    }))
  }
  const [fallback] = await getCollection('aboutPageImages')
  return (fallback?.data.gallery ?? []).map((src) => ({ src, alt: 'SCTTRD' }))
}

export async function getShows() {
  const base = cmsBase()
  const abs = (u: any) => {
    if (!u) return ''
    if (/^https?:\/\//i.test(String(u))) return String(u)
    try { return new URL(String(u), base).href } catch { return String(u) }
  }
  try {
    const r = await fetch(`${base}/api/shows?limit=100&sort=-order`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) {
      const j: any = await r.json()
      if (j.docs?.length) return j.docs.map((d: any) => ({ id: d.id, collection: 'shows', data: { venue: d.venue, city: d.city, date: d.date, status: d.status, order: d.order ?? 10, link: d.link || undefined, image: typeof d.image === 'object' ? abs(d.image?.url) : (typeof d.image === 'string' ? abs(d.image) : ''), imageAlt: d.imageAlt || d.image?.alt || '', srcset: undefined } }))
    }
  } catch {}
  return await getCollection('shows')
}
