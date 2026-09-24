import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bannerRelease, featuredRelease, releasePhase, releaseSlug, releaseUrl } from '../src/lib/release.ts';

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
});
