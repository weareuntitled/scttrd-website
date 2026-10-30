import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bannerRelease, featuredRelease, releaseLink, releasePhase, releaseSlug, releaseUrl, spotifyAppLink } from '../src/lib/release.ts';

const release = (title, releaseDate, extra = {}) => ({ title, slug: releaseSlug(title), releaseDate, ...extra });
const now = new Date('2026-10-01T12:00:00Z');

describe('Release-Auswahl', () => {
  it('zeigt den nächsten angekündigten Track und wechselt am Releasetag auf released', () => {
    const old = release('Alter Track', '2026-09-01T00:00:00Z');
    const next = release('Wo du bist', '2026-10-17T00:00:00Z');
    assert.equal(featuredRelease([old, next], now), next);
    assert.equal(releasePhase(next, now), 'upcoming');
    assert.equal(releasePhase(next, new Date('2026-10-17T00:00:00Z')), 'released');
    assert.equal(releaseUrl(next), '/releases/wo-du-bist/');
  });

  it('beendet das Banner standardmäßig 28 Tage nach Release', () => {
    const item = release('Wo du bist', '2026-09-15T00:00:00Z', { bannerEnabled: true });
    assert.equal(bannerRelease([item], new Date('2026-10-12T23:59:59Z')), item);
    assert.equal(bannerRelease([item], new Date('2026-10-13T00:00:00Z')), null);
  });

  it('respektiert deaktivierte und individuell verlängerte Banner', () => {
    const off = release('Aus', '2026-10-17T00:00:00Z', { bannerEnabled: false });
    const long = release('Lang', '2026-09-01T00:00:00Z', { bannerDurationDays: 60 });
    assert.equal(bannerRelease([off], now), null);
    assert.equal(bannerRelease([long], now), long);
  });

  it('verlinkt den Linkhub ab Releasetag direkt auf Spotify, davor auf die Release-Seite', () => {
    const spotifyUrl = 'https://open.spotify.com/album/abc';
    const item = release('Wo du bist', '2026-10-17T00:00:00Z', { spotifyUrl });
    assert.deepEqual(releaseLink(item, now), { href: '/releases/wo-du-bist/', external: false, label: 'Release ansehen' });
    assert.deepEqual(releaseLink(item, new Date('2026-10-17T00:00:00Z')), { href: spotifyUrl, external: true, label: 'Auf Spotify anhören' });
  });

  describe('Weiterleitung in die Spotify-App', () => {
    const url = 'https://open.spotify.com/intl-de/album/abc123?si=xyz';
    const instagramIos = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Instagram 350.0.0';
    const facebookIos = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0]';
    const safariIos = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1';
    const instagramAndroid = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130.0 Mobile Instagram 350.0.0';
    const desktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0 Safari/537.36';

    it('öffnet aus Instagram und Facebook auf iOS das spotify-Schema', () => {
      assert.equal(spotifyAppLink(url, instagramIos), 'spotify://album/abc123?play=1');
      assert.equal(spotifyAppLink(url, facebookIos), 'spotify://album/abc123?play=1');
    });

    it('nutzt auf Android den Intent mit Fallback auf den Web-Link', () => {
      assert.equal(
        spotifyAppLink(url, instagramAndroid),
        'intent://album/abc123?play=1#Intent;scheme=spotify;package=com.spotify.music;S.browser_fallback_url=https%3A%2F%2Fopen.spotify.com%2Falbum%2Fabc123%3Fplay%3D1;end',
      );
    });

    it('überlässt Safari, Desktop und Nicht-Spotify-Links dem normalen Link', () => {
      assert.equal(spotifyAppLink(url, safariIos), null);
      assert.equal(spotifyAppLink(url, desktop), null);
      assert.equal(spotifyAppLink('https://distrokid.com/hyperfollow/scttrd/wo-du-bist', instagramIos), null);
    });
  });

  it('bleibt nach dem Release ohne Spotify-Link auf der Release-Seite', () => {
    const item = release('Wo du bist', '2026-09-01T00:00:00Z');
    assert.deepEqual(releaseLink(item, now), { href: '/releases/wo-du-bist/', external: false, label: 'Release ansehen' });
  });
});
