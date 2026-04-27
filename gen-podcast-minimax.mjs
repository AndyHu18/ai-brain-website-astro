// gen-podcast-minimax.mjs
// Replaces gen-podcast-tts.mjs (Gemini, robotic) with MiniMax Speech-02-HD (natural Mandarin).
// Run AFTER topping up balance at platform.minimax.io/user-center/payment/recharge
// Usage:
//   1. Copy .env.example -> .env.local, fill in MINIMAX_API_KEY + MINIMAX_GROUP_ID
//   2. node --env-file=.env.local gen-podcast-minimax.mjs
//      (or: set vars in shell, then `node gen-podcast-minimax.mjs`)

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const API_KEY  = process.env.MINIMAX_API_KEY || "";
const GROUP_ID = process.env.MINIMAX_GROUP_ID || "";

const SCRIPTS_DIR = "./audio-scripts";
const OUTPUT_DIR  = "./public/audio";
const BGM_PATH    = "./public/audio/bgm.mp3";

// MiniMax Speech-02-HD voices — natural Mandarin
const VOICE_FEMALE = "female-shaonv";     // 少女音 — clear, warm
const VOICE_MALE   = "male-qn-jingying";  // 精英青年 — confident, professional
const SPEECH_MODEL = "speech-02-hd";

const SILENCE_MS  = 400;       // pause between segments
const BGM_VOLUME  = 0.12;      // BGM gain (lower than 0.15 default — bgm was overpowering)

const EPISODES = [
  { script: "00-series.md",     out: "ep00-series" },
  { script: "01-exposure.md",   out: "ep01-exposure" },
  { script: "02-homepage.md",   out: "ep02-homepage" },
  { script: "03-pricing.md",    out: "ep03-pricing" },
  { script: "04-google.md",     out: "ep04-google" },
  { script: "05-content.md",    out: "ep05-content" },
  { script: "06-seo.md",        out: "ep06-seo" },
  { script: "07-automation.md", out: "ep07-automation" },
  { script: "08-upsell.md",     out: "ep08-upsell" },
  { script: "09-retention.md",  out: "ep09-retention" },
  { script: "10-referral.md",   out: "ep10-referral" },
  { script: "11-trust.md",      out: "ep11-trust" },
  { script: "12-integration.md",out: "ep12-integration" },
];

// === Parse [小雅] / [志豪] dialogue lines from markdown after the first --- divider ===
function parseScript(content) {
  const segments = [];
  const lines = content.split("\n");
  let inDialogue = false;
  for (const line of lines) {
    if (line.trim() === "---") { inDialogue = true; continue; }
    if (!inDialogue) continue;
    const f = line.match(/^\[小雅\]\s*(.+)/);
    const m = line.match(/^\[志豪\]\s*(.+)/);
    if (f)      segments.push({ voice: VOICE_FEMALE, text: f[1].trim() });
    else if (m) segments.push({ voice: VOICE_MALE,   text: m[1].trim() });
  }
  return segments;
}

// === Call MiniMax T2A v2; returns mp3 Buffer ===
async function generateSegment(text, voiceId) {
  const res = await fetch(`https://api.minimaxi.chat/v1/t2a_v2?GroupId=${GROUP_ID}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: SPEECH_MODEL,
      text,
      stream: false,
      voice_setting: { voice_id: voiceId, speed: 1.0, vol: 1.0, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  const data = await res.json();
  if (data.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax error ${data.base_resp?.status_code}: ${data.base_resp?.status_msg}`);
  }
  const hex = data.audio_file || data.data?.audio;
  if (!hex) throw new Error("No audio data: " + JSON.stringify(data).slice(0, 300));
  return Buffer.from(hex, "hex");
}

const fwd = (p) => p.replace(/\\/g, "/");

