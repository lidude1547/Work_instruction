// 14 個場景的動態圖像。每個 draw(c, t, s) 只依賴場景內時間 t，可任意跳轉。
const SCENES = {};

// ---------- 共用：章節標題卡 + 左上角章節標籤 ----------
function chapter(c, t, s, col = C.cy) {
  const dur = s.dur;
  if (t < 2.9) {
    const pin = seg(t, 0, 0.7, E.outE), pout = seg(t, 2.1, 2.9, E.inC);
    const a = Math.min(pin, 1 - pout), dy = -pout * 120;
    c.save(); c.globalAlpha = 0.65 * a; c.fillStyle = '#02030a'; c.fillRect(0, 0, W, H); c.restore();
    text(c, s.ch, W / 2 - 520 + (1 - pin) * -120, H / 2 + 150 + dy, { size: 420, w: 700, f: F.en, stroke: rgba(col, 0.55 * a), lw: 2, a: 1 });
    textIn(c, s.zh, W / 2 - 40, H / 2 + 10 + dy, seg(t, 0.15, 1.1, E.lin), { size: 120, w: 900, color: C.wh, a, glow: rgba(col, 0.6), blur: 30 });
    text(c, s.en, W / 2 - 36, H / 2 + 80 + dy, { size: 30, w: 500, f: F.mono, color: col, ls: lerp(30, 8, pin), a: a * seg(t, 0.4, 1.0) });
    line(c, W / 2 - 40, H / 2 + 112 + dy, W / 2 - 40 + 620, H / 2 + 112 + dy, col, 3, a, seg(t, 0.3, 1.2, E.outE));
    text(c, 'CH.' + s.ch, W / 2 - 40, H / 2 - 128 + dy, { size: 26, w: 600, f: F.mono, color: C.ink, a: a * seg(t, 0.3, 0.8), ls: 6 });
  }
  const la = life(t, 2.5, dur - 0.3, 0.6, 0.4);
  if (la > 0) {
    text(c, 'CH.' + s.ch, 72, 92, { size: 22, w: 600, f: F.mono, color: col, a: la, ls: 4 });
    line(c, 150, 85, 180, 85, col, 2, la);
    text(c, s.zh, 192, 94, { size: 28, w: 700, a: la });
    text(c, s.en, 192 + measure(c, s.zh, 28, 700) + 20, 92, { size: 18, w: 500, f: F.mono, color: C.ink, a: la * 0.9, ls: 3 });
  }
}
// 焦點：在 [a,b] 區間時為 1，其餘時間淡到 dimTo
function focus(t, a, b, dimTo = 0.35, always = false) {
  if (always) return 1;
  const k = Math.min(seg(t, a - 0.3, a + 0.3), 1 - seg(t, b - 0.3, b + 0.3));
  return lerp(dimTo, 1, k);
}

// =====================================================================
// 00 序章
// =====================================================================
const STACK_NAMES = ['Si Substrate', 'STI Oxide', 'Gate Oxide', 'High-k', 'Metal Gate', 'Spacer SiN', 'CESL', 'PMD Oxide', 'W Contact', 'M1 Barrier', 'M1 Cu', 'SiCN Cap', 'Low-k ILD', 'Via 1', 'M2 Cu', 'SiCN Cap', 'Low-k ILD', 'M3 Cu', 'Passivation', 'Bond Pad'];
const STACK_COLS = [C.si, C.cy, C.gr, C.cy, C.am, C.vi, C.gr, C.cy, C.ink, C.vi, C.cu, C.gr, C.vi, C.ink, C.cu, C.gr, C.vi, C.cu, C.cy, C.am];

