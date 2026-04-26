// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // base + outDir combo: files land at dist/series/*, Vercel serves dist/
  // so /series/* maps to the actual built files.
  base: '/series',
  outDir: './dist/series',
  vite: {
    plugins: [tailwindcss()]
  }
});