async function generateEpisode({ script, out }) {
  const scriptPath = path.join(SCRIPTS_DIR, script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`  ❌ Missing: ${script}`);
    return false;
  }
  const segments = parseScript(fs.readFileSync(scriptPath, "utf-8"));
  if (!segments.length) {
    console.error(`  ❌ ${script}: no dialogue parsed`);
    return false;
  }

  console.log(`  ⏳ ${out}: ${segments.length} segments`);
  const tmpDir = path.join(os.tmpdir(), `mm-${out}-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const segPaths = [];

  // Fetch all segments
  for (let i = 0; i < segments.length; i++) {
    const { voice, text } = segments[i];
    try {
      const buf = await generateSegment(text, voice);
      const p = path.join(tmpDir, `seg${i}.mp3`);
      fs.writeFileSync(p, buf);
      segPaths.push(p);
      process.stdout.write(`    [${i + 1}/${segments.length}] ${voice} ✓ (${(buf.length / 1024).toFixed(0)}KB)\r`);
    } catch (err) {
      console.error(`\n    ❌ segment ${i + 1} failed: ${err.message}`);
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      return false;
    }
  }
  console.log();

  // Generate silence file
  const silencePath = path.join(tmpDir, "silence.mp3");
  execSync(
    `ffmpeg -y -f lavfi -i "anullsrc=r=32000:cl=mono" -t ${SILENCE_MS / 1000} -c:a libmp3lame -q:a 9 "${fwd(silencePath)}"`,
    { stdio: "ignore" }
  );

  // Concat segments with silence between
  const listPath = path.join(tmpDir, "filelist.txt");
  const lines = [];
  for (let i = 0; i < segPaths.length; i++) {
    if (i > 0) lines.push(`file '${fwd(silencePath)}'`);
    lines.push(`file '${fwd(segPaths[i])}'`);
  }
  fs.writeFileSync(listPath, lines.join("\n"), "utf-8");

  const voicePath = path.join(tmpDir, "voice.mp3");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${fwd(listPath)}" -c:a libmp3lame -q:a 3 "${fwd(voicePath)}"`,
    { stdio: "ignore" }
  );

  // Mix BGM if available
  const mp3Path = path.join(OUTPUT_DIR, `${out}.mp3`);
  if (fs.existsSync(BGM_PATH)) {
    try {
      execSync(
        `ffmpeg -y -i "${fwd(path.resolve(voicePath))}" -i "${fwd(path.resolve(BGM_PATH))}" -filter_complex "[1:a]volume=${BGM_VOLUME}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=3[out]" -map "[out]" -codec:a libmp3lame -q:a 3 "${fwd(mp3Path)}"`,
        { stdio: "ignore" }
      );
      console.log(`  🎵 mixed (BGM @ ${BGM_VOLUME}): ${out}.mp3`);
    } catch (err) {
      fs.copyFileSync(voicePath, mp3Path);
      console.error(`  ⚠️  BGM mix failed, voice only: ${err.message}`);
    }
  } else {
    fs.copyFileSync(voicePath, mp3Path);
    console.log(`  🎵 voice only (no BGM): ${out}.mp3`);
  }

  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  return true;
}

async function main() {
  if (!API_KEY)  { console.error("❌ MINIMAX_API_KEY missing. Set in .env.local."); process.exit(1); }
  if (!GROUP_ID) { console.error("❌ MINIMAX_GROUP_ID missing. Get from platform.minimax.io/user-center/basic-information"); process.exit(1); }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("\n🎙️  MiniMax Podcast Generator (Speech-02-HD)\n");
  console.log(`  Female voice: ${VOICE_FEMALE}`);
  console.log(`  Male voice:   ${VOICE_MALE}`);
  console.log(`  BGM:          ${fs.existsSync(BGM_PATH) ? `✓ ${BGM_PATH} (vol ${BGM_VOLUME})` : "✗ (voice only)"}\n`);

  const start = Date.now();
  let ok = 0;
  for (const ep of EPISODES) {
    const success = await generateEpisode(ep);
    if (success) ok++;
    console.log();
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("─".repeat(60));
  console.log(`✅ Done: ${ok}/${EPISODES.length} episodes  |  ${elapsed}s`);
  if (ok === EPISODES.length) {
    console.log("\n📝 Next:");
    console.log("   1. Restore AUDIO_MAP in src/layouts/ArticleLayout.astro");
    console.log("   2. npx astro build && git add -A && git commit -m 'feat(audio): MiniMax voice'");
    console.log("   3. git push && npx vercel deploy --prod --yes");
  }
}

main().catch(e => { console.error("\n❌ Fatal:", e.message); process.exit(1); });
