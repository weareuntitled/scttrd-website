import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { bandFacts, musicGroupSchema } from '../src/lib/facts.ts'

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('grounding page identifies the same music group as the homepage', () => {
  assert.equal(musicGroupSchema['@id'], 'https://scttrd.de/#scttrd')
  assert.equal(musicGroupSchema['@type'], 'MusicGroup')
  assert.equal(musicGroupSchema.name, bandFacts.name)
  assert.deepEqual(musicGroupSchema.member.map((member) => member.name), ['Dani', 'Babsi', 'Nate'])
  assert.ok(musicGroupSchema.sameAs.includes('https://soundcloud.com/scttrd-live'))
  assert.match(read('src/pages/index.astro'), /\.\.\.musicGroupSchema/)
  assert.match(read('src/pages/facts.astro'), /application\/ld\+json/)
  assert.match(read('src/pages/facts.astro'), /canonical="https:\/\/scttrd.de\/facts\/"/)
})

test('facts are discoverable through the footer and sitemap', () => {
  assert.match(read('src/lib/facts.ts'), /url: '\/facts\/'/)
  assert.match(read('src/pages/sitemap.xml.ts'), /'\/facts\/'/)
})
