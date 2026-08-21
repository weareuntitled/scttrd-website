import { getCollection } from 'astro:content'
export async function getShows() {
  const url = import.meta.env.PAYLOAD_URL || process.env.PAYLOAD_URL
  if (url) {
    try {
      const r = await fetch(`${url.replace(/\/$/, '')}/api/shows?limit=100&sort=-order`)
      if (r.ok) {
        const j: any = await r.json()
        return (j.docs || []).map((d: any) => ({
          id: d.id,
          collection: 'shows',
          data: {
            venue: d.venue,
            city: d.city,
            date: d.date,
            status: d.status,
            order: d.order ?? 10,
            link: d.link || undefined,
            image: typeof d.image === 'object' ? d.image?.url || '' : d.image || '',
            imageAlt: d.imageAlt || d.image?.alt || '',
            srcset: d.image?.url ? undefined : undefined,
          },
        }))
      }
    } catch {}
  }
  return await getCollection('shows')
}
