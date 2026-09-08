import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nextShow, parseDate, formatDate, isoDate, compareByDate, upcoming, past, orderedUpcoming, showSlug, showUrl, showAction, socialNavLinks, adjacentShows } from '../src/lib/show.ts';

const show = (o) => ({ data: o });

describe('Show-Hub Tracer', () => {
  it('nextShow: früheste gültige Upcoming-Show, t.b.a. wird ignoriert', () => {
    const shows = [
      show({ status: 'upcoming', date: '12.12.2026', order: 10 }),
      show({ status: 'upcoming', date: '21.08.2026', order: 10 }),
      show({ status: 'upcoming', date: 't.b.a.', order: 1 }),
      show({ status: 'past', date: '08.08.2026', order: 10 }),
    ];

    assert.equal(nextShow(shows)?.data.date, '21.08.2026');
  });

  it('nextShow: null ohne gültige Upcoming-Show', () => {
    assert.equal(nextShow([]), null);
    assert.equal(
      nextShow([show({ status: 'upcoming', date: 't.b.a.', order: 1 })]),
      null
    );
  });
});

describe('Show-Hub Datumskern', () => {
  it('parseDate: DD.MM.YYYY → Datum, t.b.a./falsches Format → null', () => {
    assert.deepEqual(parseDate('21.08.2026'), { year: 2026, month: 8, day: 21 });
    assert.equal(parseDate('t.b.a.'), null);
    assert.equal(parseDate('2026-08-21'), null);
    assert.equal(parseDate('31.02.2026'), null);
  });

  it('formatDate/isoDate: kanonisch deutsch bzw. ISO, ungültig → t.b.a./null', () => {
    assert.equal(formatDate('21.08.2026'), '21.08.2026');
    assert.equal(formatDate('t.b.a.'), 't.b.a.');
    assert.equal(isoDate('21.08.2026'), '2026-08-21');
    assert.equal(isoDate('t.b.a.'), null);
  });

  it('compareByDate: früheste zuerst, ungültige hinten, order-Fallback', () => {
    const a = show({ date: '21.08.2026', order: 2 });
    const b = show({ date: '12.12.2026', order: 1 });
    const c = show({ date: 't.b.a.', order: 5 });
    const d = show({ date: 't.b.a.', order: 1 });
    assert.ok(compareByDate(a, b) < 0);
    assert.ok(compareByDate(b, a) > 0);
    assert.ok(compareByDate(a, c) < 0);
    assert.ok(compareByDate(c, a) > 0);
    assert.ok(compareByDate(d, c) < 0);
  });
});

describe('Show-Hub Auswahl', () => {
  it('upcoming: nur upcoming, früheste zuerst, t.b.a. hinten via order', () => {
    const shows = [
      show({ status: 'upcoming', date: '12.12.2026', order: 10 }),
      show({ status: 'past', date: '08.08.2026', order: 10 }),
      show({ status: 'upcoming', date: '21.08.2026', order: 10 }),
      show({ status: 'upcoming', date: 't.b.a.', order: 5 }),
      show({ status: 'upcoming', date: 't.b.a.', order: 1 }),
    ];
    const list = upcoming(shows);
    assert.deepEqual(
      list.map((s) => s.data.date),
      ['21.08.2026', '12.12.2026', 't.b.a.', 't.b.a.']
    );
    assert.deepEqual(
      list.filter((s) => s.data.date === 't.b.a.').map((s) => s.data.order),
      [1, 5]
    );
  });

  it('past: nur past, neueste zuerst', () => {
    const shows = [
      show({ status: 'past', date: '01.08.2025', order: 10 }),
      show({ status: 'upcoming', date: '21.08.2026', order: 10 }),
      show({ status: 'past', date: '06.12.2025', order: 10 }),
    ];
    assert.deepEqual(
      past(shows).map((s) => s.data.date),
      ['06.12.2025', '01.08.2025']
    );
  });

  it('orderedUpcoming: NEXT zuerst, identisch mit nextShow()', () => {
    const shows = [
      show({ status: 'upcoming', date: '12.12.2026', order: 10 }),
      show({ status: 'upcoming', date: '21.08.2026', order: 10 }),
      show({ status: 'upcoming', date: 't.b.a.', order: 1 }),
    ];
    const ordered = orderedUpcoming(shows);
    assert.equal(ordered[0], nextShow(shows));
    assert.equal(ordered[0].data.date, '21.08.2026');
    assert.equal(ordered.length, 3);
  });

  it('orderedUpcoming: ohne gültige Show kein Pin, t.b.a. bleibt sortiert', () => {
    const shows = [show({ status: 'upcoming', date: 't.b.a.', order: 1 })];
    assert.deepEqual(orderedUpcoming(shows), shows);
    assert.equal(nextShow(shows), null);
  });
});

