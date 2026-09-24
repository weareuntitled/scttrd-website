const DAY = 86_400_000;

const dataOf = (release: any) => release?.data ?? release;
const timeOf = (release: any) => Date.parse(dataOf(release)?.releaseDate ?? '');

export function releaseSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function releaseUrl(release: any): string {
  const data = dataOf(release);
  return `/releases/${data.slug || releaseSlug(data.title)}/`;
}

export function releasePhase(release: any, now = new Date()): 'upcoming' | 'released' {
  return timeOf(release) > now.getTime() ? 'upcoming' : 'released';
}

export function featuredRelease(releases: any[], now = new Date()): any | null {
  const valid = releases.filter((release) => Number.isFinite(timeOf(release)));
  const upcoming = valid
    .filter((release) => timeOf(release) > now.getTime())
    .sort((a, b) => timeOf(a) - timeOf(b));
  if (upcoming.length) return upcoming[0];
  return valid.sort((a, b) => timeOf(b) - timeOf(a))[0] ?? null;
}

export function bannerRelease(releases: any[], now = new Date()): any | null {
  const release = featuredRelease(releases, now);
  const data = dataOf(release);
  if (!release || data.bannerEnabled === false) return null;
  if (releasePhase(release, now) === 'upcoming') return release;
  const duration = Number(data.bannerDurationDays) || 28;
  return now.getTime() < timeOf(release) + duration * DAY ? release : null;
}

export function releaseDateLabel(release: any): string {
  const timestamp = timeOf(release);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(timestamp)
    : '';
}
