// 逐格輸出 MP4：多個無頭 Chrome 分段渲染 → ffmpeg 編碼 → 合併 → 混入音軌與可切換的字幕軌。
// 用法：node tools/render_mp4.js [fps=30] [workers=6]
// 需要先啟動 node tools/serve.js 8080
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const DATA = require('../app/data.js');

const FPS = +(process.argv[2] || 30), WORKERS = +(process.argv[3] || 6);
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'output'), TMP = path.join(OUT, '.parts');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const URL = 'http://localhost:8080/index.html?render=1';
// RANGE=秒-秒 可只輸出一段做測試
const [RS, RE] = (process.env.RANGE || `0-${DATA.total}`).split('-').map(Number);
const F0 = Math.round(RS * FPS), frames = Math.ceil(RE * FPS) - F0;
fs.mkdirSync(TMP, { recursive: true });

function run(cmd, args, opt = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'pipe'], ...opt });
    let err = ''; p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => (code ? rej(new Error(cmd + ' exited ' + code + '\n' + err.slice(-2000))) : res()));
    if (opt.feed) opt.feed(p);
  });
}

async function renderPart(browser, idx, f0, f1) {
  const file = path.join(TMP, `part${idx}.mp4`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.evaluate(() => window.__ready);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'ignore', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error('ffmpeg part ' + idx)) : res())));
  for (let f = f0; f < f1; f++) {
    const b64 = await page.evaluate((t) => { window.__render(t); return document.getElementById('stage').toDataURL('image/jpeg', 0.93).split(',')[1]; }, f / FPS);
    const buf = Buffer.from(b64, 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`part ${idx}: ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await done;
  await page.close();
  return file;
}

(async () => {
  console.time('render');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const per = Math.ceil(frames / WORKERS), jobs = [];
  for (let i = 0; i < WORKERS; i++) jobs.push(renderPart(browser, i, F0 + i * per, F0 + Math.min(frames, (i + 1) * per)));
  const parts = await Promise.all(jobs);
  await browser.close();
  console.timeEnd('render');

  const list = path.join(TMP, 'list.txt');
  fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
  const video = path.join(TMP, 'video.mp4');
  await run('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
  const final = path.join(OUT, process.env.RANGE ? 'test_clip.mp4' : 'DEPOSITION_showreel_1080p.mp4');
  await run('ffmpeg', ['-loglevel', 'error', '-y', '-i', video, '-ss', String(RS), '-i', path.join(ROOT, 'assets/audio/soundtrack.mp3'), '-i', path.join(OUT, 'subtitles.zh-TW.srt'),
    '-map', '0:v', '-map', '1:a', '-map', '2:s', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-c:s', 'mov_text',
    '-metadata:s:s:0', 'language=chi', '-metadata:s:s:0', 'title=繁體中文', '-metadata', 'title=' + DATA.config.title + ' — ' + DATA.config.titleEn,
    '-t', String(RE - RS), '-movflags', '+faststart', final]);
  console.log('wrote', final);
})().catch((e) => { console.error(e); process.exit(1); });