SCENES.intro = function (c, t, s) {
  bg(c, t, { grid: t > 19.8, dust: t > 19.8 ? 40 : 14, k: t > 19.8 ? 1 : 0.4 });
  const cx = W / 2, cy = H / 2;

  // A. 原子 → 晶格 → 晶圓（0–10.4）
  if (t < 10.6) {
    const aOut = 1 - seg(t, 9.6, 10.4, E.inQ);
    // 單一原子
    const a1 = seg(t, 0, 1.2) * (1 - seg(t, 2.2, 3.2));
    const pulse = 1 + 0.15 * Math.sin(t * 6);
    spark(c, cx, cy, 10 * pulse, C.cy, a1);
    for (let k = 0; k < 3; k++) {
      const u = ((t * 0.6 + k / 3) % 1);
      c.save(); c.strokeStyle = rgba(C.cy, (1 - u) * 0.5 * a1); c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, 20 + u * 160, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    // 晶格縮放
    const zp = seg(t, 2.0, 7.6, E.ioC);
    const sp = 300 * Math.pow(14 / 300, zp);
    const la = seg(t, 1.8, 2.8) * (1 - seg(t, 6.6, 7.8));
    if (la > 0) {
      const nx = Math.ceil(W / 2 / sp) + 1, ny = Math.ceil(H / 2 / sp) + 1;
      c.save(); c.translate(cx, cy); c.rotate(zp * 0.6);
      c.strokeStyle = rgba(C.cy, 0.25 * la); c.lineWidth = Math.max(0.5, sp * 0.02);
      c.beginPath();
      for (let i = -nx; i <= nx; i++) { c.moveTo(i * sp, -ny * sp); c.lineTo(i * sp, ny * sp); }
      for (let j = -ny; j <= ny; j++) { c.moveTo(-nx * sp, j * sp); c.lineTo(nx * sp, j * sp); }
      c.stroke();
      if (sp > 26) {
        for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++) {
          const r = sp * 0.08;
          const k = (i + j) & 1;
          dot(c, i * sp, j * sp, r, k ? C.cy : C.vi, la);
          if (sp > 80) glow(c, i * sp, j * sp, r * 5, k ? C.cy : C.vi, la * 0.4);
        }
      } else {
        c.fillStyle = rgba(C.cy, 0.6 * la);
        for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++) c.fillRect(i * sp - 1, j * sp - 1, 2, 2);
      }
      c.restore();
    }
    // 晶圓
    const wa = seg(t, 6.2, 7.6) * aOut;
    if (wa > 0) {
      const R = lerp(2600, 400, seg(t, 6.2, 9.0, E.outC)) * lerp(1, 0.6, seg(t, 9.6, 10.4, E.inQ));
      drawWafer(c, cx, cy, R, t * 0.05, wa, C.cy);
    }
    // 視野尺度讀數
    const ra = seg(t, 1.0, 2.0) * aOut;
    const fov = Math.pow(10, lerp(-9.5, -0.5, seg(t, 1.8, 9.0, E.ioC)));
    const unit = fov < 1e-6 ? (fov * 1e9).toFixed(fov < 1e-8 ? 2 : 0) + ' nm' : fov < 1e-3 ? (fov * 1e6).toFixed(0) + ' µm' : (fov * 1e3).toFixed(0) + ' mm';
    text(c, 'FIELD OF VIEW', 80, H - 150, { size: 18, f: F.mono, color: C.ink, a: ra, ls: 4 });
    text(c, unit, 80, H - 105, { size: 44, w: 600, f: F.mono, color: C.cy, a: ra });
    line(c, 80, H - 88, 80 + 300 * seg(t, 1.8, 9.0, E.ioC), H - 88, C.cy, 3, ra);
  }

  // B. 城市照片（9.6–14.6）
  const ca = life(t, 9.6, 14.8, 0.5, 0.6);
  if (ca > 0) {
    photo(c, 'city', { a: ca, zoom: lerp(1.25, 1.08, seg(t, 9.6, 14.8, E.lin)), py: 0.2, filter: 'saturate(0.6) contrast(1.15) brightness(0.65)', tint: rgba(C.cy, 0.25) });
    // 晶粒格線疊在城市上
    c.save(); c.globalAlpha = ca * 0.35; c.strokeStyle = C.cy; c.lineWidth = 1;
    const gs = 96, off = (t - 9.6) * 12;
    c.beginPath();
    for (let x = -off % gs; x < W; x += gs) { c.moveTo(x, 0); c.lineTo(x, H); }
    for (let y = -off % gs; y < H; y += gs) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke(); c.restore();
    vignette(c, ca);
    textIn(c, 'A CHIP IS A CITY', cx, cy - 10, seg(t, 10.0, 11.2, E.lin), { size: 130, w: 700, f: F.en, align: 'center', ls: 6, a: ca, glow: rgba(C.cy, 0.5), blur: 40 });
    text(c, '街道寬度：數奈米 ・ 樓層：上百層', cx, cy + 70, { size: 34, w: 500, align: 'center', color: C.wh, a: ca * seg(t, 11.0, 11.8), ls: 4 });
    // 掃描框
    const fx = cx + Math.sin(t * 0.8) * 300, fy = cy + 200;
    c.save(); c.globalAlpha = ca * 0.8; c.strokeStyle = C.am; c.lineWidth = 2; c.strokeRect(fx - 80, fy - 50, 160, 100); c.restore();
    text(c, 'DIE 0x' + (Math.floor(t * 7) % 256).toString(16).toUpperCase().padStart(2, '0'), fx - 78, fy - 60, { size: 16, f: F.mono, color: C.am, a: ca });
  }

  // C. 等角薄膜堆疊（14.2–20）
  const sa = life(t, 14.2, 20.0, 0.5, 0.25);
  if (sa > 0) {
    const o = { x: cx - 120, y: cy + 230, s: 1 };
    let z = 0;
    for (let i = 0; i < 20; i++) {
      const ti = 14.6 + i * 0.22;
      const p = seg(t, ti, ti + 0.3, E.outBack);
      const h = 9 + (i % 3) * 4;
      if (p > 0) isoBox(c, o, -170, -170, z + (1 - p) * 220, 340, 340, h, STACK_COLS[i], { a: sa * clamp(p * 2), alpha: 0.92, glow: t - ti < 0.5 ? 1 - (t - ti) * 2 : 0 });
      if (p > 0) {
        const [lx, ly] = isoP(o, 170, -170, z + h / 2);
        text(c, String(i + 1).padStart(2, '0') + '  ' + STACK_NAMES[i], lx + 40, ly + 6, { size: 18, f: F.mono, color: STACK_COLS[i], a: sa * clamp(p) * clamp(1 - (Math.min(20, Math.floor((t - 14.6) / 0.22) + 1) - 1 - i) / 6) });
      }
      z += h;
    }
    text(c, 'LAYER BY LAYER', 120, 300, { size: 64, w: 700, f: F.en, a: sa * seg(t, 14.6, 15.4), ls: 4 });
    text(c, '一層一層，以原子為單位堆疊', 120, 350, { size: 30, w: 500, color: C.ink, a: sa * seg(t, 15.0, 15.8) });
    const n = Math.max(0, Math.min(20, Math.floor((t - 14.6) / 0.22) + 1));
    text(c, String(n).padStart(2, '0'), 120, 520, { size: 150, w: 700, f: F.en, color: C.cy, a: sa, glow: rgba(C.cy, 0.5) });
    text(c, '/ 20+ LAYERS', 330, 520, { size: 28, f: F.mono, color: C.ink, a: sa });
  }

  // D. 標題（19.8–36）
  if (t >= 19.8) {
    const k = seg(t, 19.8, 20.2);
    const shake = Math.max(0, 1 - (t - 20) / 0.6);
    c.save();
    c.translate((hash(Math.floor(t * 60)) - 0.5) * 24 * shake, (hash(Math.floor(t * 60) + 1) - 0.5) * 24 * shake);
    const up = seg(t, 23.6, 25.0, E.ioC);
    const ty = lerp(cy + 20, cy - 110, up), sc = lerp(1, 0.78, up);
    // 背後的晶圓光環
    drawWafer(c, cx, ty - 40, 520 + Math.sin(t * 0.5) * 6, t * 0.03, 0.22 * k, C.vi, true);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2 + t * 0.05;
      c.save(); c.globalAlpha = 0.08 * k; c.strokeStyle = i % 2 ? C.cy : C.vi; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * 560, ty - 40 + Math.sin(a) * 560); c.lineTo(cx + Math.cos(a) * 1400, ty - 40 + Math.sin(a) * 1400); c.stroke(); c.restore();
    }
    c.save(); c.translate(cx, ty); c.scale(sc, sc);
    const g = shake;
    if (g > 0) {
      text(c, DATA.config.title, -14 * g, 0, { size: 210, w: 900, align: 'center', color: C.rd, a: 0.7 * g, base: 'middle' });
      text(c, DATA.config.title, 14 * g, 0, { size: 210, w: 900, align: 'center', color: C.cy, a: 0.7 * g, base: 'middle' });
    }
    text(c, DATA.config.title, 0, 0, { size: 210, w: 900, align: 'center', base: 'middle', glow: rgba(C.cy, 0.55), blur: 50, ls: 10 });
    // 切片錯位
    if (g > 0.2) {
      for (let i = 0; i < 4; i++) {
        const yy = -100 + hash(Math.floor(t * 30) + i) * 200;
        c.save(); c.beginPath(); c.rect(-800, yy, 1600, 14); c.clip();
        text(c, DATA.config.title, (hash(i + Math.floor(t * 30)) - 0.5) * 120 * g, 0, { size: 210, w: 900, align: 'center', base: 'middle', color: C.cy, ls: 10 });
        c.restore();
      }
    }
    text(c, DATA.config.titleEn, 0, 150, { size: 40, w: 500, f: F.mono, align: 'center', color: C.cy, ls: lerp(60, 22, seg(t, 20, 21.5, E.outE)), a: seg(t, 20.2, 21) });
    c.restore();
    c.restore();
    // 閃白
    const fl = Math.max(0, 1 - Math.abs(t - 20) / 0.35);
    if (fl > 0) { c.save(); c.globalAlpha = fl * 0.9; c.fillStyle = '#dff8ff'; c.fillRect(0, 0, W, H); c.restore(); }

    // E. 副標與旅程時間軸
    textIn(c, DATA.config.subtitle, cx, cy + 95, seg(t, 24.2, 25.4, E.lin), { size: 46, w: 500, align: 'center', color: C.wh, ls: 8 });
    const ja = seg(t, 25.4, 26.2);
    if (ja > 0) {
      const x0 = 260, x1 = W - 260, yy = cy + 250;
      const zoom = seg(t, 33.6, 35.9, E.inC);
      const nodeX = (i) => lerp(x0, x1, i / 11);
      c.save();
      c.translate(nodeX(0), yy); c.scale(1 + zoom * 7, 1 + zoom * 7); c.translate(-nodeX(0), -yy);
      line(c, x0, yy, x1, yy, C.dim, 2, ja, seg(t, 25.4, 27.4, E.ioC));
      for (let i = 0; i < 12; i++) {
        const sc = DATA.scenes[i + 1], ap = seg(t, 26 + i * 0.25, 26.6 + i * 0.25, E.outBack);
        const col = [C.cy, C.vi, C.am][i % 3];
        if (ap <= 0) continue;
        dot(c, nodeX(i), yy, 8 * ap, col, ja); glow(c, nodeX(i), yy, 36, col, 0.6 * ap);
        text(c, sc.ch, nodeX(i), yy - 30, { size: 18, f: F.mono, align: 'center', color: col, a: ap });
        text(c, sc.zh, nodeX(i), yy + (i % 2 ? 78 : 48), { size: 20, w: 500, align: 'center', color: C.ink, a: ap * (1 - zoom) });
      }
      const pp = ((t - 27) / 6) % 1;
      if (t > 27) spark(c, lerp(x0, x1, pp), yy, 4, C.wh, ja * (1 - zoom));
      c.restore();
    }
    // 無塵室照片作為底
    const pa = life(t, 28.8, 34.6, 1.2, 1.0) * 0.32;
    if (pa > 0) {
      c.save(); c.globalCompositeOperation = 'screen';
      photo(c, 'cleanroom', { a: pa, zoom: lerp(1.05, 1.15, seg(t, 28.8, 35, E.lin)), filter: 'grayscale(1) contrast(1.3) brightness(0.7)', tint: rgba(C.cy, 0.6) });
      c.restore();
    }
    text(c, 'FOR PROCESS & EQUIPMENT ENGINEERS', cx, H - 150, { size: 20, f: F.mono, align: 'center', color: C.ink, ls: 8, a: seg(t, 29.4, 30.4) * (1 - seg(t, 33.6, 34.4)) });
  }
};

