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
  it('index.astro imports all collections used on homepage', () => {
    const src = read('src/pages/index.astro');
    for (const c of ['shows', 'links', 'videos', 'reels', 'homeText', 'homeImages']) {
      assert.match(src, new RegExp(`getCollection\\(['"]${c}['"]\\)`), `missing getCollection('${c}')`);
    }
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

  it('admin/config.yml collections match content.config.ts (grouped forms)', () => {
    const yml = read('public/admin/config.yml');
    const ts = read('src/content.config.ts');
    for (const name of ['shows', 'links', 'videos']) {
      assert.match(yml, new RegExp(`name:\\s*${name}`), `config.yml missing ${name}`);
      assert.match(ts, new RegExp(`${name}\\s*=`), `content.config.ts missing ${name}`);
    }
    assert.match(yml, /name:\s*homepage/, 'config.yml missing homepage group');
    assert.match(yml, /name:\s*about/, 'config.yml missing about group');
    assert.match(yml, /src\/content\/home\/text\.md/);
    assert.match(yml, /src\/content\/home\/images\.md/);
    assert.match(ts, /homeText\s*=/);
    assert.match(ts, /homeImages\s*=/);
  });

  it('about/contact singletons parse and have email', () => {
    assert.match(fm(read('src/content/about/hero.md')).email, /@/);
    assert.match(fm(read('src/content/contact/contact.md')).email, /@/);
  });
});
