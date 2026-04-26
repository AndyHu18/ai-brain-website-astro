// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Pages live under src/pages/series/*, so URLs are /series/* naturally.
  // No base/outDir override needed — Vercel serves dist/ at root.
  vite: {
    plugins: [tailwindcss()]
  }
});
