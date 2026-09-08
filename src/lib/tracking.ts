import { showAction } from './show.ts';

export type TrackingSource = 'linkhub' | 'homepage';
export type TrackingMedium = 'show-card' | 'ticket-button';

export function withTracking(
  href: string,
  opts: { source: TrackingSource | string; medium: TrackingMedium | string }
): string {
  const [base, hash] = href.split('#');
  const separator = base.includes('?') ? '&' : '?';
  const params = `utm_source=${encodeURIComponent(String(opts.source).toLowerCase())}&utm_medium=${encodeURIComponent(String(opts.medium).toLowerCase())}`;
  return `${base}${separator}${params}${hash !== undefined ? `#${hash}` : ''}`;
}

export function trackedTicketUrl(
  show: any,
  opts: { source: TrackingSource | string; medium: TrackingMedium | string }
): string | null {
  const action = showAction(show);
  if (action.kind !== 'ticket' || !action.href) return null;
  return withTracking(action.href, opts);
}
