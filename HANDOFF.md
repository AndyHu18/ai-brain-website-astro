# AI 智能大腦 — 12 篇系列 Astro 站 · Handoff

最後更新：2026-04-26 by Claude Code session

---

## 🌐 線上 / 部署

| 項目 | 連結 |
|------|------|
| **正式站** | https://ai-brain-website.vercel.app |
| 系列總覽（首頁 redirect 到此）| https://ai-brain-website.vercel.app/系列總覽/ |
| 文章範例 | https://ai-brain-website.vercel.app/articles/retention/ |
| GitHub repo | https://github.com/AndyHu18/ai-brain-website-astro |
| Vercel project | `ai-brain-website`（renamed from `ai-brain-website-astro`）|
| Vercel team ID | `team_ymsxuSPl43kbRZdvT5JRIWNN` |
| Vercel project ID | `prj_aJ3c6pXF7UULpJbhwr1PuTKp3xqc` |

**部署機制**：
- GitHub `master` push → Vercel auto-deploy（已綁定）
- `npx vercel deploy` 也可手動觸發
- alias 主網域命令：`npx vercel alias set <new-deploy-url> ai-brain-website.vercel.app`
  （主網域有時不會自動跟著最新 deploy，需手動 alias）
- 舊版備援專案：`ai-brain-website-legacy`（沒刪，可隨時切回）

---

## 📂 專案位置

| 用途 | 路徑 |
|------|------|
| **新站源碼（Astro）** | `C:/Users/user/Desktop/ai-brain-astro/` |
| **舊站源碼**（純 HTML，已下架但保留）| `C:/Users/user/Desktop/Claude code/ai-brain-deploy/` |
| 原始專案（reference）| `C:/Users/user/Desktop/專案_程式/ai-brain-website/` |
| Word docx 來源 | `C:/Users/user/Desktop/系列總覽.docx` |

---

## 🏗️ 技術棧

```
Astro 6.1.9
TypeScript (strict)
Tailwind CSS v4 (@tailwindcss/vite)
@tailwindcss/typography
cheerio + turndown（內容抽取，僅 build-time 用）
```

**Build / Dev**：
```bash
cd C:/Users/user/Desktop/ai-brain-astro
npm run dev    # localhost:4321
npm run build  # output to ./dist
```

**Dev server config**：
- `.claude/launch.json` 在 `C:/Users/user/Desktop/Claude code/.claude/launch.json`
- name: `ai-brain-astro`, port: 4321

---

## 📁 檔案結構

```
ai-brain-astro/
├── src/
│   ├── consts.ts                          # SITE 常數 + SERIES_ARTICLES（12 篇 metadata）
│   ├── content.config.ts                  # Content Collection schema (Zod)
│   │
│   ├── content/articles/
│   │   ├── 01-exposure.md                 # 12 篇文章 markdown（frontmatter + body）
│   │   ├── 02-homepage.md
│   │   ├── 03-seo.md
│   │   ├── 04-google.md
│   │   ├── 05-content.md
│   │   ├── 06-social.md
│   │   ├── 07-automation.md
│   │   ├── 08-upsell.md
│   │   ├── 09-retention.md                # ← 唯一手寫，其餘 11 篇從舊版 HTML 抽取
│   │   ├── 10-referral.md
│   │   ├── 11-trust.md
│   │   └── 12-integration.md
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro               # head + Navbar + Footer（含 SEO meta）
│   │   └── ArticleLayout.astro            # hero + sidebar + pagination + return + related
│   │
│   ├── components/
│   │   ├── Navbar.astro                   # 上方固定導航（含 safe-area inset）
│   │   ├── Footer.astro                   # 暗色 footer（3-col grid + 版權）
│   │   ├── HeroPortraitFigure.astro       # Andy 大照片（接 variant: article|series）
│   │   ├── KeyStats.astro                 # Bloomberg 風 3 統計
│   │   ├── SidebarToc.astro               # 文章右側 TOC + 系列篇章列表（lg+ only）
│   │   ├── Pagination.astro               # 上下篇 cards（含完整 title）
│   │   ├── RelatedArticles.astro          # 你可能感興趣 3 卡片（只 title）
│   │   ├── ReturnToOverview.astro         # 文章底部「回 12 篇系列總覽」明顯 CTA
│   │   ├── ReadingProgress.astro          # 頂部 2px primary 進度條
│   │   └── ScrollReveal.astro             # IntersectionObserver + html.js 漸進增強
│   │
│   ├── pages/
│   │   ├── articles/[...slug].astro       # 動態文章路由（讀 collection）
│   │   └── 系列總覽/index.astro           # 系列總覽頁（hero + 12 cards grid + CTA）
│   │
│   └── styles/global.css                  # 設計系統 token + base + components + utilities
│
├── public/
│   └── andy-photo.png                     # Andy 主筆肖像（704KB，hero 用）
│
├── _extract/                              # 內容抽取工具（build-time helper）
│   ├── extract.cjs                        # 從舊 HTML 抽 metadata + body to markdown
│   └── polish.cjs                         # 清理 trailing CTA junk
│
├── astro.config.mjs                       # 含 redirects: '/' → '/系列總覽/'
└── package.json
```

---

## 🎨 設計系統（global.css `@theme`）

**色彩**（oklch 暖色基底）：
- `--color-paper`：主背景（cream）
- `--color-paper-warm/blush`：區塊 / 卡片底
- `--color-ink-midnight/titanium`：暗色 hero/footer/CTA
- `--color-primary`：oklch(0.557 0.166 45) Hermès 橙
- `--color-primary-soft/deep`、`--color-honey`
- `--color-ink/muted/faint/light`：文字 4 階
- `--color-rule-hair/soft/bold`：細線 3 階

