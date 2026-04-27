import https from "https";
import fs from "fs";
import path from "path";

const API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = "./public/images/articles";

const ARTICLES = [
  {
    file: "01-exposure.jpg",
    prompt:
      "A smartphone displaying Google Maps with a single local business pin glowing in warm orange, surrounded by other unlit gray pins, held in hands in a bright modern cafe setting, photorealistic, shallow depth of field, warm amber window light, professional lifestyle photography",
  },
  {
    file: "02-homepage.jpg",
    prompt:
      "A MacBook Pro laptop on a minimal white desk displaying a clean modern business website homepage with a prominent orange call-to-action button and clear headline text, soft diffused natural window light, photorealistic editorial product photography, warm neutral tones",
  },
  {
    file: "03-seo.jpg",
    prompt:
      "A laptop screen showing Google search results page with the top organic result highlighted by a subtle orange glow, placed on a light wooden desk with a ceramic coffee cup and glasses nearby, soft morning light, photorealistic, warm professional atmosphere",
  },
  {
    file: "04-google.jpg",
    prompt:
      "A smartphone and laptop side by side on a warm walnut desk, both showing analytics dashboards with upward trending orange line charts and star review ratings, amber task lighting, notebook and pen nearby, photorealistic editorial business photography",
  },
  {
    file: "05-content.jpg",
    prompt:
      "A content creator working at a wooden desk, laptop open showing a blog post editor, a printed content calendar nearby, smartphone with social media feed, warm natural light from a large window, coffee cup, green plant, photorealistic lifestyle photography, East Asian business setting",
  },
  {
    file: "06-social.jpg",
    prompt:
      "Top-down flat lay of three devices — smartphone, tablet, and laptop — arranged on a warm oak surface, all displaying social media engagement notifications and analytics with orange accent highlights, warm amber tones, photorealistic overhead product shot, minimal styling",
  },
  {
    file: "07-automation.jpg",
    prompt:
      "A laptop on a glass modern desk displaying a clean automation workflow interface with connected process steps glowing in orange and white, minimalist bright office with indirect lighting, green plant accent, photorealistic editorial product photography, crisp and professional",
  },
  {
    file: "08-upsell.jpg",
    prompt:
      "A laptop screen showing a sleek e-commerce product page with a highlighted upgrade package section in orange, shopping cart visible, placed on a warm wooden desk in a clean modern office, natural daylight, photorealistic, shallow depth of field, professional lifestyle",
  },
  {
    file: "09-retention.jpg",
    prompt:
      "Close-up of a smartphone held in both hands displaying a modern loyalty rewards app with a digital membership card and points balance in warm orange, soft bokeh cafe background, photorealistic portrait product photography, warm golden hour lighting",
  },
  {
    file: "10-referral.jpg",
    prompt:
      "Two young East Asian business professionals in a bright modern office, one showing the other a smartphone displaying 5-star customer reviews with an orange share button, both smiling naturally, warm natural window light, photorealistic editorial lifestyle photography",
  },
  {
    file: "11-trust.jpg",
    prompt:
      "A laptop in a clean white office displaying a professional business website with trust badges, customer testimonials section, and security certification icons, clean desk with a small plant, soft diffused daylight, photorealistic product photography, minimal and credible",
  },
  {
    file: "12-integration.jpg",
    prompt:
      "Overhead bird's eye view of a modern workspace: laptop showing a connected business dashboard with multiple app icons linked by glowing orange lines forming a unified system, notebook, phone, coffee cup arranged neatly, warm tone product photography, photorealistic",
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
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error("JSON parse failed: " + raw.slice(0, 200)));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!API_KEY) {
    console.error("❌ OPENAI_API_KEY not set");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("Generating 12 article cover images...\n");

  for (let i = 0; i < ARTICLES.length; i++) {
    const { file, prompt } = ARTICLES[i];
    console.log(`[${i + 1}/12] ${file}`);
    try {
      const data = await callOpenAI(prompt);
      if (data.error) {
        console.error(`  ❌ API error: ${data.error.message}`);
        continue;
      }
      const b64 = data.data[0].b64_json;
      const buffer = Buffer.from(b64, "base64");
      fs.writeFileSync(path.join(OUTPUT_DIR, file), buffer);
      console.log(`  ✅ Saved`);
    } catch (err) {
      console.error(`  ❌ ${err.message}`);
    }
  }

  console.log("\n🎉 Done! Images in", OUTPUT_DIR);
}

main();
