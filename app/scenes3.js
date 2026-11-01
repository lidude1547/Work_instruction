// 場景 08–13：量測、填孔、ALD、先進節點、終章、尾聲

// =====================================================================
// 08 均勻度與應力
// =====================================================================
// 厚度場（Å）：中心厚、邊緣薄 + 噴頭造成的六重紋路
function thick(u, v) {
  const r2 = u * u + v * v, r = Math.sqrt(r2), th = Math.atan2(v, u);
  return 5000 * (1 + 0.010 - 0.016 * r2 * r2 + 0.006 * Math.cos(6 * th) * r * r * r + 0.004 * Math.sin(3 * th + 1) * r);
}
function heat(x) { // 0..1 → 藍 → 青 → 綠 → 琥珀 → 紅
  const stops = ['#2a3cff', '#38e8ff', '#4dffa6', '#ffb23f', '#ff4d6d'];
  const k = clamp(x) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(k));
  return mix(stops[i], stops[i + 1], k - i);
}
let _heat = null;
function heatMap(R) {
  if (_heat) return _heat;
  _heat = document.createElement('canvas'); _heat.width = _heat.height = 2 * R;
  const g = _heat.getContext('2d'), cs = 12;
  for (let y = -R; y < R; y += cs) for (let x = -R; x < R; x += cs) {
    const u = (x + cs / 2) / R, v = (y + cs / 2) / R;
    if (u * u + v * v > 1.05) continue;
    g.fillStyle = heat((thick(u, v) - 4900) / 200);
    g.fillRect(R + x, R + y, cs + 0.5, cs + 0.5);
  }
  return _heat;
}
const PTS49 = (() => {
  const p = [[0, 0]];
  [[8, 0.33], [16, 0.66], [24, 0.95]].forEach(([n, r]) => { for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + 0.2; p.push([Math.cos(a) * r, Math.sin(a) * r]); } });
  return p;
})();
SCENES.quality = function (c, t, s) {
  bg(c, t, { color: C.gr, k: 0.5, cx: 0.3 });
  const wx = 500, wy = 560, R = 300;
  const ma = seg(t, 2.4, 3.2), sweep = seg(t, 2.6, 6.0, E.ioQ) * Math.PI * 2;
  const dim = lerp(1, 0.55, seg(t, 24.4, 25.4));
  if (ma > 0) {
    // 厚度場不隨時間變化：只算一次放進離屏畫布，之後以掃描扇形裁切顯示
    c.save(); c.globalAlpha = ma * dim;
    c.beginPath(); c.moveTo(wx, wy); c.arc(wx, wy, R + 2, -Math.PI / 2, -Math.PI / 2 + sweep); c.closePath(); c.clip();
    c.beginPath(); c.arc(wx, wy, R, 0, Math.PI * 2); c.clip();
    c.drawImage(heatMap(R), wx - R, wy - R);
    c.restore();
    c.save(); c.globalAlpha = ma; c.strokeStyle = C.wh; c.lineWidth = 3; c.beginPath(); c.arc(wx, wy, R, 0, Math.PI * 2); c.stroke(); c.restore();
    if (sweep < Math.PI * 2) { const an = sweep - Math.PI / 2; line(c, wx, wy, wx + Math.cos(an) * R, wy + Math.sin(an) * R, C.wh, 3, ma); glow(c, wx + Math.cos(an) * R, wy + Math.sin(an) * R, 50, C.wh, ma); }
    text(c, 'THICKNESS MAP · 300 mm', wx, wy - R - 30, { size: 18, f: F.mono, align: 'center', color: C.ink, a: ma, ls: 3 });
    // 色階
    for (let k = 0; k < 100; k++) { c.fillStyle = heat(k / 100); c.globalAlpha = ma * dim; c.fillRect(wx - 200 + k * 4, wy + R + 40, 4, 12); }
    c.globalAlpha = 1;
    text(c, '4900 Å', wx - 200, wy + R + 76, { size: 16, f: F.mono, color: C.ink, a: ma * dim }); text(c, '5100 Å', wx + 200, wy + R + 76, { size: 16, f: F.mono, align: 'right', color: C.ink, a: ma * dim });
  }
  // 49 點量測
  const shown = Math.max(0, Math.min(49, Math.floor((t - 6.6) / 0.1) + 1));
  let mn = 1e9, mx = -1e9, sum = 0;
  for (let i = 0; i < shown; i++) {
    const [u, v] = PTS49[i], val = thick(u, v);
    mn = Math.min(mn, val); mx = Math.max(mx, val); sum += val;
    const p = seg(t, 6.6 + i * 0.1, 6.9 + i * 0.1, E.outBack);
    c.save(); c.globalAlpha = p * dim; c.strokeStyle = C.wh; c.lineWidth = 2; c.fillStyle = 'rgba(0,0,0,0.5)';
    c.beginPath(); c.arc(wx + u * R, wy + v * R, 7, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
  }
  const mean = shown ? sum / shown : 0, nu = shown > 1 ? (mx - mn) / (2 * mean) * 100 : 0;
  const sa = seg(t, 6.6, 7.4);
  if (sa > 0) {
    const x = 870, y = 200;
    panel(c, x, y, 380, 330, { color: C.gr, a: sa, r: 10 });
    text(c, 'WIW · 49-POINT', x + 28, y + 44, { size: 18, f: F.mono, color: C.gr, a: sa, ls: 3 });
    [['POINTS', String(shown).padStart(2, '0')], ['MEAN', mean.toFixed(0) + ' Å'], ['MAX', (shown ? mx : 0).toFixed(0) + ' Å'], ['MIN', (shown ? mn : 0).toFixed(0) + ' Å']].forEach(([k, v], i) => {
      text(c, k, x + 28, y + 96 + i * 44, { size: 18, f: F.mono, color: C.ink, a: sa });
      text(c, v, x + 352, y + 96 + i * 44, { size: 26, w: 600, f: F.mono, align: 'right', a: sa });
    });
    text(c, 'NU%', x + 28, y + 300, { size: 22, f: F.mono, color: C.gr, a: sa });
    text(c, nu.toFixed(2) + ' %', x + 352, y + 302, { size: 40, w: 700, f: F.mono, align: 'right', color: C.gr, a: sa, glow: rgba(C.gr, 0.6) });
  }
  // WTW：一個 lot 的 25 片
  const wa = life(t, 8.8, 24.6, 0.6, 0.6) * dim;
  if (wa > 0) {
    const x = 870, y = 580;
    panel(c, x, y, 380, 200, { color: C.cy, a: wa, r: 10 });
    text(c, 'WTW · LOT 25 WAFERS', x + 28, y + 40, { size: 18, f: F.mono, color: C.cy, a: wa, ls: 2 });
    for (let k = 0; k < 25; k++) {
      const p = seg(t, 9 + k * 0.05, 9.4 + k * 0.05), v = 0.5 + (hash(k + 40) - 0.5) * 0.5;
      c.save(); c.globalAlpha = wa * p; c.fillStyle = C.cy; c.fillRect(x + 28 + k * 13, y + 170 - v * 100 * p, 8, v * 100 * p); c.restore();
    }
    line(c, x + 24, y + 120, x + 356, y + 120, C.am, 1.5, wa * seg(t, 10.4, 11));
  }
  // 公式
  const fa = life(t, 12.4, 24.6, 0.5, 0.6);
  if (fa > 0) {
    const x = 1300, y = 300;
    text(c, 'NON-UNIFORMITY', x, y, { size: 20, f: F.mono, color: C.ink, a: fa, ls: 4 });
    typed(c, 'NU% = (Max − Min) / (2 × Mean)', x, y + 70, seg(t, 12.6, 14.8, E.lin), { size: 28, w: 600, f: F.mono, color: C.wh, a: fa });
    const sub = `= (${mx.toFixed(0)} − ${mn.toFixed(0)}) / (2 × ${mean.toFixed(0)})`;
    text(c, sub, x, y + 130, { size: 24, f: F.mono, color: C.ink, a: fa * seg(t, 15, 15.8) });
    text(c, '= ' + nu.toFixed(2) + ' %', x, y + 200, { size: 64, w: 700, f: F.mono, color: C.gr, a: fa * seg(t, 15.6, 16.4), glow: rgba(C.gr, 0.5) });
  }
  // 噴頭疊圖
  const sh = life(t, 18.4, 24.6, 0.8, 0.6);
  if (sh > 0) {
    c.save(); c.globalAlpha = sh * 0.75; c.fillStyle = 'rgba(4,6,12,0.55)'; c.beginPath(); c.arc(wx, wy, R, 0, Math.PI * 2); c.fill();
    for (let ring = 1; ring <= 9; ring++) {
      const n = ring * 8, rr2 = ring * R / 9.6;
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 + t * 0.1;
        c.fillStyle = C.wh; c.beginPath(); c.arc(wx + Math.cos(a) * rr2, wy + Math.sin(a) * rr2, 3.2, 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();
    text(c, 'SHOWERHEAD HOLE PATTERN', wx, wy + 8, { size: 22, w: 700, f: F.mono, align: 'center', color: C.am, a: sh, ls: 2 });
    const steps = ['孔洞設計', '流場分布', '厚度分布'];
    steps.forEach((st, i) => {
      const p = seg(t, 19.2 + i * 0.6, 19.8 + i * 0.6);
      const x = 1330 + i * 190, y = 640;
      panel(c, x, y, 160, 80, { color: C.am, a: p * sh, r: 8 });
      text(c, st, x + 80, y + 50, { size: 24, w: 700, align: 'center', a: p * sh });
      if (i < 2) arrow(c, x + 164, y + 40, x + 186, y + 40, C.am, 2, p * sh, 9);
    });
  }
  // 應力
  const sp = seg(t, 24.6, 25.6);
  if (sp > 0) {
    const x0 = 1330, x1 = 1850, cx = (x0 + x1) / 2, cy = 520;
    // 先示範拉伸 → 壓縮，再用 RF 功率掃描並收斂到目標窗
    let sigma;
    if (t < 27.2) sigma = 250 * seg(t, 24.6, 25.8, E.outBack);
    else if (t < 30.4) sigma = lerp(250, -250, seg(t, 27.2, 28.4, E.ioC));
    else if (t < 31.2) sigma = lerp(-250, 200, seg(t, 30.4, 31.2, E.ioC));
    else if (t < 34.6) sigma = lerp(200, -320, seg(t, 31.2, 34.6, E.ioS));
    else sigma = lerp(-320, -40, seg(t, 34.6, 36, E.ioC));
    const bow = sigma / 300 * 70;
    const ys = (x) => cy - bow * Math.pow((x - cx) / ((x1 - x0) / 2), 2);
    c.save(); c.globalAlpha = sp;
    const band = (off, th, col) => {
      c.beginPath();
      for (let x = x0; x <= x1; x += 8) c.lineTo(x, ys(x) + off);
      for (let x = x1; x >= x0; x -= 8) c.lineTo(x, ys(x) + off + th);
      c.closePath(); c.fillStyle = col; c.fill();
    };
    const fcol = sigma >= 0 ? C.am : C.cy;
    band(-10, 10, fcol); band(0, 30, '#3b4760');
    c.restore();
    // 應力箭頭：拉伸 → 向內收縮，壓縮 → 向外擴張
    const dir = sigma >= 0 ? -1 : 1, mag = Math.min(1, Math.abs(sigma) / 250);
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const xb = cx + side * (120 + k * 110), yb = ys(xb) - 30;
        arrow(c, xb - side * dir * 30 * mag, yb, xb + side * dir * 30 * mag, yb, fcol, 3, sp * mag, 10);
      }
    }
    const label = sigma >= 0 ? '拉伸應力 TENSILE (+σ)' : '壓縮應力 COMPRESSIVE (−σ)';
    text(c, label, cx, 360, { size: 30, w: 700, align: 'center', color: fcol, a: sp });
    text(c, (sigma >= 0 ? '晶圓下凹成碗狀' : '晶圓上凸成拱形'), cx, 400, { size: 22, align: 'center', color: C.ink, a: sp });
    text(c, 'σ = ' + (sigma >= 0 ? '+' : '') + sigma.toFixed(0) + ' MPa', x0, 660, { size: 34, w: 700, f: F.mono, color: fcol, a: sp });
    text(c, 'BOW ' + (-bow * 0.9).toFixed(1) + ' µm', x1, 660, { size: 24, f: F.mono, align: 'right', color: C.ink, a: sp });
    // RF 功率滑桿
    const sl = seg(t, 30.4, 31.2);
    if (sl > 0) {
      const sx0 = x0, sx1 = x1, syy = 740, v = 0.1 + seg(t, 31.2, 34.6, E.ioS) * 0.85 - seg(t, 34.6, 36, E.ioC) * 0.35;
      text(c, 'RF POWER / ION BOMBARDMENT', sx0, syy - 24, { size: 16, f: F.mono, color: C.ink, a: sl, ls: 2 });
      line(c, sx0, syy, sx1, syy, C.dim, 6, sl);
      c.save(); c.globalAlpha = sl * 0.25; c.fillStyle = C.gr; c.fillRect(lerp(sx0, sx1, 0.52), syy - 14, (sx1 - sx0) * 0.14, 28); c.restore();
      text(c, 'TARGET', lerp(sx0, sx1, 0.59), syy + 36, { size: 14, f: F.mono, align: 'center', color: C.gr, a: sl });
      spark(c, lerp(sx0, sx1, v), syy, 10, C.wh, sl);
      if (t > 36) text(c, '✓ IN SPEC', x1, 860, { size: 30, w: 700, f: F.mono, align: 'right', color: C.gr, a: seg(t, 36, 36.6) });
    }
    text(c, 'Stoney: σ = E·h_s² / (6(1−ν)·R·h_f)', x0, 860, { size: 18, f: F.mono, color: C.ink, a: sp * 0.9 });
  }
  chapter(c, t, s, C.gr);
};

// =====================================================================
// 09 高深寬比填孔
// =====================================================================
SCENES.gapfill = function (c, t, s) {
  bg(c, t, { color: C.cy, k: 0.5 });
  const D = lerp(150, 400, seg(t, 1.2, 5.6, E.ioC)), w0 = 100, top = 400;
  const defs = [
    { k: 'PVD', zh: '物理極限', col: C.rd, a: 6.4, b: 12 },
    { k: '傳統 CVD', zh: '擴散困境', col: C.am, a: 12.4, b: 18 },
    { k: 'ALD', zh: '完美解答', col: C.cy, a: 18.4, b: 24 },
  ];
  const ar = (D / w0).toFixed(1);
  text(c, 'ASPECT RATIO', W / 2, 168, { size: 18, f: F.mono, align: 'center', color: C.ink, ls: 6, a: seg(t, 1, 2) });
  text(c, ar + ' : 1', W / 2 + 10, 230, { size: 56, w: 700, f: F.mono, align: 'center', color: C.wh, a: seg(t, 1, 2), glow: rgba(C.cy, 0.5) });
  defs.forEach((d, i) => {
    const cx = 380 + i * 580, x = cx - 250, y = 270, wd = 500, ht = 600;
    const ap = seg(t, 1.0 + i * 0.2, 1.8 + i * 0.2, E.outBack);
    if (ap <= 0) return;
    const fa = t < 6.4 ? 1 : t > 24.4 ? (i === 2 ? 1 : 0.45) : focus(t, d.a, d.b, 0.55);
    const a = ap * fa;
    panel(c, x, y, wd, ht, { color: d.col, a, glow: fa > 0.9 && t > 6.4 ? 0.5 : 0 });
    text(c, d.k + '：' + d.zh, cx, y + 54, { size: 30, w: 700, align: 'center', color: d.col, a });
    const g = seg(t, d.a, d.b - 0.4, E.lin);
    c.save(); c.globalAlpha = a; c.beginPath(); c.rect(x + 2, y + 80, wd - 4, ht - 82); c.clip();
    const L = x, Rr = x + wd, tl = cx - w0 / 2, tr = cx + w0 / 2, bot = top + D;
    const sub = () => {
      c.beginPath(); c.moveTo(L, top); c.lineTo(tl, top); c.lineTo(tl, bot); c.lineTo(tr, bot); c.lineTo(tr, top); c.lineTo(Rr, top); c.lineTo(Rr, y + ht); c.lineTo(L, y + ht); c.closePath();
      const gr = c.createLinearGradient(0, top, 0, y + ht); gr.addColorStop(0, '#46546e'); gr.addColorStop(1, '#1a2132'); c.fillStyle = gr; c.fill();
    };
    if (i === 0) {
      const topT = 30 * g, ohR = 6 + 52 * g, botT = 18 * g;
      sub();
      if (g > 0) {
        c.fillStyle = '#d9e1ec';
        c.fillRect(L, top - topT, tl - L, topT); c.fillRect(tr, top - topT, Rr - tr, topT);
        for (const sx of [tl, tr]) { c.beginPath(); c.arc(sx, top - topT * 0.3, ohR, 0, Math.PI * 2); c.fill(); }
        c.beginPath(); c.ellipse(cx, bot, Math.max(4, w0 / 2 - ohR * 0.6), botT, 0, Math.PI, 0); c.fill();
        c.fillRect(tl, top, 3 * g, D); c.fillRect(tr - 3 * g, top, 3 * g, D);
        if (ohR >= w0 / 2) {
          c.save(); c.strokeStyle = C.rd; c.lineWidth = 3; c.setLineDash([8, 6]); c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8);
          c.strokeRect(tl + 8, top + ohR * 0.6, w0 - 16, D - ohR * 0.6 - botT - 6); c.restore();
        }
      }
    } else if (i === 1) {
      const thk = (yd) => g * (58 - 30 * (yd / D));
      sub();
      if (g > 0) {
        c.fillStyle = '#e8b56a';
        c.fillRect(L, top - thk(0), Rr - L, thk(0)); c.fillRect(tl, top, w0, D);
        const closed = thk(0) >= w0 / 2;
        const yStart = closed ? D * (58 * g - 50) / (30 * g) : -thk(0) - 2;
        const yEnd = D - g * 28;
        c.beginPath();
        for (let yd = Math.max(yStart, -thk(0) - 2); yd <= yEnd; yd += 4) c.lineTo(cx - w0 / 2 + thk(Math.max(0, yd)), top + yd);
        for (let yd = yEnd; yd >= Math.max(yStart, -thk(0) - 2); yd -= 4) c.lineTo(cx + w0 / 2 - thk(Math.max(0, yd)), top + yd);
        c.closePath(); c.fillStyle = '#0b1120'; c.fill();
        if (closed) {
          c.save(); c.strokeStyle = C.rd; c.lineWidth = 3; c.shadowColor = C.rd; c.shadowBlur = 20; c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8); c.stroke(); c.restore();
        }
      }
    } else {
      const thk = g * w0 / 2, n = Math.max(1, Math.round(g * 22));
      if (g > 0) {
        for (let k = n; k >= 1; k--) {
          c.strokeStyle = k % 2 ? '#38e8ff' : '#ffb23f'; c.lineWidth = 2 * thk * k / n; c.lineJoin = 'miter';
          c.beginPath(); c.moveTo(L - 20, top); c.lineTo(tl, top); c.lineTo(tl, bot); c.lineTo(tr, bot); c.lineTo(tr, top); c.lineTo(Rr + 20, top); c.stroke();
        }
      }
      sub();
    }
    c.restore();
    // 標註
    const la = seg(t, d.b - 1.6, d.b - 0.8);
    const notes = ['懸垂封口 Pinch-off', '內部孔洞 Keyhole Void', '100% 共形 Conformal'];
    text(c, notes[i], cx, y + ht - 36, { size: 26, w: 700, align: 'center', color: d.col, a: la * ap });
    // 印章
    if (t > 24.4) {
      const st = seg(t, 24.4 + (i === 2 ? 1.2 : i * 0.5), 24.8 + (i === 2 ? 1.2 : i * 0.5), E.outBack);
      const sc = lerp(1.8, 1, st);
      c.save(); c.translate(cx, y + 300); c.rotate(-0.15); c.scale(sc, sc); c.globalAlpha = clamp(st);
      if (i < 2) { text(c, '✕', 0, 40, { size: 180, w: 900, align: 'center', color: C.rd, a: 0.85 }); }
      else {
        rr(c, -200, -50, 400, 100, 14); c.strokeStyle = C.cy; c.lineWidth = 6; c.shadowColor = C.cy; c.shadowBlur = 30; c.stroke(); c.shadowBlur = 0;
        text(c, '100% CONFORMAL', 0, 14, { size: 40, w: 700, f: F.en, align: 'center', color: C.cy });
      }
      c.restore();
    }
  });
  text(c, '示意圖，非等比例 · 先進結構的 AR 可達數十比一', W - 70, H - 150, { size: 16, align: 'right', color: C.ink, a: seg(t, 2, 3) * 0.8 });
  chapter(c, t, s, C.cy);
};

