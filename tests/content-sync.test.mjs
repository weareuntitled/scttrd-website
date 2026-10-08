// Sync-Modus: plan + apply + verify + Live-URL in EINEM Lauf (Ziel: unter 2 Min.
// von der Idee zur veröffentlichten Änderung — ein Befehl, ein Prozess).
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildPlan,
  publicUrl,
  summarizePlan,
  validateInput,
} from '../cms/scripts/content-import-lib.mjs'
import { showSlug } from '../src/lib/show.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const showInput = (data = {}) => validateInput({
  type: 'show',
  identity: {},
  data: { venue: 'Xolo Bar', city: 'München', date: '03.12.2026', ...data },
  sources: [{ url: 'https://example.com/gig' }],
})

test('summarizePlan prints one compact line per record', () => {
  const created = buildPlan([showInput()], {})
  assert.deepEqual(summarizePlan(created), ['create show — Xolo Bar | München | 03.12.2026'])

  const existing = { show: [{ id: 10, venue: 'Xolo Bar', city: 'München', date: '03.12.2026', status: 'upcoming', link: 'https://a.example' }] }
  const updated = buildPlan([showInput({ link: 'https://b.example', order: 10 })], existing)
  assert.deepEqual(summarizePlan(updated), ['update show #10 — Xolo Bar | München | 03.12.2026 (link, order)'])

  const unchanged = buildPlan([showInput({ link: 'https://a.example' })], existing)
  assert.deepEqual(summarizePlan(unchanged), ['skip show #10 — Xolo Bar | München | 03.12.2026'])
})

test('publicUrl mirrors the website slug rule instead of drifting from it', () => {
  // showSlug in src/lib/show.ts entfernt Umlaut-NFD-Reste NICHT — deshalb hier
  // exakt spiegeln, sonst druckt der Sync eine URL, die 404 gibt.
  assert.equal(showSlug('Xolo Bar', '03.12.2026'), 'xolo-bar-03-12-2026')
  assert.equal(showSlug('Grünwalder Str.', '01.01.2027'), 'gru-nwalder-str-01-01-2027')
  assert.equal(
    publicUrl({ type: 'show', data: { venue: 'Xolo Bar', date: '03.12.2026' } }),
    `https://scttrd.de/shows/${showSlug('Xolo Bar', '03.12.2026')}/`,
  )
  assert.equal(
    publicUrl({ type: 'show', data: { venue: 'Grünwalder Str.', date: '01.01.2027' } }),
    `https://scttrd.de/shows/${showSlug('Grünwalder Str.', '01.01.2027')}/`,
  )
  assert.equal(
    publicUrl({ type: 'release', data: { slug: 'vault-cut-01' } }, 'https://example.test'),
    'https://example.test/releases/vault-cut-01/',
  )
})

describe('content:sync runs plan, apply and verify in one call', () => {
  let server
  let port
  let requests = []
  let tmpDir

  const runSync = (env) => new Promise((resolve) => {
    const child = spawn(process.execPath, [
      path.join(root, 'cms/scripts/content-import.mjs'),
      '--sync', '--input', path.join(tmpDir, 'input.json'),
    ], {
      cwd: tmpDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scttrd-sync-'))
    fs.writeFileSync(path.join(tmpDir, 'input.json'), JSON.stringify(showInput()))
    server = http.createServer((req, res) => {
      let body = ''
      req.on('data', (chunk) => { body += chunk })
      req.on('end', () => {
        requests.push({ method: req.method, url: req.url, auth: req.headers.authorization || '', body })
        res.setHeader('Content-Type', 'application/json')
        if (req.url.startsWith('/api/users/login')) {
          res.end(JSON.stringify({ token: 'stub-token' }))
          return
        }
        if (req.method === 'POST' && req.url === '/api/shows') {
          res.end(JSON.stringify({ id: 10, doc: { id: 10 } }))
          return
        }
        if (req.url.startsWith('/api/')) {
          res.end(JSON.stringify({ docs: [], totalDocs: 0, limit: 100, page: 1 }))
          return
        }
        res.statusCode = 404
        res.end(JSON.stringify({ errors: [{ message: 'not found' }] }))
      })
    })
    await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve) })
    port = server.address().port
  })

  after(() => {
    server?.close()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('one command writes the record, verifies it and prints the live URL', async () => {
    requests = []
    const result = await runSync({
      PATH: process.env.PATH || '',
      CMS_URL: `http://127.0.0.1:${port}`,
      CMS_API_KEY: 'test-key-123',
      SITE_URL: 'https://example.test',
    })
    assert.equal(result.code, 0, `stderr: ${result.stderr}`)

    assert.match(result.stdout, /^create show — Xolo Bar/m)
    assert.match(result.stdout, /verify: \{.*"ok":true\}/s)
    assert.match(result.stdout, /live: https:\/\/example\.test\/shows\/xolo-bar-03-12-2026\//)
    assert.match(result.stdout, /live: https:\/\/example\.test\//)

    const write = requests.find((r) => r.method === 'POST' && r.url === '/api/shows')
    assert.ok(write, `kein Create-Aufruf: ${JSON.stringify(requests)}`)
    assert.equal(write.auth, 'users API-Key test-key-123')
    assert.ok(requests.some((r) => r.url.startsWith('/api/releases')), 'verify-Lauf fehlt (kein /api/releases)')
    assert.ok(!requests.some((r) => r.url === '/api/users/login'), 'mit API-Key darf kein Login laufen')
  })

  test('a failed verification makes the command exit non-zero', async () => {
    const broken = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json')
      if (req.method === 'POST' && req.url === '/api/shows') return res.end(JSON.stringify({ id: 11 }))
      // Plan-Lookup (mit where[]) antwortet sauber, der Verify-ListCall nicht:
      // ein unvollständiges Show-Dokument reicht, damit verify ok:false meldet.
      if (req.url.includes('where[')) return res.end(JSON.stringify({ docs: [], totalDocs: 0 }))
      res.end(JSON.stringify({ docs: [{ id: 1 }], totalDocs: 1 }))
    })
    await new Promise((resolve) => { broken.listen(0, '127.0.0.1', resolve) })
    requests = []
    const result = await runSync({
      PATH: process.env.PATH || '',
      CMS_URL: `http://127.0.0.1:${broken.address().port}`,
      CMS_API_KEY: 'test-key-123',
      SITE_URL: 'https://example.test',
    })
    broken.close()
    assert.equal(result.code, 1, `stderr: ${result.stderr}`)
    assert.match(result.stdout, /"ok":false/)
  })
})
