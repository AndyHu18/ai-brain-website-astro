// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // No 'base' — static output stays at root paths.
  // Vercel rewrites /series/* → /* in vercel.json.
  redirects: {
    '/': '/series/系列總覽/',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});