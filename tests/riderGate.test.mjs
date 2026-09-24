import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { RIDER_FILES, RIDER_GATED, riderRequestPayload, validateRiderRequest } from '../src/lib/riderRequest.ts';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

describe('Rider-Gate: Validierung', () => {
  it('akzeptiert vollständige Angaben und normalisiert sie', () => {
    const r = validateRiderRequest({ name: '  Kim  Muster ', venue: 'Kontrast Festival', email: ' FOH@Venue.DE ' });
    assert.equal(r.ok, true);
    assert.deepEqual(r.data, { name: 'Kim Muster', venue: 'Kontrast Festival', email: 'foh@venue.de' });
  });

  it('meldet fehlende Felder einzeln', () => {
    const r = validateRiderRequest({ name: 'K', venue: '', email: 'nope' });
    assert.equal(r.ok, false);
    assert.equal(r.spam, false);
    assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'name', 'venue']);
  });

  it('erkennt den Honeypot als Spam', () => {
    const r = validateRiderRequest({ name: 'Bot', venue: 'Bot', email: 'bot@bot.io', website: 'http://spam' });
    assert.equal(r.ok, false);
    assert.equal(r.spam, true);
  });

  it('baut das CMS-Payload mit erster IP aus x-forwarded-for', () => {
    const p = riderRequestPayload({ name: 'A', venue: 'B', email: 'a@b.de' }, { userAgent: 'UA', ip: '1.2.3.4, 10.0.0.1' });
    assert.equal(p.ip, '1.2.3.4');
    assert.equal(p.file, 'rider');
    assert.equal(p.source, 'styleguide');
  });
});

describe('Rider-Gate: Verdrahtung', () => {
  it('lokale Dateien aus RIDER_FILES existieren in public/', () => {
    for (const file of Object.values(RIDER_FILES).filter((f) => f.startsWith('/'))) {
      assert.ok(exists(path.join('public', file)), `fehlt: ${file}`);
    }
  });

  it('PDF und Hospitality liegen hinter dem Gate, HTML bleibt frei', () => {
    assert.deepEqual([...RIDER_GATED].sort(), ['hospitality', 'pdf']);
    assert.ok(!RIDER_GATED.includes('html'));
  });

  it('styleguide.astro: HTML frei verlinkt, PDF + Hospitality nur in .rider-links', () => {
    const src = read('src/pages/styleguide.astro');
    assert.match(src, /action="\/api\/rider-request"/);
    assert.match(src, /name="website"/, 'Honeypot fehlt');
    assert.match(src, /class="button button-large rider-open" href=\{RIDER_FILES\.html\}/, 'HTML-Rider muss frei aufrufbar sein');
    const links = src.match(/<div class="rider-links">([\s\S]*?)<\/div>/)?.[1] ?? '';
    assert.match(links, /RIDER_FILES\.pdf/);
    assert.match(links, /RIDER_FILES\.hospitality/);
    assert.doesNotMatch(src, /href="https:\/\/drive\.google\.com\/drive\/folders\/1R8LF6_T1DeVFs72Bm3O-HAaX2_3jqp45"/, 'Hospitality darf nicht mehr direkt verlinkt sein');
  });

  it('API-Route existiert, schreibt ins CMS und verschickt die Benachrichtigung', () => {
    const src = read('src/pages/api/rider-request.ts');
    assert.match(src, /\/api\/rider-requests/);
    assert.match(src, /validateRiderRequest/);
    assert.match(src, /sendNotification/);
    assert.match(src, /SMTP_PASSWORD/);
    assert.match(src, /sendMail/);
    assert.match(src, /html: notificationHtml/);
    assert.match(src, /#f00000/);
    assert.match(src, /connectionTimeout/);
    assert.match(src, /socketTimeout/);
    assert.match(read('all-inclusive/compose.all.yaml'), /SMTP_PORT: \$\{SMTP_PORT:-587\}/);
  });

  it('CMS kennt die Collection rider-requests inkl. Migration', () => {
    assert.match(read('cms/src/collections/RiderRequests.ts'), /slug: 'rider-requests'/);
    assert.match(read('cms/src/payload.config.ts'), /RiderRequests/);
    assert.match(read('cms/src/migrations/index.ts'), /add_rider_requests/);
  });

  it('Rider-HTML verlinkt das PDF', () => {
    assert.match(read('public/styleguide/assets/rider/scttrd-foh-rider.html'), /href="scttrd-foh-rider\.pdf"/);
  });
});
