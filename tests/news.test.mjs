import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { newsUrl } from '../src/lib/news.ts'
import { articleSchema } from '../src/lib/seo.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

test('news URL and Article schema are canonical and include the cover image', () => {
  const article = { title: 'Live-Recap Ulm', slug: 'live-recap-ulm', excerpt: 'Rückblick auf die Show', publishedAt: '2026-10-19', cover: 'https://cms.example.test/photo.jpg' }
  assert.equal(newsUrl(article), '/news/live-recap-ulm/')
  const schema = articleSchema(article, 'https://scttrd.de/news/live-recap-ulm/')
  assert.equal(schema['@type'], 'Article')
  assert.equal(schema.headline, article.title)
  assert.equal(schema.image, article.cover)
  assert.equal(schema.mainEntityOfPage, 'https://scttrd.de/news/live-recap-ulm/')
})

test('news routes, CMS reader, navigation and sitemap are connected', () => {
  assert.ok(fs.existsSync(path.join(root, 'src/pages/news/index.astro')))
  assert.ok(fs.existsSync(path.join(root, 'src/pages/news/[slug].astro')))
  assert.match(read('src/lib/cms.ts'), /export async function getNews\(\)/)
  assert.match(read('src/components/SiteHeader.astro'), /label: 'News', url: '\/news\/'/)
  assert.match(read('src/pages/sitemap.xml.ts'), /getNews\(\)/)
})

test('footer groups its links in three columns and stacks them on mobile', () => {
  const footer = read('src/components/SiteFooter.astro')
  const groups = read('src/lib/facts.ts')
  assert.match(footer, /\.footer-grid\s*\{[^}]*display:\s*grid/)
  assert.match(footer, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(footer, /@media\s*\(max-width:\s*767px\)[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  for (const group of ['Seiten', 'Material', 'Kontakt']) assert.match(groups, new RegExp(`label: '${group}'`))
  for (const link of ['/#shows', '/news/', '/gallery/', '/styleguide/#presse', '/facts/']) assert.ok(groups.includes(`url: '${link}'`), `footer missing ${link}`)
  assert.doesNotMatch(footer, /font-family:\s*['"]Inter/)
})

test('recap article and reading column align to the breadcrumb edge', () => {
  const styles = read('src/styles/news.css')
  assert.match(read('src/content/news/sperrstunde-2-0-ulm.md'), /^body:\s*\|$/m)
  assert.match(styles, /\.news-article-page\s*>\s*article\s*\{[^}]*margin:\s*38px\s+0\s+0/)
  assert.match(styles, /\.article-content\s*\{[^}]*margin:\s*48px\s+0\s+0/)
})

test('event, show and recording links appear immediately above the article heading', () => {
  const page = read('src/pages/news/[slug].astro')
  assert.ok(page.indexOf('class="article-actions"') < page.indexOf('class="article-heading"'))
})

test('homepage displays up to three published news cards immediately before the FAQ', () => {
  const home = read('src/pages/index.astro')
  assert.match(home, /getNews\(\)/)
  assert.match(home, /status === 'published'/)
  assert.match(home, /\.slice\(0, 3\)/)
  assert.match(home, /<HomeNews articles=\{latestNews\}/)
  assert.ok(home.indexOf('<HomeNews') < home.indexOf('<section class="section-faq"'))
  const component = read('src/components/HomeNews.astro')
  assert.match(component, /href=\{newsUrl\(article\)\}/)
  assert.match(component, /href="\/news\/"/)
  assert.match(component, /articles\.map/)
})
