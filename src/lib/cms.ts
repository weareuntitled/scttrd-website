import { getCollection } from 'astro:content'
export async function getShows() {
  const url = import.meta.env.PAYLOAD_URL || (typeof process !== 'undefined' ? (process as any).env?.PAYLOAD_URL : undefined) || 'http://localhost:3000'
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/api/shows?limit=100&sort=-order`, { signal: AbortSignal.timeout(1500) } as any)
    if (r.ok) {
      const j: any = await r.json()
      if (j.docs?.length) return j.docs.map((d: any) => ({ id: d.id, collection: 'shows', data: { venue: d.venue, city: d.city, date: d.date, status: d.status, order: d.order ?? 10, link: d.link || undefined, image: typeof d.image === 'object' ? d.image?.url || '' : d.image || '', imageAlt: d.imageAlt || d.image?.alt || '', srcset: undefined } }))
    }
  } catch {}
  return await getCollection('shows')
}
