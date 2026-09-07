// https://astro.build/config
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://scttrd.de',
  output: 'static',
  vite: {
    preview: {
      allowedHosts: ['scttrd.de', 'localhost'],
    },
  },
});