function drawWafer(c, cx, cy, R, rot, a, col, ringOnly = false) {
  if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.translate(cx, cy); c.rotate(rot);
  c.beginPath(); c.arc(0, 0, R, Math.PI / 2 + 0.03, Math.PI / 2 + Math.PI * 2 - 0.03); c.lineTo(0, R - R * 0.03); c.closePath();
  if (!ringOnly) {
    const gr = c.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R);
    gr.addColorStop(0, '#26324a'); gr.addColorStop(0.7, '#121a2a'); gr.addColorStop(1, '#0a0f1a');
    c.fillStyle = gr; c.fill();
  }
  c.save(); c.clip();
  const ds = Math.max(18, R / 7.5);
  c.strokeStyle = rgba(col, 0.35); c.lineWidth = 1;
  c.beginPath();
  for (let x = -R; x <= R; x += ds) { c.moveTo(x, -R); c.lineTo(x, R); }
  for (let y = -R; y <= R; y += ds) { c.moveTo(-R, y); c.lineTo(R, y); }
  c.stroke();
  if (!ringOnly) {
    // 薄膜干涉的彩虹反光
    const sh = c.createLinearGradient(-R, -R, R, R);
    sh.addColorStop(0, 'rgba(56,232,255,0)'); sh.addColorStop(0.45, 'rgba(164,107,255,0.18)'); sh.addColorStop(0.55, 'rgba(56,232,255,0.22)'); sh.addColorStop(1, 'rgba(255,178,63,0)');
    c.fillStyle = sh; c.fillRect(-R, -R, 2 * R, 2 * R);
  }
  c.restore();
  c.beginPath(); c.arc(0, 0, R, Math.PI / 2 + 0.03, Math.PI / 2 + Math.PI * 2 - 0.03); c.lineTo(0, R - R * 0.03); c.closePath();
  c.shadowColor = col; c.shadowBlur = 30; c.strokeStyle = col; c.lineWidth = 3; c.stroke();
  c.restore();
}

