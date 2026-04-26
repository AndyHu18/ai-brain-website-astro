// 全站常數 + 12 篇文章 metadata（給 sidebar 系列文章列表用）

// BASE_PATH 必須與 astro.config.mjs 的 base 設定一致
export const BASE_PATH = "/series";

export const SITE = {
  name: "AI 智能大腦",
  brandSuffix: ".",
  tagline: "把 AI 變成你 24 小時不下班的同事",
  seriesName: "網站經營 12 篇系列",
  overviewUrl: `${BASE_PATH}/系列總覽/`,
  // 嵌入式環境的「來源頁」(使用者從 landing page v2 點進來,要能回 v2 而非回首頁)
  mainSiteUrl: "https://ai-brain-website.vercel.app/landing-page-v2.html",
  ctaUrl: "https://line.me/ti/p/5gW0er9baG",
  ctaLabel: "加 LINE 免費診斷",
  copyright: "© 2026 AI 智能大腦公司 · 企業級 AI 導入專家",
};

// 12 篇文章基本資料（給 sidebar、pagination 用）
export const SERIES_ARTICLES: Array<{
  num: string;
  slug: string;
  shortTitle: string;
  badge: string;
}> = [
  { num: "01", slug: "exposure", shortTitle: "曝光問題", badge: "曝光導流" },
  { num: "02", slug: "homepage", shortTitle: "首頁設計", badge: "首頁印象" },
  { num: "03", slug: "seo", shortTitle: "差異化定位", badge: "差異化定位" },
  { num: "04", slug: "google", shortTitle: "產品介紹", badge: "產品頁面" },
  { num: "05", slug: "content", shortTitle: "成交路徑", badge: "成交路徑" },
  { num: "06", slug: "social", shortTitle: "留下聯絡", badge: "留下聯絡" },
  { num: "07", slug: "automation", shortTitle: "自動化", badge: "自動化訊息" },
  { num: "08", slug: "upsell", shortTitle: "加購升級", badge: "加購升級" },
  { num: "09", slug: "retention", shortTitle: "回頭客", badge: "回頭客機制" },
  { num: "10", slug: "referral", shortTitle: "口碑轉介", badge: "口碑系統" },
  { num: "11", slug: "trust", shortTitle: "信任建立", badge: "信任與證據" },
  { num: "12", slug: "integration", shortTitle: "整合策略", badge: "整合策略" },
];
