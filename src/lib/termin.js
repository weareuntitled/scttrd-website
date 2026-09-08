import { parseDate } from './show.ts';

// Shim: identische Semantik wie bisher, Implementierung aus dem Show-Hub.
export const toTs = (d) => {
  const parsed = parseDate(d);
  return parsed ? Date.UTC(parsed.year, parsed.month - 1, parsed.day) : NaN;
};

export const byDate = (a, b) => {
  const pa = toTs(a.data.date);
  const pb = toTs(b.data.date);
  if (Number.isNaN(pa) && Number.isNaN(pb)) return a.data.order - b.data.order;
  if (Number.isNaN(pa)) return 1;
  if (Number.isNaN(pb)) return -1;
  return pb - pa;
};

export const upcoming = (shows) =>
  shows.filter((s) => s.data.status === 'upcoming').sort(byDate);

export const past = (shows) =>
  shows.filter((s) => s.data.status === 'past').sort(byDate);
