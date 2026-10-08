import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  apiAuthHeader,
  buildPlan,
  collectionFor,
  isUploadCandidate,
  parseGermanDate,
  slugify,
  validateInput,
  whereQuery,
} from '../cms/scripts/content-import-lib.mjs'

const show = (data = {}) => ({
  type: 'show',
  identity: {},
  data: { venue: 'Techno & Punsch', city: 'Augsburg', date: '12.12.2026', ...data },
  sources: [{ url: 'https://example.com/event' }],
})

const release = (data = {}) => ({
  type: 'release',
  identity: {},
  data: { title: 'Vault Cut 01', releaseDate: '2026-12-12', cover: '/images/cover.jpg', ...data },
  sources: [{ url: 'https://example.com/release' }],
})

test('remote CMS requests use Payload JWT authentication', () => {
  assert.equal(apiAuthHeader('secret-token'), 'JWT secret-token')
})

test('content input requires a supported type, identity and source', () => {
  assert.throws(() => validateInput({ type: 'gig', identity: {}, data: {}, sources: [{ url: 'https://example.com' }] }), /unsupported/i)
  assert.throws(() => validateInput({ type: 'show', identity: {}, data: { city: 'Augsburg' }, sources: [{ url: 'https://example.com' }] }), /identity/i)
  assert.throws(() => validateInput(show({ date: '12/12/2026' })), /DD\.MM\.YYYY/i)
  assert.throws(() => validateInput({ ...show(), sources: [] }), /source/i)
  assert.throws(() => validateInput(release({ releaseDate: '12.12.2026' })), /YYYY-MM-DD/i)
  assert.throws(() => validateInput(release({ cover: '/missing/cover.jpg' })), /cover/i)
  assert.doesNotThrow(() => validateInput(show()))
  assert.doesNotThrow(() => validateInput(release()))
})

test('derive: show status from german date, slug and image alt', () => {
  const upcoming = validateInput(show({ date: '12.12.2099' }))
  assert.equal(upcoming.data.status, 'upcoming')
  const past = validateInput(show({ date: '01.01.2000', image: '/images/show.jpg' }))
  assert.equal(past.data.status, 'past')
  assert.equal(past.data.imageAlt, 'Techno & Punsch, Augsburg')
  const dated = validateInput(release({ title: 'Räuber & Gendarm' }))
  assert.equal(dated.identity.slug, 'rauber-gendarm')
  assert.equal(slugify('Räuber & Gendarm'), 'rauber-gendarm')
  assert.equal(parseGermanDate('31.02.2026'), null)
})

test('content plan creates, updates only changed fields, and skips identical records', () => {
  const items = [
    show({ venue: 'Neuer Club' }),
    release({ title: 'Neuer Track', releaseDate: '2026-11-01', cover: '/images/neuer-track.jpg' }),
    release({ title: 'Gleich', releaseDate: '2026-01-01', cover: '/images/gleich.jpg', description: 'keep' }),
  ]
  const existing = {
    release: [
      { id: 'r1', slug: 'vault-cut-01', title: 'Vault Cut 01', releaseDate: '2026-12-12', cover: '/images/cover.jpg', description: 'alte Beschreibung', status: 'published' },
      { id: 'r2', slug: 'gleich', title: 'Gleich', releaseDate: '2026-01-01', cover: '/images/gleich.jpg', description: 'keep' },
    ],
  }
  const plan = buildPlan(items, existing)
  assert.deepEqual(plan.map((item) => item.action), ['create', 'create', 'skip'])
  assert.equal(plan[0].data.status, 'upcoming')
  assert.equal(plan[1].data.status, 'published', 'neue Releases werden veröffentlicht')

  const changed = buildPlan([release({ title: 'Vault Cut 01', slug: 'vault-cut-01', description: 'neu' })], existing)
  assert.equal(changed[0].action, 'update')
  assert.deepEqual(changed[0].changes, { description: { from: 'alte Beschreibung', to: 'neu' } })
  assert.equal(changed[0].data.status, undefined, 'nicht mitgelieferte Felder bleiben unangetastet')
})

