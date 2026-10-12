import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { RIDER_FILES, RIDER_GATED, RIDER_PRIVATE_FILES, createRiderGateToken, isRiderGateTokenValid, riderRequestPayload, validateRiderRequest } from '../src/lib/riderRequest.ts';
import { canRevealRiderPhone, normalizeRiderPhone } from '../src/lib/riderPhone.ts';

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

  it('signiert das zeitlich begrenzte Freischalt-Cookie', () => {
    const now = 1_800_000_000_000;
    const token = createRiderGateToken('test-payload-secret', now);
    assert.equal(isRiderGateTokenValid(token, 'test-payload-secret', now), true);
    assert.equal(isRiderGateTokenValid(token, 'wrong-secret', now), false);
    assert.equal(isRiderGateTokenValid(`${token}x`, 'test-payload-secret', now), false);
    assert.equal(isRiderGateTokenValid(token, 'test-payload-secret', now + 31 * 24 * 60 * 60 * 1000), false);
  });
});

describe('Rider-Gate: Telefonnummer', () => {
  it('gibt die Nummer nur bei exaktem Passwort frei', () => {
    assert.equal(canRevealRiderPhone('correct horse battery staple', 'correct horse battery staple'), true);
    assert.equal(canRevealRiderPhone('correct horse battery staple ', 'correct horse battery staple'), false);
    assert.equal(canRevealRiderPhone('wrong password', 'correct horse battery staple'), false);
  });

  it('bleibt ohne konfiguriertes oder bei überlangem Passwort geschlossen', () => {
    assert.equal(canRevealRiderPhone('anything', ''), false);
    assert.equal(canRevealRiderPhone('x'.repeat(513), 'configured'), false);
    assert.equal(canRevealRiderPhone('short-pass', 'short-pass'), true);
    assert.equal(canRevealRiderPhone('wrong-pass', 'short-pass'), false);
  });

  it('normalisiert deutsche Nummernformate für den geschützten tel-Link', () => {
    assert.deepEqual(normalizeRiderPhone('0171 2345678'), { phone: '0171 2345678', tel: '+491712345678' });
    assert.deepEqual(normalizeRiderPhone('+49 171 2345678'), { phone: '+49 171 2345678', tel: '+491712345678' });
    assert.equal(normalizeRiderPhone('keine Nummer'), null);
  });

  it('enthält die Telefonnummer nicht in den heruntergeladenen Rider-Dateien', () => {
    const html = read('private/rider/scttrd-foh-rider.html');
    assert.doesNotMatch(html, /tel:\+|\+\d{1,3}(?:[ -]?\d){7,14}/);
    assert.doesNotMatch(html, /data-phone-form|\/api\/rider-phone/);
    const styleguide = read('src/pages/styleguide.astro');
    assert.match(styleguide, /data-rider-phone-form/);
    assert.match(styleguide, /\/api\/rider-phone/);
    assert.doesNotMatch(read('scripts/build-email-signatures.mjs'), /tel:\+/);
    assert.doesNotMatch(read('public/styleguide/assets/signatures/daniel-s-dj.html'), /tel:\+/);
    assert.doesNotMatch(read('wiki/content/signatures/daniel-s-dj.html'), /tel:\+/);
    assert.doesNotMatch(read('wiki/content/import/email-signaturen/daniel-s-dj.html'), /tel:\+/);
    assert.match(read('src/pages/api/rider-phone.ts'), /RIDER_PHONE_PASSWORD/);
    assert.match(read('src/pages/api/rider-phone.ts'), /RIDER_PHONE_NUMBER/);
    assert.match(read('all-inclusive/.env.example'), /^RIDER_PHONE_NUMBER=$/m);
    assert.match(read('all-inclusive/.env.example'), /^RIDER_PHONE_PASSWORD=$/m);
  });
});

describe('Rider-Gate: Verdrahtung', () => {
  it('private Rider-Dateien existieren außerhalb von public/', () => {
    for (const file of Object.values(RIDER_PRIVATE_FILES)) assert.ok(exists(path.join('private/rider', file)), `fehlt: ${file}`);
    assert.ok(!exists('public/styleguide/assets/rider/scttrd-foh-rider.html'));
    assert.ok(!exists('public/styleguide/assets/rider/scttrd-foh-rider.pdf'));
  });

  it('HTML, PDF und Hospitality liegen hinter dem Anfrageformular', () => {
    assert.deepEqual([...RIDER_GATED].sort(), ['hospitality', 'html', 'pdf']);
    assert.equal(RIDER_FILES.html, '/api/rider-file/html');
    assert.equal(RIDER_FILES.pdf, '/api/rider-file/pdf');
  });

  it('styleguide.astro: erklärt das Anfrage-Gate und bietet alle Unterlagen danach an', () => {
    const src = read('src/pages/styleguide.astro');
    assert.match(src, /action="\/api\/rider-request"/);
    assert.match(src, /name="website"/, 'Honeypot fehlt');
    assert.match(src, /wer die Unterlagen angefragt hat/);
    assert.match(src, /riderUnlocked\s*&&/);
    assert.match(src, /window\.location\.assign\('\/styleguide\/#rider'\)/);
    const links = src.match(/<div class="rider-links">([\s\S]*?)<\/div>/)?.[1] ?? '';
    assert.match(links, /RIDER_FILES\.html/);
    assert.match(links, /RIDER_FILES\.pdf/);
    assert.match(links, /RIDER_FILES\.hospitality/);
    assert.doesNotMatch(src, /href="https:\/\/drive\.google\.com\/drive\/folders\/1R8LF6_T1DeVFs72Bm3O-HAaX2_3jqp45"/, 'Hospitality darf nicht mehr direkt verlinkt sein');
  });

  it('API-Route existiert, schreibt ins CMS und verschickt die Benachrichtigung', () => {
    const src = read('src/pages/api/rider-request.ts');
    const fileRoute = read('src/pages/api/rider-file/[file].ts');
    const mail = read('src/lib/riderMail.ts');
    assert.match(src, /\/api\/rider-requests/);
    assert.match(src, /validateRiderRequest/);
    assert.match(src, /sendRiderNotification/);
    assert.doesNotMatch(src, /files:\s*RIDER_FILES/);
    assert.match(src, /createRiderGateToken/);
    assert.match(fileRoute, /isRiderGateTokenValid/);
    assert.match(fileRoute, /content-disposition.*attachment/i);
    assert.match(mail, /MAIL_RELAY_URL/);
    assert.match(mail, /MAIL_RELAY_SECRET/);
    assert.match(mail, /SMTP_PASSWORD/);
    assert.match(mail, /sendMail/);
    assert.match(mail, /#f00000/);
    assert.match(mail, /connectionTimeout/);
    assert.match(mail, /socketTimeout/);
    assert.match(read('all-inclusive/compose.all.yaml'), /MAIL_RELAY_URL/);
  });

  it('CMS kennt die Collection rider-requests inkl. Migration', () => {
    assert.match(read('cms/src/collections/RiderRequests.ts'), /slug: 'rider-requests'/);
    assert.match(read('cms/src/payload.config.ts'), /RiderRequests/);
    assert.match(read('cms/src/migrations/index.ts'), /add_rider_requests/);
  });

  it('Download-API sperrt ohne Freischalt-Cookie und sendet Attachments', () => {
    const route = read('src/pages/api/rider-file/[file].ts');
    assert.match(route, /isRiderGateTokenValid/);
    assert.match(route, /content-disposition/);
    assert.match(route, /private.*no-store/);
  });
});
