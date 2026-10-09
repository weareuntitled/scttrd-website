import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Agent-Import-Vertrag für das SCTTRD CMS (Payload 3, Postgres).
// Identity ist der Schlüssel, über den ein bestehender Datensatz gefunden wird.
// shows haben kein slug-Feld, deshalb ist die Identity dort venue+city+date.
export const contentTypes = {
  show: { collection: 'shows', identity: ['venue', 'city', 'date'] },
  release: { collection: 'releases', identity: ['slug'] },
}

export const mediaFields = {
  show: ['image'],
  release: ['cover'],
}

// Genau diese Felder kennt die Collection — alles andere wird abgelehnt,
// damit nichts Unbekanntes an die API geschickt wird. `sources` gehört
// bewusst nicht dazu: es ist reine Workflow-Pflicht, das CMS speichert es nicht.
export const writableFields = {
  show: ['venue', 'city', 'date', 'status', 'description', 'address', 'doorsTime', 'startTime', 'image', 'imageAlt', 'link', 'linkKind', 'lineup', 'order', 'page'],
  release: ['title', 'slug', 'releaseDate', 'cover', 'description', 'spotifyUrl', 'bannerEnabled', 'bannerDurationDays', 'status'],
}

const GERMAN_DATE = /^(\d{2})\.(\d{2})\.(\d{4})$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function parseGermanDate(value) {
  const match = GERMAN_DATE.exec(String(value ?? '').trim())
  if (!match) return null
  const [, day, month, year] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return { year, month, day, time: date.getTime() }
}

export function parseIsoDate(value) {
  const match = ISO_DATE.exec(String(value ?? '').trim())
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return { year, month, day, time: date.getTime() }
}

export const expandPath = (value) => String(value).startsWith('~/') ? path.join(os.homedir(), String(value).slice(2)) : String(value)

export const isRemoteUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value)

export const isSitePath = (value) => typeof value === 'string' && /^\/(images|videos)\//.test(value)

// Ein lokaler Pfad (Datei existiert) wird beim Apply hochgeladen.
export const isUploadCandidate = (value) =>
  typeof value === 'string' &&
  value !== '' &&
  !isRemoteUrl(value) &&
  !isSitePath(value) &&
  fs.existsSync(expandPath(value))

const identityValue = (item, key) => String(item.identity?.[key] ?? item.data?.[key] ?? '').trim()

export function identityOf(item) {
  const config = contentTypes[item.type]
  return Object.fromEntries(config.identity.map((key) => [key, identityValue(item, key)]))
}

export function identityLabel(item) {
  return contentTypes[item.type].identity.map((key) => identityOf(item)[key]).join(' | ')
}

export function validateInput(raw) {
  const items = Array.isArray(raw) ? raw : [raw]
  const normalized = items.map((item) => {
    if (!isRecord(item) || !contentTypes[item.type]) throw new Error('Unsupported content type')
    if (!isRecord(item.data)) throw new Error('Every content item needs a data object')
    const unknown = Object.keys(item.data).filter((field) => !writableFields[item.type].includes(field))
    if (unknown.length) throw new Error(`Unknown ${item.type} field(s): ${unknown.join(', ')}`)
    // Optionale Pin-Nummer: erlaubt Umbenennungen von Identity-Feldern,
    // ohne dass der Import einen zweiten Datensatz anlegt.
    if (item.id !== undefined && item.id !== null && !/^\d+$/.test(String(item.id).trim())) {
      throw new Error('Content id must be a numeric CMS id')
    }
    if (item.id === undefined || item.id === null) delete item.id
    else item.id = Number(item.id)
    const identity = isRecord(item.identity) ? item.identity : {}
    item = { ...item, identity }
    // Slug fehlt oft noch in der Eingabe — er wird wie im CMS aus dem Titel erzeugt.
    if (item.type === 'release' && !identityValue(item, 'slug') && String(item.data?.title ?? '').trim()) {
      item.identity = { ...item.identity, slug: slugify(item.data.title) }
    }
    const missing = contentTypes[item.type].identity.filter((key) => !identityValue(item, key))
    if (missing.length) throw new Error(`Every content item needs an identity: ${missing.join(', ')}`)
    if (!Array.isArray(item.sources) || item.sources.length === 0 || item.sources.some((source) => !/^https?:\/\//i.test(String(source?.url ?? '')))) {
      throw new Error('Every content item needs at least one valid source URL')
    }
    // Identity und data befüllen sich gegenseitig, damit Create und Diff dieselben Werte sehen.
    const data = { ...item.data }
    for (const key of contentTypes[item.type].identity) {
      if (data[key] === undefined || data[key] === '') data[key] = identityValue(item, key)
      identity[key] = identityValue(item, key)
    }
    item = { ...item, identity, data }
    return deriveItem(item)
  })
  return Array.isArray(raw) ? normalized : normalized[0]
}

// Technische Felder erzeugt der Agent selbst, der Nutzer liefert nur Rohmaterial.
export function deriveItem(item) {
  const data = { ...item.data }
  if (item.type === 'show') {
    const parsed = parseGermanDate(data.date)
    if (!parsed) throw new Error(`Show date must be DD.MM.YYYY, got: ${data.date}`)
    const today = new Date()
    const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    data.status = parsed.time >= startOfToday ? 'upcoming' : 'past'
    if (data.image && !data.imageAlt) data.imageAlt = `${data.venue}, ${data.city}`
  }
  if (item.type === 'release') {
    if (data.releaseDate && !parseIsoDate(data.releaseDate)) throw new Error(`releaseDate must be YYYY-MM-DD, got: ${data.releaseDate}`)
    if (!identityValue(item, 'slug')) throw new Error('Release needs a slug or a title to derive one')
  }
  for (const field of mediaFields[item.type]) {
    const value = data[field]
    if (typeof value !== 'string' || !value) continue
    if (isRemoteUrl(value) || isSitePath(value) || isUploadCandidate(value) || /^\d+$/.test(value)) continue
    throw new Error(`${field} must be an existing file, a URL, a site path (/images/…) or a media id: ${value}`)
  }
  return { ...item, data }
}

const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right)

