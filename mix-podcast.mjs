/**
 * 當用戶把背景音樂放到 public/audio/bgm.mp3 之後，
 * 執行這支腳本重新把所有純人聲 MP3 與 BGM 混合。
 * 使用方式：node mix-podcast.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const AUDIO_DIR = "./public/audio";
const BGM_PATH = path.join(AUDIO_DIR, "bgm.mp3");

if (!fs.existsSync(BGM_PATH)) {
  console.error("❌ 找不到 bgm.mp3，請先把背景音樂放到 public/audio/bgm.mp3");
  process.exit(1);
}

const files = fs.readdirSync(AUDIO_DIR).filter(
  (f) => f.startsWith("ep") && f.endsWith(".mp3")
);

if (files.length === 0) {
  console.error("❌ public/audio/ 裡找不到任何 ep*.mp3，請先執行 node gen-podcast-tts.mjs");
  process.exit(1);
}

console.log(`\n🎵 開始混音 ${files.length} 個音檔...\n`);

for (const file of files) {
  const inputPath = path.join(AUDIO_DIR, file);
  const tmpPath = path.join(AUDIO_DIR, `_tmp_${file}`);

  try {
    execSync(
      `ffmpeg -y -i "${inputPath}" -i "${BGM_PATH}" -filter_complex "[1:a]volume=0.15[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=3[out]" -map "[out]" -codec:a libmp3lame -q:a 3 "${tmpPath}"`,
      { stdio: "ignore" }
    );
    fs.renameSync(tmpPath, inputPath);
    console.log(`  ✅ ${file}`);
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error(`  ❌ ${file}：${err.message}`);
  }
}

console.log("\n✅ 混音完成！");
