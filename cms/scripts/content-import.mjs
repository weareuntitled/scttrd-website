#!/usr/bin/env node
// Agent-Import für Shows und Releases ins SCTTRD CMS (Payload-REST).
//   npm run content:check -- --input <file.json>   nur validieren
//   npm run content:plan  -- --input <file.json>   Plan (create/update/skip) ohne Schreiben
//   npm run content:apply -- --input <file.json>   Plan ausführen
// Läuft mit purem node (nur Builtins), braucht also kein installiertes cms/node_modules.
import { readFileSync, existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  apiAuthHeader,
  authHeaderForEnv,
  buildPlan,
  collectionFor,
  expandPath,
  isRemoteUrl,
  isSitePath,
  isUploadCandidate,
  mediaFields,
  validateInput,
  whereQuery,
} from './content-import-lib.mjs'

const loadEnvFiles = () => {
  for (const file of ['.env', '../.env']) {
    let text
    try { text = readFileSync(file, 'utf8') } catch { continue }
    for (const line of text.split('\n')) {
      const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
      if (!match || line.trim().startsWith('#')) continue
      if (process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
}

loadEnvFiles()

const argument = (name) => {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const inputPath = argument('--input')
if (!inputPath) {
  console.error('Usage: node scripts/content-import.mjs [--check|--apply] --input path/to/content.json')
  process.exit(1)
}

const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--apply') ? 'apply' : 'plan'
const cmsUrl = (process.env.CMS_URL || process.env.PAYLOAD_URL || 'http://localhost:3000').replace(/\/$/, '')
const email = process.env.CMS_EMAIL || process.env.SEED_EMAIL || 'admin@scttrd.de'
const password = process.env.CMS_PASSWORD || process.env.SEED_PASSWORD

let token = null
// Mit CMS_API_KEY entfällt der Login komplett (schnellster Weg, kein Passwort nötig).
const apiKeyHeader = authHeaderForEnv(process.env)

const authHeader = async () => {
  if (apiKeyHeader) return apiKeyHeader
  if (!token) {
    if (!password) throw new Error('CMS_API_KEY or CMS_PASSWORD (or SEED_PASSWORD) is required to authenticate against the CMS')
    const login = await fetch(`${cmsUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const session = await login.json().catch(() => ({}))
    if (!login.ok || !session.token) throw new Error(`CMS login failed (${login.status}) for ${email}`)
    token = session.token
  }
  return apiAuthHeader(token)
}

const request = async (path, init = {}) => {
  const headers = new Headers(init.headers)
  headers.set('Authorization', await authHeader())
  if (init.body) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${cmsUrl}${path}`, { ...init, headers })
  const text = await response.text()
  if (!response.ok) throw new Error(`CMS request failed (${response.status}): ${text.slice(0, 400)}`)
  return text ? JSON.parse(text) : null
}

// Payload-Upload-Felder brauchen eine Mediums-ID. Der Agent darf aber einen lokalen
// Pfad, eine URL oder einen /images/…-Pfad liefern — hier wird daraus eine ID:
// vorhandenes Medium mit gleichem Dateinamen wiederverwenden (auch beim 2. Lauf
// keine Duplikate), sonst Datei nachladen/aus public/ nehmen und hochladen.
const publicRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../public')

const sourceFileFor = async (value) => {
  if (isSitePath(value)) {
    const file = path.join(publicRoot, value.slice(1))
    return existsSync(file) ? file : null
  }
  if (isUploadCandidate(value)) return expandPath(value)
  if (isRemoteUrl(value)) {
    const response = await fetch(value)
    if (!response.ok) throw new Error(`cover download failed (${response.status}): ${value}`)
    const name = path.basename(new URL(value).pathname) || `cover-${Date.now()}.jpg`
    const file = path.join(os.tmpdir(), `scttrd-${Date.now()}-${name}`)
    await writeFile(file, Buffer.from(await response.arrayBuffer()))
    return file
  }
  return null
}

const resolveMedia = async (value) => {
  if (typeof value !== 'string' || !value) return value
  if (/^\d+$/.test(value)) return Number(value)
  const filename = path.basename(String(value).split(/[?#]/)[0])
  const found = await request(`/api/media?where[filename][equals]=${encodeURIComponent(filename)}&limit=1`)
  if (found?.docs?.[0]) return found.docs[0].id
  const file = await sourceFileFor(value)
  if (!file) throw new Error(`No media found for "${value}" — use an existing media id, a file in public/ or a local file`)
  const form = new FormData()
  const blob = await readFile(file)
  const uploadName = path.basename(file)
  form.append('file', new Blob([blob]), uploadName)
  form.append('_payload', JSON.stringify({ alt: uploadName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ') }))
  const response = await fetch(`${cmsUrl}/api/media`, {
    method: 'POST',
    headers: { Authorization: await authHeader() },
    body: form,
  })
  const body = await response.json().catch(() => ({}))
  const id = body?.id ?? body?.doc?.id
  if (!response.ok || !id) throw new Error(`Media upload failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
  return id
}

try {
  const raw = JSON.parse(await readFile(inputPath, 'utf8'))
  const items = validateInput(Array.isArray(raw) ? raw : [raw])

  if (mode === 'check') {
    console.log(JSON.stringify({ valid: true, items: items.length, types: items.map((item) => item.type) }, null, 2))
    process.exit(0)
  }

  if (mode === 'apply') {
    for (const item of items) {
      for (const field of mediaFields[item.type]) {
        if (typeof item.data[field] === 'string') item.data[field] = await resolveMedia(item.data[field])
      }
    }
  }

  const byType = {}
  for (const item of items) {
    const collection = collectionFor(item.type)
    byType[item.type] ??= []
    // Mit id wird der Datensatz direkt adressiert — so lassen sich auch
    // Identity-Felder umbenennen, ohne einen zweiten Eintrag anzulegen.
    if (item.id !== undefined) {
      let doc
      try {
        doc = await request(`/api/${collection}/${item.id}?depth=1`)
      } catch (error) {
        if (/\(404\)/.test(error.message)) throw new Error(`No ${item.type} with id ${item.id} in ${cmsUrl}/api/${collection}`)
        throw error
      }
      byType[item.type].push(doc)
      continue
    }
    const response = await request(`/api/${collection}?${whereQuery(item)}&limit=1&depth=1`)
    if (response?.docs?.[0]) byType[item.type].push(response.docs[0])
  }

  const plan = buildPlan(items, byType)
  console.log(JSON.stringify(plan, null, 2))

  if (mode === 'apply') {
    for (const item of plan) {
      if (item.action === 'skip') continue
      const collection = collectionFor(item.type)
      if (item.action === 'create') await request(`/api/${collection}`, { method: 'POST', body: JSON.stringify(item.data) })
      if (item.action === 'update') await request(`/api/${collection}/${item.id}`, { method: 'PATCH', body: JSON.stringify(item.data) })
    }
    const created = plan.filter((item) => item.action === 'create').length
    const updated = plan.filter((item) => item.action === 'update').length
    const skipped = plan.filter((item) => item.action === 'skip').length
    console.error(`Applied: ${created} create, ${updated} update, ${skipped} skip.`)
  }
} catch (error) {
  console.error(`content:${mode} failed: ${error.message}`)
  process.exit(1)
}
