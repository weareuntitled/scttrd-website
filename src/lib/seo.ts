// Zentrale Helfer für strukturierte Daten und Social-Meta-Tags.
// Grund: Audit-Befund "https://scttrd.dehttps://cms.scttrd.de/..." — absolute
// CMS-Bild-URLs dürfen nie mit der Site-URL verkettet werden.
import { isoDate, showSlug } from './show.ts'

export const SITE_URL = 'https://scttrd.de'
export const DEFAULT_OG_IMAGE = '/images/00_scttrd_graded_-29.jpg'

export function absoluteUrl(value?: string | null, base: string = SITE_URL): string | undefined {
  if (!value) return undefined
  const url = String(value).trim()
  if (url.length === 0) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

export interface ShowLike {
  data: {
    venue?: string
    city?: string
    date?: unknown
    description?: string
    address?: string
    doorsTime?: string
    startTime?: string
    image?: string | null
    link?: string
    linkKind?: string
    [key: string]: unknown
  }
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export function showEventSchema(show: ShowLike, base: string = SITE_URL) {
  const { venue = '', city = '', date, description, address, doorsTime, startTime, image, link } = show.data
  const day = isoDate(date)
  const start = typeof startTime === 'string' && TIME.test(startTime.trim()) ? startTime.trim() : ''
  const doors = typeof doorsTime === 'string' && TIME.test(doorsTime.trim()) ? doorsTime.trim() : ''
  const startDate = day && start ? `${day}T${start}` : day || undefined
  const doorTime = day && doors ? `${day}T${doors}` : undefined
  const text = typeof description === 'string' ? description.trim() : ''
  const street = typeof address === 'string' ? address.trim() : ''
  return {
    '@type': 'Event',
    name: `${venue} - SCTTRD`,
    ...(startDate ? { startDate } : {}),
    ...(doorTime ? { doorTime } : {}),
    ...(text ? { description: text } : {}),
    url: `${base}/shows/${showSlug(venue, date)}/`,
    image: absoluteUrl(image || DEFAULT_OG_IMAGE, base),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue,
      address: {
        '@type': 'PostalAddress',
        ...(street ? { streetAddress: street } : {}),
        ...(city ? { addressLocality: city } : {}),
      },
    },
    performer: { '@id': `${base}/#scttrd` },
    ...(link ? { offers: { '@type': 'Offer', url: link, priceCurrency: 'EUR' } } : {}),
  }
}

export interface Crumb {
  name: string
  url: string
}

export function breadcrumbSchema(crumbs: Crumb[], base: string = SITE_URL) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url, base),
    })),
  }
}

export interface SitemapEntry {
  loc: string
  lastmod?: string
}

// Meta-Description aus der CMS-Beschreibung: nur kürzen, wenn nötig —
// und dann an der Wortgrenze. Kurze Texte bleiben unangetastet.
export function truncateDescription(text: string, max = 157): string {
  const clean = String(text ?? '').trim().replace(/\s+/g, ' ')
  if (clean.length <= max) return clean
  return clean.slice(0, max).replace(/\s+\S*$/, '')
}

export function renderSitemap(entries: SitemapEntry[]): string {
  const escapeXml = (value: string): string =>
    value.replace(/[<>&'"]/g, (character) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] ?? character)
  const urls = entries
    .map((entry) =>
      entry.lastmod
        ? `  <url><loc>${escapeXml(entry.loc)}</loc><lastmod>${escapeXml(entry.lastmod)}</lastmod></url>`
        : `  <url><loc>${escapeXml(entry.loc)}</loc></url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
}
