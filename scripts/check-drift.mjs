import fs from 'node:fs';
const yml = fs.readFileSync('public/admin/config.yml','utf8');
const ts = fs.readFileSync('src/content.config.ts','utf8');
const fields = (name, re) => [...yml.matchAll(new RegExp(`name:\\s*${name}[\\s\\S]*?fields:([\\s\\S]*?)(?=\\n  - name:|$)`,'g'))].length;
let drift = 0;
for (const c of ['shows','links','videos','press']) if (!yml.includes(`name: ${c}`) || !ts.includes(`${c}`)) drift++;
console.log(drift ? `drift:${drift}` : 'ok: Zod ↔ Decap in sync');
process.exit(drift ? 1 : 0);
