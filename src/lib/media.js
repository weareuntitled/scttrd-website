import fs from 'node:fs';
import path from 'node:path';
export const exists = (p) => fs.existsSync(path.join(process.cwd(), 'public', p.replace(/^\//, '')));
export const assertMedia = (p) => { if (!exists(p)) throw new Error(`missing media ${p}`); return p; };
