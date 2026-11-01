// 場景 04–07：電漿、腔體、PVD、化學廚房

// =====================================================================
// 04 電漿微觀世界
// =====================================================================
SCENES.plasma = function (c, t, s) {
  bg(c, t, { color: C.vi });
  // 開場照片
  const pa = life(t, 0, 6.2, 0.3, 0.8);
  if (pa > 0) {
    photo(c, 'plasma', { a: pa, zoom: lerp(1.05, 1.25, seg(t, 0, 6.2, E.lin)), filter: 'saturate(1.2) contrast(1.15) brightness(0.8)', tint: rgba(C.vi, 0.35) });
    vignette(c, pa);
    textIn(c, 'e⁻', 1500, 560, seg(t, 2.4, 3.2), { size: 260, w: 700, f: F.en, color: C.cy, a: pa, glow: rgba(C.cy, 0.8), blur: 40 });
    text(c, '高能電子  →  碰撞  →  活性物種', 1500, 640, { size: 34, w: 700, align: 'center', a: pa * seg(t, 3.4, 4.2) });
    text(c, 'ELECTRON-IMPACT CHEMISTRY', 1500, 684, { size: 18, f: F.mono, align: 'center', color: C.cy, ls: 5, a: pa * seg(t, 3.6, 4.4) });
  }
  const w = 560, gap = 35, x0 = (W - (3 * w + 2 * gap)) / 2, y0 = 190, h = 650;
  const defs = [
    { zh: '離子化碰撞', en: 'IONIZATION', col: C.cy, a: 6.4, b: 12, eq: 'e⁻ + Ar → Ar⁺ + 2e⁻', cap: '電子倍增 → 維持放電' },
    { zh: '激發碰撞', en: 'EXCITATION', col: C.am, a: 12.4, b: 23, eq: 'e⁻ + Ar → Ar* → Ar + hν', cap: '輝光 Glow Discharge → OES' },
    { zh: '分解碰撞', en: 'DISSOCIATION', col: C.vi, a: 23.4, b: 35, eq: 'e⁻ + SiH₄ → SiH₃* + H* + e⁻', cap: '自由基 Radicals → 表面反應' },
  ];
  const banner = seg(t, 35.4, 36.2, E.outE);
  defs.forEach((d, i) => {
    const ap = seg(t, 5.8 + i * 0.25, 6.6 + i * 0.25, E.outBack);
    if (ap <= 0) return;
    const fa = t < 6.4 ? 1 : focus(t, d.a, d.b, 0.32, t > 35);
    const x = x0 + i * (w + gap), y = y0 + (1 - ap) * 120, a = ap * fa;
    panel(c, x, y, w, h, { color: d.col, a, glow: fa > 0.9 && t > 6.4 && t < 35 ? 0.7 : 0 });
    text(c, d.zh, x + 32, y + 66, { size: 40, w: 900, color: d.col, a });
    text(c, d.en, x + 32, y + 100, { size: 18, f: F.mono, color: C.ink, a, ls: 4 });
    text(c, d.eq, x + w / 2, y + 160, { size: 26, w: 600, f: F.en, align: 'center', a });
    const cx = x + w / 2, cy = y + 380;
    c.save(); c.beginPath(); c.rect(x + 4, y + 180, w - 8, 380); c.clip();
    if (i === 0) ionization(c, t, cx, cy, a);
    else if (i === 1) excitation(c, t, cx, cy, a, t > 18.4);
    else dissociation(c, t, cx, cy, a);
    c.restore();
    text(c, d.cap, x + w / 2, y + 610, { size: 24, w: 700, align: 'center', color: d.col, a });
  });
  if (banner > 0) {
    c.save(); c.globalAlpha = banner * 0.85; c.fillStyle = '#05030c'; c.fillRect(0, 430, W, 220); c.restore();
    line(c, 0, 430, W, 430, C.vi, 2, banner, banner); line(c, W, 650, 0, 650, C.vi, 2, banner, banner);
    textIn(c, 'IONIZATION · EXCITATION · DISSOCIATION', W / 2, 515, seg(t, 35.6, 36.8, E.lin), { size: 44, w: 700, f: F.en, align: 'center', ls: 6, color: C.cy });
    text(c, '＝ 看懂 PECVD 的一半', W / 2, 600, { size: 54, w: 900, align: 'center', a: seg(t, 36.6, 37.4), glow: rgba(C.vi, 0.8), blur: 30 });
  }
  chapter(c, t, s, C.vi);
};
function ionization(c, t, cx, cy, a) {
  const per = 3, u = ((t - 6.4) % per + per) % per / per, hit = 0.27;
  const ex = u < hit ? lerp(cx - 260, cx - 50, u / hit) : cx - 50;
  // 原子
  const k = u < hit ? 0 : seg(u, hit, hit + 0.2, E.outC);
  const ax = cx + k * 90, ay = cy + k * 90;
  glow(c, ax, ay, 150, k > 0 ? C.rd : C.vi, a * 0.5);
  dot(c, ax, ay, lerp(64, 52, k), k > 0 ? '#c2456b' : '#6b4bd8', a);
  text(c, k > 0 ? 'Ar⁺' : 'Ar', ax, ay + 12, { size: 34, w: 700, f: F.en, align: 'center', a });
  if (u < hit) {
    for (let j = 0; j < 8; j++) dot(c, ex - j * 12, cy, 6 - j * 0.6, C.cy, a * (1 - j / 8));
    spark(c, ex, cy, 6, C.cy, a);
    text(c, 'e⁻', ex - 10, cy - 24, { size: 26, f: F.en, color: C.cy, a });
  } else {
    const v = (u - hit);
    const fl = Math.max(0, 1 - v * 8); glow(c, cx - 50, cy, 200 * fl, C.wh, a * fl);
    for (const [dx, dy] of [[1, -0.9], [1.2, -0.3]]) {
      const x = cx - 50 + dx * v * 420, y = cy + dy * v * 420;
      spark(c, x, y, 6, C.cy, a); text(c, 'e⁻', x + 12, y - 12, { size: 24, f: F.en, color: C.cy, a });
    }
  }
}
function excitation(c, t, cx, cy, a, oes) {
  const per = 3.4, u = ((t - 12.4) % per + per) % per / per;
  glow(c, cx, cy, 60, C.am, a * 0.8); dot(c, cx, cy, 20, C.am, a);
  const rings = [60, 110, 160];
  rings.forEach((r) => { c.save(); c.globalAlpha = a * 0.5; c.strokeStyle = C.ink; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); c.restore(); });
  // 電子能階：0.1 被撞 → 0.2 躍遷到外層 → 0.35 回落並放出光子
  const rr_ = u < 0.1 ? 60 : u < 0.2 ? lerp(60, 160, seg(u, 0.1, 0.2)) : u < 0.33 ? 160 : u < 0.4 ? lerp(160, 60, seg(u, 0.33, 0.4)) : 60;
  const an = t * 2.4;
  spark(c, cx + Math.cos(an) * rr_, cy + Math.sin(an) * rr_, 7, C.cy, a);
  if (u < 0.1) { const ex = lerp(cx - 270, cx - 70, u / 0.1); spark(c, ex, cy + 40, 5, C.cy, a); }
  if (u >= 0.35) {
    const v = (u - 0.35) / 0.65, x0 = cx + 40 + v * 260;
    c.save(); c.strokeStyle = C.am; c.lineWidth = 3; c.globalAlpha = a * (1 - v * 0.5); c.shadowColor = C.am; c.shadowBlur = 16; c.beginPath();
    for (let k = 0; k < 90; k++) { const x = x0 - 90 + k, yy = cy + Math.sin(k * 0.35) * 14 * Math.sin(k / 90 * Math.PI); k ? c.lineTo(x, yy) : c.moveTo(x, yy); }
    c.stroke(); c.restore();
    text(c, 'hν', x0 - 40, cy - 30, { size: 28, f: F.en, w: 700, color: C.am, a });
    const fl = Math.max(0, 1 - v * 3); glow(c, cx, cy, 260, C.am, a * fl * 0.6);
  }
  if (oes) {
    // OES 光譜示意（Ar 750 / 811 nm 等譜線）
    const x0 = cx - 220, y0 = cy + 150, ap = seg(t, 18.4, 19.4) * a;
    line(c, x0, y0, x0 + 440, y0, C.ink, 1.5, ap);
    [[0.12, 0.3], [0.3, 0.5], [0.52, 0.85], [0.62, 0.4], [0.78, 1], [0.86, 0.55]].forEach(([p, hgt], k) => {
      const hh = 70 * hgt * seg(t, 18.6 + k * 0.1, 19.2 + k * 0.1) * (0.85 + 0.15 * Math.sin(t * 7 + k));
      line(c, x0 + p * 440, y0, x0 + p * 440, y0 - hh, k % 2 ? C.am : C.rd, 4, ap);
    });
    text(c, 'OES  λ (nm)', x0 + 440, y0 + 22, { size: 14, f: F.mono, align: 'right', color: C.ink, a: ap });
  }
}
function dissociation(c, t, cx, cy, a) {
  const per = 3.2, u = ((t - 23.4) % per + per) % per / per, hit = 0.375;
  const k = u < hit ? 0 : seg(u, hit, 1, E.outC);
  const Hs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y], i) => [x * 62, y * 62, i]);
  // 鍵
  Hs.forEach(([hx, hy, i]) => {
    const fly = i === 1 ? k : 0;
    const x = cx + hx + fly * 220, y = cy + hy - fly * 120;
    if (fly < 0.05) line(c, cx, cy, x, y, C.ink, 4, a);
    glow(c, x, y, 40, C.wh, a * (0.3 + fly));
    dot(c, x, y, 18, '#dfe8f5', a);
    text(c, i === 1 && fly > 0.1 ? 'H*' : 'H', x, y + 8, { size: 20, w: 700, f: F.en, align: 'center', color: C.bg, a });
  });
  const rad = k > 0 ? 0.6 + 0.4 * Math.sin(t * 10) : 0;
  glow(c, cx, cy, 90 + rad * 50, C.vi, a * (0.4 + rad));
  dot(c, cx, cy, 34, '#7d63c9', a);
  text(c, 'Si', cx, cy + 11, { size: 30, w: 700, f: F.en, align: 'center', a });
  if (k > 0) text(c, 'SiH₃*', cx - 40, cy + 120, { size: 30, w: 700, f: F.en, align: 'center', color: C.vi, a: a * k });
  if (u < hit) { const ex = lerp(cx - 270, cx + 40, u / hit), ey = lerp(cy - 160, cy - 62, u / hit); spark(c, ex, ey, 6, C.cy, a); }
  else { const fl = Math.max(0, 1 - (u - hit) * 6); glow(c, cx + 50, cy - 62, 160 * fl, C.wh, a * fl); }
}

