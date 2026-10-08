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
    image?: string | null
    link?: string
    linkKind?: string
    [key: string]: unknown
  }
}

export function showEventSchema(show: ShowLike, base: string = SITE_URL) {
  const { venue = '', city = '', date, image, link } = show.data
  const startDate = isoDate(date)
  return {
    '@type': 'Event',
    name: `${venue} - SCTTRD`,
    ...(startDate ? { startDate } : {}),
    url: `${base}/shows/${showSlug(venue, date)}/`,
    image: absoluteUrl(image || DEFAULT_OG_IMAGE, base),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue,
      address: {
        '@type': 'PostalAddress',
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
