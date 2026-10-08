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

// Spiegel von `to-snake-case` — dem Paket, das Payload für Spaltennamen nutzt:
// ein Unterstrich vor JEDEN Großbuchstaben, dann klein. Wegen der Akronyme ist
// das kein normales camelCase-zu-snake_case: enableAPIKey -> enable_a_p_i_key
// (nicht enable_api_key). Ohne diesen Untersatz landet die Spalte falsch und
// jeder users-Query schlägt fehl (Login 500).
const snake = (name) => name.replace(/([A-Z])/g, '_$1').toLowerCase()
const API_KEY_FIELDS = ['enableAPIKey', 'apiKey', 'apiKeyIndex']
const API_KEY_COLUMNS = API_KEY_FIELDS.map(snake)

test('snake mirror matches payload naming on columns that already exist in prod', () => {
  assert.equal(snake('releaseDate'), 'release_date')
  assert.equal(snake('bannerEnabled'), 'banner_enabled')
  assert.equal(snake('sourceUrl'), 'source_url')
  assert.deepEqual(API_KEY_COLUMNS, ['enable_a_p_i_key', 'api_key', 'api_key_index'])
})

test('Users collection enables Payload API keys', () => {
  assert.match(usersSource, /useAPIKey:\s*true/, 'auth.useAPIKey muss in Users.ts stehen')
})

describe('api key migrations', () => {
  const addPath = 'cms/src/migrations/20261008_000000_add_users_api_key.ts'
  const repairPath = 'cms/src/migrations/20261008_000001_repair_users_api_key_columns.ts'
  const indexSource = read('cms/src/migrations/index.ts')

  const upBody = (file) => {
    const up = /export async function up[\s\S]*?(?=\nexport async function down)/.exec(read(file))?.[0]
    assert.ok(up, `up() in ${file} nicht gefunden`)
    return up
  }
  const downBody = (file) => {
    const down = /export async function down[\s\S]*$/.exec(read(file))?.[0]
    assert.ok(down, `down() in ${file} nicht gefunden`)
    return down
  }

  test('both migrations exist and are registered in the migration index', () => {
    for (const file of [addPath, repairPath]) {
      assert.ok(fs.existsSync(path.join(root, file)), `${file} fehlt`)
      const name = path.basename(file, '.ts')
      assert.match(indexSource, new RegExp(`name: '${name}'`), `${name} fehlt im migrations-Array`)
      assert.match(indexSource, new RegExp(`from './${name}'`), `${name} wird nicht importiert`)
    }
  })

  test('up only adds the api key columns (idempotent, additive)', () => {
    const up = upBody(addPath)
    assert.doesNotMatch(up, /\bDROP\b|\bTRUNCATE\b|\bDELETE\b/, 'up() darf nichts entfernen')
    for (const column of API_KEY_COLUMNS) {
      assert.match(up, new RegExp(`ADD COLUMN IF NOT EXISTS "${column}"`), `up() fügt ${column} nicht idempotent hinzu`)
    }
    assert.doesNotMatch(up, /"enable_api_key"/, 'enable_api_key wäre die falsche (nicht von to-snake-case erzeugte) Spalte')
  })

  test('repair migration fixes a wrong enable_api_key column and is guarded', () => {
    const up = upBody(repairPath)
    assert.match(up, /ADD COLUMN IF NOT EXISTS "enable_a_p_i_key"/)
    assert.match(up, /DROP COLUMN IF EXISTS "enable_api_key"/)
    assert.doesNotMatch(up, /DROP TABLE|\bTRUNCATE\b/, 'Reparatur darf keine Tabelle löschen')
    const down = downBody(repairPath)
    assert.doesNotMatch(down, /DROP TABLE/)
    assert.match(down, new RegExp(`DROP COLUMN IF EXISTS "${snake('enableAPIKey')}"`))
    assert.doesNotMatch(down, /DROP COLUMN IF EXISTS "api_key(?!_index)"/, 'die korrekte api_key-Spalte darf die Reparatur nicht löschen')
  })

  test('down of the add migration drops only those columns', () => {
    const down = downBody(addPath)
    assert.doesNotMatch(down, /DROP TABLE/, 'down() darf die users-Tabelle nicht löschen')
    for (const column of API_KEY_COLUMNS) {
      assert.match(down, new RegExp(`DROP COLUMN IF EXISTS "${column}"`), `down() entfernt ${column} nicht`)
    }
  })

  test('column names equal toSnakeCase(field) for every api key field', () => {
    const up = upBody(addPath)
    for (const field of API_KEY_FIELDS) {
      assert.match(up, new RegExp(`"${snake(field)}"`), `Spalte ${snake(field)} (aus ${field}) fehlt`)
      assert.doesNotMatch(up, new RegExp(`"${field}"`), `${field} ist kein Postgres-Spaltenname`)
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
