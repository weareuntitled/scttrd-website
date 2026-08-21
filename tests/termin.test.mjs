import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toTs, byDate, upcoming, past } from '../src/lib/termin.js';

const show = (o) => ({ data: o });

describe('Termin', () => {
  it('toTs: deutsches Datum → Timestamp, t.b.a. → NaN', () => {
    assert.ok(Number.isFinite(toTs('21.08.2026')));
    assert.ok(Number.isNaN(toTs('t.b.a.')));
    assert.ok(Number.isNaN(toTs('2026-08-21')));
  });
  it('byDate: neuestes zuerst, ungültiges nach hinten, order-Fallback', () => {
    const a = show({ date: '21.08.2026', order: 2 });
    const b = show({ date: '12.12.2026', order: 1 });
    const c = show({ date: 't.b.a.', order: 5 });
    const d = show({ date: 't.b.a.', order: 1 });
    assert.equal([a, b, c].sort(byDate)[0], b);
    assert.equal([c, d].sort(byDate)[0], d);
    assert.equal([c, a].sort(byDate)[0], a);
  });
  it('upcoming/past: filter + sort via eine Interface', () => {
    const s = [
      show({ status: 'upcoming', date: '21.08.2026', order: 10 }),
      show({ status: 'upcoming', date: '12.12.2026', order: 10 }),
      show({ status: 'past', date: '08.08.2026', order: 10 }),
    ];
    assert.equal(upcoming(s).length, 2);
    assert.equal(upcoming(s)[0].data.date, '12.12.2026');
    assert.equal(past(s).length, 1);
  });
});
