import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";

const API_KEY = "AIzaSyCb1I2NLVxaup1FIC6byGwRFt4bieTHt0w";
const SCRIPTS_DIR = "./audio-scripts";
const OUTPUT_DIR = "./public/audio";
const BGM_PATH = "./public/audio/bgm.mp3";
const TTS_MODEL = "gemini-2.5-pro-preview-tts";
const VOICE_FEMALE = "Kore";
const VOICE_MALE = "Puck";
const SAMPLE_RATE = 24000;
const SILENCE_MS = 400;

const EPISODES = [
  { script: "00-series.md", out: "ep00-series" },
  { script: "01-exposure.md", out: "ep01-exposure" },
  { script: "02-homepage.md", out: "ep02-homepage" },
  { script: "03-pricing.md", out: "ep03-pricing" },
  { script: "04-google.md", out: "ep04-google" },
  { script: "05-content.md", out: "ep05-content" },
  { script: "06-seo.md", out: "ep06-seo" },
  { script: "07-automation.md", out: "ep07-automation" },
  { script: "08-upsell.md", out: "ep08-upsell" },
  { script: "09-retention.md", out: "ep09-retention" },
  { script: "10-referral.md", out: "ep10-referral" },
  { script: "11-trust.md", out: "ep11-trust" },
  { script: "12-integration.md", out: "ep12-integration" },
];

function parseScript(content) {
  const segments = [];
  const lines = content.split("\n");
  let inDialogue = false;
  for (const line of lines) {
    if (line.trim() === "---") { inDialogue = true; continue; }
    if (!inDialogue) continue;
    const femaleMatch = line.match(/^\[小雅\]\s*(.+)/);
    const maleMatch = line.match(/^\[志豪\]\s*(.+)/);
    if (femaleMatch) segments.push({ voice: VOICE_FEMALE, text: femaleMatch[1].trim() });
    else if (maleMatch) segments.push({ voice: VOICE_MALE, text: maleMatch[1].trim() });
  }
  return segments;
}

function callTTS(text, voiceName) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/${TTS_MODEL}:generateContent?key=${API_KEY}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(raw);
          if (json.error) return reject(new Error(json.error.message));
          const b64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!b64) return reject(new Error("No audio data in response: " + raw.slice(0, 300)));
          resolve(Buffer.from(b64, "base64"));
        } catch (e) {
          reject(new Error("Parse failed: " + raw.slice(0, 300)));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function makeSilence(ms) {
  const samples = Math.floor((SAMPLE_RATE * ms) / 1000);
  return Buffer.alloc(samples * 2, 0);
}

function writeWav(pcmData, filePath) {
  const dataLen = pcmData.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLen, 40);
  fs.writeFileSync(filePath, Buffer.concat([header, pcmData]));
}

async function generateEpisode({ script, out }) {
  const scriptPath = path.join(SCRIPTS_DIR, script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`  ❌ 找不到腳本：${script}`);
    return false;
  }
  const content = fs.readFileSync(scriptPath, "utf-8");
  const segments = parseScript(content);
  if (segments.length === 0) {
    console.error(`  ❌ ${script} 沒有解析到對話段落`);
    return false;
  }

  console.log(`  ⏳ ${out}：${segments.length} 段對話`);
  const pcmBuffers = [];
  const silence = makeSilence(SILENCE_MS);

  for (let i = 0; i < segments.length; i++) {
    const { voice, text } = segments[i];
    if (i > 0) await new Promise(r => setTimeout(r, 3500));
    try {
      const pcm = await callTTS(text, voice);
      if (i > 0) pcmBuffers.push(silence);
      pcmBuffers.push(pcm);
      process.stdout.write(`    段落 ${i + 1}/${segments.length} ✓\r`);
    } catch (err) {
      console.error(`\n    ❌ 段落 ${i + 1} 失敗：${err.message}`);
      return false;
    }
  }

  const wavPath = path.join(OUTPUT_DIR, `${out}.wav`);
  writeWav(Buffer.concat(pcmBuffers), wavPath);
  console.log(`\n  ✅ WAV 完成：${out}.wav`);

  const mp3Path = path.join(OUTPUT_DIR, `${out}.mp3`);
  const hasBGM = fs.existsSync(BGM_PATH);

  if (hasBGM) {
    try {
      execSync(
        `ffmpeg -y -i "${wavPath}" -i "${BGM_PATH}" -filter_complex "[1:a]volume=0.15[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=3[out]" -map "[out]" -codec:a libmp3lame -q:a 3 "${mp3Path}"`,
        { stdio: "ignore" }
      );
      fs.unlinkSync(wavPath);
      console.log(`  🎵 混音完成：${out}.mp3`);
    } catch (err) {
      console.error(`  ⚠️  ffmpeg 混音失敗，保留 WAV：${err.message}`);
      fs.renameSync(wavPath, mp3Path.replace(".mp3", ".wav"));
    }
  } else {
    execSync(
      `ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -q:a 3 "${mp3Path}"`,
      { stdio: "ignore" }
    );
    fs.unlinkSync(wavPath);
    console.log(`  🎵 轉 MP3 完成（無 BGM）：${out}.mp3`);
  }

  return true;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("\n🎙️  開始生成 Podcast 音檔...\n");
  console.log(`BGM：${fs.existsSync(BGM_PATH) ? "✅ 找到 bgm.mp3，將混入背景音樂" : "⚠️  未找到 bgm.mp3，將只輸出純人聲 MP3"}\n`);

  const start = Date.now();
  let success = 0;

  for (const ep of EPISODES) {
    const ok = await generateEpisode(ep);
    if (ok) success++;
    console.log();
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("─".repeat(50));
  console.log(`✅ 完成：${success}/${EPISODES.length} 集  |  耗時：${elapsed}s`);
  if (!fs.existsSync(BGM_PATH)) {
    console.log("\n📝 下一步：把背景音樂存為 public/audio/bgm.mp3，再執行 node mix-podcast.mjs 重新混音");
  }
}

main();
