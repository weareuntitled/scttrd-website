import type { APIRoute } from 'astro';
import { getNews, getReleases, getShows } from '../lib/cms.ts';
import { showUrl } from '../lib/show.ts';
import { releaseUrl } from '../lib/release.ts';
import { newsUrl } from '../lib/news.ts';
import { renderSitemap } from '../lib/seo.ts';

const siteUrl = 'https://scttrd.de';

export const GET: APIRoute = async () => {
  const [shows, releases, news] = await Promise.all([getShows(), getReleases(), getNews()]) as any[][];
  const staticPaths = ['/', '/links/', '/gallery/', '/styleguide/', '/news/'];
  const entries = [
    ...staticPaths.map((path) => ({ loc: `${siteUrl}${path}` })),
    ...shows.map((show) => ({ loc: `${siteUrl}${showUrl(show)}`, lastmod: show.updatedAt })),
    ...releases.map((release) => ({ loc: `${siteUrl}${releaseUrl(release)}`, lastmod: release.updatedAt })),
    ...news.map((article) => ({ loc: `${siteUrl}${newsUrl(article)}`, lastmod: article.updatedAt })),
  ];
  const seen = new Set<string>();
  const unique = entries.filter((entry) => (seen.has(entry.loc) ? false : (seen.add(entry.loc), true)));

  return new Response(renderSitemap(unique), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