// =====================================================================
// 10 ALD 自限性循環
// =====================================================================
SCENES.ald = function (c, t, s) {
  bg(c, t, { color: C.cy, cx: 0.25 });
  const rx = 470, ry = 540, R = 230;
  const steps = [
    { n: '① 前驅物 A', en: 'PRECURSOR A', col: C.cy, a: 6.4 },
    { n: '② Purge', en: 'INERT PURGE', col: '#b8c6d8', a: 11.4 },
    { n: '③ 反應物 B', en: 'REACTANT B', col: C.am, a: 16.4 },
    { n: '④ Purge', en: 'BYPRODUCT PURGE', col: '#b8c6d8', a: 21.4 },
  ];
  const fast = t >= 26.6;
  let cyc = 0, stepIdx = -1, phase = 0;
  if (!fast) { for (let i = 0; i < 4; i++) if (t >= steps[i].a) stepIdx = i; cyc = t >= 26 ? 1 : 0; if (stepIdx >= 0) phase = (stepIdx + clamp((t - steps[stepIdx].a) / 4.6)) / 4; }
  else { const k = (t - 26.6) / 0.25; cyc = Math.min(54, 1 + Math.floor(k)); phase = k % 1; stepIdx = Math.floor(phase * 4); }
  const ra = seg(t, 2.4, 3.4);
  // 環
  steps.forEach((st, i) => {
    const a0 = -Math.PI / 2 + i * Math.PI / 2 + 0.06, a1 = a0 + Math.PI / 2 - 0.12;
    const act = i === stepIdx ? 1 : 0.25;
    c.save(); c.globalAlpha = ra; c.strokeStyle = rgba(st.col, act); c.lineWidth = 26; c.lineCap = 'round';
    if (i === stepIdx) { c.shadowColor = st.col; c.shadowBlur = 30; }
    c.beginPath(); c.arc(rx, ry, R, a0, a0 + (a1 - a0) * seg(t, 2.6 + i * 0.2, 3.4 + i * 0.2, E.outC)); c.stroke(); c.restore();
    const am = (a0 + a1) / 2, lx = rx + Math.cos(am) * (R + 70), ly = ry + Math.sin(am) * (R + 70);
    text(c, st.n, lx, ly, { size: 26, w: 700, align: Math.cos(am) > 0.1 ? 'left' : Math.cos(am) < -0.1 ? 'right' : 'center', color: st.col, a: ra * lerp(0.5, 1, act) });
    text(c, st.en, lx, ly + 24, { size: 13, f: F.mono, align: Math.cos(am) > 0.1 ? 'left' : Math.cos(am) < -0.1 ? 'right' : 'center', color: C.ink, a: ra * lerp(0.5, 1, act), ls: 2 });
  });
  if (stepIdx >= 0) { const an = -Math.PI / 2 + phase * Math.PI * 2; spark(c, rx + Math.cos(an) * R, ry + Math.sin(an) * R, 10, C.wh, ra); }
  text(c, 'CYCLE', rx, ry - 60, { size: 20, f: F.mono, align: 'center', color: C.ink, ls: 6, a: ra });
  text(c, String(cyc).padStart(3, '0'), rx, ry + 30, { size: 110, w: 700, f: F.mono, align: 'center', a: ra, glow: rgba(C.cy, 0.6), blur: 30 });
  text(c, '≈ ' + (cyc * 0.1).toFixed(1) + ' nm', rx, ry + 84, { size: 28, w: 600, f: F.mono, align: 'center', color: C.cy, a: ra });
  if (t < 6.4) textIn(c, '時間上分離的兩個半反應', rx, ry + 150, seg(t, 3, 4.4, E.lin), { size: 22, align: 'center', color: C.ink, a: ra });

  // 表面
  const px = 860, py = 200, pw = 990, ph = 660, sy = 780;
  panel(c, px, py, pw, ph, { color: C.cy, a: ra * 0.9, r: 10 });
  c.save(); c.beginPath(); c.rect(px + 2, py + 2, pw - 4, ph - 4); c.clip();
  const sites = 18, sx = (j) => px + 70 + j * 50;
  const layers = fast ? cyc : (t >= 21.4 ? 1 : 0);
  const stackH = layers * 3;
  // 基板與已長的膜
  c.fillStyle = '#2b3448'; c.fillRect(px, sy, pw, ph);
  for (let k = 0; k < layers; k++) { c.fillStyle = k % 2 ? 'rgba(56,232,255,0.55)' : 'rgba(255,178,63,0.55)'; c.fillRect(px + 40, sy - (k + 1) * 3, pw - 80, 3); }
  const surf = sy - stackH;
  const dumb = (x, y, col, ang = 0, a = 1) => {
    const dx = Math.sin(ang) * 10, dy = Math.cos(ang) * 10;
    line(c, x - dx, y - dy, x + dx, y + dy, col, 4, a);
    dot(c, x - dx, y - dy, 8, col, a); dot(c, x + dx, y + dy, 8, shade(col, 0.4), a);
  };
  if (!fast) {
    const u1 = (t - 6.4) / 4.6, u2 = (t - 11.4) / 4.6, u3 = (t - 16.4) / 4.6, u4 = (t - 21.4) / 4.6;
    for (let j = 0; j < sites; j++) {
      const land = 0.08 + 0.6 * hash(j + 1);
      // A：化學吸附
      if (t >= 6.4 && t < 16.4 + (0.08 + 0.6 * hash(j + 50)) * 4.6) {
        const yA = u1 < land ? lerp(py + 40, surf - 22, E.inQ(clamp(u1 / land))) : surf - 22;
        if (u1 >= 0) { line(c, sx(j), surf, sx(j), yA + 10, C.cy, 2, u1 >= land ? 1 : 0); dumb(sx(j), yA, C.cy, u1 < land ? t * 3 + j : 0); }
      }
      // B：反應
      if (t >= 16.4) {
        const landB = 0.08 + 0.6 * hash(j + 50);
        if (u3 < landB) { const yB = lerp(py + 40, surf - 50, E.inQ(clamp(u3 / landB))); dumb(sx(j), yB, C.am, t * 3 + j); }
        else {
          const k = clamp((u3 - landB) / 0.1);
          c.fillStyle = mix(C.cy, C.am, 0.5); c.globalAlpha = k; rr(c, sx(j) - 24, surf - 18, 48, 18, 4); c.fill(); c.globalAlpha = 1;
          // 副產物往上飄，第 4 步被吹走
          const age = (t - (16.4 + landB * 4.6));
          const bx = sx(j) + 10 + Math.sin(age * 3 + j) * 10 + (u4 > 0 ? E.inQ(clamp(u4 * 1.3)) * 1300 : 0), by = surf - 40 - age * 40;
          if (by > py) { dot(c, bx, by, 6, C.rd, 1); dot(c, bx + 10, by - 4, 4, '#ffd0d8', 1); }
        }
      }
    }
    // 多出來的前驅物：飽和後無處可去
    if (t >= 6.4 && t < 16.4) {
      for (let k = 0; k < 12; k++) {
        const x = px + 80 + tri(hash(k) * 1800 + t * (60 + hash(k + 1) * 80), pw - 160) + (u2 > 0 ? E.inQ(clamp(u2 * 1.3)) * 1300 : 0);
        const y = py + 80 + tri(hash(k + 2) * 800 + t * 50, 300);
        dumb(x, y, C.cy, t * 2 + k, 0.55 * seg(t, 7, 8));
      }
    }
    // 吹掃氣流
    for (const [t0, col] of [[11.4, '#b8c6d8'], [21.4, '#b8c6d8']]) {
      const pa = life(t, t0, t0 + 4.6, 0.4, 0.6);
      if (pa > 0) for (let k = 0; k < 10; k++) {
        const u = ((t - t0) * 0.9 + hash(k + 7)) % 1, yy = py + 70 + k * 46;
        arrow(c, px + u * pw - 80, yy, px + u * pw + 20, yy, col, 3, pa * Math.sin(u * Math.PI), 12);
      }
    }
    if (t > 10.0 && t < 11.4) text(c, 'SATURATED ✓  自我限制', px + pw - 40, py + 60, { size: 26, w: 700, color: C.cy, align: 'right', a: seg(t, 10, 10.4) });
    if (t > 25.8) text(c, '1 MONOLAYER ✓', px + pw - 40, py + 60, { size: 26, w: 700, f: F.mono, color: C.am, align: 'right', a: seg(t, 25.8, 26.2) });
  } else {
    // 快轉循環：表面閃動
    const col = stepIdx === 0 ? C.cy : stepIdx === 2 ? C.am : '#b8c6d8';
    for (let j = 0; j < sites; j++) dot(c, sx(j), surf - 8, 6, col, 0.8);
    if (stepIdx % 2 === 1) for (let k = 0; k < 6; k++) arrow(c, px + phase * 4 % 1 * pw, py + 100 + k * 70, px + phase * 4 % 1 * pw + 60, py + 100 + k * 70, '#b8c6d8', 3, 0.5, 10);
    // 厚度尺
    const rx2 = px + pw - 70;
    line(c, rx2, sy, rx2, surf, C.cy, 3, 1);
    line(c, rx2 - 10, surf, rx2 + 10, surf, C.cy, 3, 1);
    text(c, (cyc * 1.0).toFixed(0) + ' Å', rx2 - 20, surf - 14, { size: 28, w: 700, f: F.mono, align: 'right', color: C.cy });
    text(c, 'GPC ≈ 1 Å / cycle', px + 40, py + 60, { size: 26, w: 600, f: F.mono, color: C.wh, a: seg(t, 26.6, 27.2) });
    text(c, '厚度 = 循環次數 × 每循環成長量', px + 40, py + 100, { size: 22, color: C.ink, a: seg(t, 27, 27.6) });
  }
  c.restore();
  const big = seg(t, 33.4, 34.2, E.outE);
  if (big > 0) {
    c.save(); c.globalAlpha = big * 0.8; c.fillStyle = '#03050b'; c.fillRect(px + 2, py + 300, pw - 4, 190); c.restore();
    text(c, 'SELF-LIMITING', px + pw / 2, py + 400, { size: 84, w: 700, f: F.en, align: 'center', ls: lerp(40, 10, big), a: big, glow: rgba(C.cy, 0.8), blur: 40 });
    text(c, '用時間，換取原子級的精度', px + pw / 2, py + 455, { size: 30, w: 700, align: 'center', color: C.cy, a: seg(t, 34, 34.8) });
  }
  chapter(c, t, s, C.cy);
};

