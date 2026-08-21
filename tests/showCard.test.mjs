import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getInteraction } from '../src/lib/showCard.js';
describe('ShowCard seam', () => {
  it('liefert Webflow-ID für bekannte Indices', () => {
    assert.ok(getInteraction('upcoming', 0)?.item);
    assert.ok(getInteraction('past', 0)?.item);
  });
  it('fällt bei Überlauf auf null (statt {}), kein stiller Hover-Bruch)', () => {
    assert.equal(getInteraction('upcoming', 1), null);
    assert.equal(getInteraction('past', 5), null);
  });
});