describe('Show-Hub Identität', () => {
  it('showSlug: stabil über Umlaute, Satzzeichen, Datum', () => {
    assert.equal(showSlug('Kulturhaus Milbertshofen', '06.12.2025'), 'kulturhaus-milbertshofen-06-12-2025');
    assert.equal(showSlug('  Wurzelknorken3000!! ', '08.08.2026'), 'wurzelknorken3000-08-08-2026');
    assert.equal(showSlug('2h live @Kontrast Festival', '02.08.2024'), '2h-live-kontrast-festival-02-08-2024');
  });

  it('showUrl: einzige Stelle für das /shows/-Template', () => {
    const s = show({ venue: 'singoldsand', date: '21.08.2026' });
    assert.equal(showUrl(s), '/shows/singoldsand-21-08-2026/');
  });

  it('showAction: Labels nach DESIGN.md (Ticket/Video/Seite/folgt)', () => {
    const ticket = show({ status: 'upcoming', venue: 'K', city: 'M', date: '06.12.2025', link: 'https://www.eventbrite.de/e/x-tickets-1' });
    assert.deepEqual(showAction(ticket), { href: ticket.data.link, label: 'Tickets sichern ↗', kind: 'ticket' });
    const event = show({ status: 'upcoming', venue: 'T', city: 'A', date: '12.12.2026', link: 'https://www.instagram.com/techno_punsch/' });
    assert.deepEqual(showAction(event), { href: event.data.link, label: 'Event & Tickets ↗', kind: 'page' });
    const waiting = show({ status: 'upcoming', venue: 'W', city: 'A', date: 't.b.a.', order: 1 });
    assert.deepEqual(showAction(waiting), { href: null, label: 'Ticketlink folgt.', kind: 'none' });
    const video = show({ status: 'past', venue: 'R', city: 'V', date: '01.08.2025', link: 'https://www.youtube.com/watch?v=x' });
    assert.deepEqual(showAction(video), { href: video.data.link, label: 'Video ansehen ↗', kind: 'video' });
    const page = show({ status: 'past', venue: 'K', city: 'A', date: '02.08.2024', link: 'https://www.instagram.com/kontrastfestival.archive/' });
    assert.deepEqual(showAction(page), { href: page.data.link, label: 'Veranstaltungsseite ↗', kind: 'page' });
  });

  it('showAction: explizites linkKind schlägt Regex, Past-Tickets werden unterdrückt', () => {
    const explicit = show({ status: 'upcoming', venue: 'T', date: '12.12.2026', link: 'https://www.instagram.com/techno_punsch/', linkKind: 'ticket' });
    assert.deepEqual(showAction(explicit), { href: explicit.data.link, label: 'Tickets sichern ↗', kind: 'ticket' });
    const explicitPage = show({ status: 'upcoming', venue: 'S', date: '21.08.2026', link: 'https://tickets.example.com/x', linkKind: 'website' });
    assert.deepEqual(showAction(explicitPage), { href: explicitPage.data.link, label: 'Event & Tickets ↗', kind: 'page' });
    const dead = show({ status: 'past', venue: 'K', date: '06.12.2025', link: 'https://www.eventbrite.de/e/x-tickets-1' });
    assert.deepEqual(showAction(dead), { href: null, label: 'Veranstaltungsseite ↗', kind: 'none' });
    const deadExplicit = show({ status: 'past', venue: 'K', date: '06.12.2025', link: 'https://www.eventbrite.de/e/x-tickets-1', linkKind: 'ticket' });
    assert.deepEqual(showAction(deadExplicit), { href: null, label: 'Veranstaltungsseite ↗', kind: 'none' });
  });
});

describe('Show-Hub Verlinkung', () => {
  it('adjacentShows: prev = frühere, next = spätere Show (nur gültige Daten)', () => {
    const a = show({ status: 'past', date: '06.08.2023', order: 10 });
    const b = show({ status: 'past', date: '06.12.2025', order: 10 });
    const c = show({ status: 'upcoming', date: '17.10.2026', order: 10 });
    const d = show({ status: 'upcoming', date: '12.12.2026', order: 10 });
    const tba = show({ status: 'upcoming', date: 't.b.a.', order: 1 });
    const all = [c, tba, a, d, b];

    assert.equal(adjacentShows(all, c).prev, b);
    assert.equal(adjacentShows(all, c).next, d);
    assert.equal(adjacentShows(all, a).prev, null);
    assert.equal(adjacentShows(all, d).next, null);
  });

  it('adjacentShows: unbekannte Show / leere Liste → prev+next null', () => {
    const s = show({ status: 'upcoming', date: '17.10.2026', order: 10 });
    assert.deepEqual(adjacentShows([], s), { prev: null, next: null });
    assert.deepEqual(adjacentShows([show({ status: 'past', date: '06.12.2025', order: 10 })], s), { prev: null, next: null });
  });
});

describe('Show-Hub Navigation', () => {
  it('socialNavLinks: eine Schreibweise für CMS- und Collection-Form', () => {
    const links = [
      { platform: 'Spotify', url: 'https://open.spotify.com/x' },
      { data: { label: 'soundcloud', url: 'https://soundcloud.com/x' } },
      { platform: 'YouTube', url: 'https://youtube.com/x' },
      { platform: 'Instagram', url: '' },
    ];
    assert.deepEqual(socialNavLinks(links), [
      { label: 'Spotify', url: 'https://open.spotify.com/x' },
      { label: 'soundcloud', url: 'https://soundcloud.com/x' },
    ]);
  });
});
