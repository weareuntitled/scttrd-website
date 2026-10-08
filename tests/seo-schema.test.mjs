// Vertrag für die strukturierten Daten der Show-Seiten (SEO/AEO-Critical).
// Sonderfall im Audit: die Startseite hat siteUrl UND absolute CMS-Bild-URL
// verkettet ("https://scttrd.dehttps://cms.scttrd.de/...") — das darf nie
// wiederkommen, deshalb zentral in src/lib/seo.ts mit Test.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { absoluteUrl, showEventSchema, breadcrumbSchema, DEFAULT_OG_IMAGE, SITE_URL } from '../src/lib/seo.ts'
import { showSlug, isoDate } from '../src/lib/show.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const show = {
  data: {
    venue: 'Xolo Bar',
    city: 'München',
    date: '03.12.2026',
    status: 'upcoming',
    image: 'https://cms.scttrd.de/api/media/file/xolo.jpg',
    imageAlt: '',
    link: 'https://frida-restaurant.de/xolo',
    linkKind: 'website',
    lineup: [],
  },
}

test('absoluteUrl never doubles the site origin', () => {
  assert.equal(absoluteUrl('https://cms.scttrd.de/api/media/file/a.jpg'), 'https://cms.scttrd.de/api/media/file/a.jpg')
  assert.equal(absoluteUrl('/images/hero.jpg'), `${SITE_URL}/images/hero.jpg`)
  assert.equal(absoluteUrl('https://cms.scttrd.de/api/media/file/a.jpg', 'https://scttrd.de'), 'https://cms.scttrd.de/api/media/file/a.jpg')
  assert.equal(absoluteUrl('images/hero.jpg'), `${SITE_URL}/images/hero.jpg`)
  assert.equal(absoluteUrl(null), undefined)
})

test('showEventSchema describes the event the way crawlers need it', () => {
  const schema = showEventSchema(show)
  assert.equal(schema['@type'], 'Event')
  assert.equal(schema.name, 'Xolo Bar - SCTTRD')
  assert.equal(schema.startDate, '2026-12-03')
  assert.equal(schema.startDate, isoDate(show.data.date))
  assert.equal(schema.url, `${SITE_URL}/shows/${showSlug('Xolo Bar', '03.12.2026')}/`)
  assert.equal(schema.image, 'https://cms.scttrd.de/api/media/file/xolo.jpg', 'CMS-Bild-URL darf nicht mit der Site-URL verkettet werden')
  assert.equal(schema.location['@type'], 'Place')
  assert.equal(schema.location.name, 'Xolo Bar')
  assert.equal(schema.location.address.addressLocality, 'München')
  assert.equal(schema.offers.url, 'https://frida-restaurant.de/xolo')
  assert.equal(schema.eventStatus, 'https://schema.org/EventScheduled')
  assert.equal(schema.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode')
})

test('showEventSchema falls back to the press image and omits offers without link', () => {
  const bare = showEventSchema({ data: { ...show.data, image: '', link: '' } })
  assert.equal(bare.image, `${SITE_URL}${DEFAULT_OG_IMAGE}`)
  assert.equal(bare.offers, undefined)
  assert.equal(bare.startDate, '2026-12-03')
})

test('breadcrumbSchema builds positions from Home to the show', () => {
  const schema = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shows', url: '/#shows' },
    { name: 'Xolo Bar', url: `/shows/${showSlug('Xolo Bar', '03.12.2026')}/` },
  ])
  assert.equal(schema['@type'], 'BreadcrumbList')
  assert.equal(schema.itemListElement.length, 3)
  assert.deepEqual(schema.itemListElement.map((entry) => entry.position), [1, 2, 3])
  assert.equal(schema.itemListElement[0].item, `${SITE_URL}/`)
  assert.equal(schema.itemListElement[2].item, `${SITE_URL}/shows/xolo-bar-03-12-2026/`)
  assert.equal(schema.itemListElement[2].name, 'Xolo Bar')
})

test('pages wire up og:image, Event and Breadcrumb schema', () => {
  const layout = read('src/layouts/BaseLayout.astro')
  assert.match(layout, /property="og:image"/)
  assert.match(layout, /name="twitter:image"/)

  const showPage = read('src/pages/shows/[slug].astro')
  assert.match(showPage, /showEventSchema/)
  assert.match(showPage, /breadcrumbSchema/)
  assert.match(showPage, /application\/ld\+json/)

  assert.match(read('src/pages/gallery.astro'), /image=/)
  assert.match(read('src/pages/styleguide.astro'), /property="og:image"/)

  const index = read('src/pages/index.astro')
  assert.ok(
    !index.includes('siteUrl}${nextShow.data.image'),
    'Startseite darf siteUrl und absolute Bild-URL nicht mehr verkettet (Audit-Befund)',
  )
})
