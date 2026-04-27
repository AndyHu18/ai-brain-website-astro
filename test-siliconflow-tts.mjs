import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";

const API_KEY = "sk-api-IRJgbtSMhj0UWwQyha-7JDcmfX2iVDHuW3orQPIvSDLY57PnFVPPO-7zWrW4j6eCeMKBz1YHXctvM99k5uFvQ3mDOvvSdpiNUdiY-GTVoBu4KG1Tpy7aA8w";
const OUTPUT_DIR = "./public/audio/test";

const TEST_DIALOGUE = [
  { voice: "female", text: "嗨！歡迎收聽《AI 行銷實戰》，我是你的主持人小雅。" },
  { voice: "male",   text: "我是志豪，今天我們來聊聊如何用 AI 幫你的網站吸引更多客戶。" },
  { voice: "female", text: "對，很多老闆都問我：我的網站有了，但為什麼沒有人來？" },
  { voice: "male",   text: "這個問題太常見了！其實關鍵在於「曝光」，你要讓對的人看到你。" },
];

// SiliconFlow available voices for fish-speech
// Reference voices: fishaudio/fish-speech-1.5:{voice_name}
const VOICE_FEMALE = "fishaudio/fish-speech-1.5:alex";   // Try different voices
const VOICE_MALE   = "fishaudio/fish-speech-1.5:anna";

function fwd(p) {
  return p.replace(/\\/g, "/");
}

async function generateSegment(text, voiceId) {
  const res = await fetch("https://api.siliconflow.cn/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "fishaudio/fish-speech-1.5",
      input: text,
      voice: voiceId,
      response_format: "mp3",
      speed: 1.0,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("\n🎙️  測試 SiliconFlow Fish-Speech-1.5...\n");
  console.log("  先列出可用聲音列表...");

  // List available voices
  try {
    const voiceRes = await fetch("https://api.siliconflow.cn/v1/audio/voice/list?model=fishaudio/fish-speech-1.5", {
      headers: { "Authorization": `Bearer ${API_KEY}` },
    });
    if (voiceRes.ok) {
      const voiceData = await voiceRes.json();
      console.log("  可用聲音：", JSON.stringify(voiceData, null, 2));
    } else {
      console.log("  聲音列表 API 回應：", voiceRes.status, await voiceRes.text());
    }
  } catch (e) {
    console.log("  無法取得聲音列表：", e.message);
  }

  console.log("\n  開始生成測試對話...");

  const tmpDir = path.join(os.tmpdir(), `sf-test-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const segPaths = [];
  for (let i = 0; i < TEST_DIALOGUE.length; i++) {
    const { voice, text } = TEST_DIALOGUE[i];
    const voiceId = voice === "female" ? VOICE_FEMALE : VOICE_MALE;

    process.stdout.write(`  段落 ${i + 1}/${TEST_DIALOGUE.length} [${voice}]... `);
    try {
      const buf = await generateSegment(text, voiceId);
      const segPath = path.join(tmpDir, `seg${i}.mp3`);
      fs.writeFileSync(segPath, buf);
      segPaths.push(segPath);
      console.log(`✓ (${(buf.length / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.log(`❌ 失敗：${err.message}`);
      process.exit(1);
    }
  }

  // Concat with silence
  const silencePath = path.join(tmpDir, "silence.mp3");
  execSync(
    `ffmpeg -y -f lavfi -i "anullsrc=r=24000:cl=mono" -t 0.4 -c:a libmp3lame -q:a 9 "${fwd(silencePath)}"`,
    { stdio: "ignore" }
  );

  const listPath = path.join(tmpDir, "filelist.txt");
  const lines = [];
  for (let i = 0; i < segPaths.length; i++) {
    if (i > 0) lines.push(`file '${fwd(silencePath)}'`);
    lines.push(`file '${fwd(segPaths[i])}'`);
  }
  fs.writeFileSync(listPath, lines.join("\n"), "utf-8");

  const outPath = path.resolve(OUTPUT_DIR, "test-siliconflow.mp3");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${fwd(listPath)}" -c:a libmp3lame -q:a 3 "${fwd(outPath)}"`,
    { stdio: "ignore" }
  );

  console.log(`\n✅ 完成！輸出：${outPath}`);
  console.log(`   檔案大小：${(fs.statSync(outPath).size / 1024).toFixed(1)}KB`);

  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

main().catch(e => { console.error("❌ 錯誤：", e.message); process.exit(1); });
