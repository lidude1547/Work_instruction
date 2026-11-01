// 繪圖工具庫：所有畫面都是時間 t 的純函數，任何時間點都能直接算出該格畫面（可拖曳、可變速、可逐格輸出）。
const W = 1920, H = 1080;
const C = {
  bg: '#04060c', cy: '#38e8ff', vi: '#a46bff', am: '#ffb23f', rd: '#ff4d6d', gr: '#4dffa6',
  wh: '#eaf6ff', ink: '#8ea3ba', dim: '#3a4a5e', cu: '#e08a4f', si: '#5d6878',
};
const F = {
  tc: '"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',
  en: '"Space Grotesk","Segoe UI",sans-serif',
  mono: '"JetBrains Mono",Consolas,monospace',
};

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const E = {
  lin: (t) => t,
  inQ: (t) => t * t,
  outQ: (t) => 1 - (1 - t) * (1 - t),
  ioQ: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outC: (t) => 1 - Math.pow(1 - t, 3),
  inC: (t) => t * t * t,
  ioC: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outE: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  ioE: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  ioS: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
// 區段進度：t 從 a 走到 b 時，回傳套用 easing 後的 0→1
const seg = (t, a, b, ease = E.outC) => ease(inv(a, b, t));
// 進場 + 退場的包絡
const life = (t, a, b, fi = 0.5, fo = 0.5) => Math.min(seg(t, a, a + fi, E.outC), 1 - seg(t, b - fo, b, E.inQ));
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hash2 = (i, j) => hash(i * 57.13 + j * 13.37);
// 三角波反彈（粒子在牆間直線來回）
const tri = (x, len) => { const m = ((x % (2 * len)) + 2 * len) % (2 * len); return m < len ? m : 2 * len - m; };

function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgba(hex, a = 1) { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function shade(hex, f, a = 1) {
  const [r, g, b] = hexRgb(hex);
  const m = (v) => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f));
  return `rgba(${m(r)},${m(g)},${m(b)},${a})`;
}
function mix(h1, h2, t) {
  const a = hexRgb(h1), b = hexRgb(h2);
  const c = a.map((v, i) => Math.round(lerp(v, b[i], t)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------- 快取的光暈貼圖 ----------
const _glow = {};
function glowSprite(color) {
  if (_glow[color]) return _glow[color];
  const s = 128, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, rgba(color, 1)); gr.addColorStop(0.18, rgba(color, 0.55)); gr.addColorStop(0.5, rgba(color, 0.12)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  return (_glow[color] = cv);
}
function glow(c, x, y, r, color, a = 1) {
  if (a <= 0.003 || r <= 0) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(a);
  c.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  c.restore();
}
function dot(c, x, y, r, color, a = 1) {
  c.globalAlpha = clamp(a); c.fillStyle = color; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
}
// 帶核心亮點與光暈的粒子
function spark(c, x, y, r, color, a = 1) {
  glow(c, x, y, r * 5, color, a * 0.8);
  dot(c, x, y, r, mix(color, '#ffffff', 0.55), a);
}

// ---------- 文字 ----------
function font(size, w = 700, fam = F.tc) { return `${w} ${size}px ${fam}`; }
function text(c, s, x, y, o = {}) {
  c.save();
  c.font = font(o.size || 32, o.w || 500, o.f || F.tc);
  c.fillStyle = o.color || C.wh;
  c.textAlign = o.align || 'left';
  c.textBaseline = o.base || 'alphabetic';
  c.globalAlpha = clamp(o.a === undefined ? 1 : o.a);
  if ('letterSpacing' in c) c.letterSpacing = (o.ls || 0) + 'px';
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 18; }
  if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 2; c.strokeText(s, x, y); }
  else c.fillText(s, x, y);
  c.restore();
}
function measure(c, s, size, w = 500, fam = F.tc, ls = 0) {
  c.save(); c.font = font(size, w, fam);
  if ('letterSpacing' in c) c.letterSpacing = ls + 'px';
  const m = c.measureText(s).width; c.restore(); return m;
}
// 逐字進場（每個字從下方淡入並模糊對焦）
function textIn(c, s, x, y, p, o = {}) {
  const chars = [...s], n = chars.length, size = o.size || 32, ls = o.ls || 0;
  const wTot = measure(c, s, size, o.w || 500, o.f || F.tc, ls);
  let cx = o.align === 'center' ? x - wTot / 2 : o.align === 'right' ? x - wTot : x;
  const spread = o.spread || 0.6;
  for (let i = 0; i < n; i++) {
    const cw = measure(c, chars[i], size, o.w || 500, o.f || F.tc, ls);
    const lp = E.outC(clamp((p * (1 + spread) - (i / Math.max(1, n - 1)) * spread) / 1));
    if (lp > 0) text(c, chars[i], cx, y + (1 - lp) * (o.dy === undefined ? size * 0.5 : o.dy), { ...o, align: 'left', a: lp * (o.a === undefined ? 1 : o.a) });
    cx += cw;
  }
}
// 打字機效果（含游標）
function typed(c, s, x, y, p, o = {}) {
  const chars = [...s], k = Math.floor(chars.length * clamp(p));
  const shown = chars.slice(0, k).join('');
  text(c, shown, x, y, o);
  if (p > 0 && p < 1.05) {
    const w = measure(c, shown, o.size || 32, o.w || 500, o.f || F.mono, o.ls || 0);
    const xx = (o.align === 'center' ? x - measure(c, s, o.size || 32, o.w || 500, o.f || F.mono, o.ls || 0) / 2 : x) + w + 4;
    c.fillStyle = o.color || C.cy; c.globalAlpha = (Math.floor(p * 40) % 2) ? 1 : 0.3;
    c.fillRect(xx, y - (o.size || 32) * 0.8, (o.size || 32) * 0.5, (o.size || 32) * 0.95); c.globalAlpha = 1;
  }
}
// 數字滾動
function counter(v, digits = 0) { return v.toFixed(digits); }

// ---------- 形狀 ----------
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
// HUD 風格面板：半透明底 + 邊框 + 角落刻度
function panel(c, x, y, w, h, o = {}) {
  const a = o.a === undefined ? 1 : o.a, col = o.color || C.cy;
  if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  rr(c, x, y, w, h, o.r || 14);
  c.fillStyle = o.fill || 'rgba(8,14,26,0.72)'; c.fill();
  if (o.glow) { c.shadowColor = col; c.shadowBlur = 30 * o.glow; }
  c.strokeStyle = rgba(col, o.line || 0.55); c.lineWidth = o.lw || 2; c.stroke();
  c.shadowBlur = 0;
  c.strokeStyle = col; c.lineWidth = 3;
  const k = 18;
  for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    c.beginPath(); c.moveTo(px + dx * 6, py + dy * (6 + k)); c.lineTo(px + dx * 6, py + dy * 6); c.lineTo(px + dx * (6 + k), py + dy * 6); c.stroke();
  }
  c.restore();
}
// 按長度比例描出折線
function polyline(c, pts, p = 1, close = false) {
  const P = close ? [...pts, pts[0]] : pts;
  let total = 0; const segs = [];
  for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); segs.push(d); total += d; }
  let left = total * clamp(p);
  c.beginPath(); c.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length && left > 0; i++) {
    const d = segs[i - 1], u = Math.min(1, left / d);
    c.lineTo(lerp(P[i - 1][0], P[i][0], u), lerp(P[i - 1][1], P[i][1], u));
    left -= d;
  }
  c.stroke();
}
function line(c, x1, y1, x2, y2, col, lw = 2, a = 1, p = 1) {
  c.save(); c.globalAlpha = clamp(a); c.strokeStyle = col; c.lineWidth = lw;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(lerp(x1, x2, clamp(p)), lerp(y1, y2, clamp(p))); c.stroke(); c.restore();
}
function arrow(c, x1, y1, x2, y2, col, lw = 3, a = 1, head = 14) {
  if (a <= 0) return;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  c.save(); c.globalAlpha = clamp(a); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(ang) * head * 0.6, y2 - Math.sin(ang) * head * 0.6); c.stroke();
  c.beginPath(); c.moveTo(x2, y2);
  c.lineTo(x2 - Math.cos(ang - 0.45) * head, y2 - Math.sin(ang - 0.45) * head);
  c.lineTo(x2 - Math.cos(ang + 0.45) * head, y2 - Math.sin(ang + 0.45) * head);
  c.closePath(); c.fill(); c.restore();
}
// 標註引線：點 → 折線 → 文字
function callout(c, x, y, tx, ty, label, sub, col, p, o = {}) {
  if (p <= 0) return;
  const right = tx > x;
  c.save();
  dot(c, x, y, 6, col, p); glow(c, x, y, 26, col, p * 0.7);
  c.strokeStyle = col; c.lineWidth = 2; c.globalAlpha = p;
  polyline(c, [[x, y], [tx, ty], [tx + (right ? 40 : -40), ty]], seg(p, 0, 0.6));
  c.restore();
  const tp = seg(p, 0.4, 1);
  const lx = tx + (right ? 52 : -52);
  text(c, label, lx, ty - 4, { size: o.size || 30, w: 700, color: col, align: right ? 'left' : 'right', a: tp });
  if (sub) text(c, sub, lx, ty + 32, { size: o.subSize || 22, w: 400, color: C.ink, align: right ? 'left' : 'right', a: tp, f: o.subF || F.tc });
}

