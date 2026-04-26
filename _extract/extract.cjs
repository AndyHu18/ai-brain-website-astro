// 從舊版 HTML 提取 metadata + body → Astro Markdown
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const TurndownService = require("turndown");

const SRC = "C:/Users/user/Desktop/Claude code/ai-brain-deploy";
const DST = "C:/Users/user/Desktop/ai-brain-astro/src/content/articles";

// 檔名 ↔ slug ↔ num
const ARTICLES = [
  { file: "article-01-exposure.html",  num: "01", slug: "exposure" },
  { file: "article-02-homepage.html",  num: "02", slug: "homepage" },
  { file: "article-03-seo.html",       num: "03", slug: "seo" },
  { file: "article-04-google.html",    num: "04", slug: "google" },
  { file: "article-05-content.html",   num: "05", slug: "content" },
  { file: "article-06-social.html",    num: "06", slug: "social" },
  { file: "article-07-automation.html",num: "07", slug: "automation" },
  { file: "article-08-upsell.html",    num: "08", slug: "upsell" },
  // 09 已手寫，保留不覆蓋
  { file: "article-10-referral.html",  num: "10", slug: "referral" },
  { file: "article-11-trust.html",     num: "11", slug: "trust" },
  { file: "article-12.html",           num: "12", slug: "integration" },
];

const td = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});

// 自訂規則：移除空 div、span 但保留內容
td.addRule("strip-divs", {
  filter: ["div", "span"],
  replacement: (content) => content,
});

// 表格保留 markdown table
td.keep(["table", "thead", "tbody", "tr", "th", "td"]);

function extractFromArticle(filename) {
  const fullPath = path.join(SRC, filename);
  const html = fs.readFileSync(fullPath, "utf8");
  const $ = cheerio.load(html);

  // === Metadata ===
  const title = $("h1.hero-title, h1").first().text().trim().replace(/\s+/g, " ");
  
  let subtitle = $(".hero-subtitle, .article-subtitle").first().text().trim();
  if (!subtitle) subtitle = $("header p").first().text().trim();
  subtitle = subtitle.replace(/\s+/g, " ");

  let badge = $(".article-category-badge, .hero-badge, .badge").first().text().trim();
  badge = badge
    .replace(/\d+\s*\/\s*12/g, "")
    .replace(/第\s*\d+\s*篇/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // 3 key-stats
  const stats = [];
  $(".key-stat").each((_, el) => {
    const num = $(el).find(".key-stat-num").text().trim();
    const label = $(el).find(".key-stat-label").text().trim().replace(/\s+/g, " ");
    if (num && label) stats.push({ num, label });
  });

  // 閱讀時間
  let readTime = "";
  const meta = $("body").text();
  const m = meta.match(/閱讀約\s*(\d+)\s*分鐘/);
  if (m) readTime = `${m[1]} 分鐘`;
  else readTime = "8 分鐘";

  // === Body content extraction ===
  // 從 main / article 標籤裡抓所有 h2 之後的內容
  let bodyMd = "";
  
  // 找 main / article body container
  const $body = $("main.article-layout, article.article-body, main").first();
  
  if ($body.length) {
    // 排除 sidebar、footer、nav-pagination、related
    $body.find(".sidebar, .article-pagination, .related-articles, footer, .float-cta, aside").remove();
    
    // 取所有 h2 + 其後內容
    const sections = [];
    let currentSection = null;
    $body.children().each((_, el) => {
      const tag = el.tagName?.toLowerCase();
      if (tag === "h2") {
        if (currentSection) sections.push(currentSection);
        currentSection = { heading: $(el).text().trim().replace(/\s+/g, " "), html: "" };
      } else if (currentSection) {
        currentSection.html += $.html(el);
      } else {
        // h2 之前的內容（lead paragraph）
        if (!sections.lead) sections.lead = "";
        sections.lead = (sections.lead || "") + $.html(el);
      }
    });
    if (currentSection) sections.push(currentSection);

    // Lead paragraphs（H2 前面的引言段落）
    if (sections.lead) {
      bodyMd += td.turndown(sections.lead).trim() + "\n\n";
    }

    // 各 H2 section
    sections.forEach((sec) => {
      bodyMd += `## ${sec.heading}\n\n`;
      bodyMd += td.turndown(sec.html).trim() + "\n\n";
    });
  } else {
    // Fallback：從 h2 開始抓
    $("h2").each((_, h2) => {
      const heading = $(h2).text().trim().replace(/\s+/g, " ");
      bodyMd += `## ${heading}\n\n`;
      let next = $(h2).next();
      while (next.length && next[0].tagName?.toLowerCase() !== "h2") {
        // 跳過 sidebar / footer / pagination 區
        const cls = next.attr("class") || "";
        if (cls.match(/sidebar|footer|pagination|related|float-cta/)) {
          next = next.next();
          continue;
        }
        bodyMd += td.turndown($.html(next)).trim() + "\n\n";
        next = next.next();
      }
    });
  }

  // 清理：移除多餘空行、清掉前後 whitespace
  bodyMd = bodyMd
    .replace(/\n{3,}/g, "\n\n")
    .replace(/&[a-z]+;/gi, " ")
    .trim();

  return { title, subtitle, badge, stats, readTime, bodyMd };
}

function buildFrontmatter(meta, num, slug) {
  // Stats 至少 3 個（如果沒抓到完整就補預設）
  let stats = meta.stats;
  while (stats.length < 3) {
    stats.push({ num: "—", label: "（待補）" });
  }
  stats = stats.slice(0, 3);

  // Subtitle 限長
  const subtitle = meta.subtitle || meta.title;
  const description = subtitle.slice(0, 140);

  // YAML escape
  const esc = (s) => String(s).replace(/"/g, '\\"');

  return `---
num: "${num}"
slug: "${slug}"
title: "${esc(meta.title)}"
subtitle: "${esc(subtitle)}"
badge: "${esc(meta.badge || '系列文章')}"
description: "${esc(description)}"
readTime: "${meta.readTime}"
stats:
${stats.map(s => `  - num: "${esc(s.num)}"\n    label: "${esc(s.label)}"`).join("\n")}
pubDate: 2026-04-26
---

`;
}

let okCount = 0;
let failCount = 0;
ARTICLES.forEach(({ file, num, slug }) => {
  try {
    const meta = extractFromArticle(file);
    const fm = buildFrontmatter(meta, num, slug);
    const content = fm + meta.bodyMd + "\n";
    const outPath = path.join(DST, `${num}-${slug}.md`);
    fs.writeFileSync(outPath, content, "utf8");
    const sizeKb = (content.length / 1024).toFixed(1);
    console.log(`✅ ${num}-${slug}.md (${sizeKb}KB, ${meta.stats.length} stats)`);
    okCount++;
  } catch (e) {
    console.log(`❌ ${file}: ${e.message}`);
    failCount++;
  }
});

console.log(`\n=== Done: ${okCount} ok, ${failCount} fail ===`);
