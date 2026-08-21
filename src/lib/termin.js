export const toTs = (d) => {
  const m = d.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? Date.parse(`${m[3]}-${m[2]}-${m[1]}`) : NaN;
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
