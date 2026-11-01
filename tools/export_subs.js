// 由 app/data.js 匯出字幕（SRT / VTT）與完整腳本 SCRIPT.md
const fs = require('fs');
const path = require('path');
const DATA = require('../app/data.js');
const out = path.join(__dirname, '..', 'output');
fs.mkdirSync(out, { recursive: true });

const ts = (t, sep) => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`;
};
const cues = [];
for (const s of DATA.scenes) for (const [a, b, tx] of s.cues) cues.push([s.start + a, s.start + b, tx]);
fs.writeFileSync(path.join(out, 'subtitles.zh-TW.srt'), cues.map(([a, b, tx], i) => `${i + 1}\n${ts(a, ',')} --> ${ts(b, ',')}\n${tx}\n`).join('\n'));
fs.writeFileSync(path.join(out, 'subtitles.zh-TW.vtt'), 'WEBVTT\n\n' + cues.map(([a, b, tx]) => `${ts(a, '.')} --> ${ts(b, '.')}\n${tx}\n`).join('\n'));

const mmss = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
let md = `# ${DATA.config.title} — ${DATA.config.titleEn}\n\n`;
md += `**片長** ${mmss(DATA.total)} ・ **受眾** 晶圓廠製程／設備工程師 ・ **形式** 動態圖像 showreel（1920×1080，${DATA.config.bpm} BPM 配樂對拍）\n\n`;
md += `| 章節 | 時間 | 長度 |\n|---|---|---|\n`;
for (const s of DATA.scenes) md += `| CH.${s.ch} ${s.zh} · ${s.en} | ${mmss(s.start)} | ${s.dur}s |\n`;
for (const s of DATA.scenes) {
  md += `\n## CH.${s.ch} ${s.zh} — ${s.en}\n\n_${mmss(s.start)} – ${mmss(s.start + s.dur)}_\n\n| 時間 | 旁白／字幕 |\n|---|---|\n`;
  for (const [a, , tx] of s.cues) md += `| ${mmss(s.start + a)} | ${tx} |\n`;
}
fs.writeFileSync(path.join(__dirname, '..', 'SCRIPT.md'), md);
console.log('cues:', cues.length, 'total', mmss(DATA.total));