// ---------- 照片 ----------
const IMG = {};
function loadImages(list) {
  return Promise.all(list.map(([k, src]) => new Promise((res) => {
    const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => res(); im.src = src;
  })));
}
// 照片：cover 填滿 + Ken Burns 推移 + 單色調（不讀取像素，file:// 下也能用）
function photo(c, key, o = {}) {
  const im = IMG[key]; if (!im) return;
  const a = o.a === undefined ? 1 : o.a; if (a <= 0) return;
  const x = o.x || 0, y = o.y || 0, w = o.w || W, h = o.h || H;
  const z = o.zoom || 1, s = Math.max(w / im.width, h / im.height) * z;
  const iw = im.width * s, ih = im.height * s;
  const px = x + (w - iw) / 2 + (o.px || 0) * (iw - w) / 2, py = y + (h - ih) / 2 + (o.py || 0) * (ih - h) / 2;
  c.save(); c.globalAlpha = a;
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.filter = o.filter || 'none';
  c.drawImage(im, px, py, iw, ih);
  c.filter = 'none';
  if (o.tint) { c.globalCompositeOperation = 'color'; c.fillStyle = o.tint; c.fillRect(x, y, w, h); }
  if (o.overlay) { c.globalCompositeOperation = 'source-over'; c.fillStyle = o.overlay; c.fillRect(x, y, w, h); }
  c.restore();
}

