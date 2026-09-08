import { getCollection } from 'astro:content'
import { showSlug } from './show.ts'

export { showSlug }

const cmsBase = () => {
  const url = import.meta.env.PAYLOAD_URL || (typeof process !== 'undefined' ? (process as any).env?.PAYLOAD_URL : undefined) || 'http://localhost:3000'
  return url.replace(/\/$/, '')
}

export async function getPage(slug: string) {
  const base = cmsBase()
  try {
    const r = await fetch(`${base}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&depth=1&limit=1`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) return ((await r.json()) as any).docs?.[0] ?? null
  } catch {}
  return null
}

export async function getLinkHub() {
  const base = cmsBase()
  try {
    const r = await fetch(`${base}/api/globals/link-hub?depth=1`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) return await r.json()
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

export async function getLinks() {
  const base = cmsBase()
  try {
    const r = await fetch(`${base}/api/links?sort=order&limit=100`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) {
      const docs = ((await r.json()) as any).docs ?? []
      if (docs.length) return docs.map((d: any) => ({ label: d.label, platform: d.platform, url: d.url, target: d.target || '_blank', cover: d.cover || undefined }))
    }
  } catch {}
  const local = await getCollection('links')
  return local.sort((a, b) => a.data.order - b.data.order).map((item) => item.data)
}

export async function getShows() {
  const base = cmsBase()
  const localShows = await getCollection('shows')
  const localBySlug = new Map(localShows.map((show) => [showSlug(show.data.venue, show.data.date), show]))
  const abs = (u: any) => {
    if (!u) return ''
    if (/^https?:\/\//i.test(String(u))) return String(u)
    try { return new URL(String(u), base).href } catch { return String(u) }
  }
  try {
    const r = await fetch(`${base}/api/shows?limit=100&sort=-order`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) {
      const j: any = await r.json()
      if (j.docs?.length) {
        const cmsShows = j.docs.map((d: any) => {
          const local = localBySlug.get(showSlug(d.venue, d.date))
          return { id: d.id, collection: 'shows', data: { venue: d.venue, city: d.city, date: d.date, status: d.status, order: d.order ?? 10, link: d.link || local?.data.link, image: typeof d.image === 'object' ? abs(d.image?.url) : (typeof d.image === 'string' ? abs(d.image) : local?.data.image ?? ''), imageAlt: d.imageAlt || d.image?.alt || local?.data.imageAlt || '', srcset: undefined, lineup: Array.isArray(d.lineup) && d.lineup.length ? d.lineup : local?.data.lineup ?? [] } }
        })
        const cmsSlugs = new Set(cmsShows.map((show: any) => showSlug(show.data.venue, show.data.date)))
        return [...cmsShows, ...localShows.filter((show) => !cmsSlugs.has(showSlug(show.data.venue, show.data.date)))]
      }
    }
  } catch {}
  return await getCollection('shows')
}