// =====================================================================
// 11 先進節點
// =====================================================================
SCENES.nodes = function (c, t, s) {
  bg(c, t, { color: C.vi, k: 0.7 });
  const defs = [
    { k: '3D FinFET', zh: '鰭式場效電晶體', d: ['平面 → 立體鰭片', 'High-k 須無死角覆蓋側壁'], col: C.cy, a: 6.4, b: 12 },
    { k: '3D GAA', zh: '環繞閘極電晶體', d: ['奈米片間隙極小', '僅 ALD 能 360° 環繞包覆'], col: C.vi, a: 12.4, b: 19 },
    { k: '3D NAND', zh: '立體快閃記憶體', d: ['堆疊突破 200+ 層', '超深通道孔的完美填孔'], col: C.am, a: 19.4, b: 26 },
  ];
  const all = t > 26.4;
  defs.forEach((d, i) => {
    const cx = 330 + i * 630, ap = seg(t, 2.6 + i * 0.3, 3.4 + i * 0.3, E.outBack);
    if (ap <= 0) return;
    const fa = t < 6.4 || all ? 1 : focus(t, d.a, d.b, 0.35);
    const act = t >= d.a && t < d.b ? 1 : all ? 0.6 : 0;
    const bob = Math.sin(t * 1.2 + i) * 6;
    const o = { x: cx, y: 600 + bob + (1 - ap) * 80, s: 1 };
    c.save(); c.globalAlpha = fa;
    if (i === 0) finfet(c, o, t, act, ap);
    else if (i === 1) gaa(c, o, t, act, ap);
    else nand(c, o, t, act, ap);
    c.restore();
    const ty = 760;
    text(c, d.k, cx, ty, { size: 40, w: 700, f: F.en, align: 'center', color: d.col, a: ap * fa });
    text(c, d.zh, cx, ty + 38, { size: 24, w: 700, align: 'center', a: ap * fa });
    d.d.forEach((ln, k) => text(c, ln, cx, ty + 78 + k * 32, { size: 22, align: 'center', color: C.ink, a: ap * fa * seg(t, d.a, d.a + 0.8) }));
  });
  const ba = seg(t, 26.4, 27.4, E.outE);
  if (ba > 0) {
    textIn(c, '「共形」不是加分題，而是入場券', W / 2, 200, seg(t, 26.4, 27.8, E.lin), { size: 56, w: 900, align: 'center', glow: rgba(C.cy, 0.5), blur: 30 });
    text(c, 'CONFORMALITY IS THE ENTRY TICKET', W / 2, 244, { size: 20, f: F.mono, align: 'center', color: C.cy, ls: 6, a: seg(t, 27.2, 28) });
  }
  chapter(c, t, s, C.vi);
};
function finfet(c, o, t, act, ap) {
  const g = seg(t, 6.6, 8.6, E.outC);
  isoBox(c, o, -110, -110, -40, 220, 220, 40, C.si, { a: ap });
  isoBox(c, o, -110, -110, 0, 220, 220, 26, '#2c5d78', { a: ap, alpha: 0.9 });
  // 鰭片分成閘極後、前兩段，依遠近順序繪製
  for (const fx of [-60, 20]) isoBox(c, o, fx, -110, 26, 36, 80, 100, '#7d8aa0', { a: ap });
  isoBox(c, o, -96, -30, 26, 192, 64, 128, C.cy, { a: ap * (0.3 + 0.5 * g), alpha: 0.45, glow: act * (0.6 + 0.4 * Math.sin(t * 5)) });
  isoBox(c, o, -90, -24, 26, 180, 52, 122, C.am, { a: ap, alpha: 0.95 });
  for (const fx of [-60, 20]) isoBox(c, o, fx, 34, 26, 36, 76, 100, '#7d8aa0', { a: ap });
}
function gaa(c, o, t, act, ap) {
  const g = seg(t, 12.6, 14.6, E.outC);
  isoBox(c, o, -110, -110, -40, 220, 220, 40, C.si, { a: ap });
  const zs = [30, 68, 106];
  // 後段奈米片
  zs.forEach((z) => isoBox(c, o, -70, -110, z, 140, 80, 16, '#a7b4c8', { a: ap }));
  // 包覆層 + 閘極
  zs.forEach((z) => isoBox(c, o, -76, -32, z - 6, 152, 64, 28, C.vi, { a: ap * g, alpha: 0.7, glow: act * (0.6 + 0.4 * Math.sin(t * 5 + z)) }));
  isoBox(c, o, -90, -30, 0, 180, 60, 150, C.am, { a: ap, alpha: 0.35, edge: rgba(C.am, 0.9) });
  zs.forEach((z) => isoBox(c, o, -70, 30, z, 140, 80, 16, '#a7b4c8', { a: ap }));
}
function nand(c, o, t, act, ap) {
  const n = Math.max(6, Math.min(40, Math.floor((t - 19.6) / 0.12) + 1)), lh = 6.5;
  const built = t < 19.6 ? 6 : n;
  for (let k = 0; k < built; k++) {
    const kp = t < 19.6 ? 1 : seg(t, 19.6 + k * 0.12, 19.9 + k * 0.12, E.outC);
    isoBox(c, o, -100, -100, k * lh + (1 - kp) * 60, 200, 200, lh, k % 2 ? '#2f6f86' : '#5c6678', { a: ap * kp, edge: false });
  }
  const H = built * lh;
  // 通道孔（X 光透視）
  const [tx, ty] = isoP(o, 0, 0, H), [bx, by] = isoP(o, 0, 0, 0);
  c.save(); c.globalAlpha = ap;
  const g = c.createLinearGradient(0, ty, 0, by); g.addColorStop(0, rgba(C.cy, 0.9)); g.addColorStop(1, rgba(C.cy, 0.2));
  c.fillStyle = g; c.fillRect(tx - 14, ty, 28, by - ty);
  c.strokeStyle = C.cy; c.lineWidth = 3; c.shadowColor = C.cy; c.shadowBlur = 20 * (0.5 + act);
  c.beginPath(); c.ellipse(tx, ty, 30, 17, 0, 0, Math.PI * 2); c.stroke();
  for (let k = 0; k < built; k += 4) { const [ex, ey] = isoP(o, 0, 0, k * lh); c.globalAlpha = ap * 0.4; c.beginPath(); c.ellipse(ex, ey, 26, 15, 0, 0, Math.PI * 2); c.stroke(); }
  c.restore();
  const cnt = t < 19.6 ? 0 : Math.round(built / 40 * 236);
  if (t >= 19.4) {
    text(c, cnt + ' LAYERS', o.x + 150, o.y - 300, { size: 26, w: 700, f: F.mono, color: C.am, a: ap * seg(t, 19.4, 20) });
    text(c, '（示意）', o.x + 150, o.y - 270, { size: 16, color: C.ink, a: ap * seg(t, 19.4, 20) });
  }
}

