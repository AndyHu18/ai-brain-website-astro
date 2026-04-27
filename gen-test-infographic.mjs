import https from "https";
import fs from "fs";
import path from "path";

const API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = "./public/images/articles";

const STYLE_BASE = `A high-end luxury educational infographic — premium ecommerce mentor brand aesthetic,
boutique consultant style, vivid but elegant, refined gold accents, magnetic and aspirational.
Color palette: creamy ivory background, champagne gold accents, caramel orange highlights,
warm sand midtones, deep coffee brown shadows, subtle black accents.
NO neon colors. NO cheap promotional banner feel. NO simplified Chinese.`;

const TEST_IMAGES = [
  {
    file: "01-exposure-v3.jpg",
    prompt: `${STYLE_BASE}

Layout: clean two-column comparison infographic with a subtle vertical divider in center.
Left column shows a 4-step failing journey (business without strategy).
Right column shows a 4-step winning journey (business with exposure strategy).
Each step has a minimal line-art icon and Chinese text label.
Bottom of each column shows a bold stat result in large champagne gold numbers.

Display the following Traditional Chinese text clearly and legibly
(website-UI quality font, sharp crisp rendering, NOT garbled, NOT simplified Chinese,
NOT decorative calligraphy — treat every character like high-DPI screen text):

  Main headline: "兩種商家，兩種結局"
  Sub-headline: "你的網路曝光策略，決定你的生意能見度"

  Left column title (on warm gray background): "沒有曝光策略"
  Left step 1: "只靠口碑介紹" (icon: single silhouette person)
  Left step 2: "新客幾乎找不到你" (icon: magnifying glass with X mark)
  Left step 3: "競爭對手排在前面" (icon: competitor rising above)
  Left step 4: "生意越來越難做" (icon: downward arrow trend)
  Left bottom stat: "每月新客：2-3 位"

  Right column title (on warm cream background): "有曝光策略"
  Right step 1: "出現在對的搜尋結果" (icon: magnifying glass with checkmark)
  Right step 2: "客戶主動找上門" (icon: person walking toward door)
  Right step 3: "品牌持續被記住" (icon: glowing lightbulb)
  Right step 4: "穩定成長的客流量" (icon: upward arrow trend)
  Right bottom stat: "每月新客：20-30 位"

Style: clean editorial infographic, high contrast text on backgrounds,
icons in minimal champagne gold line-art style, NOT PowerPoint, NOT cartoon.

IMPORTANT: All Chinese characters must be Traditional Chinese (繁體中文).
Text rendering is the top priority — every character must be sharp and readable.

Restrictions:
- No logo, no watermark, no fake UI buttons
- No simplified Chinese, no garbled text, no Lorem Ipsum placeholder text
- No neon colors, no heavy drop shadows on body text`,
  },
  {
    file: "02-homepage-v3.jpg",
    prompt: `${STYLE_BASE}

Layout: wide landscape editorial annotated diagram.
Center: a clean schematic website homepage illustration (flat, minimal, vector-like style)
showing: a hero banner area, a prominent headline zone, an orange call-to-action button,
and a below-fold content section with 3 columns.
Around the central mockup: 5 numbered callout labels connected by thin champagne gold lines,
distributed naturally around the mockup (2 on left, 2 on right, 1 at top or bottom center).
Each callout has a caramel orange filled circle with white number inside, and Chinese text beside it.

Display the following Traditional Chinese text clearly and legibly
(sharp, website-UI quality, NOT garbled, NOT simplified Chinese):

  Main headline: "首頁決勝的 5 個關鍵"
  Sub-headline: "訪客在 3 秒內決定去留——你的首頁準備好了嗎？"

  Callout ①: "清楚說出你能幫誰解決什麼問題"
  Callout ②: "一眼就能找到的行動按鈕"
  Callout ③: "讓訪客立刻感受到的信任感"
  Callout ④: "3 秒內傳達你的核心價值"
  Callout ⑤: "手機版體驗同樣順暢好用"

  Bottom note: "每一個關鍵都在影響你的轉換率"

Style: premium editorial annotated diagram, champagne gold thin connector lines,
caramel orange numbered circles with white numerals, deep coffee brown text labels.
The website mockup should be clean flat schematic illustration, NOT a photo.
NOT a cheap template. NOT PowerPoint annotation style.

IMPORTANT: All Chinese must be Traditional Chinese (繁體中文), sharp, legible,
exactly like text rendered by a modern browser at high DPI.

Restrictions:
- No logo, no watermark on the website mockup
- No simplified Chinese, no garbled text, no fake Lorem Ipsum in the mockup
- Numbered circles must clearly show white numbers inside orange circles
- All callout text must be fully legible`,
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
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error("parse failed: " + raw.slice(0, 300)));
        }
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
  console.log("Generating 2 infographic test images (quality: high)...\n");

  for (let i = 0; i < TEST_IMAGES.length; i++) {
    const { file, prompt } = TEST_IMAGES[i];
    console.log(`[${i + 1}/2] ${file}...`);
    try {
      const data = await callOpenAI(prompt);
      if (data.error) { console.error("  ❌", data.error.message); continue; }
      fs.writeFileSync(path.join(OUTPUT_DIR, file), Buffer.from(data.data[0].b64_json, "base64"));
      console.log("  ✅ Saved →", path.join(OUTPUT_DIR, file));
    } catch (err) {
      console.error("  ❌", err.message);
    }
  }
  console.log("\nDone. Check public/images/articles/ for the two test images.");
}

main();
