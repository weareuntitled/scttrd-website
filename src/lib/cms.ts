import { getCollection } from 'astro:content'
import { showSlug } from './show.ts'

export { showSlug }

const cmsBase = () => {
  const url = import.meta.env.PAYLOAD_URL || (typeof process !== 'undefined' ? (process as any).env?.PAYLOAD_URL : undefined) || 'http://localhost:3000'
  return url.replace(/\/$/, '')
}

const cmsWarning = (operation: string) => console.warn(`[cms] ${operation} unavailable; using fallback`)

const abs = (base: string, url: any) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(String(url))) return String(url)
  try { return new URL(String(url), base).href } catch { return String(url) }
}

async function cmsList(path: string): Promise<any[] | null> {
  try {
    const response = await fetch(`${cmsBase()}/api/${path}`, { signal: AbortSignal.timeout(1500) } as any)
    if (!response.ok) throw new Error('CMS response failed')
    const body = await response.json()
    if (!Array.isArray(body.docs)) throw new Error('Invalid CMS list')
    return body.docs
  } catch {
    cmsWarning(path.split('?')[0])
    return null
  }
}

export async function getPage(slug: string) {
  try {
    const r = await fetch(`${cmsBase()}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&depth=1&limit=1`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) return ((await r.json()) as any).docs?.[0] ?? null
    cmsWarning('pages')
  } catch { cmsWarning('pages') }
  return null
}

export async function getLinkHub() {
  try {
    const r = await fetch(`${cmsBase()}/api/globals/link-hub?depth=1`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) return await r.json()
    cmsWarning('link-hub')
  } catch { cmsWarning('link-hub') }
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
  const docs = await cmsList('links?sort=order&limit=100')
  if (docs?.length) return docs.map((d: any) => ({ label: d.label, platform: d.platform, url: d.url, target: d.target || '_blank', cover: d.cover || undefined }))
  const local = await getCollection('links')
  return local.sort((a, b) => a.data.order - b.data.order).map((item) => item.data)
}

export async function getReleases() {
  const base = cmsBase()
  const docs = await cmsList('releases?sort=releaseDate&limit=100&depth=1')
  if (!docs) return []
  return docs.map((d: any) => ({
    ...d,
    cover: abs(base, typeof d.cover === 'object' ? d.cover?.url : d.cover),
    coverAlt: typeof d.cover === 'object' ? d.cover?.alt || d.title : d.title,
  }))
}

export async function getShows() {
  const base = cmsBase()
  const docs = await cmsList('shows?limit=100&sort=-order')
  // Nur CMS-Shows — kein lokaler Merge/Status-Override mehr.
  if (docs) {
    return docs.map((d: any) => ({
      id: d.id,
      collection: 'shows',
      data: {
        venue: d.venue,
        city: d.city,
        date: d.date,
        status: d.status,
        order: d.order ?? 10,
        link: d.link || '',
        linkKind: d.linkKind || undefined,
        image: abs(base, typeof d.image === 'object' ? d.image?.url : d.image),
        imageAlt: d.imageAlt || d.image?.alt || '',
        srcset: undefined,
        lineup: Array.isArray(d.lineup) && d.lineup.length ? d.lineup : [],
      },
    }))
  }
  // Letzte Rettung nur wenn das CMS gar nicht erreichbar ist (keine Doppel/Status-Inkonsistenz).
  const localShows = await getCollection('shows')
  return localShows.map((show) => ({ ...show }))
}
