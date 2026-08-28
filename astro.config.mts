// @ts-check
import { defineConfig } from 'astro/config';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  server: {
      port: 10721
  },
  integrations: [],
  adapter: netlify()
});