import https from "https";
import fs from "fs";
import path from "path";

const API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = "./public/images/articles";

const TEST_IMAGES = [
  {
    file: "01-exposure-v2.jpg",
    prompt: `A high-end luxury website editorial visual — premium ecommerce mentor landing page aesthetic, boutique consultant brand feel, vivid but elegant, magnetic and aspirational.

Scene: A sophisticated top-down night cityscape in miniature diorama style. One small storefront glows with warm amber-gold light radiating upward like a beacon, while surrounding storefronts remain dimly lit in deep coffee brown shadow. The glowing store has a subtle search pin icon hovering above it in champagne gold.

Color palette: creamy ivory background vignette, champagne gold light beam, caramel orange core glow, warm sand midtones, deep coffee brown shadows, subtle black accents.

Traditional Chinese text (繁體中文) in clean bold sans-serif: the label "網路曝光" appears in champagne gold near the glowing store. Text must be sharp, legible, website-UI quality — NOT garbled, NOT decorative, NOT simplified Chinese.

Style: luxury editorial photography feel, refined gold accents, creamy premium lighting, cinematic depth of field. NOT a cheap promotional banner. NOT neon colors. NOT a generic map screenshot.`,
  },
  {
    file: "02-homepage-v2.jpg",
    prompt: `A high-end luxury website editorial visual — premium ecommerce mentor landing page aesthetic, boutique consultant brand feel, vivid but elegant, magnetic and aspirational.

Scene: A premium MacBook Pro open on an elegant white marble desk, displaying a clean high-converting business website homepage. The website on screen has: a clear bold headline, a warm caramel orange call-to-action button, and a professional hero image — all clearly visible and sharp (NOT blurry abstract shapes). Beside the laptop: a single white orchid in a minimal ceramic vase, a thin gold pen, a small espresso cup.

Color palette: creamy white marble surface, champagne gold accents, caramel orange button glow on screen, deep coffee brown laptop body, soft ivory background.

Traditional Chinese text (繁體中文): a subtle annotation label "3 秒決定去留" in champagne gold appears elegantly beside the laptop screen. Text must be sharp, legible, like a high-end infographic label — NOT garbled, NOT simplified Chinese.

Style: luxury editorial product photography, boutique consultant brand feel, creamy premium lighting from above-left, shallow depth of field on background. NOT a generic stock photo. NOT a cheap tech banner.`,
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

  for (let i = 0; i < TEST_IMAGES.length; i++) {
    const { file, prompt } = TEST_IMAGES[i];
    console.log(`[${i + 1}/2] ${file} (high quality)...`);
    try {
      const data = await callOpenAI(prompt);
      if (data.error) { console.error("  ❌", data.error.message); continue; }
      fs.writeFileSync(path.join(OUTPUT_DIR, file), Buffer.from(data.data[0].b64_json, "base64"));
      console.log("  ✅ Saved");
    } catch (err) {
      console.error("  ❌", err.message);
    }
  }
  console.log("\nDone.");
}

main();
