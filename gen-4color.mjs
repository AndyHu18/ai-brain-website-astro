import https from "https";
import fs from "fs";
import path from "path";

const API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = "./public/images/style-compare";

const prompt = `An educational infographic — premium ecommerce mentor brand aesthetic, boutique consultant style.

STRICT COLOR RULE — exactly 4 colors, each assigned one function only, no exceptions:
  COLOR 1 — creamy ivory (#FAF7F2): background ONLY. Used nowhere else.
  COLOR 2 — champagne gold (#C9A96E): brand decoration ONLY — column titles, divider line, step number badges, header underlines. Used nowhere else.
  COLOR 3 — caramel orange (#D4854A): action/highlight ONLY — the two bottom stat numbers, right-column checkmark icons. Used nowhere else.
  COLOR 4 — deep coffee brown (#3B2A1A): all body text ONLY — every label, every step description, both column headers. Used nowhere else.

NO fifth color. NO warm sand. NO black. NO gray backgrounds on columns. NO additional tones.
The discipline IS the design — restraint creates premium feel.

Layout: two-column comparison infographic. Clean ivory background throughout.
Thin champagne gold vertical divider separates the two columns.
Champagne gold step number badges (①②③④) beside each step text.
Bottom stat row: large caramel orange numbers, coffee brown label text.

Display the following Traditional Chinese text clearly and legibly
(website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "兩種商家，兩種結局"
  Sub-headline: "你的網路曝光策略，決定你的生意能見度"

  Left column title: "沒有曝光策略"
  Left step 1: "只靠口碑介紹"
  Left step 2: "新客幾乎找不到你"
  Left step 3: "競爭對手排在前面"
  Left step 4: "生意越來越難做"
  Left stat: "每月新客：2-3 位"

  Right column title: "有曝光策略"
  Right step 1: "出現在對的搜尋結果"
  Right step 2: "客戶主動找上門"
  Right step 3: "品牌持續被記住"
  Right step 4: "穩定成長的客流量"
  Right stat: "每月新客：20-30 位"

Style: clean editorial infographic, generous white space, minimal line-art icons in champagne gold.
NOT PowerPoint. NOT cartoon. Text must be sharp and fully readable.

Restrictions:
- No logo, no watermark
- No simplified Chinese, no garbled text, no Lorem Ipsum
- STRICTLY 4 colors only as defined above — reject any impulse to add a 5th`;

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
  console.log("生成 E版 — 嚴格 4 色功能版（quality: high）...");
  try {
    const data = await callOpenAI(prompt);
    if (data.error) { console.error("❌", data.error.message); return; }
    const outPath = path.join(OUTPUT_DIR, "E-4color-functional.jpg");
    fs.writeFileSync(outPath, Buffer.from(data.data[0].b64_json, "base64"));
    console.log("✅ Saved:", outPath);
  } catch (err) {
    console.error("❌", err.message);
  }
}

main();
