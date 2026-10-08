#!/usr/bin/env node
// Prüft die öffentliche CMS-API, so wie die Website sie liest.
//   npm run content:verify                      (CLI: report + Exit-Code)
//   import { verifyReport } from './content-verify.mjs'   (vom Sync-Modus)
import { pathToFileURL } from 'node:url'
import { loadEnvFiles } from './content-import-lib.mjs'

export async function verifyReport() {
  loadEnvFiles()
  const base = (process.env.CMS_URL || process.env.PAYLOAD_URL || 'http://localhost:3000').replace(/\/$/, '')

  const report = {}
  const failures = []

  const list = async (name, path) => {
    try {
      const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(5000) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!Array.isArray(body.docs)) throw new Error('no docs array')
      report[name] = body.totalDocs ?? body.docs.length
      return body.docs
    } catch (error) {
      report[name] = false
      failures.push(`${name}: ${error.message}`)
      return []
    }
  }

  const shows = await list('shows', '/api/shows?limit=100&sort=-order')
  const releases = await list('releases', '/api/releases?limit=100&sort=releaseDate&depth=1')
  await list('pages', '/api/pages?limit=1')
  await list('links', '/api/links?limit=1')

  for (const show of shows) {
    if (!show.venue || !show.city || !show.date || !show.status) failures.push(`show ${show.id}: missing required field`)
  }
  for (const release of releases) {
    if (!release.slug || !release.releaseDate) failures.push(`release ${release.id}: missing slug/releaseDate`)
  }

  report.ok = failures.length === 0
  if (failures.length) report.failures = failures
  return report
}

// Nur als CLI ausführen — beim Import (Sync-Modus) darf hier nichts laufen.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await verifyReport()
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exitCode = 1
}
