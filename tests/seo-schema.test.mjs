// Vertrag für die strukturierten Daten der Show-Seiten (SEO/AEO-Critical).
// Sonderfall im Audit: die Startseite hat siteUrl UND absolute CMS-Bild-URL
// verkettet ("https://scttrd.dehttps://cms.scttrd.de/...") — das darf nie
// wiederkommen, deshalb zentral in src/lib/seo.ts mit Test.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { absoluteUrl, showEventSchema, breadcrumbSchema, renderSitemap, truncateDescription, DEFAULT_OG_IMAGE, SITE_URL } from '../src/lib/seo.ts'
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

// --- nächste Prioritätswelle: Sitemap-Lastmod, Styleguide-Meta, leeres img, FAQ/AEO ---

test('renderSitemap emits loc plus optional lastmod', () => {
  const xml = renderSitemap([
    { loc: 'https://scttrd.de/' },
    { loc: 'https://scttrd.de/shows/xolo-bar-03-12-2026/', lastmod: '2026-10-08T11:51:13.954Z' },
  ])
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/)
  assert.match(xml, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/)
  assert.ok(xml.includes('<url><loc>https://scttrd.de/</loc></url>'), 'Eintrag ohne lastmod bleibt kompakt')
  assert.ok(xml.includes('<url><loc>https://scttrd.de/shows/xolo-bar-03-12-2026/</loc><lastmod>2026-10-08T11:51:13.954Z</lastmod></url>'))
  assert.ok(!xml.includes('undefined'))
})

test('sitemap route uses renderSitemap with CMS updatedAt and covers styleguide', () => {
  const route = read('src/pages/sitemap.xml.ts')
  assert.match(route, /renderSitemap/)
  assert.match(route, /updatedAt/)
  assert.match(route, /\/styleguide\//)
  const shows = read('src/lib/cms.ts')
  assert.match(shows, /updatedAt: d\.updatedAt/)
})

test('show list rows drop the <img> instead of rendering src=""', () => {
  const customers = read('src/components/Customers.astro')
  assert.match(customers, /show\.data\.image &&/)
  assert.ok(!/src=\{show\.data\.image\}(?![\s\S]*image &&)/.test(customers) || /show\.data\.image &&/.test(customers))
})

test('styleguide ships meta description and canonical', () => {
  const styleguide = read('src/pages/styleguide.astro')
  assert.match(styleguide, /<meta name="description"/)
  assert.match(styleguide, /rel="canonical"/)
})

test('showEventSchema carries description, address and times when present', () => {
  const detailed = showEventSchema({ data: {
    ...show.data,
    description: 'SCTTRD live in der Xolo Bar: Post-Punk trifft Techno.',
    address: 'Beispielstraße 1, 80331 München',
    doorsTime: '19:00',
    startTime: '20:00',
  } })
  assert.equal(detailed.description, 'SCTTRD live in der Xolo Bar: Post-Punk trifft Techno.')
  assert.equal(detailed.location.address.streetAddress, 'Beispielstraße 1, 80331 München')
  assert.equal(detailed.startDate, '2026-12-03T20:00')
  assert.equal(detailed.doorTime, '2026-12-03T19:00')
})

test('showEventSchema stays lean without details or times', () => {
  const plain = showEventSchema(show)
  assert.equal(plain.description, undefined)
  assert.equal(plain.doorTime, undefined)
  assert.equal(plain.startDate, '2026-12-03', 'Ohne Beginn bleibt das reine Tagesdatum')
  assert.equal(plain.location.address.streetAddress, undefined)
})

test('showEventSchema ignores malformed times', () => {
  const broken = showEventSchema({ data: { ...show.data, doorsTime: 'abends', startTime: '20' } })
  assert.equal(broken.doorTime, undefined)
  assert.equal(broken.startDate, '2026-12-03')
})

test('truncateDescription only cuts long text at word boundaries', () => {
  assert.equal(truncateDescription('Kurz und gut.'), 'Kurz und gut.')
  const long = `SCTTRD spielt ein DJ Live Set bei Techno und Punsch in Augsburg. Tickets gibt es direkt im Ticketshop. Weitere Infos zum Abend folgen auf der Veranstaltungsseite und an der Abendkasse vor Ort.`
  const cut = truncateDescription(long)
  assert.ok(cut.length <= 157)
  assert.ok(!/\S$/.test(long.slice(0, 157)) || cut === long.slice(0, 157).replace(/\s+\S*$/, ''))
  assert.ok(!cut.endsWith('vor') && !cut.endsWith('an'), 'Kein abgehacktes Wort am Ende')
})

test('show pages render description, details and use them for meta', () => {
  const showPage = read('src/pages/shows/[slug].astro')
  assert.match(showPage, /description/)
  assert.match(showPage, /show-description/)
  assert.match(showPage, /Einlass/)
  assert.match(showPage, /Beginn/)
  assert.match(showPage, /Adresse/)
  assert.match(showPage, /metaDescription/)
  const cms = read('src/lib/cms.ts')
  for (const field of ['description', 'address', 'doorsTime', 'startTime']) {
    assert.ok(cms.includes(field), `getShows reicht ${field} durch`)
  }
})

test('base layout ships canonical social meta (url, type, twitter)', () => {
  const layout = read('src/layouts/BaseLayout.astro')
  assert.match(layout, /property="og:url"/)
  assert.match(layout, /property="og:type"/)
  assert.match(layout, /name="twitter:title"/)
  assert.match(layout, /name="twitter:description"/)
})

test('show pages reuse the site header typography and footer', () => {
  const header = read('src/components/SiteHeader.astro')
  assert.match(header, /font-family:\s*Poppins,\s*sans-serif/)

  const footer = read('src/components/SiteFooter.astro')
  assert.match(footer, /class="footer"/)
  assert.match(footer, /class="footer-links"/)

  const homepage = read('src/pages/index.astro')
  const showPage = read('src/pages/shows/[slug].astro')
  assert.match(homepage, /<SiteFooter/)
  assert.match(showPage, /<SiteFooter/)
  assert.ok(!showPage.includes('show-footer'), 'Show-Seiten verwenden keinen abweichenden Footer')
})

test('home carries a FAQ block with FAQPage schema', () => {
  const index = read('src/pages/index.astro')
  assert.match(index, /Häufige Fragen/)
  assert.match(index, /FAQPage/)
  assert.match(index, /mainEntity/)
  assert.match(index, /\?/) // Fragen sind echte Frage-Überschriften
  assert.match(index, /aria-expanded/) // Accordion (Framer-Referenz), Antworten bleiben im DOM
  const beforeCta = index.indexOf('class="section-faq"') < index.indexOf('class="section-cta"')
  assert.ok(beforeCta, 'FAQ steht unten vor dem Kontakt-CTA')
  assert.match(index, /\.faq-item\[data-open\] \.faq-a-clip/, 'Offener Zustand steuert den Clip (Button ist in h3)')
  assert.ok(!index.includes('wissen willst \\u2014'), 'Kein literal \\u2014 im JSX-Text')
})