// Datum vergleichen wir auf Tag-Genauigkeit: das CMS liefert ISO, der Input
// kommt als 'YYYY-MM-DD' bzw. 'DD.MM.YYYY' — sonst meldet jeder Lauf ein Update.
const dateFields = { show: ['date'], release: ['releaseDate'] }

const asDateKey = (value) => {
  const text = String(value ?? '').trim()
  // CMS liefert 'YYYY-MM-DDTHH:MM:SS.sssZ', der Input 'YYYY-MM-DD'.
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const german = GERMAN_DATE.exec(text)
  return german ? `${german[3]}-${german[2]}-${german[1]}` : null
}

// Relationship-Felder liefert das CMS mit `depth=1` als populiertes Objekt,
// die Eingabe dagegen nur die id — vergleichen wir wie die Medien über die id,
// sonst meldet jeder zweite Lauf ein Phantom-Update und der Diff druckt das
// ganze Dokument aus.
export const relationFields = {
  show: ['page'],
  release: [],
}

// Medien/Relationships vergleichen wir über die ID, nicht über das Payload-Objekt.
const comparable = (type, field, value) => {
  if (mediaFields[type].includes(field)) return isRecord(value) ? value.id : value
  if (relationFields[type]?.includes(field)) return isRecord(value) ? value.id : value
  if (dateFields[type]?.includes(field)) return asDateKey(value) ?? value
  return value
}