// =====================================================================
// 01 砌磚工程
// =====================================================================
SCENES.brick = function (c, t, s) {
  bg(c, t, { color: C.cy });
  const tiles = [
    { zh: '黃光微影', en: 'LITHOGRAPHY', a: 5.4, b: 7.7, col: C.am },
    { zh: '蝕刻圖案化', en: 'ETCH', a: 7.7, b: 10.2, col: C.rd },
    { zh: '擴散與植入', en: 'DIFFUSION / IMPLANT', a: 10.4, b: 15.0, col: C.gr },
    { zh: '薄膜沉積', en: 'THIN FILM DEPOSITION', a: 15.4, b: 99, col: C.cy },
  ];
  const ta = life(t, 2.6, 19.6, 0.4, 0.8);
  if (ta > 0) {
    const w = 360, h = 360, gap = 40, x0 = (W - (4 * w + 3 * gap)) / 2, y0 = 330;
    tiles.forEach((tl, i) => {
      const ap = seg(t, 2.8 + i * 0.2, 3.4 + i * 0.2, E.outBack);
      const act = Math.min(seg(t, tl.a - 0.2, tl.a + 0.3), 1 - seg(t, tl.b - 0.2, tl.b + 0.3));
      const dimmed = t > 5.2 ? lerp(0.45, 1, act) : 1;
      const x = x0 + i * (w + gap), y = y0 + (1 - ap) * 80 - act * 16 - seg(t, 18.6 + i * 0.1, 19.6, E.inC) * 200;
      if (ap <= 0) return;
      panel(c, x, y, w, h, { color: tl.col, a: ta * ap * dimmed, glow: act, line: lerp(0.3, 1, act) });
      tileIcon(c, i, x + w / 2, y + 150, t, act, ta * ap * dimmed, tl.col);
      text(c, tl.zh, x + w / 2, y + 285, { size: 36, w: 700, align: 'center', a: ta * ap * dimmed });
      text(c, tl.en, x + w / 2, y + 322, { size: 16, w: 500, f: F.mono, align: 'center', color: tl.col, ls: 3, a: ta * ap * dimmed });
      text(c, '0' + (i + 1), x + 22, y + 44, { size: 20, f: F.mono, color: tl.col, a: ta * ap * dimmed });
    });
    text(c, '前段製程四大模組', W / 2, 250, { size: 44, w: 700, align: 'center', a: ta * seg(t, 2.6, 3.4) });
    text(c, 'FRONT-END-OF-LINE PROCESS MODULES', W / 2, 288, { size: 18, f: F.mono, align: 'center', color: C.ink, ls: 6, a: ta * seg(t, 2.8, 3.6) });
  }
  // 照片插曲
  const pa = life(t, 17.8, 21.2, 0.6, 0.8);
  if (pa > 0) {
    photo(c, 'layers', { a: pa, zoom: lerp(1.3, 1.1, seg(t, 17.8, 21.2, E.lin)), px: -0.2, filter: 'saturate(0.8) contrast(1.2) brightness(0.75)', tint: rgba(C.vi, 0.25) });
    vignette(c, pa);
    text(c, '15–20+', 140, H / 2 + 40, { size: 220, w: 700, f: F.en, a: pa * seg(t, 18.2, 18.8), glow: rgba(C.cy, 0.5), blur: 40 });
    text(c, 'THIN-FILM LAYERS PER CHIP', 150, H / 2 + 100, { size: 26, f: F.mono, color: C.cy, ls: 6, a: pa * seg(t, 18.4, 19.0) });
  }
  // 等角堆疊 + 摩天樓藍圖
  const sa = seg(t, 20.2, 20.8);
  if (sa > 0) {
    const o = { x: 640, y: 780, s: 1 };
    let z = 0;
    const n = Math.max(0, Math.min(20, Math.floor((t - 20.5) / 0.45) + 1));
    for (let i = 0; i < 20; i++) {
      const ti = 20.5 + i * 0.45, p = seg(t, ti, ti + 0.4, E.outBack), h = 12 + (i % 4) * 3;
      if (p > 0) isoBox(c, o, -200, -200, z + (1 - p) * 260, 400, 400, h, STACK_COLS[i], { a: sa * clamp(p * 2), alpha: 0.9, glow: Math.max(0, 1 - (t - ti) * 1.5) });
      z += h;
    }
    // 卡尺
    const zTop = 20 * 16.5;
    const cp = seg(t, 26.4, 27.2);
    if (cp > 0) {
      const [ax, ay] = isoP(o, -200, 200, 0), [bx, by] = isoP(o, -200, 200, zTop);
      line(c, ax - 40, ay, bx - 40, by, C.am, 2, cp, cp);
      line(c, ax - 50, ay, ax - 30, ay, C.am, 2, cp); line(c, bx - 50, by, bx - 30, by, C.am, 2, cp);
      text(c, 'Σ t', ax - 70, (ay + by) / 2, { size: 26, f: F.mono, color: C.am, align: 'right', a: cp });
    }
    text(c, String(n).padStart(2, '0'), 120, 260, { size: 120, w: 700, f: F.en, color: C.cy, a: sa, glow: rgba(C.cy, 0.5) });
    text(c, 'LAYERS DEPOSITED', 120, 300, { size: 20, f: F.mono, color: C.ink, a: sa, ls: 4 });
    // 摩天樓
    const bxl = 1180, bw = 260, base = 820, fh = 26;
    for (let i = 0; i < n; i++) {
      const fy = base - (i + 1) * fh, fp = seg(t, 20.5 + i * 0.45, 20.9 + i * 0.45);
      const inset = i > 14 ? (i - 14) * 14 : 0;
      c.save(); c.globalAlpha = sa * fp; c.strokeStyle = rgba(C.cy, 0.8); c.lineWidth = 1.5;
      c.strokeRect(bxl + inset, fy, bw - inset * 2, fh);
      for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(bxl + inset + k * (bw - inset * 2) / 6, fy + 5); c.lineTo(bxl + inset + k * (bw - inset * 2) / 6, fy + fh - 5); c.stroke(); }
      c.restore();
    }
    // 吊車
    const topY = base - n * fh;
    c.save(); c.globalAlpha = sa; c.strokeStyle = C.am; c.lineWidth = 2;
    c.beginPath(); c.moveTo(bxl + bw + 40, base); c.lineTo(bxl + bw + 40, topY - 80); c.lineTo(bxl - 60, topY - 80); c.stroke();
    const hookX = bxl + bw / 2 + Math.sin(t * 1.4) * 60;
    c.beginPath(); c.moveTo(hookX, topY - 80); c.lineTo(hookX, topY - 30); c.stroke(); c.restore();
    line(c, 1100, base, 1600, base, C.ink, 2, sa);
    text(c, 'BLUEPRINT · FLOOR ' + String(n).padStart(2, '0'), bxl, base + 40, { size: 18, f: F.mono, color: C.ink, a: sa, ls: 2 });
    // 三項關鍵指標
    const chips = [['厚度', 'THICKNESS'], ['應力', 'STRESS'], ['覆蓋率', 'STEP COVERAGE']];
    chips.forEach(([zh, en], i) => {
      const cp2 = seg(t, 26.4 + i, 26.9 + i, E.outBack);
      if (cp2 <= 0) return;
      const x = 1580, y = 300 + i * 130;
      panel(c, x, y, 280, 100, { color: [C.am, C.vi, C.gr][i], a: cp2, r: 10 });
      text(c, zh, x + 24, y + 52, { size: 34, w: 700, a: cp2 });
      text(c, en, x + 24, y + 80, { size: 15, f: F.mono, color: [C.am, C.vi, C.gr][i], a: cp2, ls: 2 });
      text(c, '→ YIELD', x + 260, y + 52, { size: 16, f: F.mono, color: C.ink, align: 'right', a: cp2 * seg(t, 30, 31) });
    });
  }  chapter(c, t, s, C.cy);
};