**字型**：
- `--font-display-cjk`：Noto Serif TC 900（中文大標）
- `--font-display-latin`：Fraunces optical sizing（拉丁/數字）
- `--font-body-cjk`：Noto Sans TC（中文 body）
- `--font-ui`：Inter（UI / eyebrow）

**Utilities**（global.css `@utility`）：
- `container-wide` / `eyebrow` / `eyebrow-primary`
- `editorial-h1` / `editorial-h2` / `body-lg`
- `rule-hairline`

**Components 共用 class**（global.css `@layer components`）：
- `.font-display-cjk` / `.font-display-latin` / `.font-body-cjk` / `.font-ui`
- `.tabular-display`（Fraunces + tnum + opsz 96）
- `html.js .reveal` / `html.js .reveal.revealed`（scroll reveal 漸進增強）

---

## ✅ 已完成（這個 session）

1. **Astro 重構**：從純 HTML 站搬到 Astro 6 + TS + Tailwind v4
2. **12 篇文章 migration**：cheerio + turndown 從舊 HTML 抽到 markdown
3. **編輯式視覺**：Hermès × Aesop × 中文書卷氣（drop cap、§ section sign、hairline、Bloomberg stats）
4. **代碼審查 8 維度**：cascade / context inversion / cross-file / state / a11y / mobile / Astro / perf — 18 個 bug 修
5. **RWD 系統審查**：breakpoints / touch targets / typography / overflow / mobile UX
6. **GitHub + Vercel auto-deploy**：push 自動部署
7. **解 Vercel preview protection**：公開可訪問
8. **舊專案 rename → legacy**：保留備援

---

## ⚠️ 已知尚待處理（下個 session 可做）

### A. 內容潤飾（content polish）
**11 篇 markdown 是從舊 HTML 自動抽取的**，body 內文會有結構碎片：
- 例：`錯誤一` `錯誤二` 這種 mistake-card label 變成 plain text 而非 H3
- 例：`✕` `✓` 標籤變成 plain text 跟內文混在一起
- 例：`來源 1 · 必做｜...` 這種複合 label 失去 design hierarchy
- **要做**：手動逐篇打開 `src/content/articles/0X-*.md` 校對 + 加 H3 標題 + 重排 list

### B. 圖片優化
- `public/andy-photo.png` 704KB → 可用 Astro Image component（`<Image>`）+ WebP
- 12 篇文章內**沒有圖**（純文字），可考慮加配圖（Gemini 生圖工作流：見 `~/.claude/rules/gemini-model.md`）

### C. SEO + 結構化資料
- 已有 og:title / og:description / og:type=article
- **沒做**：JSON-LD Article schema、sitemap.xml、robots.txt
- Astro 有 `@astrojs/sitemap` integration 可一鍵加

### D. 性能
- Fonts 已 preconnect + display=swap
- **沒做**：font preload critical fonts（hero h1 用的 Noto Serif TC 900）

### E. Analytics
- 沒裝任何 analytics（Plausible / Google Analytics）

---

## 🔧 常用指令備忘

```bash
# 切到專案
cd C:/Users/user/Desktop/ai-brain-astro

# 開 dev
npm run dev   # 然後開 http://localhost:4321

# build + 預覽（本地測 production build）
npm run build && npm run preview

# 部署（也可只 push 到 GitHub master 觸發 auto-deploy）
npx vercel deploy

# 切主網域 alias
LATEST=$(npx vercel ls | grep -m 1 "Ready" | grep -oE 'https://ai-brain-website-[a-z0-9]+\.vercel\.app' | head -1)
npx vercel alias set "$LATEST" ai-brain-website.vercel.app

# 查 deploy 列表
npx vercel ls

# 抽取 / 重新生成 11 篇 markdown（從舊版 HTML，謹慎用會覆蓋）
node _extract/extract.cjs
node _extract/polish.cjs
```

---

## 🆔 帳號資訊

- GitHub user: **AndyHu18**（已用 `gh auth status` 認證）
- Vercel: **andyhu18's projects** team
- Auth tokens 在：
  - GitHub: `gh auth token` 取得
  - Vercel: `~/AppData/Roaming/com.vercel.cli/Data/auth.json`

---

## 💡 設計原則（給未來 session 參考）

1. **暖色 oklch 配色克制使用** — primary 橘只在 accent / CTA / 點睛
2. **編輯式 hairline divider** — 不用粗線，用 `--color-rule-hair` 1px 暖色細線
3. **font-display-cjk = 大標**, body-cjk = 內文
4. **eyebrow 標籤** = uppercase + 11px + letter-spacing 0.18em
5. **Bloomberg 風數字** = Fraunces optical sizing，大數字小描述
6. **§ section sign** prefix on H2 in article body（編輯式雜誌感）
7. **Drop cap** 在文章第一段（Noto Serif TC 900 + primary 橘）
8. **不用 shadcn / 不用 Framer Motion** — luxury = restraint

---

## 🚨 不要做的事

- 不要動 `src/styles/global.css` 的 `@theme` token 名稱（component 全部 reference 它）
- 不要用 Tailwind 不存在的 class（如 `pt-18` `h-18` `duration-400`），會 silently fail
- 不要在 `@utility` 裡寫空規則（Tailwind v4 會 build error）
- 不要給 `<a>` 加 `text-decoration: underline` reset（會破壞文章內 link 動畫）
- 不要把 `*-light` token 加進 `@theme`（會跟 Tailwind 內建衝突），用 `*-soft` 替代
