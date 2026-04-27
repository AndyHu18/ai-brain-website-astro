# Cloudflare Pages Deploy Settings

Connect this repo at https://dash.cloudflare.com/?to=/:account/pages and use:

| Setting                | Value                 |
| ---------------------- | --------------------- |
| Production branch      | `master`              |
| Build command          | `npm run build`       |
| Build output directory | `dist`                |
| Root directory         | `/`                   |
| Node version env var   | `NODE_VERSION` = `20` |

No environment variables required for the website itself — API keys are only used by `gen-*.mjs` scripts run locally to generate content, not by the deployed site.

## Custom domain

Add your domain in Pages → Custom domains. Cloudflare auto-provisions SSL.

## CLI deploy alternative

```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=ai-brain-astro
```