// =====================================================================
// 12 終章：交響樂
// =====================================================================
SCENES.finale = function (c, t, s) {
  bg(c, t, { color: C.am, k: 0.5 });
  const pa = life(t, 0, 5.6, 0.6, 0.8);
  if (pa > 0) {
    photo(c, 'orchestra', { a: pa, zoom: lerp(1.05, 1.22, seg(t, 0, 5.6, E.lin)), filter: 'saturate(0.7) contrast(1.15) brightness(0.75)', tint: rgba(C.am, 0.25) });
    vignette(c, pa);
    textIn(c, 'SYMPHONY', W / 2, 560, seg(t, 2.7, 3.9, E.lin), { size: 150, w: 700, f: F.en, align: 'center', ls: 30, a: pa, glow: rgba(C.am, 0.6), blur: 40 });
    text(c, '沒有獨奏，只有合奏', W / 2, 630, { size: 36, w: 700, align: 'center', a: pa * seg(t, 3.5, 4.2), ls: 10 });
  }
  const da = seg(t, 5.0, 5.8);
  if (da > 0) {
    const zoom = lerp(1, 1.08, seg(t, 5, 38, E.lin)) * lerp(1, 0.9, seg(t, 28.4, 31, E.ioC));
    c.save(); c.translate(960, 600); c.scale(zoom, zoom); c.translate(-960, -600);
    const o = { x: 960, y: 640 + Math.sin(t * 0.8) * 5, s: 1.05 };
    const drop = (t0) => { const p = seg(t, t0, t0 + 0.7, E.outBack); return [(1 - p) * 300, clamp(p * 1.5)]; };
    isoBox(c, o, -280, -180, -70, 560, 360, 70, C.si, { a: da });
    isoBox(c, o, -240, -180, 0, 120, 360, 14, '#3f8f6b', { a: da, alpha: 0.9 });
    isoBox(c, o, 120, -180, 0, 120, 360, 14, '#3f8f6b', { a: da, alpha: 0.9 });
    const glowK = (t0, t1) => (t >= t0 && t < t1 ? 0.6 + 0.4 * Math.sin(t * 5) : t > 28.4 ? 0.5 : 0);
    // ALD High-k + 金屬閘極
    let [dz, al] = drop(5.4);
    isoBox(c, o, -70, -140, dz, 140, 280, 7, C.cy, { a: da * al, glow: glowK(5.4, 11.4) * 1.4 });
    isoBox(c, o, -64, -140, 7 + dz, 128, 280, 80, '#c9a24a', { a: da * al });
    // LPCVD 間隙壁
    [dz, al] = drop(11.4);
    isoBox(c, o, -100, -140, dz, 30, 280, 87, C.am, { a: da * al, alpha: 0.9, glow: glowK(11.4, 17.4) });
    isoBox(c, o, 70, -140, dz, 30, 280, 87, C.am, { a: da * al, alpha: 0.9, glow: glowK(11.4, 17.4) });
    // PVD 接觸窗（ILD 之內）
    [dz, al] = drop(23.4);
    for (const cxp of [-200, 160]) isoBox(c, o, cxp, -20, 14 + dz, 40, 40, 156, C.cu, { a: da * al });
    // PECVD ILD
    [dz, al] = drop(17.4);
    isoBox(c, o, -280, -180, dz, 560, 360, 170, C.vi, { a: da * al, alpha: 0.22, edge: rgba(C.vi, 0.8), glow: glowK(17.4, 23.4) });
    // PVD 金屬線
    [dz, al] = drop(23.4);
    isoBox(c, o, -230, -180, 170 + dz, 100, 360, 30, C.cu, { a: da * al, glow: glowK(23.4, 28.4) });
    isoBox(c, o, 130, -180, 170 + dz, 100, 360, 30, C.cu, { a: da * al, glow: glowK(23.4, 28.4) });
    isoBox(c, o, -280, -30, 228 + dz, 560, 60, 26, C.cu, { a: da * al * seg(t, 24, 25), glow: glowK(23.4, 28.4) });
    // 標註
    const P = (x, y, z) => isoP(o, x, y, z);
    let [x, y] = P(-70, 140, 4); callout(c, x, y, 520, 760, 'ALD · 深邃精確', 'High-k 閘極介電層（數 nm）', C.cy, seg(t, 6.0, 7.0));
    [x, y] = P(-100, 140, 60); callout(c, x, y, 500, 540, 'LPCVD · 高溫高覆蓋', 'FEOL 側壁間隙壁 Spacer', C.am, seg(t, 12.0, 13.0));
    [x, y] = P(280, 0, 120); callout(c, x, y, 1440, 620, 'PECVD · 低溫快速', 'BEOL 層間絕緣 ILD', C.vi, seg(t, 18.0, 19.0));
    [x, y] = P(230, -100, 200); callout(c, x, y, 1420, 380, 'PVD · 高導電純度', '金屬互連 / 阻擋層', C.cu, seg(t, 24.0, 25.0));
    c.restore();
  }
  const fa = seg(t, 28.4, 29.4, E.outE);
  if (fa > 0) {
    textIn(c, '沒有單一贏家，只有最佳配置。', W / 2, 190, seg(t, 28.4, 29.8, E.lin), { size: 64, w: 900, align: 'center', glow: rgba(C.am, 0.6), blur: 30 });
    text(c, 'NO SINGLE WINNER — ONLY THE OPTIMAL STACK', W / 2, 238, { size: 22, f: F.mono, align: 'center', color: C.am, ls: 6, a: seg(t, 29.4, 30.2) });
  }
  chapter(c, t, s, C.am);
};

