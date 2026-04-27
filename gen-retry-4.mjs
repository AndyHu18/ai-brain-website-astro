import https from "https";
import fs from "fs";
import path from "path";

const API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = "./public/images/articles";

const STYLE = `A high-end luxury EDUCATIONAL INFOGRAPHIC — flat vector graphic style, NO photography, NO real people, NO realistic scenes.
Premium ecommerce mentor brand aesthetic. Boutique consultant style. Vivid but elegant.
Color palette: creamy ivory background (#FAF7F2), champagne gold accents (#C9A96E), caramel orange highlights (#D4854A), warm sand midtones (#E8DCC8), deep coffee brown body text (#3B2A1A).
Visual style: clean flat editorial diagram, minimal line-art icons, geometric shapes, typography-forward layout.
NOT a photograph. NOT lifestyle photography. NOT real people. NOT realistic scenes.
NOT PowerPoint. NOT cartoon. Text must be sharp and fully readable.
Think: McKinsey-style consulting infographic meets boutique brand aesthetics.
Restrictions: No logo, no watermark. No simplified Chinese, no garbled text. All text Traditional Chinese (繁體中文), website-UI quality, sharp and legible.`;

const IMAGES = [
  {
    file: "04-google-infographic.jpg",
    label: "04 產品介紹",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic with flat vector icons. Thin champagne gold vertical divider. Each column: 4 rows of text with simple geometric icons (NO photos, NO real people). Bottom stat row with large caramel orange bold numbers.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "死目錄 vs 業務員"
  Sub-headline: "產品頁不是列出商品，是替客人完成決策"

  Left column title: "死目錄（一般產品頁）"
  Left step 1: "只有名稱、規格、價格"
  Left step 2: "沒說適合誰"
  Left step 3: "看不到與同行的差異"
  Left step 4: "沒有明確的下一步"
  Left bottom stat: "結果：客人看完無感離開"

  Right column title: "業務員（優化產品頁）"
  Right step 1: "具體說出適合哪種人"
  Right step 2: "直接點出客人的痛點"
  Right step 3: "說出你跟別人真正不同"
  Right step 4: "明確告訴客人下一步"
  Right bottom stat: "結果：客人有畫面直接下單"`,
  },
  {
    file: "05-content-infographic.jpg",
    label: "05 成交路徑",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic with flat vector icons. Thin champagne gold vertical divider. Each column: 3 rows of Chinese text with simple line-art icons (NO photos, NO real people, NO hands/faces). Bottom stat row with very large caramel orange bold numbers.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "漏水的桶子 vs 順暢的路徑"
  Sub-headline: "衝動高峰只有30秒，過了就不回來了"

  Left column title: "成交路徑有障礙"
  Left step 1: "電話藏在聯絡頁裡"
  Left step 2: "手機版按鈕消失"
  Left step 3: "流程超過5個步驟"
  Left bottom stat: "轉換率：12%"

  Right column title: "成交路徑已優化"
  Right step 1: "浮動按鈕永遠在眼前"
  Right step 2: "具體CTA文字有畫面"
  Right step 3: "三步以內完成預約"
  Right bottom stat: "轉換率：28%"`,
  },
  {
    file: "09-retention-infographic.jpg",
    label: "09 回頭客機制",
    prompt: `${STYLE}

Layout: premium stats comparison card — wide landscape, purely typographic and geometric, NO photos, NO people. Left half: deep coffee brown (#3B2A1A) background with very large champagne gold numbers and white text. Right half: creamy ivory (#FAF7F2) background with coffee brown text and two comparison blocks stacked vertically. Thin vertical champagne gold divider line in center.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "同樣100個新客，3年後的差距"
  Sub-headline: "差別只在：有沒有讓熟客自動回來的系統"

  Left side (dark background):
    Big number: "2,100萬"
    Label: "有無留客系統的3年業績差距"

  Right side (light background), top block:
    Label: "❌ 沒有留客系統"
    Line 1: "年回流 1.5次"
    Line 2: "單客貢獻 NT$750"
    Line 3: "3年累計：約81萬"

  Right side (light background), bottom block:
    Label: "✅ 有留客系統"
    Line 1: "年回流 6次"
    Line 2: "單客貢獻 NT$3,000"
    Line 3: "3年累計：約292萬"

  Bottom note: "找新客成本是留老客的 5-7 倍"`,
  },
  {
    file: "11-trust-infographic.jpg",
    label: "11 信任感建立",
    prompt: `${STYLE}

Layout: wide landscape annotated diagram. Center: a clean FLAT VECTOR schematic illustration of a website (NOT a photo, NOT a realistic mockup — think minimal wireframe-style flat design) showing placeholder areas for testimonials, star ratings, and a profile photo area. Around the central diagram: 5 numbered callout labels connected by thin champagne gold hairlines. Each callout: caramel orange filled circle with white number, Chinese text label beside it. Callouts distributed 2-3 on left, 2 on right.

Display the following Traditional Chinese text clearly and legibly (sharp, website-UI quality, NOT garbled, NOT simplified Chinese):

  Main headline: "5 種信任建立工具"
  Sub-headline: "你的同行 95% 連第一種都沒做"

  Callout ①: "影片見證：比文字可信度高10倍"
  Callout ②: "第三方背書：把Google評價放進網站"
  Callout ③: "媒體報導：被採訪就是永久信任標章"
  Callout ④: "真實感：老闆照片取代股票假圖"
  Callout ⑤: "老闆故事：別人永遠複製不了的差異化"`,
  },
];

function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size: "1792x1024",
      quality: "high",
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
        catch (e) { reject(new Error("parse failed: " + raw.slice(0, 300))); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function generateOne({ file, label, prompt }) {
  const outPath = path.join(OUTPUT_DIR, file);
  console.log(`  ⏳ 開始：${label}`);
  try {
    const data = await callOpenAI(prompt);
    if (data.error) {
      console.error(`  ❌ ${label}：${data.error.message}`);
      return { file, success: false, error: data.error.message };
    }
    fs.writeFileSync(outPath, Buffer.from(data.data[0].b64_json, "base64"));
    console.log(`  ✅ 完成：${label} → ${file}`);
    return { file, success: true };
  } catch (err) {
    console.error(`  ❌ ${label}：${err.message}`);
    return { file, success: false, error: err.message };
  }
}

async function main() {
  if (!API_KEY) { console.error("❌ OPENAI_API_KEY not set"); process.exit(1); }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n🔄 補生 4 張（加強限制：禁止真人照片）...\n`);
  const start = Date.now();

  const results = await Promise.allSettled(IMAGES.map(generateOne));

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const succeeded = results.filter(r => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - succeeded;

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ 完成：${succeeded}/4 張  |  ❌ 失敗：${failed} 張  |  耗時：${elapsed}s`);

  if (failed > 0) {
    results.forEach(r => {
      if (r.status === "fulfilled" && !r.value.success)
        console.log(`  - ${r.value.file}：${r.value.error}`);
    });
  }
}

main();
