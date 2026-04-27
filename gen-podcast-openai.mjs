import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const SCRIPTS_DIR = "./audio-scripts";
const OUTPUT_DIR = "./public/audio";
const BGM_PATH = "./public/audio/bgm.mp3";
const VOICE_FEMALE = "nova";   // 小雅 — warm female
const VOICE_MALE = "onyx";     // 志豪 — deep male

const EPISODES = [
  { script: "00-series.md",    out: "ep00-series" },
  { script: "01-exposure.md",  out: "ep01-exposure" },
  { script: "02-homepage.md",  out: "ep02-homepage" },
  { script: "03-pricing.md",   out: "ep03-pricing" },
  { script: "04-google.md",    out: "ep04-google" },
  { script: "05-content.md",   out: "ep05-content" },
  { script: "06-seo.md",       out: "ep06-seo" },
  { script: "07-automation.md",out: "ep07-automation" },
  { script: "08-upsell.md",    out: "ep08-upsell" },
  { script: "09-retention.md", out: "ep09-retention" },
  { script: "10-referral.md",  out: "ep10-referral" },
  { script: "11-trust.md",     out: "ep11-trust" },
  { script: "12-integration.md",out: "ep12-integration" },
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

async function generateSegmentMp3(client, text, voice) {
  const res = await client.audio.speech.create({
    model: "tts-1-hd",
    voice,
    input: text,
    response_format: "mp3",
  });
  return Buffer.from(await res.arrayBuffer());
}

function fwd(p) {
  return p.replace(/\\/g, "/");
}

async function generateEpisode(client, { script, out }) {
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

  const tmpDir = path.join(os.tmpdir(), `podcast-${out}-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    // silence: 400ms
    const silencePath = path.join(tmpDir, "silence.mp3");
    execSync(`ffmpeg -y -f lavfi -i "anullsrc=r=24000:cl=mono" -t 0.4 -c:a libmp3lame -q:a 9 "${fwd(silencePath)}"`, { stdio: "ignore" });

    // generate each segment
    const segPaths = [];
    for (let i = 0; i < segments.length; i++) {
      const { voice, text } = segments[i];
      const segPath = path.join(tmpDir, `seg${String(i).padStart(3, "0")}.mp3`);
      try {
        const buf = await generateSegmentMp3(client, text, voice);
        fs.writeFileSync(segPath, buf);
        segPaths.push(segPath);
        process.stdout.write(`    段落 ${i + 1}/${segments.length} ✓\r`);
      } catch (err) {
        console.error(`\n    ❌ 段落 ${i + 1} 失敗：${err.message}`);
        return false;
      }
    }

    // concat filelist
    const listPath = path.join(tmpDir, "filelist.txt");
    const lines = [];
    for (let i = 0; i < segPaths.length; i++) {
      if (i > 0) lines.push(`file '${fwd(silencePath)}'`);
      lines.push(`file '${fwd(segPaths[i])}'`);
    }
    fs.writeFileSync(listPath, lines.join("\n"), "utf-8");

    // concat → voice.mp3
    const voicePath = path.join(tmpDir, "voice.mp3");
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${fwd(listPath)}" -c:a libmp3lame -q:a 3 "${fwd(voicePath)}"`,
      { stdio: "ignore" }
    );

    // mix with BGM or plain copy
    const mp3Path = path.resolve(OUTPUT_DIR, `${out}.mp3`);
    const hasBGM = fs.existsSync(BGM_PATH);

    if (hasBGM) {
      const bgmAbs = path.resolve(BGM_PATH);
      execSync(
        `ffmpeg -y -i "${fwd(path.resolve(voicePath))}" -i "${fwd(bgmAbs)}" -filter_complex "[1:a]volume=0.15[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=3[out]" -map "[out]" -codec:a libmp3lame -q:a 3 "${fwd(mp3Path)}"`,
        { stdio: "ignore" }
      );
      console.log(`\n  🎵 混音完成：${out}.mp3`);
    } else {
      fs.copyFileSync(voicePath, mp3Path);
      console.log(`\n  🎵 完成（無 BGM）：${out}.mp3`);
    }

    return true;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ 未設定 OPENAI_API_KEY 環境變數");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("\n🎙️  開始生成 Podcast 音檔（OpenAI TTS · tts-1-hd）...\n");
  const hasBGM = fs.existsSync(BGM_PATH);
  console.log(`BGM：${hasBGM ? "✅ 找到 bgm.mp3，將混入背景音樂" : "⚠️  未找到 bgm.mp3，將只輸出純人聲 MP3"}\n`);

  const start = Date.now();
  let success = 0;

  for (const ep of EPISODES) {
    const ok = await generateEpisode(client, ep);
    if (ok) success++;
    console.log();
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("─".repeat(50));
  console.log(`✅ 完成：${success}/${EPISODES.length} 集  |  耗時：${elapsed}s`);
}

main();
