const baseUrl = (process.env.SMOKE_BASE_URL || 'https://scttrd.de').replace(/\/$/, '')

const checks = [
  ['website', `${baseUrl}/`],
  ['gallery', `${baseUrl}/gallery/`],
  ['links', `${baseUrl}/links/`],
  ['cms', 'https://cms.scttrd.de/admin'],
  ['docmost', 'https://docs.scttrd.de/'],
]

for (const [name, url] of checks) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`${name}: ${response.status} ${url}`)
  console.log(`${name}: ${response.status}`)
}

const videoUrl = `${baseUrl}/videos/radio-rudina/clip.mp4`
const video = await fetch(videoUrl, {
  headers: { Range: 'bytes=0-1023' },
  signal: AbortSignal.timeout(15000),
})
if (![200, 206].includes(video.status)) throw new Error(`video: ${video.status} ${videoUrl}`)
console.log(`video: ${video.status}`)