function tileIcon(c, i, x, y, t, act, a, col) {
  c.save(); c.globalAlpha = a;
  if (i === 0) {
    // 光罩 + 光束 + 晶圓
    c.fillStyle = C.dim; for (let k = 0; k < 6; k++) if (k % 2 === 0) c.fillRect(x - 110 + k * 37, y - 60, 37, 12);
    for (let k = 0; k < 6; k++) if (k % 2 === 1) {
      const lx = x - 110 + k * 37 + 18;
      c.strokeStyle = rgba(col, 0.4 + 0.6 * act); c.lineWidth = 3;
      c.beginPath(); c.moveTo(lx, y - 100); c.lineTo(lx, y - 60); c.stroke();
      c.beginPath(); c.moveTo(lx, y - 48); c.lineTo(lx, y + 40); c.stroke();
      glow(c, lx, y + 40, 24, col, act);
    }
    c.fillStyle = rgba(col, 0.3 + 0.5 * act); c.beginPath(); c.ellipse(x, y + 48, 130, 28, 0, 0, Math.PI * 2); c.fill();
  } else if (i === 1) {
    const d = 20 + 50 * act;
    c.fillStyle = '#2a3446'; c.fillRect(x - 120, y - 20, 240, 100);
    c.fillStyle = C.bg; c.fillRect(x - 30, y - 20, 60, d);
    c.fillStyle = col; c.fillRect(x - 120, y - 32, 90, 12); c.fillRect(x + 30, y - 32, 90, 12);
    for (let k = 0; k < 3; k++) { const yy = y - 110 + ((t * 120 + k * 30) % 90); arrow(c, x - 15 + k * 15, yy, x - 15 + k * 15, yy + 24, col, 2, act, 8); }
  } else if (i === 2) {
    c.fillStyle = '#2a3446'; c.fillRect(x - 120, y, 240, 80);
    for (let k = 0; k < 14; k++) {
      const u = ((t * 0.8 + hash(k)) % 1), xx = x - 100 + k * 15;
      const yy = y - 100 + u * (100 + 60 * hash(k + 5));
      dot(c, xx, yy, 4, col, act * (yy > y ? 0.6 : 1));
    }
    c.fillStyle = rgba(col, 0.25 + 0.3 * act); c.fillRect(x - 120, y, 240, 40 * (0.3 + act * 0.7));
  } else {
    const n = 2 + Math.floor(act * 5 + (t > 15.4 ? (t - 15.4) * 1.2 : 0)) % 7;
    for (let k = 0; k < n; k++) {
      c.fillStyle = [C.cy, C.vi, C.am, C.gr][k % 4]; c.globalAlpha = a * 0.85;
      c.fillRect(x - 120, y + 60 - k * 18, 240, 14);
    }
    for (let k = 0; k < 8; k++) { const u = (t * 0.9 + hash(k + 3)) % 1; dot(c, x - 110 + hash(k) * 220, y - 100 + u * (150 - n * 18), 3, col, act); }
  }
  c.restore();
}

