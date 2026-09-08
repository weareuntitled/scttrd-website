const GERMAN_DATE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

export type GermanDate = { year: number; month: number; day: number };

export function parseDate(value: unknown): GermanDate | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(GERMAN_DATE);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function formatDate(value: unknown): string {
  const parsed = parseDate(value);
  return parsed ? `${pad(parsed.day)}.${pad(parsed.month)}.${parsed.year}` : 't.b.a.';
}

export function isoDate(value: unknown): string | null {
  const parsed = parseDate(value);
  return parsed ? `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}` : null;
}

const timeOf = (value: unknown): number => {
  const parsed = parseDate(value);
  return parsed ? Date.UTC(parsed.year, parsed.month - 1, parsed.day) : NaN;
};

const orderOf = (show: any): number =>
  Number.isFinite(Number(show?.data?.order)) ? Number(show.data.order) : 0;

export function compareByDate(a: any, b: any): number {
  const ta = timeOf(a?.data?.date);
  const tb = timeOf(b?.data?.date);
  const aValid = Number.isFinite(ta);
  const bValid = Number.isFinite(tb);
  if (!aValid && !bValid) return orderOf(a) - orderOf(b);
  if (!aValid) return 1;
  if (!bValid) return -1;
  if (ta !== tb) return ta - tb;
  return orderOf(a) - orderOf(b);
}

export function upcoming(shows: any[]): any[] {
  return (shows ?? [])
    .filter((show: any) => show?.data?.status === 'upcoming')
    .sort(compareByDate);
}

export function past(shows: any[]): any[] {
  return (shows ?? [])
    .filter((show: any) => show?.data?.status === 'past')
    .sort((a: any, b: any) => {
      const ta = timeOf(a?.data?.date);
      const tb = timeOf(b?.data?.date);
      const aValid = Number.isFinite(ta);
      const bValid = Number.isFinite(tb);
      if (!aValid && !bValid) return orderOf(a) - orderOf(b);
      if (!aValid) return 1;
      if (!bValid) return -1;
      if (ta !== tb) return (tb as number) - (ta as number);
      return orderOf(a) - orderOf(b);
    });
}

export function orderedUpcoming(shows: any[]): any[] {
  const list = upcoming(shows);
  const next = nextShow(shows);
  if (!next) return list;
  return [next, ...list.filter((show: any) => show !== next)];
}

export function showSlug(venue: unknown, date: unknown): string {
  return `${venue ?? ''}-${date ?? ''}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function showUrl(show: any): string {
  return `/shows/${showSlug(show?.data?.venue, show?.data?.date)}/`;
}

const TICKET_HOSTS = /eventbrite|ra\.co|residentadvisor|tixforgigs|adticket|pretix|starticket|ticket/i;
const YOUTUBE_HOSTS = /youtube\.com|youtu\.be/i;

export type ShowActionKind = 'ticket' | 'video' | 'page' | 'none';
export type ShowAction = { href: string | null; label: string; kind: ShowActionKind };

const LINK_KINDS = ['ticket', 'website', 'video'];

export function showAction(show: any): ShowAction {
  const link = show?.data?.link;
  const status = show?.data?.status;
  if (typeof link !== 'string' || link.length === 0) {
    return status === 'upcoming'
      ? { href: null, label: 'Ticketlink folgt.', kind: 'none' }
      : { href: null, label: 'Veranstaltungsseite ↗', kind: 'none' };
  }
  const explicit = LINK_KINDS.includes(show?.data?.linkKind) ? show.data.linkKind : null;
  const kind: ShowActionKind =
    explicit ?? (YOUTUBE_HOSTS.test(link) ? 'video' : TICKET_HOSTS.test(link) ? 'ticket' : 'page');
  if (kind === 'video') return { href: link, label: 'Video ansehen ↗', kind };
  if (kind === 'ticket') {
    return status === 'upcoming'
      ? { href: link, label: 'Tickets sichern ↗', kind }
      : { href: null, label: 'Veranstaltungsseite ↗', kind: 'none' };
  }
  return status === 'upcoming'
    ? { href: link, label: 'Event & Tickets ↗', kind: 'page' }
    : { href: link, label: 'Veranstaltungsseite ↗', kind: 'page' };
}

const SOCIAL_PLATFORMS = ['spotify', 'soundcloud', 'instagram'];

export function socialNavLinks(links: any[]): { label: string; url: string }[] {
  return (links ?? [])
    .map((link: any) => ({
      label: String(link?.platform ?? link?.data?.label ?? ''),
      url: String(link?.url ?? link?.data?.url ?? ''),
    }))
    .filter((link) => SOCIAL_PLATFORMS.includes(link.label.toLowerCase()) && link.url.length > 0);
}

export function nextShow(shows: any[]): any {
  let selected: any = null;
  let selectedTime = Number.POSITIVE_INFINITY;

  for (const show of shows ?? []) {
    if (show?.data?.status !== 'upcoming') continue;
    const time = timeOf(show.data.date);
    if (!Number.isFinite(time) || time >= selectedTime) continue;
    selected = show;
    selectedTime = time;
  }

  return selected;
}
