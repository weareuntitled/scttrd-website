import fs from 'fs'
import path from 'path'
const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000'
const TOKEN = process.env.PAYLOAD_TOKEN
if (!TOKEN) { console.error('PAYLOAD_TOKEN missing (login via /api/users/login first)'); process.exit(1) }
const dir = 'src/content/home/shows'
for (const f of fs.readdirSync(dir).filter(x=>x.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(dir,f),'utf8')
  const data = Object.fromEntries([...raw.matchAll(/^(\w+):\s*(.*)$/gm)].map(m=>[m[1],m[2].trim()]))
  const body = { venue: data.venue, city: data.city, date: data.date, status: data.status||'past', order: Number(data.order)||10, link: data.link||undefined }
  const r = await fetch(`${PAYLOAD_URL}/api/shows`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`JWT ${TOKEN}` }, body: JSON.stringify(body) })
  console.log(f, r.status, await r.text().then(t=>t.slice(0,200)))
}