// =====================================================================
// 05 腔體架構
// =====================================================================
SCENES.chamber = function (c, t, s) {
  bg(c, t, { color: C.cy, k: 0.6 });
  const dp = seg(t, 2.4, 6.0, E.ioQ);
  const bp = (a, b) => seg(dp, a, b, E.lin);
  c.save(); c.lineWidth = 2.5; c.strokeStyle = rgba(C.cy, 0.85); c.lineJoin = 'round';
  // RF 產生器、匹配箱
  c.globalAlpha = 1;
  polyline(c, [[90, 140], [360, 140], [360, 250], [90, 250]], bp(0, 0.25), true);
  polyline(c, [[470, 140], [740, 140], [740, 250], [470, 250]], bp(0.1, 0.35), true);
  // 腔體
  polyline(c, [[470, 290], [1170, 290], [1170, 850], [470, 850]], bp(0.2, 0.7), true);
  // 噴頭
  c.strokeStyle = rgba(C.wh, 0.8);
  polyline(c, [[540, 340], [1100, 340], [1100, 362], [540, 362]], bp(0.4, 0.75), true);
  // 基座
  polyline(c, [[540, 682], [1100, 682], [1100, 760], [540, 760]], bp(0.5, 0.85), true);
  polyline(c, [[790, 760], [790, 850]], bp(0.7, 0.9)); polyline(c, [[850, 760], [850, 850]], bp(0.7, 0.9));
  // 排氣
  polyline(c, [[1170, 790], [1270, 790]], bp(0.8, 1)); polyline(c, [[1170, 820], [1270, 820]], bp(0.8, 1));
  c.restore();
  const la = seg(t, 3.0, 4.0);
  text(c, 'RF GENERATOR', 225, 185, { size: 20, w: 700, f: F.mono, align: 'center', a: la });
  text(c, '13.56 MHz', 225, 225, { size: 26, w: 600, f: F.mono, align: 'center', color: C.cy, a: la });
  text(c, 'MATCHING BOX', 605, 185, { size: 20, w: 700, f: F.mono, align: 'center', a: la });
  text(c, '50 Ω', 605, 225, { size: 26, w: 600, f: F.mono, align: 'center', color: C.vi, a: la });
  text(c, 'PUMP →', 1280, 812, { size: 16, f: F.mono, color: C.ink, a: la });
  // 噴頭孔
  for (let k = 0; k < 28; k++) { c.fillStyle = C.bg; c.globalAlpha = la; c.fillRect(556 + k * 19.5, 356, 6, 6); c.globalAlpha = 1; }
  // 纜線與 RF 波
  const ca = seg(t, 5.0, 6.2);
  const cable = [[360, 195], [470, 195]], cable2 = [[740, 195], [820, 195], [820, 290]];
  c.save(); c.strokeStyle = rgba(C.cy, 0.5 * ca); c.lineWidth = 6; polyline(c, cable); polyline(c, cable2); c.restore();
  if (t > 6.4) {
    const rfA = seg(t, 6.4, 7.2);
    // 功率脈衝沿纜線前進：產生器 → 匹配箱（110 px），匹配箱 → 腔體饋入點（80 + 95 px）
    for (let k = 0; k < 6; k++) {
      const d = ((t * 0.8 + k / 6) % 1) * 285;
      let x, y;
      if (d < 110) { x = 360 + d; y = 195; }
      else if (d < 190) { x = 740 + d - 110; y = 195; }
      else { x = 820; y = 195 + d - 190; }
      glow(c, x, y, 26, C.cy, rfA * 0.9); dot(c, x, y, 4, C.wh, rfA);
    }
    // 產生器內的正弦波
    c.save(); c.strokeStyle = C.cy; c.lineWidth = 2; c.globalAlpha = rfA; c.beginPath();
    for (let x = 0; x < 200; x++) { const yy = 265 + Math.sin(x * 0.15 - t * 14) * 10; x ? c.lineTo(125 + x, yy) : c.moveTo(125 + x, yy); }
    c.stroke(); c.restore();
  }
  // 量表與史密斯圖
  const ma = life(t, 6.4, 36.6, 0.6, 0.6);
  if (ma > 0) {
    const tune = seg(t, 12.4, 17.0, E.ioC);
    const refl = lerp(210, 2, tune) + (tune > 0.99 ? Math.sin(t * 5) * 0.6 : 0);
    panel(c, 1470, 140, 400, 300, { color: C.cy, a: ma, r: 10 });
    text(c, 'FWD POWER', 1500, 185, { size: 16, f: F.mono, color: C.ink, a: ma, ls: 3 });
    text(c, (1000 * seg(t, 6.4, 8, E.outC)).toFixed(0) + ' W', 1840, 185, { size: 30, w: 600, f: F.mono, align: 'right', color: C.cy, a: ma });
    text(c, 'REFL POWER', 1500, 240, { size: 16, f: F.mono, color: C.ink, a: ma, ls: 3 });
    text(c, Math.max(0, refl * seg(t, 6.4, 8)).toFixed(0) + ' W', 1840, 240, { size: 30, w: 600, f: F.mono, align: 'right', color: refl > 20 ? C.rd : C.gr, a: ma });
    [['C1 LOAD', lerp(0.25, 0.62, tune)], ['C2 TUNE', lerp(0.8, 0.41, tune)]].forEach(([lab, v], i) => {
      const y = 290 + i * 50;
      text(c, lab, 1500, y, { size: 16, f: F.mono, color: C.ink, a: ma });
      c.save(); c.globalAlpha = ma; c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(1620, y - 12, 220, 10); c.fillStyle = C.vi; c.fillRect(1620, y - 12, 220 * v, 10); c.restore();
    });
    if (tune > 0.98) text(c, '● MATCHED', 1500, 420, { size: 22, w: 700, f: F.mono, color: C.gr, a: ma * (0.7 + 0.3 * Math.sin(t * 6)) });
    // 史密斯圖：反射係數 Γ 螺旋收斂到中心（50 Ω）
    const sx = 1670, sy = 640, R = 150;
    c.save(); c.globalAlpha = ma * 0.9; c.strokeStyle = rgba(C.cy, 0.5); c.lineWidth = 1.5;
    c.beginPath(); c.arc(sx, sy, R, 0, Math.PI * 2); c.stroke();
    for (const r of [0.33, 1, 3]) { const rc = R / (1 + r); c.beginPath(); c.arc(sx + R - rc, sy, rc, 0, Math.PI * 2); c.stroke(); }
    for (const x of [0.5, 1, 2]) { const rx = R / x; c.save(); c.beginPath(); c.arc(sx, sy, R, 0, Math.PI * 2); c.clip(); c.beginPath(); c.arc(sx + R, sy - rx, rx, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(sx + R, sy + rx, rx, 0, Math.PI * 2); c.stroke(); c.restore(); }
    c.beginPath(); c.moveTo(sx - R, sy); c.lineTo(sx + R, sy); c.stroke();
    c.restore();
    const gm = lerp(0.62, 0.01, tune), ang = 2.2 + tune * 7;
    c.save(); c.strokeStyle = rgba(C.am, 0.7 * ma); c.lineWidth = 2; c.beginPath();
    for (let k = 0; k <= 40; k++) { const tt = tune * k / 40, g2 = lerp(0.62, 0.01, tt), a2 = 2.2 + tt * 7; const x = sx + Math.cos(a2) * g2 * R, y = sy + Math.sin(a2) * g2 * R; k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.restore();
    spark(c, sx + Math.cos(ang) * gm * R, sy + Math.sin(ang) * gm * R, 6, C.am, ma);
    text(c, 'SMITH CHART · Γ → 0', sx, sy + R + 34, { size: 16, f: F.mono, align: 'center', color: C.ink, a: ma, ls: 2 });
  }
  // 氣流
  const ga = seg(t, 18.4, 19.4);
  if (ga > 0) {
    polylineAlpha(c, [[1000, 140], [1000, 290]], C.gr, 3, ga);
    text(c, 'PROCESS GAS', 1000, 128, { size: 16, f: F.mono, color: C.gr, align: 'center', a: ga });
    for (let k = 0; k < 4; k++) { const u = (t * 1.2 + k / 4) % 1; arrow(c, 1000, 150 + u * 120, 1000, 170 + u * 120, C.gr, 3, ga * Math.sin(u * Math.PI), 10); }
    for (let k = 0; k < 28; k++) {
      const x = 559 + k * 19.5, u = (t * 0.9 + hash(k)) % 1;
      line(c, x, 368 + u * 120, x, 380 + u * 120, C.gr, 2, ga * 0.6 * (1 - u));
    }
  }
  // 電漿
  const pl = seg(t, 24.4, 25.4);
  if (pl > 0) {
    const pulse = 0.85 + 0.15 * Math.sin(t * 9);
    const g = c.createRadialGradient(820, 520, 30, 820, 520, 330);
    g.addColorStop(0, rgba(C.vi, 0.7 * pl * pulse)); g.addColorStop(0.6, rgba(C.vi, 0.25 * pl)); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.beginPath(); c.rect(472, 365, 696, 300); c.clip(); c.fillStyle = g; c.fillRect(472, 365, 696, 300); c.restore();
    for (let i = 0; i < 26; i++) {
      const x = 570 + hash(i) * 500 + Math.sin(t * 2 + i) * 20, y = 400 + ((hash(i + 3) * 240 + t * 30) % 240);
      const isIon = i % 2 === 0;
      spark(c, x, y, 5, isIon ? C.cy : C.vi, pl);
      text(c, isIon ? '+' : 'r', x, y - 10, { size: 14, w: 700, f: F.en, align: 'center', color: C.wh, a: pl * 0.8 });
    }
    // 鞘層：離子加速撞向晶圓
    c.save(); c.globalAlpha = pl; c.strokeStyle = rgba(C.cy, 0.8); c.setLineDash([10, 8]); c.lineWidth = 2;
    c.beginPath(); c.ellipse(820, 655, 290, 10, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    for (let k = 0; k < 10; k++) {
      const x = 600 + k * 50, u = (t * 1.6 + hash(k + 9)) % 1;
      arrow(c, x, 630 + u * 30, x, 650 + u * 30, C.cy, 2, pl * 0.9, 8);
    }
  }
  // 晶圓與加熱
  const hp = seg(t, 30.4, 32.0);
  c.save(); c.globalAlpha = seg(t, 4, 5); c.fillStyle = '#5c6a82'; c.fillRect(580, 672, 480, 10); c.restore();
  if (hp > 0) {
    const g = c.createLinearGradient(0, 682, 0, 760); g.addColorStop(0, rgba(C.am, 0.9 * hp)); g.addColorStop(1, rgba(C.rd, 0.4 * hp));
    c.fillStyle = g; c.fillRect(542, 684, 556, 74);
    glow(c, 820, 720, 380, C.am, hp * 0.35);
    text(c, Math.round(lerp(25, 350, seg(t, 30.4, 33, E.outC))) + ' °C', 820, 735, { size: 34, w: 700, f: F.mono, align: 'center', color: C.bg, a: hp });
  }
  // 標註
  const lx = 1215;
  callout(c, 1100, 351, lx - 30, 351, 'Showerhead', '氣體分配盤 / 上電極', C.wh, seg(t, 18.6, 19.6), { size: 26 });
  callout(c, 1060, 500, lx - 30, 480, 'Plasma Zone', '電漿區：離子 + 自由基', C.vi, seg(t, 24.6, 25.6), { size: 26 });
  callout(c, 1100, 655, lx - 30, 610, 'Ion Sheath', '鞘層：加速離子', C.cy, seg(t, 25.6, 26.6), { size: 26 });
  callout(c, 1100, 720, lx - 30, 730, 'Heated Chuck', '加熱基座 100–400 °C', C.am, seg(t, 30.6, 31.6), { size: 26 });
  // 五個旋鈕
  const ka = seg(t, 36.4, 37.2);
  if (ka > 0) {
    const knobs = [['RF POWER', 'W', 0.62, C.cy], ['PRESSURE', 'Torr', 0.4, C.am], ['GAS FLOW', 'sccm', 0.7, C.gr], ['TEMPERATURE', '°C', 0.55, C.rd], ['SPACING', 'mils', 0.35, C.vi]];
    knobs.forEach(([lab, unit, v, col], i) => {
      const kp = seg(t, 36.4 + i * 0.6, 37.0 + i * 0.6, E.outBack);
      const x = 1530, y = 190 + i * 132;
      if (kp <= 0) return;
      const val = v + Math.sin(t * 1.3 + i * 1.7) * 0.12;
      c.save(); c.globalAlpha = kp;
      c.fillStyle = 'rgba(10,16,30,0.9)'; c.beginPath(); c.arc(x, y, 46, 0, Math.PI * 2); c.fill();
      c.strokeStyle = rgba(col, 0.3); c.lineWidth = 6; c.beginPath(); c.arc(x, y, 46, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
      c.strokeStyle = col; c.beginPath(); c.arc(x, y, 46, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * val)); c.stroke();
      const an = Math.PI * (0.75 + 1.5 * val);
      c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(an) * 34, y + Math.sin(an) * 34); c.stroke();
      c.restore();
      text(c, lab, x + 70, y - 4, { size: 22, w: 700, f: F.mono, color: col, a: kp });
      text(c, (val * 100).toFixed(0) + '%  ' + unit, x + 70, y + 26, { size: 18, f: F.mono, color: C.ink, a: kp });
    });
  }
  chapter(c, t, s, C.cy);
};
function polylineAlpha(c, pts, col, lw, a) { c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; polyline(c, pts); c.restore(); }

// =====================================================================
// 06 PVD 磁控濺鍍
// =====================================================================
SCENES.pvd = function (c, t, s) {
  bg(c, t, { color: C.rd, k: 0.6, cx: 0.4 });
  const ox = 760, sy = 720, tw = 120, tb = 920;
  const ap = seg(t, 2.4, 3.4);
  // 電漿底光
  glow(c, ox, 460, 520, C.vi, ap * 0.35);
  // 磁鐵
  const mags = [['N', C.rd], ['S', '#4a7bd8'], ['N', C.rd]];
  mags.forEach(([m, col], i) => {
    const x = 460 + i * 200, y = 170 - (1 - seg(t, 2.6 + i * 0.1, 3.2 + i * 0.1, E.outBack)) * 60;
    c.save(); c.globalAlpha = ap; c.fillStyle = shade(col, -0.35); c.fillRect(x, y, 200, 55); c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(x, y, 200, 55); c.restore();
    text(c, m, x + 100, y + 42, { size: 36, w: 700, f: F.en, align: 'center', a: ap });
  });
  c.save(); c.globalAlpha = ap; c.fillStyle = '#3d4658'; c.fillRect(460, 225, 600, 50); c.restore();
  text(c, '陰極靶材 TARGET', ox, 260, { size: 22, w: 700, align: 'center', a: ap });
  // 磁力線與被困的電子
  const fa = seg(t, 5.0, 6.4);
  for (const cxm of [660, 860]) {
    for (let r = 0; r < 3; r++) {
      const rx = 60 + r * 28, ry = 50 + r * 26;
      c.save(); c.globalAlpha = fa * 0.6; c.strokeStyle = C.cy; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cxm, 275, rx, ry, 0, 0, Math.PI); c.stroke(); c.restore();
      for (let e = 0; e < 3; e++) {
        const an = ((t * (1.6 + r * 0.3) + e / 3 + r * 0.2) % 1) * Math.PI;
        spark(c, cxm + Math.cos(an) * rx, 275 + Math.sin(an) * ry, 3.5, C.cy, fa * focus(t, 6.4, 12, 0.6));
      }
    }
    // 侵蝕跑道
    glow(c, cxm, 278, 70, C.am, fa * (0.5 + 0.3 * Math.sin(t * 6)));
  }
  // 基板與溝槽
  const g = seg(t, 12.4, 31, E.lin);
  const topT = 26 * g, ohR = 6 + 50 * g, botT = 16 * g;
  c.save(); c.globalAlpha = ap;
  c.fillStyle = '#26324a';
  c.beginPath(); c.moveTo(280, sy); c.lineTo(ox - tw / 2, sy); c.lineTo(ox - tw / 2, tb); c.lineTo(ox + tw / 2, tb); c.lineTo(ox + tw / 2, sy); c.lineTo(1240, sy); c.lineTo(1240, 960); c.lineTo(280, 960); c.closePath(); c.fill();
  c.strokeStyle = rgba(C.wh, 0.3); c.lineWidth = 2; c.stroke();
  // 金屬膜
  if (g > 0) {
    const metal = c.createLinearGradient(0, sy - 40, 0, sy); metal.addColorStop(0, '#e9eef5'); metal.addColorStop(1, '#8c97a8');
    c.fillStyle = metal;
    c.fillRect(280, sy - topT, ox - tw / 2 - 280, topT); c.fillRect(ox + tw / 2, sy - topT, 1240 - ox - tw / 2, topT);
    for (const sx of [ox - tw / 2, ox + tw / 2]) { c.beginPath(); c.arc(sx, sy - topT * 0.4, ohR * 0.9, 0, Math.PI * 2); c.fill(); }
    const bw = Math.max(0, tw - 2 * ohR * 0.9 + 30);
    c.beginPath(); c.ellipse(ox, tb, bw / 2, botT, 0, Math.PI, 0); c.fill();
    c.fillRect(ox - tw / 2, sy, 3 * g, tb - sy); c.fillRect(ox + tw / 2 - 3 * g, sy, 3 * g, tb - sy);
  }
  c.restore();
  // 離子與濺射原子
  if (t > 6.4) {
    const ia = seg(t, 6.4, 7.4);
    for (let i = 0; i < 16; i++) {
      const u = (t * 0.9 + hash(i)) % 1, tx = i % 2 ? 660 : 860, x = tx + (hash(i + 3) - 0.5) * 140 * (1 - u), y = lerp(640, 285, E.inQ(u));
      spark(c, x, y, 6, C.am, ia * (u < 0.95 ? 1 : 0));
      if (i < 4) text(c, 'Ar⁺', x + 12, y, { size: 18, w: 700, f: F.en, color: C.am, a: ia * 0.9 });
      if (u > 0.95) glow(c, tx, 285, 60, C.wh, ia);
    }
  }
  if (t > 12.4) {
    const rate = 50, t0 = 12.4;
    const iMax = Math.floor((t - t0) * rate), iMin = Math.max(0, Math.floor((t - t0 - 1.4) * rate));
    for (let i = iMin; i <= iMax; i++) {
      const tb_ = t0 + i / rate, age = t - tb_;
      const sxp = (i % 2 ? 660 : 860) + (hash(i) - 0.5) * 80, th = (hash(i + 0.5) - 0.5) * 1.3;
      const x = sxp + Math.sin(th) * 520 * age, y = 285 + Math.cos(th) * 520 * age;
      const inTrench = x > ox - tw / 2 + ohR * 0.6 && x < ox + tw / 2 - ohR * 0.6;
      const stop = inTrench ? tb - botT : sy - topT;
      if (y > stop) continue;
      line(c, x - Math.sin(th) * 22, y - Math.cos(th) * 22, x, y, rgba(C.wh, 0.35), 1.5, 1);
      dot(c, x, y, 5, '#d8e0ea', 1);
    }
    text(c, 'LINE-OF-SIGHT', 300, 400, { size: 20, f: F.mono, color: C.wh, a: seg(t, 13, 14) * 0.8, ls: 4 });
  }
  // 懸垂標註
  const oa = seg(t, 24.4, 25.4);
  if (oa > 0) {
    glow(c, ox - tw / 2, sy - 10, 90, C.rd, oa * (0.6 + 0.4 * Math.sin(t * 8)));
    glow(c, ox + tw / 2, sy - 10, 90, C.rd, oa * (0.6 + 0.4 * Math.sin(t * 8)));
    callout(c, ox - tw / 2 - 20, sy - 20, 420, 560, '懸垂效應 Overhang', '開口提前封閉 → 內部空洞', C.rd, oa, { size: 30 });
  }
  // 關鍵洞察
  const ia = seg(t, 18.4, 19.4, E.outC);
  if (ia > 0) {
    const x = 1310, y = 220, wdt = 540;
    panel(c, x + (1 - ia) * 80, y, wdt, 560, { color: C.am, a: ia, glow: 0.4 });
    text(c, 'KEY INSIGHT', x + 36, y + 64, { size: 26, w: 700, f: F.en, color: C.am, a: ia, ls: 4 });
    const rows = [['✓', '純物理：動能轟擊，無化學反應', C.gr], ['✓', '高純度金屬導線、阻擋層', C.gr], ['✓', '速率快、低溫', C.gr], ['✕', '依賴視線法則 Line-of-Sight', C.rd], ['✕', '深溝槽 → 懸垂、底部覆蓋差', C.rd]];
    rows.forEach(([ic, tx, col], i) => {
      const rp = seg(t, 19.2 + i * 0.5 + (i > 2 ? 4.4 : 0), 19.8 + i * 0.5 + (i > 2 ? 4.4 : 0));
      text(c, ic, x + 40, y + 140 + i * 78, { size: 30, w: 700, color: col, a: rp });
      text(c, tx, x + 86, y + 140 + i * 78, { size: 26, w: 500, a: rp });
    });
  }
  chapter(c, t, s, C.rd);
};

// =====================================================================
// 07 化學廚房
// =====================================================================
const RECIPES = [
  { f: 'SiO₂', zh: '二氧化矽', role: '介電與隔離層', eq: 'SiH₄ + N₂O/O₂ → SiO₂ + 副產物', chips: ['PECVD', '300–400 °C', 'ILD'], col: C.cy, a: 5.4, b: 12, eqT: 5.6 },
  { f: 'Si₃N₄', zh: '氮化矽', role: '保護與應力層', eq: '3SiH₄ + 4NH₃ → Si₃N₄ + 12H₂', chips: ['高緻密度', '抗水氣', '應力可調'], col: C.vi, a: 12.4, b: 19, eqT: 12.6 },
  { f: 'Poly-Si', zh: '多晶矽', role: '傳統閘極與導體', eq: 'SiH₄ → Si + 2H₂（LPCVD）', chips: ['> 600 °C', '熱分解', '高覆蓋率'], col: C.am, a: 19.4, b: 26, eqT: 19.6 },
];
SCENES.kitchen = function (c, t, s) {
  bg(c, t, { color: C.am, k: 0.6 });
  const w = 540, h = 600, gap = 40, x0 = (W - (3 * w + 2 * gap)) / 2, y0 = 190;
  const out = seg(t, 26.2, 27.2, E.inC);
  if (out < 1) RECIPES.forEach((r, i) => {
    const ap = seg(t, 2.6 + i * 0.3, 3.3 + i * 0.3, E.outBack);
    if (ap <= 0) return;
    const fa = t < 5.4 ? 1 : focus(t, r.a, r.b, 0.38);
    const a = ap * fa * (1 - out), x = x0 + i * (w + gap), y = y0 + (1 - ap) * 100 - out * 60;
    panel(c, x, y, w, h, { color: r.col, a, glow: fa > 0.9 && t > 5.4 ? 0.6 : 0 });
    text(c, r.f, x + 36, y + 86, { size: 64, w: 700, f: F.en, color: r.col, a });
    text(c, r.zh, x + w - 36, y + 70, { size: 34, w: 900, align: 'right', a });
    text(c, r.role, x + w - 36, y + 104, { size: 22, color: C.ink, align: 'right', a });
    c.save(); c.globalAlpha = a; rr(c, x + 28, y + 140, w - 56, 70, 10); c.fillStyle = 'rgba(255,255,255,0.05)'; c.fill(); c.restore();
    typed(c, r.eq, x + 46, y + 186, seg(t, r.eqT, r.eqT + 2.2, E.lin), { size: 24, w: 600, f: F.mono, color: C.wh, a, ls: 0 });
    r.chips.forEach((ch, k) => {
      const cw = measure(c, ch, 20, 700) + 32, cxp = x + 36 + r.chips.slice(0, k).reduce((sum, q) => sum + measure(c, q, 20, 700) + 44, 0);
      const cp = seg(t, r.eqT + 2.0 + k * 0.25, r.eqT + 2.4 + k * 0.25);
      c.save(); c.globalAlpha = a * cp; rr(c, cxp, y + 236, cw, 40, 20); c.fillStyle = rgba(r.col, 0.18); c.fill(); c.strokeStyle = r.col; c.lineWidth = 1.5; c.stroke(); c.restore();
      text(c, ch, cxp + 16, y + 263, { size: 20, w: 700, color: r.col, a: a * cp });
    });
    // 等角晶塊與成膜
    const o = { x: x + w / 2, y: y + 520, s: 1 };
    const g = seg(t, r.eqT + 0.5, r.b, E.lin);
    isoBox(c, o, -120, -120, 0, 240, 240, 50, C.si, { a });
    isoBox(c, o, -120, -120, 50, 240, 240, 4 + 30 * g, r.col, { a, alpha: 0.85, glow: fa > 0.9 ? 0.6 : 0 });
    for (let k = 0; k < 14; k++) {
      const u = (t * 0.8 + hash(k + i * 20)) % 1;
      const [px, py] = isoP(o, -110 + hash(k + 3) * 220, -110 + hash(k + 4) * 220, 54 + 30 * g + (1 - u) * 160);
      dot(c, px, py, 3.5, r.col, a * fa * Math.sin(u * Math.PI));
    }
  });
  // 矽烷分支圖
  const da = seg(t, 26.8, 28.0);
  if (da > 0) {
    const cx = 960, cy = 520;
    const ends = [[470, 330, 0], [1450, 330, 1], [960, 800, 2]];
    const conds = ['+ N₂O / O₂ · PECVD · 低溫', '+ NH₃ · PECVD / LPCVD', 'Δ > 600 °C · LPCVD'];
    ends.forEach(([ex, ey, i], k) => {
      const r = RECIPES[i], p = seg(t, 27.2 + k * 0.4, 28.4 + k * 0.4, E.ioC);
      line(c, cx, cy, ex, ey, r.col, 3, da, p);
      const mx = lerp(cx, ex, 0.5), my = lerp(cy, ey, 0.5);
      text(c, conds[k], mx + (k === 2 ? 30 : 0), my - (k === 2 ? 0 : 18), { size: 22, w: 500, f: F.tc, align: k === 2 ? 'left' : 'center', color: C.ink, a: p });
      glow(c, ex, ey, 140, r.col, p * 0.5);
      text(c, r.f, ex, ey + 18, { size: 60, w: 700, f: F.en, align: 'center', color: r.col, a: p });
      text(c, r.zh, ex, ey + 58, { size: 24, w: 700, align: 'center', a: p });
    });
    // 矽烷分子
    const rot = t * 0.8;
    for (let k = 0; k < 4; k++) {
      const an = rot + k * Math.PI / 2, hx = cx + Math.cos(an) * 80, hy = cy + Math.sin(an) * 50 * Math.cos(rot * 0.5 + k);
      line(c, cx, cy, hx, hy, C.ink, 4, da);
      dot(c, hx, hy, 18, '#dfe8f5', da); text(c, 'H', hx, hy + 7, { size: 18, w: 700, f: F.en, align: 'center', color: C.bg, a: da });
    }
    glow(c, cx, cy, 140, C.wh, da * 0.4); dot(c, cx, cy, 42, '#6d7da0', da);
    text(c, 'Si', cx, cy + 13, { size: 36, w: 700, f: F.en, align: 'center', a: da });
    text(c, 'SiH₄', cx - 120, cy + 100, { size: 34, w: 700, f: F.en, align: 'right', color: C.wh, a: da });
    text(c, '矽烷：同一種起手式', cx - 120, cy + 134, { size: 20, align: 'right', color: C.ink, a: da });
  }
  chapter(c, t, s, C.am);
};
