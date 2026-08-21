import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BENTO_HARDCODED, bentoBottom, bentoTiles } from '../src/lib/bento.js';
const reel = (id, video, title) => ({ id, data: { video, title } });
describe('Bento', () => {
  it('hardcoded Adapter dokumentiert (3 Kuratierte oben)', () => {
    assert.equal(BENTO_HARDCODED.length, 3);
    assert.ok(BENTO_HARDCODED[0].video.includes('radio-rudina'));
  });
  it('bottom 3 aus CMS, Rest wird gedroppt', () => {
    const reels = [1,2,3,4].map(i => reel(String(i), `/v${i}.mp4`, `R${i}`));
    assert.equal(bentoBottom(reels).length, 3);
    assert.equal(bentoTiles(reels).length, 6);
  });
});