// Beim Plan-Modus ist die Cover-Angabe noch ein Pfad/URL, im CMS steht das
// Medium-Objekt: beide Seiten über ID bzw. Dateinamen vergleichen, sonst
// meldet jeder Lauf ein Update.
const mediaKey = (value) => {
  if (isRecord(value)) {
    const key = {}
    if (value.id !== undefined && value.id !== null) key.id = value.id
    if (value.filename) key.filename = String(value.filename)
    return Object.keys(key).length ? key : null
  }
  if (typeof value === 'number') return { id: value }
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return null
    if (/^\d+$/.test(text)) return { id: Number(text) }
    return { filename: text.split(/[?#]/)[0].split('/').pop() }
  }
  return null
}

const mediaDisplay = (value) => {
  if (isRecord(value)) return value.filename ?? value.id ?? null
  if (typeof value === 'string' && value && !/^\d+$/.test(value)) return value.split(/[?#]/)[0].split('/').pop()
  return value
}

const isSame = (type, field, found, next) => {
  if (mediaFields[type].includes(field)) {
    const left = mediaKey(found)
    const right = mediaKey(next)
    if (!left || !right) return !left && !right
    if (left.id !== undefined && right.id !== undefined) return left.id === right.id
    if (left.filename !== undefined && right.filename !== undefined) return left.filename === right.filename
    return false
  }
  if (relationFields[type]?.includes(field)) {
    // CMS: { id: 1, … } · Eingabe: 1 oder "1" — beides über die id lesen.
    const id = (value) => (isRecord(value) ? value.id : value)
    const left = id(found)
    const right = id(next)
    if (left === null || left === undefined || right === null || right === undefined) {
      return (left ?? null) === (right ?? null)
    }
    return String(left) === String(right)
  }
  return equal(comparable(type, field, found), comparable(type, field, next))
}

const missingForCreate = (item) => {
  const required = item.type === 'release' ? ['title', 'releaseDate', 'cover'] : []
  return required.filter((field) => !item.data[field])
}

export function buildPlan(items, existing) {
  const seen = new Set()
  return items.map((item) => {
    item = validateInput(item)
    const config = contentTypes[item.type]
    const label = identityLabel(item)
    const key = `${item.type}:${label}`
    if (seen.has(key)) throw new Error(`Duplicate content item: ${key}`)
    seen.add(key)
    const records = existing[item.type] ?? []
    const found = item.id !== undefined
      ? records.find((record) => String(record?.id) === String(item.id))
      : records.find((record) => config.identity.every((field) => String(record?.[field] ?? '') === identityOf(item)[field]))
    if (item.id !== undefined && !found) throw new Error(`No ${item.type} with id ${item.id}`)
    if (!found) {
      const missing = missingForCreate(item)
      if (missing.length) throw new Error(`New ${item.type} is missing: ${missing.join(', ')}`)
      // Neue Releases sollen öffentlich sichtbar sein (nur published liest die Website);
      // bestehende Datensätze werden nie ungefragt veröffentlicht.
      const data = item.type === 'release' && !item.data.status ? { ...item.data, status: 'published' } : item.data
      return { ...item, data, action: 'create', changes: {} }
    }
    const changes = Object.fromEntries(
      Object.entries(item.data)
        .filter(([field, next]) => !isSame(item.type, field, found[field], next))
        .map(([field, next]) => [field, { from: mediaFields[item.type].includes(field) ? mediaDisplay(found[field]) : comparable(item.type, field, found[field]) ?? null, to: mediaFields[item.type].includes(field) ? mediaDisplay(next) : comparable(item.type, field, next) }]),
    )
    return { ...item, action: Object.keys(changes).length ? 'update' : 'skip', id: found.id, changes }
  })
}

// Kompakte Plan-Ausgabe für den Sync-Modus: eine Zeile je Datensatz,
// damit `content:sync` nicht das volle JSON drucken muss.
export function summarizePlan(plan) {
  return plan.map((item) => {
    const head = `${item.action} ${item.type}${item.id ? ` #${item.id}` : ''} — ${identityLabel(item)}`
    const changed = Object.keys(item.changes ?? {})
    return item.action === 'update' && changed.length ? `${head} (${changed.join(', ')})` : head
  })
}

// Öffentliche URL eines Datensatzes. Die Show-Slug-Regel spiegelt exakt
// `showSlug` aus src/lib/show.ts (inkl. NFKD, das Umlaut-Reste zu '-' macht) —
// sonst druckt der Sync eine URL, die 404 gibt. Drift testet content-sync.
export function publicUrl(item, siteUrl = 'https://scttrd.de') {
  const base = String(siteUrl).replace(/\/+$/, '')
  if (item.type === 'show') {
    const slug = `${item.data.venue ?? ''}-${item.data.date ?? ''}`
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `${base}/shows/${slug}/`
  }
  return `${base}/releases/${item.data.slug}/`
}

export const collectionFor = (type) => contentTypes[type].collection

export const apiAuthHeader = (token) => `JWT ${token}`

// .env des Projekts (CWD) und des übergeordneten Verzeichnisses einlesen.
// Gesetzte Umgebungsvariablen haben Vorrang — ein exportierter Wert wird nie
// überschrieben. Gemeinsam genutzt von content-import und content-verify,
// damit `npm run content:verify` ohne exportierte Variablen funktioniert.
export function loadEnvFiles(files = ['.env', '../.env'], env = process.env) {
  for (const file of files) {
    let text
    try { text = fs.readFileSync(file, 'utf8') } catch { continue }
    for (const line of text.split('\n')) {
      const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
      if (!match || line.trim().startsWith('#')) continue
      if (env[match[1]] === undefined) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
}

// Payload 3 API-Key-Strategie erwartet "<collection-slug> API-Key <key>",
// nicht "ApiKey <key>". Der Key kommt aus CMS_API_KEY und ersetzt den Login.
export const apiKeyAuthHeader = (key) => `users API-Key ${key}`

export const authHeaderForEnv = (env) => (env.CMS_API_KEY ? apiKeyAuthHeader(env.CMS_API_KEY) : null)

export function whereQuery(item) {
  return contentTypes[item.type]
    .identity
    .map((field, index) => `where[and][${index}][${field}][equals]=${encodeURIComponent(identityOf(item)[field])}`)
    .join('&')
}