// =====================================================================
// 02 武器庫
// =====================================================================
const TECH = [
  { k: 'PVD', zh: '物理氣相沉積', col: C.rd, mech: '物理動能轟擊濺鍍', temp: [0.25, '低'], cov: [0.18, '差（視線法則）'], rate: [0, 0.85, '快'], app: ['金屬互連導線', '阻擋金屬層'], tri: [0.22, 0.72, 0.06] },
  { k: 'AP/LPCVD', zh: '常壓／低壓 CVD', col: C.am, mech: '熱能驅動化學反應', temp: [0.92, '極高／中高'], cov: [0.65, '中／佳'], rate: [0.3, 0.95, '極快 AP／慢 LP'], app: ['保護層、關鍵絕緣', '磊晶通道'], tri: [0.03, 0.42, 0.55] },
  { k: 'PECVD', zh: '電漿輔助 CVD', col: C.vi, mech: '高能電漿輔助反應', temp: [0.45, '100–400 °C'], cov: [0.5, '中'], rate: [0, 0.8, '快'], app: ['層間介電層 ILD', '氮化矽保護層'], tri: [0.58, 0.36, 0.06] },
  { k: 'ALD', zh: '原子層沉積', col: C.cy, mech: '表面自限性半反應', temp: [0.15, '極低'], cov: [1, '完美 100% 共形'], rate: [0, 0.08, '極慢（逐層）'], app: ['High-k 閘極介電層', '超高深寬比填孔'], tri: [0.28, 0.02, 0.70] },
];
SCENES.matrix = function (c, t, s) {
  bg(c, t, { color: C.vi });
  const w = 400, h = 600, gap = 30, x0 = (W - (4 * w + 3 * gap)) / 2, y0 = 190;
  const fold = seg(t, 29.4, 30.8, E.ioC);
  const ranges = [[6, 11], [11.4, 17], [17.4, 23], [23.4, 29]];
  // 三角取捨圖頂點
  const TV = [[960, 250], [560, 830], [1360, 830]];
  const triPos = (b) => [TV[0][0] * b[0] + TV[1][0] * b[1] + TV[2][0] * b[2], TV[0][1] * b[0] + TV[1][1] * b[1] + TV[2][1] * b[2]];
  if (fold < 1) {
    TECH.forEach((tc, i) => {
      const ap = seg(t, 3.0 + i * 0.3, 3.7 + i * 0.3, E.outBack);
      if (ap <= 0) return;
      const fa = t < 5.6 ? 1 : focus(t, ranges[i][0], ranges[i][1], 0.38, t > 29);
      const x = x0 + i * (w + gap), y = y0 + (1 - ap) * 100;
      const [tx, ty] = triPos(tc.tri);
      c.save();
      const cxp = x + w / 2, cyp = y + h / 2;
      c.translate(lerp(0, tx - cxp, fold), lerp(0, ty - cyp, fold));
      c.translate(cxp, cyp); c.scale(1 - fold * 0.9, 1 - fold * 0.9); c.translate(-cxp, -cyp);
      const a = ap * fa * (1 - fold);
      panel(c, x, y, w, h, { color: tc.col, a, glow: fa > 0.9 && t > 5.6 && t < 29 ? 0.8 : 0 });
      text(c, tc.k, x + 30, y + 72, { size: 50, w: 700, f: F.en, color: tc.col, a });
      text(c, tc.zh, x + 30, y + 112, { size: 26, w: 500, color: C.ink, a });
      text(c, tc.mech, x + 30, y + 168, { size: 26, w: 700, a });
      const rows = [['沉積溫度', tc.temp[0], tc.temp[1], 0], ['階梯覆蓋率', tc.cov[0], tc.cov[1], 0], ['沉積速率', tc.rate[1], tc.rate[2], tc.rate[0]]];
      rows.forEach(([lab, v, vs, v0], r) => {
        const yy = y + 230 + r * 92, gp = seg(t, 4.2 + i * 0.3 + r * 0.15, 5.4 + i * 0.3 + r * 0.15, E.outE);
        text(c, lab, x + 30, yy, { size: 20, color: C.ink, a });
        text(c, vs, x + w - 30, yy, { size: 20, w: 700, align: 'right', color: r === 1 && v > 0.9 ? C.cy : r === 1 && v < 0.2 ? C.rd : C.wh, a });
        c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(255,255,255,0.08)'; rr(c, x + 30, yy + 16, w - 60, 12, 6); c.fill();
        c.fillStyle = tc.col; rr(c, x + 30 + (w - 60) * v0 * gp, yy + 16, Math.max(4, (w - 60) * (v - v0) * gp), 12, 6); c.fill();
        c.restore();
        glow(c, x + 30 + (w - 60) * v * gp, yy + 22, 20, tc.col, a * 0.8);
      });
      text(c, '主要應用', x + 30, y + 510, { size: 18, f: F.tc, color: tc.col, a, ls: 2 });
      text(c, tc.app[0], x + 30, y + 545, { size: 22, w: 500, a }); text(c, tc.app[1], x + 30, y + 578, { size: 22, w: 500, a });
      c.restore();
    });
  }
  // 取捨三角
  const ta = seg(t, 29.8, 31.2);
  if (ta > 0) {
    c.save(); c.strokeStyle = rgba(C.wh, 0.4); c.lineWidth = 2;
    polyline(c, TV, seg(t, 29.8, 31.4, E.ioC), true); c.restore();
    // 內部同心三角
    for (let k = 1; k <= 3; k++) {
      const f = k / 4, cen = [960, (250 + 830 * 2) / 3];
      c.save(); c.strokeStyle = rgba(C.wh, 0.07 * ta); c.beginPath();
      TV.forEach((v, i) => { const p = [lerp(cen[0], v[0], f), lerp(cen[1], v[1], f)]; i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); c.stroke(); c.restore();
    }
    const labs = [['低溫', 'LOW THERMAL BUDGET', 0, -50], ['高產能', 'THROUGHPUT', -30, 60], ['共形覆蓋', 'CONFORMALITY', 30, 60]];
    labs.forEach(([zh, en, dx, dy], i) => {
      const al = i === 1 ? 'right' : i === 2 ? 'left' : 'center';
      text(c, zh, TV[i][0] + dx, TV[i][1] + dy, { size: 36, w: 700, align: al, a: ta });
      text(c, en, TV[i][0] + dx, TV[i][1] + dy + 28, { size: 16, f: F.mono, align: al, color: C.ink, a: ta, ls: 3 });
    });
    TECH.forEach((tc, i) => {
      const [x, y] = triPos(tc.tri), p = seg(t, 30.6 + i * 0.6, 31.4 + i * 0.6, E.outBack);
      const bob = Math.sin(t * 2 + i) * 4;
      spark(c, x, y + bob, 9 * p, tc.col, p);
      text(c, tc.k, x + 20, y + bob - 14, { size: 26, w: 700, f: F.en, color: tc.col, a: p });
    });
    text(c, 'TRADE-OFF', 120, 520, { size: 64, w: 700, f: F.en, align: 'left', color: C.wh, a: seg(t, 33.4, 34.4) * 0.9, ls: 12 });
    text(c, '沒有一項技術能同時拿下三個角', 124, 570, { size: 26, align: 'left', color: C.ink, a: seg(t, 34, 35) });
  }
  chapter(c, t, s, C.vi);
};

// =====================================================================
// 03 CVD 演進
// =====================================================================
const TUBE = { x0: 260, x1: 1660, y0: 290, y1: 660 };
const TOPO = [[290, 620], [600, 620], [600, 570], [760, 570], [760, 620], [1080, 620], [1080, 650], [1180, 650], [1180, 620], [1630, 620]];
function tubePath(c) { rr(c, TUBE.x0, TUBE.y0, TUBE.x1 - TUBE.x0, TUBE.y1 - TUBE.y0, 170); }
function drawSubstrate(c, film, filmCol, a, blobs) {
  c.save(); tubePath(c); c.clip();
  if (film > 0) {
    c.strokeStyle = filmCol; c.lineWidth = film * 2; c.lineJoin = 'round'; c.globalAlpha = a;
    c.beginPath(); TOPO.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
    if (blobs) blobs.forEach(([x, y, r]) => { c.fillStyle = filmCol; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
  }
  c.globalAlpha = 1;
  c.beginPath(); TOPO.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.lineTo(1630, 700); c.lineTo(290, 700); c.closePath();
  const g = c.createLinearGradient(0, 560, 0, 680); g.addColorStop(0, '#3a4760'); g.addColorStop(1, '#151c2a');
  c.fillStyle = g; c.fill();
  c.restore();
}
SCENES.evolution = function (c, t, s) {
  const wAP = 1 - seg(t, 17.4, 18.4), wPE = seg(t, 29.6, 30.6), wLP = 1 - wAP - wPE;
  bg(c, t, { color: wPE > 0.5 ? C.vi : wLP > 0.5 ? C.cy : C.rd, k: 0.8 });
  const ap = seg(t, 2.4, 3.4);
  if (ap > 0) {
    // 腔管
    c.save(); c.globalAlpha = ap;
    tubePath(c); c.fillStyle = 'rgba(14,22,38,0.75)'; c.fill();
    c.strokeStyle = rgba(C.wh, 0.35); c.lineWidth = 3; c.stroke();
    c.restore();
    // 電漿光
    if (wPE > 0) {
      c.save(); tubePath(c); c.clip();
      const pulse = 0.75 + 0.25 * Math.sin(t * 2 * Math.PI * 1.5);
      const g = c.createRadialGradient(960, 470, 20, 960, 470, 700);
      g.addColorStop(0, rgba(C.vi, 0.65 * wPE * pulse)); g.addColorStop(0.5, rgba(C.vi, 0.25 * wPE)); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(TUBE.x0, TUBE.y0, TUBE.x1 - TUBE.x0, TUBE.y1 - TUBE.y0);
      c.restore();
      c.save(); c.globalAlpha = wPE; c.fillStyle = '#8a95a8'; c.fillRect(480, 318, 960, 12);
      for (let k = 0; k < 40; k++) { c.fillStyle = C.bg; c.fillRect(492 + k * 24, 322, 6, 4); }
      c.restore();
      // RF 正弦
      c.save(); c.globalAlpha = wPE; c.strokeStyle = C.vi; c.lineWidth = 3; c.beginPath();
      for (let x = 0; x < 220; x++) { const yy = 230 + Math.sin(x * 0.12 - t * 12) * 16; x ? c.lineTo(1440 + x, yy) : c.moveTo(1440 + x, yy); }
      c.stroke(); c.restore();
      text(c, 'RF 13.56 MHz', 1660, 200, { size: 22, f: F.mono, color: C.vi, align: 'right', a: wPE });
    }
    // 薄膜：每換一種製程就換一片新晶圓
    let film = 0, col = C.rd, blobs = null;
    if (wAP > 0.5) {
      film = 2 + 9 * seg(t, 6.4, 17, E.lin); col = '#c77b8a';
      blobs = []; for (let k = 0; k < 16; k++) { const p = TOPO[1 + (k % 8)], q = TOPO[2 + (k % 8)]; const u = hash(k + 1); blobs.push([lerp(p[0], q[0], u), lerp(p[1], q[1], u), film * (0.6 + hash(k + 30) * 1.3)]); }
    } else if (wLP > 0.5) { film = 2 + 9 * seg(t, 19, 29.4, E.lin); col = '#5fc8d8'; }
    else { film = 2 + 8 * seg(t, 31, 43, E.lin); col = '#b495ff'; }
    drawSubstrate(c, film, col, ap, blobs);

    c.save(); tubePath(c); c.clip();
    // APCVD：密集、短路徑、氣相成核
    if (wAP > 0) {
      for (let i = 0; i < 230; i++) {
        const x = TUBE.x0 + ((hash(i) * 1400 + t * (90 + hash(i + 1) * 80)) % 1400) + Math.sin(t * 9 + i) * 10;
        const y = 300 + tri(hash(i + 2) * 600 + t * (40 + hash(i + 3) * 60), 300) + Math.cos(t * 11 + i * 2) * 8;
        dot(c, x, y, 3, i % 4 ? C.rd : C.am, wAP * ap * 0.85);
      }
      for (let k = 0; k < 7; k++) {
        const tb = 12.6 + k * 0.7, gp = seg(t, tb, tb + 1.4);
        if (gp <= 0) continue;
        const bx = 420 + hash(k + 50) * 1100, by = 360 + hash(k + 60) * 120 + seg(t, tb + 1.4, tb + 6, E.inQ) * 150;
        for (let m = 0; m < 7; m++) { const an = m / 7 * Math.PI * 2 + t; dot(c, bx + Math.cos(an) * 9 * gp, by + Math.sin(an) * 9 * gp, 5 * gp, C.am, wAP); }
        c.save(); c.globalAlpha = wAP * (0.5 + 0.5 * Math.sin(t * 8)); c.strokeStyle = C.rd; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, 24 * gp, 0, Math.PI * 2); c.stroke(); c.restore();
      }
    }
    // LPCVD：稀疏、長直線路徑
    if (wLP > 0) {
      for (let i = 0; i < 70; i++) {
        const vx = 180 + hash(i + 4) * 200, vy = 140 + hash(i + 5) * 160;
        const pos = (tt) => [300 + tri(hash(i) * 2800 + tt * vx, 1320), 300 + tri(hash(i + 7) * 600 + tt * vy, 290)];
        const [x, y] = pos(t), [px, py] = pos(t - 0.08);
        line(c, px, py, x, y, C.cy, 2, wLP * 0.5);
        dot(c, x, y, 3.5, C.cy, wLP);
      }
      // 示範一顆粒子的長自由徑
      const hp = (tt) => [300 + tri(1000 + tt * 330, 1320), 300 + tri(150 + tt * 210, 290)];
      c.save(); c.strokeStyle = rgba(C.wh, 0.8 * wLP); c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath();
      for (let k = 0; k <= 30; k++) { const [x, y] = hp(t - 1.5 + k * 0.05); k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); c.restore();
      const [hx, hy] = hp(t); spark(c, hx, hy, 6, C.wh, wLP);
      text(c, 'λ', hx + 14, hy - 12, { size: 30, f: F.en, w: 700, color: C.wh, a: wLP });
    }
    // PECVD：快速電子 + 自由基
    if (wPE > 0) {
      for (let i = 0; i < 70; i++) {
        const x = 300 + tri(hash(i) * 2800 + t * (700 + hash(i + 1) * 500), 1320), y = 340 + tri(hash(i + 2) * 600 + t * (500 + hash(i + 3) * 400), 240);
        spark(c, x, y, 2, C.cy, wPE * 0.9);
      }
      for (let i = 0; i < 40; i++) {
        const x = 400 + hash(i + 20) * 1120 + Math.sin(t + i) * 30, y = 360 + ((hash(i + 21) * 240 + t * 40) % 240);
        spark(c, x, y, 4.5, i % 2 ? C.vi : C.am, wPE);
      }
    }
    c.restore();
    // 進氣 / 排氣
    for (let k = 0; k < 3; k++) {
      const u = ((t * 0.9 + k / 3) % 1);
      arrow(c, 120 + u * 100, 430 + k * 40, 160 + u * 100, 430 + k * 40, C.ink, 3, ap * Math.sin(u * Math.PI));
      arrow(c, 1690 + u * 100, 430 + k * 40, 1730 + u * 100, 430 + k * 40, C.ink, 3, ap * Math.sin(u * Math.PI));
    }
    text(c, 'GAS IN', 150, 405, { size: 16, f: F.mono, color: C.ink, a: ap }); text(c, 'EXHAUST', 1700, 405, { size: 16, f: F.mono, color: C.ink, a: ap });
  }
  // 階段標籤
  const tabs = [['APCVD', C.rd, wAP], ['LPCVD', C.cy, wLP], ['PECVD', C.vi, wPE]];
  tabs.forEach(([nm, col, w], i) => {
    const x = 610 + i * 260, y = 180, a = seg(t, 2.6 + i * 0.15, 3.2 + i * 0.15);
    c.save(); c.globalAlpha = a; rr(c, x, y, 200, 54, 27);
    c.fillStyle = rgba(col, 0.15 + 0.7 * w); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke(); c.restore();
    text(c, nm, x + 100, y + 37, { size: 26, w: 700, f: F.en, align: 'center', color: w > 0.5 ? C.bg : col, a });
    if (i < 2) arrow(c, x + 210, y + 27, x + 250, y + 27, C.ink, 2, a * 0.7, 10);
  });
  // 量測讀數
  const P = Math.exp(lerp(lerp(Math.log(760), Math.log(0.5), wLP + wPE), Math.log(2), wPE));
  const T = lerp(lerp(450, 700, wLP), 300, wPE);
  const lam = 5e-5 * 760 / P; // mm（約略值）
  const lamS = lam < 0.001 ? (lam * 1e6).toFixed(0) + ' nm' : lam < 1 ? (lam * 1000).toFixed(0) + ' µm' : lam.toFixed(1) + ' mm';
  const gauges = [['PRESSURE', P >= 100 ? P.toFixed(0) + ' Torr' : P.toFixed(P < 10 ? 1 : 0) + ' Torr', C.am], ['TEMPERATURE', T.toFixed(0) + ' °C', C.rd], ['MEAN FREE PATH  λ', '≈ ' + lamS, C.cy]];
  gauges.forEach(([lab, val, col], i) => {
    const x = 330 + i * 430, y = 720, a = seg(t, 3.0 + i * 0.2, 3.8 + i * 0.2);
    panel(c, x, y, 400, 120, { color: col, a, r: 10 });
    text(c, lab, x + 26, y + 40, { size: 16, f: F.mono, color: C.ink, a, ls: 3 });
    text(c, val, x + 26, y + 95, { size: 44, w: 600, f: F.mono, color: col, a });
  });
  const fa = life(t, 18.8, 29.8, 0.6, 0.5);
  text(c, 'λ = k_B·T / (√2 · π · d² · P)', 1590, 880, { size: 22, f: F.mono, align: 'right', color: C.cy, a: fa });
  const warn = life(t, 12.6, 17.4, 0.4, 0.4);
  if (warn > 0) {
    text(c, '⚠ GAS-PHASE NUCLEATION', 1600, 880, { size: 22, f: F.mono, align: 'right', color: C.am, a: warn * (0.6 + 0.4 * Math.sin(t * 10)) });
  }
  chapter(c, t, s, C.cy);
};
