import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";

const API_KEY  = "sk-api-IRJgbtSMhj0UWwQyha-7JDcmfX2iVDHuW3orQPIvSDLY57PnFVPPO-7zWrW4j6eCeMKBz1YHXctvM99k5uFvQ3mDOvvSdpiNUdiY-GTVoBu4KG1Tpy7aA8w";
const GROUP_ID = process.env.MINIMAX_GROUP_ID || "";   // 從環境變數帶入
const OUTPUT_DIR = "./public/audio/test";

const TEST_DIALOGUE = [
  { voice: "female", text: "嗨！歡迎收聽《AI 行銷實戰》，我是你的主持人小雅。" },
  { voice: "male",   text: "我是志豪，今天我們來聊聊如何用 AI 幫你的網站吸引更多客戶。" },
  { voice: "female", text: "對，很多老闆都問我：我的網站有了，但為什麼沒有人來？" },
  { voice: "male",   text: "這個問題太常見了！其實關鍵在於「曝光」，你要讓對的人看到你。" },
];

// MiniMax Speech-02-HD voices
// Female: Mandarin natural, clear diction
const VOICE_FEMALE = "female-shaonv";    // 少女音 — 清亮自然
const VOICE_MALE   = "male-qn-jingying"; // 精英青年 — 沉穩有力

function fwd(p) { return p.replace(/\\/g, "/"); }

async function generateSegment(text, voiceId) {
  if (!GROUP_ID) throw new Error("MINIMAX_GROUP_ID 未設定，請執行 MINIMAX_GROUP_ID=xxx node test-minimax-tts.mjs");

  const res = await fetch(`https://api.minimaxi.chat/v1/t2a_v2?GroupId=${GROUP_ID}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "speech-02-hd",
      text,
      stream: false,
      voice_setting: {
        voice_id: voiceId,
        speed: 1.0,
        vol: 1.0,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }

  const data = await res.json();
  if (data.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax error: ${data.base_resp?.status_msg}`);
  }

  // data.audio_file is hex-encoded mp3
  const hexStr = data.audio_file || data.data?.audio;
  if (!hexStr) throw new Error("回應中沒有 audio 資料: " + JSON.stringify(data));
  return Buffer.from(hexStr, "hex");
}

async function main() {
  if (!GROUP_ID) {
    console.error("❌ 請先設定 Group ID：");
    console.error("   MINIMAX_GROUP_ID=你的groupId node test-minimax-tts.mjs");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("\n🎙️  測試 MiniMax Speech-02-HD...\n");
  console.log(`  Group ID: ${GROUP_ID}`);
  console.log(`  女聲: ${VOICE_FEMALE}`);
  console.log(`  男聲: ${VOICE_MALE}\n`);

  const tmpDir = path.join(os.tmpdir(), `mm-test-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const segPaths = [];
  for (let i = 0; i < TEST_DIALOGUE.length; i++) {
    const { voice, text } = TEST_DIALOGUE[i];
    const voiceId = voice === "female" ? VOICE_FEMALE : VOICE_MALE;
    process.stdout.write(`  段落 ${i + 1}/${TEST_DIALOGUE.length} [${voice}/${voiceId}]... `);
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

  // Concat with 400ms silence
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

  const outPath = path.resolve(OUTPUT_DIR, "test-minimax.mp3");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${fwd(listPath)}" -c:a libmp3lame -q:a 3 "${fwd(outPath)}"`,
    { stdio: "ignore" }
  );

  console.log(`\n✅ 完成！輸出：${outPath}`);
  console.log(`   檔案大小：${(fs.statSync(outPath).size / 1024).toFixed(1)}KB`);

  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

main().catch(e => { console.error("❌ 錯誤：", e.message); process.exit(1); });
