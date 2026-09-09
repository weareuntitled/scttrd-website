import type { APIRoute } from 'astro';
import { getShows } from '../lib/cms.ts';
import { showUrl } from '../lib/show.ts';

const siteUrl = 'https://scttrd.de';

const escapeXml = (value: string): string =>
  value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] ?? character);

export const GET: APIRoute = async () => {
  const shows = (await getShows()) as any[];
  const paths = ['/', '/links/', '/gallery/', ...shows.map((show) => showUrl(show))];
  const uniquePaths = [...new Set(paths)];
  const urls = uniquePaths
    .map((path) => `  <url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
