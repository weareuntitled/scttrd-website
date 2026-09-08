import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, scrapeLink, applyScrapedLink } from '../src/lib/linkScrape.ts';

const ok = (json, contentType = 'application/json') => ({
  ok: true,
  headers: { get: () => contentType },
  json: async () => json,
  text: async () => (typeof json === 'string' ? json : JSON.stringify(json)),
});
const fail = () => ({ ok: false, status: 404, json: async () => ({}), text: async () => '' });

describe('Link-Scrape', () => {
  it('detectPlatform: Host → Plattform, unbekannt → web', () => {
    assert.equal(detectPlatform('https://open.spotify.com/track/x'), 'spotify');
    assert.equal(detectPlatform('https://soundcloud.com/scttrd/x'), 'soundcloud');
    assert.equal(detectPlatform('https://youtu.be/x'), 'youtube');
    assert.equal(detectPlatform('https://www.instagram.com/scttrd_ofc/'), 'instagram');
    assert.equal(detectPlatform('https://example.com/seite'), 'web');
  });

  it('scrapeLink: Spotify-oEmbed liefert Titel + Cover + Typ', async () => {
    const fake = async () => ok({ title: 'Track A', thumbnail_url: 'https://cover.example/a.jpg' });
    assert.deepEqual(await scrapeLink('https://open.spotify.com/track/x', fake), {
      title: 'Track A',
      cover: 'https://cover.example/a.jpg',
      platform: 'spotify',
    });
  });

  it('scrapeLink: OpenGraph-Fallback wenn kein oEmbed', async () => {
    const html = '<meta property="og:title" content="Seite T"><meta property="og:image" content="https://img.example/t.jpg">';
    const fake = async (url) => (String(url).includes('oembed') ? fail() : ok(html, 'text/html'));
    assert.deepEqual(await scrapeLink('https://example.com/seite', fake), {
      title: 'Seite T',
      cover: 'https://img.example/t.jpg',
      platform: 'web',
    });
  });

  it('scrapeLink: null bei Fehler, nie throw', async () => {
    assert.equal(await scrapeLink('https://example.com/x', async () => fail()), null);
    assert.equal(
      await scrapeLink('https://example.com/x', async () => { throw new Error('down'); }),
      null
    );
  });

  it('applyScrapedLink: füllt nur leere Felder, Hand-Eingabe gewinnt', () => {
    const scraped = { title: 'Track A', cover: 'https://cover.example/a.jpg', platform: 'spotify' };
    const filled = applyScrapedLink({ label: '', platform: 'other' }, scraped);
    assert.equal(filled.label, 'Track A');
    assert.equal(filled.platform, 'spotify');
    assert.equal(filled.cover, 'https://cover.example/a.jpg');
    assert.ok(typeof filled.scrapedAt === 'string');
    const kept = applyScrapedLink({ label: 'Mein Titel', platform: 'instagram', cover: 'https://mine.example/c.jpg' }, scraped);
    assert.equal(kept.label, 'Mein Titel');
    assert.equal(kept.platform, 'instagram');
    assert.equal(kept.cover, 'https://mine.example/c.jpg');
    assert.deepEqual(applyScrapedLink({ label: 'x', platform: 'other' }, null), {
      label: 'x',
      platform: 'other',
    });
  });
});
