// Erzeugt das Rider-PDF aus der HTML-Version mit einem lokalen Chrome (headless).
// Voraussetzung: Preview läuft (npm run preview -- --host 127.0.0.1 --port 4329),
// damit Fonts und Assets unter /styleguide/assets/... aufgelöst werden.
//
//   npm run rider:pdf                      → nutzt http://127.0.0.1:4329
//   npm run rider:pdf -- https://scttrd.de  → nutzt eine andere Basis-URL
//   CHROME_BIN=/pfad/zu/chrome npm run rider:pdf

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.argv[2] || process.env.RIDER_BASE_URL || 'http://127.0.0.1:4329').replace(/\/$/, '');
// Cache-Buster: Chrome nutzt sonst ggf. eine gecachte Version aus dem Profil.
const url = `${base}/styleguide/assets/rider/scttrd-foh-rider.html?pdf=${Date.now()}`;
const out = path.resolve('public/styleguide/assets/rider/scttrd-foh-rider.pdf');

const candidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  'google-chrome',
  'chromium',
  'chromium-browser',
].filter(Boolean);

const resolveBinary = (candidate) => {
  if (candidate.includes('/')) return fs.existsSync(candidate) ? candidate : null;
  const which = spawnSync('which', [candidate], { encoding: 'utf8' });
  return which.status === 0 ? which.stdout.trim() : null;
};

const chrome = candidates.map(resolveBinary).find(Boolean);
if (!chrome) {
  console.error('Kein Chrome/Chromium gefunden. Setze CHROME_BIN=/pfad/zum/browser.');
  process.exit(1);
}

fs.rmSync(out, { force: true });
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--run-all-compositor-stages-before-draw',
  '--virtual-time-budget=5000',
  '--no-pdf-header-footer',
  `--print-to-pdf=${out}`,
  url,
];
const run = spawnSync(chrome, args, { encoding: 'utf8', timeout: 90_000 });
if (run.error) {
  console.error(run.error.message);
  process.exit(1);
}
if (!fs.existsSync(out) || fs.statSync(out).size < 10_000) {
  console.error('PDF wurde nicht erzeugt oder ist verdächtig klein.\n', run.stderr);
  process.exit(1);
}
console.log(`PDF geschrieben: ${path.relative(process.cwd(), out)} (${Math.round(fs.statSync(out).size / 1024)} KB) aus ${url}`);
