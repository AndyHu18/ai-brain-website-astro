// 清理 11 篇 .md 內文 — 移除 turndown 殘留 + 底部冗餘 CTA + nav junk
const fs = require("fs");
const path = require("path");
const DIR = "C:/Users/user/Desktop/ai-brain-astro/src/content/articles";

const FILES = fs.readdirSync(DIR).filter(f => f.endsWith(".md") && !f.startsWith("09"));

let totalCleaned = 0;
FILES.forEach(file => {
  const fp = path.join(DIR, file);
  let md = fs.readFileSync(fp, "utf8");
  const before = md;

  // 分離 frontmatter 跟 body
  const fmEnd = md.indexOf("---", 3);
  if (fmEnd < 0) return;
  const frontmatter = md.slice(0, fmEnd + 3);
  let body = md.slice(fmEnd + 3);

  // 1. 移除底部「下一步 / 繼續讀系列文章 / 免費預約」這類 CTA 段落
  body = body.replace(/\n下一步\s*\n[\s\S]*?(\[繼續讀系列文章\][\s\S]*)?$/g, "\n");
  body = body.replace(/\n###?\s*想知道.*?\n[\s\S]*?(\[免費預約[\s\S]*?\]\([^)]+\))[\s\S]*$/gm, "\n");
  body = body.replace(/\[免費預約\s*\d+\s*分鐘診斷\]\([^)]+\)[^\n]*/g, "");
  body = body.replace(/\[繼續讀系列文章\]\([^)]+\)/g, "");

  // 2. 移除底部單行 "下一步" 標籤
  body = body.replace(/\n+下一步\s*$/g, "");

  // 3. 修「錯誤一」「錯誤二」這類沒被標題化的 → 改成 H3
  body = body.replace(/\n[✕✓]\s*(錯誤[一二三四五六七八九十]+|診斷[一二三]|步驟[一二三四五]+)\s*\n/g, "\n\n### $1\n\n");

  // 4. 修 "✓ 自我檢測" 這類獨立字串 → eyebrow style
  body = body.replace(/\n✓\s*自我檢測\s*\n/g, "\n\n### 自我檢測\n\n");

  // 5. 把連續超過 2 個空行壓成 2 個
  body = body.replace(/\n{3,}/g, "\n\n");

  // 6. 移除尾端只剩空行
  body = body.replace(/\n+$/, "\n");

  // 7. HTML entities 清理
  body = body.replace(/&nbsp;/g, " ");

  if (body !== md.slice(fmEnd + 3)) {
    fs.writeFileSync(fp, frontmatter + body, "utf8");
    totalCleaned++;
    console.log(`✅ ${file}`);
  } else {
    console.log(`-- ${file} (no changes)`);
  }
});

console.log(`\n=== ${totalCleaned} files cleaned ===`);
