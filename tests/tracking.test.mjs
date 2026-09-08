import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withTracking, trackedTicketUrl } from '../src/lib/tracking.ts';

const show = (o) => ({ data: o });

describe('Tracking', () => {
  it('withTracking: hängt UTM an, erhält Query+Hash, normalisiert klein', () => {
    assert.equal(
      withTracking('https://tickets.example.com/x', { source: 'linkhub', medium: 'show-card' }),
      'https://tickets.example.com/x?utm_source=linkhub&utm_medium=show-card'
    );
    assert.equal(
      withTracking('https://tickets.example.com/x?foo=1#top', { source: 'Homepage', medium: 'Ticket-Button' }),
      'https://tickets.example.com/x?foo=1&utm_source=homepage&utm_medium=ticket-button#top'
    );
  });

  it('trackedTicketUrl: nur kind=ticket bekommt UTM, sonst null', () => {
    const ticket = show({ status: 'upcoming', venue: 'K', date: '06.12.2025', link: 'https://www.eventbrite.de/e/x' });
    assert.equal(
      trackedTicketUrl(ticket, { source: 'linkhub', medium: 'show-card' }),
      'https://www.eventbrite.de/e/x?utm_source=linkhub&utm_medium=show-card'
    );
    const page = show({ status: 'upcoming', venue: 'T', date: '12.12.2026', link: 'https://www.instagram.com/techno_punsch/' });
    assert.equal(trackedTicketUrl(page, { source: 'linkhub', medium: 'show-card' }), null);
    const waiting = show({ status: 'upcoming', venue: 'W', date: 't.b.a.', order: 1 });
    assert.equal(trackedTicketUrl(waiting, { source: 'homepage', medium: 'ticket-button' }), null);
  });
});
