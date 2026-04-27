import https from "https";
import fs from "fs";
import path from "path";

const API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = "./public/images/articles";

const STYLE = `A high-end luxury educational infographic — premium ecommerce mentor brand aesthetic, boutique consultant style, vivid but elegant, refined gold accents, magnetic and aspirational.
Color palette: creamy ivory background (#FAF7F2), champagne gold accents (#C9A96E), caramel orange highlights (#D4854A), warm sand midtones (#E8DCC8), deep coffee brown body text (#3B2A1A).
NO neon colors. NO cheap promotional banner feel.
Style: clean editorial infographic, generous white space, minimal line-art icons. NOT PowerPoint. NOT cartoon.
Restrictions: No logo, no watermark. No simplified Chinese, no garbled text. All text must be Traditional Chinese (繁體中文), website-UI quality, sharp and legible.`;

const IMAGES = [
  {
    file: "01-exposure-infographic.jpg",
    label: "01 曝光導流",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic. Thin champagne gold vertical divider. Each column: 4-step vertical journey with minimal line-art icons. Bottom stat row with large caramel orange numbers.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "同樣的店，3個月後兩種命運"
  Sub-headline: "差別只在一件事：有沒有主動經營網路地段"

  Left column title: "沒有網路曝光"
  Left step 1: "網站做完就放著"
  Left step 2: "Google 搜不到你"
  Left step 3: "同行排在你前面"
  Left step 4: "來客越來越少"
  Left bottom stat: "月新客：8-12 位"

  Right column title: "有做網路曝光"
  Right step 1: "長尾關鍵字出現在搜尋"
  Right step 2: "Google 商家資料完整"
  Right step 3: "社群有明確導流連結"
  Right step 4: "客流量持續成長"
  Right bottom stat: "月新客：40-60 位"`,
  },
  {
    file: "02-homepage-infographic.jpg",
    label: "02 首頁印象",
    prompt: `${STYLE}

Layout: wide landscape annotated diagram. Center: clean schematic website homepage illustration (flat, minimal, vector-like) showing hero banner, headline zone, CTA button, below-fold columns. Around the mockup: 5 numbered callout labels connected by thin champagne gold lines (2 left, 2 right, 1 bottom center). Each callout has a caramel orange filled circle with white number, Chinese text beside it.

Display the following Traditional Chinese text clearly and legibly (sharp, website-UI quality, NOT garbled, NOT simplified Chinese):

  Main headline: "首頁決勝的 5 個元素"
  Sub-headline: "少一個，就在漏客"

  Callout ①: "3秒內讓人知道你在賣什麼"
  Callout ②: "一眼看見與同行的差異"
  Callout ③: "陌生人立刻感受到的信任感"
  Callout ④: "找得到的預約按鈕"
  Callout ⑤: "真實照片勝過百張假圖"`,
  },
  {
    file: "03-seo-infographic.jpg",
    label: "03 差異化定位",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic. Thin champagne gold vertical divider. Each column: 4-step vertical list with minimal icons. Bottom stat row with large caramel orange numbers.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "同樣的實力，不同的表現方式"
  Sub-headline: "差異化讓你從50個選項中脫穎而出"

  Left column title: "無差異化"
  Left step 1: "用模糊話術介紹自己"
  Left step 2: "跟同行可以互換"
  Left step 3: "沒有故事，沒有承諾"
  Left step 4: "客人只好按價格選"
  Left bottom stat: "結果：最低價者勝"

  Right column title: "有差異化"
  Right step 1: "說出獨特的個人故事"
  Right step 2: "展示別人抄不走的方法"
  Right step 3: "給出具體可驗證的承諾"
  Right step 4: "客人感覺只想選你"
  Right bottom stat: "可多收：30-50% 溢價"`,
  },
  {
    file: "04-google-infographic.jpg",
    label: "04 產品介紹",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic. Thin champagne gold vertical divider. Each column: 4-step vertical list. Bottom stat row.

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

Layout: clean two-column comparison infographic. Thin champagne gold vertical divider. Each column: 3-step vertical list with minimal icons. Bottom stat row with large caramel orange numbers.

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
    file: "06-social-infographic.jpg",
    label: "06 留下聯絡",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic. Thin champagne gold vertical divider. Each column: 4-step vertical journey. Bottom stat row with large caramel orange numbers.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "同樣1,500位訪客，一年後的差距"
  Sub-headline: "90%的人當下不買，你有沒有辦法再找到他們？"

  Left column title: "沒有名單收集"
  Left step 1: "訪客看完直接離開"
  Left step 2: "沒有任何追蹤機制"
  Left step 3: "每個月燒廣告費找新客"
  Left step 4: "90%訪客永遠消失"
  Left bottom stat: "LINE 好友：0 位"

  Right column title: "有名單收集系統"
  Right step 1: "加 LINE 送具體好處"
  Right step 2: "15% 訪客留下聯絡"
  Right step 3: "每月累積 225 位好友"
  Right step 4: "名單變可重複利用的資產"
  Right bottom stat: "三個月後：675 位好友"`,
  },
  {
    file: "07-automation-infographic.jpg",
    label: "07 自動化訊息",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic. Thin champagne gold vertical divider. Each column: 4-step vertical list with minimal icons. Bottom stat row with large caramel orange numbers.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "同樣500位LINE好友，12個月後"
  Sub-headline: "設定一次自動跑，vs 每月手動群發"

  Left column title: "只會群發促銷"
  Left step 1: "每週群發「新品上市」"
  Left step 2: "客人感覺像廣告"
  Left step 3: "名單越來越冷"
  Left step 4: "封鎖率逐漸上升"
  Left bottom stat: "開信率 8%｜月收 NT$2萬"

  Right column title: "5個自動化序列"
  Right step 1: "新客收到7天歡迎訊息"
  Right step 2: "購後自動關懷序列"
  Right step 3: "生日週年自動問候"
  Right step 4: "沉睡客自動喚醒"
  Right bottom stat: "開信率 32%｜月收 NT$8萬"`,
  },
  {
    file: "08-upsell-infographic.jpg",
    label: "08 加購升級",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic. Thin champagne gold vertical divider. Each column: 3-step vertical list. Bottom stat row with large caramel orange numbers.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "同樣的訂單，多賺 25-40%"
  Sub-headline: "客人決定要買的那一秒，是最容易再買的時刻"

  Left column title: "沒有加購設計"
  Left step 1: "客人買什麼你賣什麼"
  Left step 2: "每筆只有主訂單"
  Left step 3: "純利潤機會全部錯過"
  Left bottom stat: "額外轉換：0%"

  Right column title: "結帳前加購設計"
  Right step 1: "結帳時輕量推薦1-2項"
  Right step 2: "心理帳戶尚未關閉"
  Right step 3: "設計一次永久自動運作"
  Right bottom stat: "加購接受率：30%"`,
  },
  {
    file: "09-retention-infographic.jpg",
    label: "09 回頭客機制",
    prompt: `${STYLE}

Layout: premium stats comparison card, wide landscape. Left half: deep coffee brown (#3B2A1A) background with large champagne gold numbers. Right half: creamy ivory background with context text. Thin vertical champagne gold divider in center.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "同樣100個新客，3年後的差距"
  Sub-headline: "差別只在：有沒有讓熟客自動回來的系統"

  Left side (dark background with large champagne gold number):
    Big number: "2,100萬"
    Label: "有無留客系統的3年業績差距"

  Right side (light background):
    Without system label: "沒有留客系統"
    Without system stats: "年回流 1.5次 → 單客貢獻 NT$750 → 3年累計 81萬"

    With system label: "有留客系統"
    With system stats: "年回流 6次 → 單客貢獻 NT$3,000 → 3年累計 292萬"

    Bottom note: "找新客成本是留老客的 5-7 倍"`,
  },
  {
    file: "10-referral-infographic.jpg",
    label: "10 口碑轉介",
    prompt: `${STYLE}

Layout: clean two-column comparison infographic. Thin champagne gold vertical divider. Each column: 4-step vertical journey with minimal icons. Bottom stat row with large caramel orange numbers.

Display the following Traditional Chinese text clearly and legibly (website-UI quality, sharp, NOT garbled, NOT simplified Chinese):

  Main headline: "被動口碑 vs 系統化口碑"
  Sub-headline: "一個推薦客的整體價值，等於10個廣告客"

  Left column title: "被動等口碑"
  Left step 1: "等客人自己想到推薦"
  Left step 2: "沒有獎勵，沒有追蹤"
  Left step 3: "口耳相傳靠運氣"
  Left step 4: "廣告費每個月都要燒"
  Left bottom stat: "推薦比例：5%"

  Right column title: "系統化推薦機制"
  Right step 1: "雙向獎勵設計"
  Right step 2: "自動追蹤推薦來源"
  Right step 3: "最佳時機點觸發分享"
  Right step 4: "口碑自動滾雪球"
  Right bottom stat: "推薦比例：40%"`,
  },
  {
    file: "11-trust-infographic.jpg",
    label: "11 信任感建立",
    prompt: `${STYLE}

Layout: wide landscape annotated diagram. Center: clean schematic website mockup showing testimonials, star ratings, photos (flat minimal vector style). Around the mockup: 5 numbered callout labels connected by thin champagne gold lines. Each callout: caramel orange filled circle with white number, Chinese text beside it.

Display the following Traditional Chinese text clearly and legibly (sharp, website-UI quality, NOT garbled, NOT simplified Chinese):

  Main headline: "5 種信任建立工具"
  Sub-headline: "你的同行 95% 連第一種都沒做"

  Callout ①: "影片見證：比文字可信度高10倍"
  Callout ②: "第三方背書：把Google評價放進網站"
  Callout ③: "媒體報導：被採訪過就是永久信任標章"
  Callout ④: "老闆真實照片：取代股票假圖"
  Callout ⑤: "老闆故事：別人永遠複製不了的差異化"`,
  },
  {
    file: "12-integration-infographic.jpg",
    label: "12 整合策略",
    prompt: `${STYLE}

Layout: elegant five-layer funnel diagram centered in wide landscape orientation. Funnel is wide at top narrowing to point at bottom. Premium champagne gold metallic appearance with subtle 3D depth. Each layer clearly labeled with Chinese text on left and description on right, separated by thin lines.

Display the following Traditional Chinese text clearly and legibly (sharp, NOT garbled, NOT simplified Chinese, website-UI quality):

  Main headline: "12個環節的5層複利系統"
  Sub-headline: "少一環，前面所有努力都打折"

  Top layer (widest):
    Label: "第一層：引流"
    Description: "曝光 + SEO — 讓對的人找到你"

  Second layer:
    Label: "第二層：留住"
    Description: "首頁 + 產品頁 + 差異化"

  Middle layer:
    Label: "第三層：成交"
    Description: "成交路徑 + 留下聯絡"

  Fourth layer:
    Label: "第四層：放大"
    Description: "自動化 + 加購 + 回頭客"

  Bottom layer (narrowest):
    Label: "第五層：乘數"
    Description: "口碑 + 信任 + 成效追蹤"

  Bottom caption: "每一層都在放大前一層的成果"`,
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

  console.log(`\n🚀 並行生成 ${IMAGES.length} 張資訊圖（quality: high，1792x1024）...\n`);
  const start = Date.now();

  const results = await Promise.allSettled(IMAGES.map(generateOne));

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const succeeded = results.filter(r => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - succeeded;

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ 完成：${succeeded}/${IMAGES.length} 張  |  ❌ 失敗：${failed} 張  |  耗時：${elapsed}s`);

  if (failed > 0) {
    console.log("\n失敗清單：");
    results.forEach(r => {
      if (r.status === "fulfilled" && !r.value.success) {
        console.log(`  - ${r.value.file}：${r.value.error}`);
      }
    });
  }

  console.log(`\n圖片位置：${OUTPUT_DIR}/`);
}

main();
