import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// Ein Postfach versorgt Website, CMS und Wiki. Die Dienste erwarten aber
// unterschiedliche Variablennamen — das darf nicht auseinanderlaufen.
describe('Mail: CMS (Passwort-Zurücksetzen)', () => {
  const config = read('cms/src/payload.config.ts');

  it('nutzt den Nodemailer-Adapter nur bei gesetztem SMTP_HOST', () => {
    assert.match(config, /nodemailerAdapter/);
    assert.match(config, /process\.env\.SMTP_HOST\s*\?/);
    assert.match(config, /\.\.\.\(email \? \{ email \} : \{\}\)/, 'ohne SMTP darf kein email-Key gesetzt werden');
  });

  it('akzeptiert SMTP_USER und SMTP_USERNAME', () => {
    assert.match(config, /process\.env\.SMTP_USER \|\| process\.env\.SMTP_USERNAME/);
  });

  it('schaltet SSL nur bei Port 465 ein', () => {
    assert.match(config, /secure: smtpPort === 465/);
    assert.match(config, /Number\(process\.env\.SMTP_PORT\) \|\| 587/);
  });

  it('ist als Abhängigkeit deklariert', () => {
    assert.match(read('cms/package.json'), /"@payloadcms\/email-nodemailer"/);
    assert.match(read('cms/package-lock.json'), /node_modules\/@payloadcms\/email-nodemailer/);
  });
});

describe('Mail: Compose reicht SMTP an alle Dienste durch', () => {
  const compose = read('all-inclusive/compose.all.yaml');
  const block = (name) => compose.split(`  ${name}:`)[1]?.split('\n  #')[0] ?? '';

  it('Website bekommt Host, Benutzer und Empfänger', () => {
    const web = block('web');
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'RIDER_MAIL_TO']) {
      assert.match(web, new RegExp(key), `web fehlt ${key}`);
    }
  });

  it('CMS bekommt dieselben Zugangsdaten', () => {
    const cms = block('cms');
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM_ADDRESS']) {
      assert.match(cms, new RegExp(key), `cms fehlt ${key}`);
    }
  });

  it('Wiki bekommt SMTP_USERNAME und MAIL_DRIVER, wie Docmost es erwartet', () => {
    const docmost = block('docmost');
    assert.match(docmost, /MAIL_DRIVER: \$\{MAIL_DRIVER:-smtp\}/);
    assert.match(docmost, /SMTP_USERNAME: \$\{SMTP_USER:/, 'Docmost muss denselben Benutzer wie die Website nutzen');
    assert.match(docmost, /SMTP_SECURE/);
    assert.match(docmost, /SMTP_PASSWORD/);
  });

  it('nutzt überall denselben Port-Standard 587', () => {
    const ports = compose.match(/SMTP_PORT: \$\{SMTP_PORT:-(\d+)\}/g) ?? [];
    assert.equal(ports.length, 3, 'alle drei Dienste brauchen SMTP_PORT');
    assert.ok(ports.every((p) => p.includes('587')), `uneinheitliche Ports: ${ports.join(', ')}`);
  });
});

describe('Mail: Dokumentation', () => {
  const env = read('all-inclusive/.env.example');

  it('listet alle nötigen Variablen', () => {
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM_ADDRESS', 'MAIL_FROM_NAME', 'RIDER_MAIL_TO']) {
      assert.match(env, new RegExp(`^${key}=`, 'm'), `fehlt: ${key}`);
    }
  });

  it('enthält kein echtes Passwort und warnt vor Port 993', () => {
    assert.match(env, /^SMTP_PASSWORD=change-me/m);
    assert.match(env, /993/, 'Hinweis auf IMAP-Port fehlt');
  });
});
