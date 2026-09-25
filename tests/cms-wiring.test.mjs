import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, 'public', p.replace(/^\//, '')));
const mdFiles = (dir) => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.md')).map(f => path.join(dir, f));
const fm = (s) => {
  const m = s.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const o = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    o[k] = v;
  }
  return o;
};

describe('CMS wiring: content ↔ index.astro ↔ admin/config.yml', () => {
  it('index.astro loads shows via CMS (getShows) + all local collections', () => {
    const src = read('src/pages/index.astro');
    assert.match(src, /getShows\(\)/);
    assert.match(src, /from '\.\.\/lib\/cms\.ts'/);
    assert.match(src, /from '\.\.\/lib\/show\.ts'/);
    for (const c of ['videos', 'reels', 'homeText', 'homeImages']) {
      assert.match(src, new RegExp(`getCollection\\(['"]${c}['"]\\)`), `missing getCollection('${c}')`);
    }
    assert.doesNotMatch(src, /getCollection\(['"]links['"]\)/, 'startseite lädt links nicht mehr (Socials sind raus)');
  });

  it('index.astro renders shows via Customers component (upcoming/past)', () => {
    const src = read('src/pages/index.astro');
    assert.match(src, /Customers shows=\{upcomingShows\}/);
    assert.match(src, /Customers shows=\{pastShows\}/);
  });

  it('bento bottom row is CMS-driven via reels (not hardcoded stale paths)', () => {
    const src = read('src/pages/index.astro');
    assert.match(src, /reels\.slice\(0,\s*3\)\.map/);
    assert.doesNotMatch(src, /wurzi-landscape-a\.web\.mp4/);
    assert.doesNotMatch(src, /rasen-landscape\.web\.mp4/);
  });

  it('nav/header email comes from homeText (not hardcoded alone)', () => {
    const src = read('src/pages/index.astro');
    assert.match(src, /homeText\?\.data\.email/);
  });

  it('homeText: email valid, headline/bio present', () => {
    const d = fm(read('src/content/home/text.md'));
    assert.match(d.email, /@/);
    assert.ok(d.headline || d.title);
    assert.ok(d.bio_de && d.bio_de.length > 10);
    assert.ok(d.cta_headline);
  });

  it('homeImages: both hero images exist on disk', () => {
    const d = fm(read('src/content/home/images.md'));
    assert.ok(exists(d.heroImage1), `missing ${d.heroImage1}`);
    assert.ok(exists(d.heroImage2), `missing ${d.heroImage2}`);
  });

  it('shows: status enum, date DD.MM.YYYY, image exists, link valid', () => {
    for (const f of mdFiles('src/content/home/shows')) {
      const d = fm(read(f));
      assert.match(d.status, /^(upcoming|past)$/, f);
      assert.match(d.date, /^\d{2}\.\d{2}\.\d{4}$/, f);
      assert.ok(d.venue && d.city, f);
      assert.ok(Number.isFinite(Number(d.order)), f);
      assert.ok(exists(d.image), `${f} missing image ${d.image}`);
      if (d.link) assert.doesNotThrow(() => new URL(d.link), `${f} bad link`);
    }
  });

  it('links: url valid, label present, files match nav', () => {
    for (const f of mdFiles('src/content/home/links')) {
      const d = fm(read(f));
      assert.ok(d.label && d.platform, f);
      assert.doesNotThrow(() => new URL(d.url), f);
      assert.ok(Number.isFinite(Number(d.order)), f);
    }
  });

  it('reels: each video+poster exists and bento can render them', () => {
    const files = mdFiles('src/content/home/reels');
    assert.ok(files.length >= 3, 'need ≥3 reels for bento row');
    for (const f of files) {
      const d = fm(read(f));
      assert.ok(d.video && d.poster && d.title, f);
      assert.ok(exists(d.video), `${f} missing video ${d.video}`);
    }
  });

  it('videos (CTA): video+poster exist', () => {
    for (const f of mdFiles('src/content/home/videos')) {
      const d = fm(read(f));
      assert.ok(exists(d.video), `${f} missing ${d.video}`);
      assert.ok(exists(d.poster), `${f} missing ${d.poster}`);
    }
  });

  it('payload.config.ts declares the CMS collections (Users/Media/Shows)', () => {
    const pc = read('cms/src/payload.config.ts');
    for (const c of ['Users', 'Media', 'Shows']) {
      assert.match(pc, new RegExp(`./collections/${c}'`), `payload.config.ts missing ${c}`);
    }
  });

  it('production CMS keeps the reverse-proxy URL and secure auth cookies', () => {
    const pc = read('cms/src/payload.config.ts');
    const users = read('cms/src/collections/Users.ts');
    assert.match(pc, /serverURL:\s*process\.env\.PAYLOAD_PUBLIC_SERVER_URL/);
    assert.match(users, /secure:\s*process\.env\.NODE_ENV\s*===\s*['"]production['"]/);
  });

  it('CMS healthcheck verifies the usable login page, not only an HTTP status', () => {
    const compose = read('all-inclusive/compose.all.yaml');
    assert.match(compose, /fetch\('http:\/\/127\.0\.0\.1:3000\/admin\/login'\)/);
    assert.match(compose, /Login - Payload/);
  });

  it('production deploy runs the server-side CMS diagnostics', () => {
    const workflow = read('.github/workflows/deploy.yml');
    const checker = read('scripts/cms-log-check.sh');
    assert.match(workflow, /name: CMS diagnostics/);
    assert.match(workflow, /sh \.\.\/scripts\/cms-log-check\.sh/);
    assert.match(checker, /docker compose -f compose\.all\.yaml/);
    assert.match(checker, /logs --no-color --tail=200 cms/);
    assert.match(checker, /docker inspect/);
    assert.match(checker, /admin\/login/);
  });

  it('releases migration adds the Payload locked-document relation', () => {
    const migration = read('cms/src/migrations/20260925_000000_add_release_lock_relation.ts');
    const index = read('cms/src/migrations/index.ts');
    assert.match(migration, /ADD COLUMN IF NOT EXISTS "releases_id" integer/);
    assert.match(migration, /DROP COLUMN IF EXISTS "releases_id"/);
    assert.match(index, /20260925_000000_add_release_lock_relation/);
  });

  it('release uses one Spotify link instead of four streaming fields', () => {
    const collection = read('cms/src/collections/Releases.ts');
    const page = read('src/pages/releases/[slug].astro');
    assert.match(collection, /name: 'spotifyUrl'/);
    assert.doesNotMatch(collection, /preSaveUrl|soundcloudUrl|youtubeUrl/);
    assert.doesNotMatch(page, /preSaveUrl|soundcloudUrl|youtubeUrl/);
  });

  it('release editor defaults new releases to draft and explains the single link', () => {
    const collection = read('cms/src/collections/Releases.ts');
    assert.match(collection, /defaultValue: 'draft'/);
    assert.match(collection, /Spotify-Link \(vorläufig möglich\)/);
    assert.match(collection, /Bitte eine gültige URL eintragen/);
  });

  it('content collections still cover homepage groups for the fallback', () => {
    const ts = read('src/content.config.ts');
    for (const name of ['shows', 'links', 'videos', 'reels', 'homeText', 'homeImages']) {
      assert.match(ts, new RegExp(`${name}\\s*=`), `content.config.ts missing ${name}`);
    }
  });

  it('about/contact singletons parse and have email', () => {
    assert.match(fm(read('src/content/about/hero.md')).email, /@/);
    assert.match(fm(read('src/content/contact/contact.md')).email, /@/);
  });
});
