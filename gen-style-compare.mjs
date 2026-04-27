import https from "https";
import fs from "fs";
import path from "path";

const API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = "./public/images/style-compare";

// 四個版本共用同一個主題文字內容，只改色彩風格描述
const SHARED_TEXT = `
Display the following Traditional Chinese text clearly and legibly
(website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "兩種商家，兩種結局"
  Sub-headline: "你的網路曝光策略，決定你的生意能見度"

  Left column title: "沒有曝光策略"
  Left step 1: "只靠口碑介紹"
  Left step 2: "新客幾乎找不到你"
  Left step 3: "競爭對手排在前面"
  Left step 4: "生意越來越難做"
  Left bottom stat: "每月新客：2-3 位"

  Right column title: "有曝光策略"
  Right step 1: "出現在對的搜尋結果"
  Right step 2: "客戶主動找上門"
  Right step 3: "品牌持續被記住"
  Right step 4: "穩定成長的客流量"
  Right bottom stat: "每月新客：20-30 位"

Layout: two-column comparison infographic. Left column shows the failing 4-step journey,
right column shows the winning 4-step journey. Each step has a minimal icon + Chinese text.
Bottom of each column shows the stat in large bold numbers.
Vertical divider separates the two columns.

Restrictions:
- No logo, no watermark
- No simplified Chinese, no garbled text, no Lorem Ipsum
- All text Traditional Chinese (繁體中文), sharp and legible`;

const VERSIONS = [
  {
    file: "A-vivid-promo.jpg",
    label: "A版 高飽和促銷感",
    style: `Color palette: high-saturation vivid promotional style like a marketplace sale banner.
Left column background: bright red or coral red (#E03C3C), right column background: vivid emerald green (#27AE60).
Accent colors: electric orange badges, bright yellow highlights, bold blue numbered circles.
Multiple saturated colors competing simultaneously. Thick bold borders in contrasting colors.
Background: pure bright white (#FFFFFF). Text: black or very dark.
Energetic, aggressive promotional feel — like Shopee, 蝦皮, or Momo shopping platform graphics.
High visual noise, many competing colors, zero restraint.`,
  },
  {
    file: "B-warm-luxury.jpg",
    label: "B版 暖色奢華（現有方向）",
    style: `Color palette: luxury ecommerce mentor brand — creamy ivory background (#FAF7F2),
champagne gold accents (#C9A96E), caramel orange highlights (#D4854A),
warm sand midtones (#E8DCC8), deep coffee brown text (#3B2A1A), subtle black accents.
Left column: soft warm gray tint. Right column: warm cream.
Refined gold divider line. Stat numbers in caramel orange, large and bold.
Overall aesthetic: premium boutique consultant brand, vivid but elegant, magnetic and aspirational.
NO neon, NO harsh contrast, NO cheap feel.`,
  },
  {
    file: "C-minimal-cold.jpg",
    label: "C版 極度克制冷色",
    style: `Color palette: ultra-minimal corporate consulting style — stark white background (#FFFFFF),
single deep navy blue (#1B2A4A) as the ONLY accent color used throughout.
Near-black (#1A1A1A) body text. Very thin hairline dividers (#CCCCCC).
Left column: subtle cool gray (#F5F6F8) tint. Right column: pure white.
NO warm tones whatsoever. NO orange, NO gold, NO yellow.
Numbered circles: navy blue filled with white numbers.
Aesthetic: McKinsey, BCG, or Bain consulting report — cold, intellectual, neutral, stripped of emotion.
Extremely restrained, almost monochrome, zero decorative color.`,
  },
  {
    file: "D-dark-luxury.jpg",
    label: "D版 深色奢華",
    style: `Color palette: dark luxury premium editorial — deep espresso brown (#1E1208) as the dominant background,
champagne gold (#C9A96E) for all headlines, column titles, and decorative elements,
caramel amber (#D4854A) for right-column accents and stat highlights,
cream white (#F5F0E8) for body text labels on dark background,
soft warm gray (#3D2E1E) for left column background panels.
Gold hairline divider between columns. Stat numbers in large champagne gold on dark background.
Aesthetic: premium financial magazine, luxury brand annual report, high-end coaching platform — rich, sophisticated, dark mode elegance.`,
  },
];

function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size: "1792x1024",
      quality: "medium",
      output_format: "jpeg",
      n: 1,
    });
    const options = {
      hostname: "api.openai.com",
      path: "/v1/images/generations",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error("parse failed: " + raw.slice(0, 200))); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!API_KEY) { console.error("❌ OPENAI_API_KEY not set"); process.exit(1); }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("生成 4 種風格對比圖（同主題，quality: medium）...\n");

  for (let i = 0; i < VERSIONS.length; i++) {
    const { file, label, style } = VERSIONS[i];
    const prompt = `An educational infographic.

${style}

${SHARED_TEXT}

Style: clean comparison infographic feel, each step has a minimal icon.
NOT a photo, NOT a PowerPoint. Text must be sharp and readable.`;

    console.log(`[${i + 1}/4] ${label}...`);
    try {
      const data = await callOpenAI(prompt);
      if (data.error) { console.error("  ❌", data.error.message); continue; }
      fs.writeFileSync(path.join(OUTPUT_DIR, file), Buffer.from(data.data[0].b64_json, "base64"));
      console.log(`  ✅ Saved: ${file}`);
    } catch (err) {
      console.error("  ❌", err.message);
    }
  }

  console.log("\n✅ 全部完成！圖片在 public/images/style-compare/");
  console.log("A-vivid-promo.jpg    → 高飽和促銷感");
  console.log("B-warm-luxury.jpg    → 暖色奢華（你現有方向）");
  console.log("C-minimal-cold.jpg   → 極度克制冷色");
  console.log("D-dark-luxury.jpg    → 深色奢華");
}

main();
