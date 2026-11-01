// 掃描 app/*.js 用到的所有非 ASCII 字元，寫成 app/glyphs.js，讓播放器在繪製前先把網路字型的對應子集載完。
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'app');
const set = new Set();
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.js') || f === 'glyphs.js') continue;
  for (const ch of fs.readFileSync(path.join(dir, f), 'utf8')) if (ch.codePointAt(0) > 127) set.add(ch);
}
const s = [...set].sort().join('');
fs.writeFileSync(path.join(dir, 'glyphs.js'), '// 自動產生：node tools/build_glyphs.js\nconst GLYPHS = ' + JSON.stringify(s) + ';\n');
console.log('glyphs:', set.size);