test('an explicit id pins the record so identity fields can be renamed', () => {
  const existing = { show: [{ id: 7, venue: 'techno & punsch', city: 'Augsburg', date: '12.12.2026', status: 'upcoming', link: null }] }
  const item = {
    type: 'show',
    id: 7,
    data: { venue: 'techno & punsch (DJ live set)', city: 'Augsburg', date: '12.12.2026', link: 'https://technomitpunsch.ticket.io/NYpegMS8/', linkKind: 'ticket' },
    sources: [{ url: 'https://technomitpunsch.ticket.io/NYpegMS8/' }],
  }
  const plan = buildPlan([item], existing)
  assert.equal(plan[0].action, 'update')
  assert.equal(plan[0].id, 7)
  assert.deepEqual(Object.keys(plan[0].changes).sort(), ['link', 'linkKind', 'venue'])
  assert.deepEqual(plan[0].changes.venue, { from: 'techno & punsch', to: 'techno & punsch (DJ live set)' })
  assert.throws(() => buildPlan([{ ...item, id: 99 }], existing), /no show with id 99/i)
  assert.throws(() => buildPlan([{ ...item, id: 'sieben' }], existing), /id/i)
})

test('media objects from the CMS are compared by id', () => {
  const items = [release({ title: 'Vault Cut 01', slug: 'vault-cut-01', cover: 42 })]
  const existing = { release: [{ id: 'r1', slug: 'vault-cut-01', title: 'Vault Cut 01', releaseDate: '2026-12-12', cover: { id: 42, url: '/uploads/cover.jpg' } }] }
  assert.equal(buildPlan(items, existing)[0].action, 'skip')
})

test('release dates from the CMS do not trigger a phantom update', () => {
  const existing = { release: [{ id: 'r1', slug: 'vault-cut-01', title: 'Vault Cut 01', releaseDate: '2026-12-12T00:00:00.000Z', cover: { id: 7 }, status: 'draft' }] }
  const plan = buildPlan([release({ slug: 'vault-cut-01', cover: 7 })], existing)
  assert.equal(plan[0].action, 'skip', `expected skip, got ${plan[0].action} with ${JSON.stringify(plan[0].changes)}`)
})

test('a cover path in plan mode matches the CMS media by filename', () => {
  const cover = { id: 7, filename: 'cover.jpg', url: '/media/cover.jpg' }
  const existing = { release: [{ id: 'r1', slug: 'vault-cut-01', title: 'Vault Cut 01', releaseDate: '2026-12-12T00:00:00.000Z', cover, status: 'draft' }] }
  const byPath = buildPlan([release({ slug: 'vault-cut-01', cover: '/images/cover.jpg' })], existing)
  assert.equal(byPath[0].action, 'skip', `expected skip, got ${byPath[0].action} with ${JSON.stringify(byPath[0].changes)}`)
  const otherFile = buildPlan([release({ slug: 'vault-cut-01', cover: '/images/other.jpg' })], existing)
  assert.equal(otherFile[0].action, 'update', 'ein anderes Cover ist eine echte Änderung')
  assert.deepEqual(otherFile[0].changes.cover, { from: 'cover.jpg', to: 'other.jpg' })
  const remote = buildPlan([release({ slug: 'vault-cut-01', cover: 'https://cdn.example.com/cover.jpg?w=1' })], existing)
  assert.equal(remote[0].action, 'skip', 'gleicher Dateiname über URL')
})

test('fields the collection does not know are rejected before any API call', () => {
  assert.throws(() => validateInput(show({ cover_url: 'https://example.com/x.jpg' })), /unknown show field/i)
  assert.throws(() => validateInput(release({ source: 'https://example.com' })), /unknown release field/i)
})

test('duplicate identity is rejected', () => {
  assert.throws(() => buildPlan([show(), show()], { show: [] }), /duplicate/i)
})

test('media file candidates are local files only', () => {
  const file = path.join(os.tmpdir(), `scttrd-cover-${process.pid}.jpg`)
  fs.writeFileSync(file, 'x')
  assert.equal(isUploadCandidate(file), true)
  assert.equal(isUploadCandidate('/images/cover.jpg'), false)
  assert.equal(isUploadCandidate('https://example.com/cover.jpg'), false)
  fs.unlinkSync(file)
  assert.equal(isUploadCandidate(file), false)
})

test('query and collection mapping match the Payload API', () => {
  assert.equal(collectionFor('show'), 'shows')
  assert.equal(collectionFor('release'), 'releases')
  assert.equal(
    whereQuery({ type: 'show', identity: { venue: 'Techno & Punsch', city: 'Augsburg', date: '12.12.2026' }, data: {} }),
    'where[and][0][venue][equals]=Techno%20%26%20Punsch&where[and][1][city][equals]=Augsburg&where[and][2][date][equals]=12.12.2026',
  )
})