// =====================================================================
// 13 尾聲
// =====================================================================
SCENES.outro = function (c, t, s) {
  bg(c, t, { color: C.cy, k: 0.5, grid: t > 14 });
  const qa = life(t, 0, 14.2, 0.8, 0.5);
  if (qa > 0) {
    photo(c, 'engineer', { a: qa * 0.45, zoom: lerp(1.05, 1.18, seg(t, 0, 14, E.lin)), px: 0.3, filter: 'grayscale(1) contrast(1.2) brightness(0.6)', tint: rgba(C.cy, 0.5) });
    vignette(c, qa);
    textIn(c, '精通化學氣相沉積，', W / 2, 330, seg(t, 0.8, 2.2, E.lin), { size: 56, w: 700, align: 'center', a: qa });
    textIn(c, '不在於尋找一種萬能的工具', W / 2, 410, seg(t, 2.2, 3.8, E.lin), { size: 56, w: 700, align: 'center', color: C.ink, a: qa });
    const words = [['溫度', C.rd, 8.0], ['速度', C.am, 8.8], ['幾何', C.cy, 9.6]];
    words.forEach(([wd, col, t0], i) => {
      const p = seg(t, t0, t0 + 0.6, E.outBack);
      const x = W / 2 + (i - 1) * 380;
      c.save(); c.translate(x, 600); c.scale(lerp(1.6, 1, p), lerp(1.6, 1, p));
      text(c, wd, 0, 0, { size: 120, w: 900, align: 'center', base: 'middle', color: col, a: qa * clamp(p), glow: rgba(col, 0.7), blur: 40 });
      c.restore();
      if (i < 2) text(c, '×', x + 190, 600, { size: 60, w: 300, align: 'center', base: 'middle', color: C.ink, a: qa * seg(t, t0 + 0.4, t0 + 0.8) });
    });
    textIn(c, '雕刻出最完美的奈米建築', W / 2, 790, seg(t, 10.8, 12.4, E.lin), { size: 50, w: 700, align: 'center', a: qa, ls: 8 });
  }
  // 片尾卡
  const ea = seg(t, 14.0, 15.0, E.outE) * (1 - seg(t, 25.6, 27.6, E.inQ));
  if (ea > 0) {
    const gl = Math.max(0, 1 - (t - 14) / 0.5);
    drawWafer(c, W / 2, 380, 150, t * 0.1, ea, C.cy);
    for (let k = 0; k < 3; k++) { const u = (t * 0.25 + k / 3) % 1; c.save(); c.globalAlpha = ea * (1 - u) * 0.5; c.strokeStyle = C.cy; c.lineWidth = 2; c.beginPath(); c.arc(W / 2, 380, 160 + u * 240, 0, Math.PI * 2); c.stroke(); c.restore(); }
    if (gl > 0) { text(c, DATA.config.title, W / 2 - 12 * gl, 640, { size: 120, w: 900, align: 'center', color: C.rd, a: ea * gl * 0.7 }); text(c, DATA.config.title, W / 2 + 12 * gl, 640, { size: 120, w: 900, align: 'center', color: C.cy, a: ea * gl * 0.7 }); }
    text(c, DATA.config.title, W / 2, 640, { size: 120, w: 900, align: 'center', a: ea, ls: 8, glow: rgba(C.cy, 0.5), blur: 40 });
    text(c, DATA.config.titleEn, W / 2, 700, { size: 30, f: F.mono, align: 'center', color: C.cy, ls: 16, a: ea });
    const ca = seg(t, 16, 17) * ea;
    line(c, W / 2 - 300, 745, W / 2 + 300, 745, C.dim, 1, ca, seg(t, 16, 17.2, E.ioC));
    text(c, 'A MOTION DESIGN SHOWREEL', W / 2, 790, { size: 20, f: F.mono, align: 'center', color: C.ink, ls: 8, a: ca });
    text(c, 'Script · Design · Animation · Sound  —  ' + DATA.config.author, W / 2, 836, { size: 26, w: 600, f: F.en, align: 'center', a: ca });
    text(c, 'Photos: Pexels (Jimmy Liao, Yuri Shkoda, Nic Wood, Gergő, Sergei Starostin, King of Concepts)  ·  Music & SFX: original procedural score', W / 2, 900, { size: 15, f: F.mono, align: 'center', color: C.ink, a: seg(t, 17.5, 18.5) * ea });
  }
};