// ---------- 等角投影（isometric） ----------
function isoP(o, x, y, z) {
  const s = o.s || 1;
  return [o.x + (x - y) * 0.866 * s, o.y + (x + y) * 0.5 * s - z * s];
}
// 等角方塊：上、左前、右前三個面分別打光
function isoBox(c, o, x, y, z, w, d, h, col, opt = {}) {
  const a = opt.a === undefined ? 1 : opt.a; if (a <= 0 || h <= 0) return;
  const P = (X, Y, Z) => isoP(o, X, Y, Z);
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  c.save(); c.globalAlpha = a;
  const face = (pts, fill) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = fill; c.fill(); if (opt.edge !== false) { c.strokeStyle = opt.edge || shade(col, 0.45, 0.55); c.lineWidth = opt.lw || 1.2; c.stroke(); } };
  const al = opt.alpha === undefined ? 1 : opt.alpha;
  face(left, shade(col, -0.35, al));
  face(right, shade(col, -0.6, al));
  face(top, shade(col, 0.12, al));
  if (opt.glow) { c.globalCompositeOperation = 'lighter'; c.shadowColor = col; c.shadowBlur = 25 * opt.glow; c.strokeStyle = rgba(col, 0.8 * opt.glow); c.lineWidth = 2; c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke(); }
  c.restore();
}

// ---------- 背景、底紋 ----------
let _grain = null, _vig = null;
function grainTex() {
  if (_grain) return _grain;
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d'), d = g.createImageData(s, s);
  for (let i = 0; i < s * s; i++) { const v = Math.floor(hash(i * 0.731) * 255); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
  g.putImageData(d, 0, 0); return (_grain = cv);
}
function vignette(c, k = 1) {
  if (!_vig) {
    _vig = document.createElement('canvas'); _vig.width = W; _vig.height = H;
    const g = _vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  c.save(); c.globalAlpha = k; c.drawImage(_vig, 0, 0); c.restore();
}
function grain(c, t, a = 0.06) {
  const g = grainTex(), f = Math.floor(t * 24);
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay';
  const ox = -Math.floor(hash(f) * 256), oy = -Math.floor(hash(f + 7) * 256);
  c.fillStyle = c.createPattern(g, 'repeat');
  c.translate(ox, oy); c.fillRect(0, 0, W + 256, H + 256);
  c.restore();
}
// 共用背景：深色底 + 漂移格線 + 漂浮微粒
function bg(c, t, o = {}) {
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  const col = o.color || C.cy;
  const gr = c.createRadialGradient(W * (o.cx || 0.5), H * (o.cy || 0.45), 0, W * 0.5, H * 0.5, W * 0.75);
  gr.addColorStop(0, rgba(col, 0.10 * (o.k === undefined ? 1 : o.k))); gr.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  if (o.grid !== false) {
    const step = 60, off = (t * 6) % step;
    c.save(); c.strokeStyle = rgba(col, 0.045); c.lineWidth = 1; c.beginPath();
    for (let x = -off; x < W; x += step) { c.moveTo(x, 0); c.lineTo(x, H); }
    for (let y = -off * 0.5; y < H; y += step) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    c.fillStyle = rgba(col, 0.16);
    for (let x = -off; x < W; x += step * 4) for (let y = -off * 0.5; y < H; y += step * 4) c.fillRect(x - 3, y - 0.5, 7, 1.5), c.fillRect(x - 0.5, y - 3, 1.5, 7);
    c.restore();
  }
  const n = o.dust === undefined ? 40 : o.dust;
  for (let i = 0; i < n; i++) {
    const x = (hash(i) * W + t * (8 + hash(i + 3) * 20)) % W, y = (hash(i + 9) * H - t * (4 + hash(i + 5) * 10) + H * 10) % H;
    glow(c, x, y, 6 + hash(i + 2) * 14, i % 3 ? col : C.vi, 0.18 + 0.15 * Math.sin(t * 1.3 + i));
  }
}
