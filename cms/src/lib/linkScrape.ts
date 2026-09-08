// Eigenständige Kopie von src/lib/linkScrape.ts (Website).
// Grund: Der CMS-Docker-Build hat nur cms/ als Context — kein Cross-Package-Import möglich.
// Bei Änderungen hier bitte auch dort spiegeln (und umgekehrt).
export type ScrapedPlatform = 'spotify' | 'soundcloud' | 'youtube' | 'instagram' | 'tiktok' | 'web';
export type ScrapedLink = { title: string; cover: string; platform: ScrapedPlatform };

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

export function detectPlatform(url: string): ScrapedPlatform {
  const host = hostOf(url);
  if (host === 'open.spotify.com' || host === 'spotify.com') return 'spotify';
  if (host === 'soundcloud.com') return 'soundcloud';
  if (host === 'youtube.com' || host === 'youtu.be') return 'youtube';
  if (host === 'instagram.com') return 'instagram';
  if (host === 'tiktok.com') return 'tiktok';
  return 'web';
}

const oembedUrl = (url: string): string | null => {
  const enc = encodeURIComponent(url);
  switch (detectPlatform(url)) {
    case 'spotify':
      return `https://open.spotify.com/oembed?url=${enc}`;
    case 'soundcloud':
      return `https://soundcloud.com/oembed?format=json&url=${enc}`;
    case 'youtube':
      return `https://www.youtube.com/oembed?url=${enc}&format=json`;
    default:
      return null;
  }
};

const metaContent = (html: string, property: string): string => {
  const match = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  ) ?? html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
  );
  return match?.[1] ?? '';
};

export async function scrapeLink(
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<ScrapedLink | null> {
  const platform = detectPlatform(url);
  try {
    const endpoint = oembedUrl(url);
    if (endpoint) {
      const response = await fetchImpl(endpoint, { signal: AbortSignal.timeout(3000) } as any);
      if (response.ok) {
        const data = (await response.json()) as any;
        if (data?.title) {
          return { title: String(data.title), cover: String(data.thumbnail_url ?? ''), platform };
        }
      }
    }
    const page = await fetchImpl(url, {
      signal: AbortSignal.timeout(3000) as any,
      headers: { accept: 'text/html' },
    } as any);
    if (!page.ok) return null;
    const html = await page.text();
    const title = metaContent(html, 'og:title');
    if (!title) return null;
    return { title, cover: metaContent(html, 'og:image'), platform };
  } catch {
    return null;
  }
}

export function applyScrapedLink(
  data: { label?: string; platform?: string; cover?: string; scrapedAt?: string },
  scraped: ScrapedLink | null
): { label?: string; platform?: string; cover?: string; scrapedAt?: string } {
  if (!scraped) return { ...data };
  const next = { ...data };
  if (!next.label?.trim() && scraped.title) next.label = scraped.title;
  if ((!next.platform || next.platform === 'other') && scraped.platform !== 'web') {
    next.platform = scraped.platform;
  }
  if (!next.cover?.trim() && scraped.cover) next.cover = scraped.cover;
  next.scrapedAt = new Date().toISOString();
  return next;
}
