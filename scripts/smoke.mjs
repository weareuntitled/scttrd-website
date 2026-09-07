const baseUrl = (process.env.SMOKE_BASE_URL || 'https://scttrd.de').replace(/\/$/, '')
const cmsUrl = (process.env.SMOKE_CMS_URL || 'https://cms.scttrd.de').replace(/\/$/, '')

const checks = [
  ['website', `${baseUrl}/`],
  ['gallery', `${baseUrl}/gallery/`],
  ['links', `${baseUrl}/links/`],
  ['cms', `${cmsUrl}/admin`],
  ['cms-shows-admin', `${cmsUrl}/admin/collections/shows`],
  ['docmost', 'https://docs.scttrd.de/'],
]

for (const [name, url] of checks) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`${name}: ${response.status} ${url}`)
  console.log(`${name}: ${response.status}`)
}

const cmsShows = await fetch(`${cmsUrl}/api/shows?limit=1`, { signal: AbortSignal.timeout(15000) })
if (!cmsShows.ok) throw new Error(`cms-shows-api: ${cmsShows.status} ${cmsUrl}/api/shows?limit=1`)
const cmsShowsBody = await cmsShows.json()
if (!Array.isArray(cmsShowsBody.docs)) throw new Error('cms-shows-api: response has no docs array')
if (cmsShowsBody.docs.some((show) => !Array.isArray(show.lineup))) throw new Error('cms-shows-api: show has no lineup array')
console.log(`cms-shows-api: ${cmsShows.status}`)

const indexHtml = await fetch(`${baseUrl}/index.html`, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
if (indexHtml.status !== 308 || indexHtml.headers.get('location') !== '/') {
  throw new Error(`index-html-redirect: expected 308 to /, got ${indexHtml.status} ${indexHtml.headers.get('location') || ''}`)
}
console.log(`index-html-redirect: ${indexHtml.status}`)

const showChecks = [
  ['singoldsand-show', '/shows/singoldsand-21-08-2026/', ['Singoldsand', 'Google Maps']],
  ['komfortrauschen-show', '/shows/kulturhaus-milbertshofen-06-12-2025/', ['Eventbrite', 'Ort in Google Maps öffnen']],
]
for (const [name, path, markers] of showChecks) {
  const page = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(15000) })
  const html = await page.text()
  if (!page.ok) throw new Error(`${name}: ${page.status} ${path}`)
  for (const marker of markers) if (!html.includes(marker)) throw new Error(`${name}: missing marker "${marker}"`)
  console.log(`${name}: ${page.status}`)
}

const videoUrl = `${baseUrl}/videos/radio-rudina/clip.mp4`
const video = await fetch(videoUrl, {
  headers: { Range: 'bytes=0-1023' },
  signal: AbortSignal.timeout(15000),
})
if (![200, 206].includes(video.status)) throw new Error(`video: ${video.status} ${videoUrl}`)
console.log(`video: ${video.status}`)
