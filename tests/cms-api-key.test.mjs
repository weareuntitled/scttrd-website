import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { apiKeyAuthHeader, authHeaderForEnv, apiAuthHeader } from '../cms/scripts/content-import-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const usersSource = read('cms/src/collections/Users.ts')

test('Users collection enables Payload API keys', () => {
  assert.match(usersSource, /useAPIKey:\s*true/, 'auth.useAPIKey muss in Users.ts stehen')
})

describe('api key migration', () => {
  const migrationPath = 'cms/src/migrations/20261008_000000_add_users_api_key.ts'
  const indexSource = read('cms/src/migrations/index.ts')

  test('migration exists and is registered', () => {
    assert.ok(fs.existsSync(path.join(root, migrationPath)), `${migrationPath} fehlt`)
    assert.match(indexSource, /20261008_000000_add_users_api_key/, 'Migration ist nicht in migrations/index.ts registriert')
  })

  test('up only adds the three api key columns (idempotent, additive)', () => {
    const up = /export async function up[\s\S]*?(?=\nexport async function down)/.exec(read(migrationPath))?.[0]
    assert.ok(up, 'up() nicht gefunden')
    assert.doesNotMatch(up, /\bDROP\b|\bTRUNCATE\b|\bDELETE\b/, 'up() darf nichts entfernen')
    for (const column of ['enable_api_key', 'api_key', 'api_key_index']) {
      assert.match(up, new RegExp(`ADD COLUMN IF NOT EXISTS "${column}"`), `up() fügt ${column} nicht idempotent hinzu`)
    }
  })

  test('down drops only those columns', () => {
    const down = /export async function down[\s\S]*$/.exec(read(migrationPath))?.[0]
    assert.ok(down, 'down() nicht gefunden')
    assert.doesNotMatch(down, /DROP TABLE/, 'down() darf die users-Tabelle nicht löschen')
    for (const column of ['enable_api_key', 'api_key', 'api_key_index']) {
      assert.match(down, new RegExp(`DROP COLUMN IF EXISTS "${column}"`), `down() entfernt ${column} nicht`)
    }
  })

  test('column names match Payloads snake_case mapping of the field names', () => {
    const up = read(migrationPath)
    for (const [field, column] of [['enableAPIKey', 'enable_api_key'], ['apiKey', 'api_key'], ['apiKeyIndex', 'api_key_index']]) {
      assert.ok(!new RegExp(`"${field}"`).test(up), `${field} ist kein Postgres-Spaltenname`)
      assert.match(up, new RegExp(`"${column}"`), `Spalte ${column} (aus ${field}) fehlt`)
    }
  })
})

test('api key auth header uses Payloads "<slug> API-Key <key>" format', () => {
  assert.equal(apiKeyAuthHeader('abc123'), 'users API-Key abc123')
  assert.equal(apiAuthHeader('tok'), 'JWT tok', 'JWT-Header darf sich nicht ändern')
})

test('auth header resolves from CMS_API_KEY without a password login', () => {
  assert.equal(authHeaderForEnv({}), null)
  assert.equal(authHeaderForEnv({ CMS_PASSWORD: 'x' }), null)
  assert.equal(authHeaderForEnv({ CMS_API_KEY: 'abc123' }), 'users API-Key abc123')
})

describe('content-import via API key (script level)', () => {
  let server
  let port
  let requests = []
  let tmpDir

  const inputPath = () => path.join(tmpDir, 'input.json')
  const showInput = () => JSON.stringify([
    {
      type: 'show',
      identity: { venue: 'Testhalle', city: 'Berlin', date: '12.12.2026' },
      data: {},
      sources: [{ url: 'https://example.com/gig' }],
    },
  ])

  const runImport = (mode, env) => new Promise((resolve) => {
    const child = spawn(process.execPath, [
      path.join(root, 'cms/scripts/content-import.mjs'),
      mode, '--input', inputPath(),
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
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scttrd-apikey-'))
    fs.writeFileSync(inputPath(), showInput())
    requests = []
    server = http.createServer((req, res) => {
      let body = ''
      req.on('data', (chunk) => { body += chunk })
      req.on('end', () => {
        requests.push({ method: req.method, url: req.url, auth: req.headers.authorization || '', body })
        res.setHeader('Content-Type', 'application/json')
        if (req.url === '/api/users/login' && req.method === 'POST') {
          res.end(JSON.stringify({ token: 'stub-token', user: { id: 1, email: 'admin@example.com' } }))
          return
        }
        if (req.url.startsWith('/api/shows')) {
          res.end(JSON.stringify({ docs: [], totalDocs: 0, limit: 10, page: 1 }))
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

  test('plan works with CMS_API_KEY only — no login, correct header', async () => {
    requests = []
    const result = await runImport('plan', {
      PATH: process.env.PATH || '',
      CMS_URL: `http://127.0.0.1:${port}`,
      CMS_API_KEY: 'test-key-123',
    })
    assert.equal(result.code, 0, `stderr: ${result.stderr}`)
    assert.equal(requests.some((r) => r.url === '/api/users/login'), false, 'API-Key darf keinen Login-Aufruf auslösen')
    const showsCall = requests.find((r) => r.url.startsWith('/api/shows'))
    assert.ok(showsCall, `kein /api/shows-Aufruf: ${JSON.stringify(requests)}`)
    assert.equal(showsCall.auth, 'users API-Key test-key-123')
    assert.match(result.stdout, /"action": "create"/)
  })

  test('plan still falls back to password login without a key', async () => {
    requests = []
    const result = await runImport('plan', {
      PATH: process.env.PATH || '',
      CMS_URL: `http://127.0.0.1:${port}`,
      CMS_EMAIL: 'admin@example.com',
      CMS_PASSWORD: 'secret',
    })
    assert.equal(result.code, 0, `stderr: ${result.stderr}`)
    assert.equal(requests.some((r) => r.url === '/api/users/login'), true, 'ohne Key muss per Passwort geloggt werden')
    const showsCall = requests.find((r) => r.url.startsWith('/api/shows'))
    assert.equal(showsCall?.auth, 'JWT stub-token')
  })

  test('API key wins over a stored password', async () => {
    requests = []
    const result = await runImport('plan', {
      PATH: process.env.PATH || '',
      CMS_URL: `http://127.0.0.1:${port}`,
      CMS_API_KEY: 'test-key-123',
      CMS_EMAIL: 'admin@example.com',
      CMS_PASSWORD: 'secret',
    })
    assert.equal(result.code, 0, `stderr: ${result.stderr}`)
    assert.equal(requests.some((r) => r.url === '/api/users/login'), false)
    assert.equal(requests.find((r) => r.url.startsWith('/api/shows'))?.auth, 'users API-Key test-key-123')
  })
})
