// https://astro.build/config
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://scttrd.de',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  redirects: {
    '/other-pages/about.html': '/',
    '/other-pages/contacts.html': '/',
    '/other-pages/meeting-template.html': '/',
    '/webflow-index-reference.html': '/',
  },
  vite: {
    preview: {
      allowedHosts: ['scttrd.de', 'localhost'],
    },
  },
});
