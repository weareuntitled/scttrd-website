// Vertrag zwischen CMS-Schema und Agent-Import.
// Sobald in Shows.ts/Releases.ts ein neues (Pflicht-)Feld landet, läuft dieser
// Test rot — dann muss der Import es kennen, ableiten oder ablehnen.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildPlan,
  mediaFields,
  validateInput,
  writableFields,
} from '../cms/scripts/content-import-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const entriesOf = (block) => {
  const entries = []
  let depth = 0
  let start = -1
  for (let index = 0; index < block.length; index += 1) {
    const char = block[index]
    if (char === '{') {
      depth += 1
      if (depth === 1) start = index
    } else if (char === '}') {
      if (depth === 1 && start >= 0) {
        entries.push(block.slice(start, index + 1))
        start = -1
      }
      depth -= 1
    }
  }
  return entries
}

const fieldsBlock = (text) => {
  const anchor = text.indexOf('fields: [')
  if (anchor < 0) throw new Error('no fields block found')
  const open = text.indexOf('[', anchor)
  let depth = 0
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '[') depth += 1
    else if (text[index] === ']') {
      depth -= 1
      if (depth === 0) return text.slice(open, index + 1)
    }
  }
  throw new Error('unterminated fields block')
}

// Nur die eigene Deklaration eines Feldes lesen, nicht seinen Inhalt: `required`
// aus einem Array-Item oder `name` aus einem collapsible dürfen nicht als
// Top-Level-Felder durchrutschen. collapsible/group zählen Payload flach aufs
// Dokument, Array-/Tab-Felder nicht.
const declarationOf = (entry) => {
  const rest = entry.slice(1)
  const cut = rest.search(/[{[]/)
  return cut < 0 ? rest : rest.slice(0, cut)
}

const schemaFields = (block) => entriesOf(block).flatMap((entry) => {
  const declaration = declarationOf(entry)
  const type = /type:\s*'([^']+)'/.exec(declaration)?.[1]
  if (['collapsible', 'group'].includes(type)) return schemaFields(fieldsBlock(entry))
  const name = /name:\s*'([^']+)'/.exec(declaration)?.[1]
  if (!name) return []
  return [{ name, type, required: /required:\s*true/.test(declaration) }]
})

const fieldsOf = (collection) => {
  const source = fs.readFileSync(path.join(root, 'cms/src/collections', `${collection}.ts`), 'utf8')
  return schemaFields(fieldsBlock(source))
}

test('the import allowlist matches the CMS schema field for field', () => {
  for (const [type, collection] of [['show', 'Shows'], ['release', 'Releases']]) {
    const schema = fieldsOf(collection).map((field) => field.name).sort()
    assert.deepEqual(
      [...writableFields[type]].sort(),
      schema,
      `${collection}: writableFields must list exactly the schema fields (add new CMS fields to writableFields)`,
    )
  }
})

test('upload fields of the schema are the ones the import resolves to a media id', () => {
  assert.deepEqual(mediaFields.show, fieldsOf('Shows').filter((f) => f.type === 'upload').map((f) => f.name))
  assert.deepEqual(mediaFields.release, fieldsOf('Releases').filter((f) => f.type === 'upload').map((f) => f.name))
})

test('every required CMS field is present after import derivation', () => {
  const cases = {
    show: () => validateInput({ type: 'show', data: { venue: 'Club', city: 'Berlin', date: '12.12.2099' }, sources: [{ url: 'https://example.com' }] }),
    release: () => validateInput({ type: 'release', data: { title: 'Track', releaseDate: '2099-01-01', cover: '/images/x.jpg' }, sources: [{ url: 'https://example.com' }] }),
  }
  for (const [type, collection] of [['show', 'Shows'], ['release', 'Releases']]) {
    const created = buildPlan([cases[type]()], {})[0].data
    const required = fieldsOf(collection).filter((field) => field.required).map((field) => field.name)
    const missing = required.filter((field) => created[field] === undefined || created[field] === '')
    assert.deepEqual(missing, [], `${collection}: required field(s) not provided by the import: ${missing.join(', ')}`)
  }
})

test('workflow metadata never reaches the API payload', () => {
  assert.ok(!writableFields.show.includes('sources'))
  assert.ok(!writableFields.release.includes('sources'))
  const item = validateInput({ type: 'show', data: { venue: 'Club', city: 'Berlin', date: '12.12.2099' }, sources: [{ url: 'https://example.com' }] })
  assert.ok(!('sources' in item.data))
})
