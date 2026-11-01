// Usage: node pexels_search.js "query" [maxResults]
// Lists free Pexels photos (id, size, photographer, alt) by parsing the public search page (fetched with curl).
const { execFileSync } = require('child_process');
const q = process.argv[2], max = +(process.argv[3] || 10);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';
let html = '';
for (let i = 0; i < 5 && !/__NEXT_DATA__/.test(html); i++) {
  if (i) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 4000);
  html = execFileSync('curl', ['-s', '-A', UA, 'https://www.pexels.com/search/' + encodeURIComponent(q) + '/'], { maxBuffer: 64 << 20 }).toString();
}
const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!m) { console.log('(blocked or no data)'); process.exit(0); }
const found = new Map();
const walk = (o) => {
  if (!o || typeof o !== 'object') return;
  if (o.attributes && o.attributes.image && o.attributes.alt !== undefined && o.id) found.set(o.id, o.attributes);
  for (const k in o) walk(o[k]);
};
walk(JSON.parse(m[1]));
let n = 0;
for (const [id, a] of found) {
  if (n++ >= max) break;
  const u = a.user || {};
  console.log([id, a.width + 'x' + a.height, ((u.first_name || '') + ' ' + (u.last_name || '')).trim(), a.alt].join(' | '));
}
