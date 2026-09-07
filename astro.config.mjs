// https://astro.build/config
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://scttrd.de',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    preview: {
      allowedHosts: ['scttrd.de', 'localhost'],
    },
  },
});
