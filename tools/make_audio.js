// 原創配樂與音效合成器：讀取 app/data.js 的場景強度與音效時間點，輸出與畫面逐秒對齊的音軌。
// 用法：node tools/make_audio.js <out.wav>
// 之後以 ffmpeg 做響度標準化並轉成 mp3（見 build.sh）。
const fs = require('fs');
const path = require('path');
const DATA = require('../app/data.js');

const SR = 44100;
const TOTAL = DATA.total + 1.5;
const N = Math.ceil(SR * TOTAL);
const L = new Float32Array(N), R = new Float32Array(N);    // 乾聲
const RL = new Float32Array(N), RR = new Float32Array(N);  // 殘響 send
const DL = new Float32Array(N), DR = new Float32Array(N);  // 延遲 send

let seed = 20261101;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const BEAT = 60 / DATA.config.bpm, BAR = BEAT * 4, S16 = BEAT / 4;

function put(i, v, pan = 0, rev = 0, dly = 0) {
  if (i < 0 || i >= N) return;
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  L[i] += v * gl; R[i] += v * gr;
  if (rev) { RL[i] += v * gl * rev; RR[i] += v * gr * rev; }
  if (dly) { DL[i] += v * gl * dly; DR[i] += v * gr * dly; }
}

// RBJ biquad
class Biquad {
  constructor(type, f, q = 0.707) { this.type = type; this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set(f, q); }
  set(f, q = this.q) {
    this.q = q;
    const w = 2 * Math.PI * clamp(f, 20, SR * 0.45) / SR, cs = Math.cos(w), sn = Math.sin(w), a = sn / (2 * q);
    let b0, b1, b2;
    if (this.type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; }
    else if (this.type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; }
    else { b0 = a; b1 = 0; b2 = -a; }
    const a0 = 1 + a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = -2 * cs / a0; this.a2 = (1 - a) / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

// ---------- 音樂強度自動化 ----------
const keys = [];
let prev = { pad: 0, arp: 0, bass: 0, drums: 0 };
for (const s of DATA.scenes) for (const [kt, v] of s.music) keys.push({ t: s.start + kt, v });
keys.sort((a, b) => a.t - b.t);
const RAMP = 0.6;
const autoCache = [];
function automation(t) {
  let p = { pad: 0, arp: 0, bass: 0, drums: 0 }, cur = p, tk = -1e9;
  for (const k of keys) { if (k.t <= t) { p = cur; cur = k.v; tk = k.t; } else break; }
  const u = clamp((t - tk) / RAMP);
  return { pad: lerp(p.pad, cur.pad, u), arp: lerp(p.arp, cur.arp, u), bass: lerp(p.bass, cur.bass, u), drums: lerp(p.drums, cur.drums, u) };
}
// 每 10ms 取樣一次，避免逐樣本計算
const AUTO_STEP = 0.01;
for (let t = 0; t < TOTAL; t += AUTO_STEP) autoCache.push(automation(t));
const auto = (t) => autoCache[Math.min(autoCache.length - 1, Math.max(0, Math.floor(t / AUTO_STEP)))];

// ---------- 和聲：D 小調 i–VI–III–VII，每兩小節換和弦 ----------
const CHORDS = [
  { pad: [57, 60, 62, 65], root: 38 }, // Dm(add9)
  { pad: [58, 62, 65, 69], root: 34 }, // Bbmaj7
  { pad: [57, 60, 65, 67], root: 41 }, // F(add9)
  { pad: [55, 60, 64, 67], root: 36 }, // C
];
const CHORD_LEN = BAR * 2;
const chordAt = (t) => CHORDS[Math.floor(t / CHORD_LEN) % CHORDS.length];

console.time('pad');
// Pad：每個和弦段落獨立渲染，attack/release 互相重疊，避免換和弦爆音
for (let k = 0; k * CHORD_LEN < TOTAL; k++) {
  const ts = k * CHORD_LEN, te = ts + CHORD_LEN, rel = 1.4, att = 0.8;
  const ch = CHORDS[k % CHORDS.length];
  ch.pad.forEach((m, vi) => {
    const pan = -0.55 + vi * 0.37;
    for (const det of [-0.08, 0.08]) {
      const f = mtof(m + det);
      const lp = new Biquad('lp', 900, 0.9);
      let ph = rnd();
      const i0 = Math.floor(ts * SR), i1 = Math.min(N, Math.floor((te + rel) * SR));
      for (let i = i0; i < i1; i++) {
        const t = i / SR;
        if ((i & 63) === 0) lp.set(700 + 600 * (0.5 + 0.5 * Math.sin(t * 0.21 + vi)) + 900 * auto(t).drums * 0.5, 0.9);
        ph += f / SR; if (ph >= 1) ph -= 1;
        const env = clamp((t - ts) / att) * (t > te ? Math.max(0, 1 - (t - te) / rel) : 1);
        const v = lp.run(2 * ph - 1) * env * auto(t).pad * 0.028;
        put(i, v, pan + det * 2, 0.45);
      }
    }
  });
  // 低八度 sine 墊底
  const f0 = mtof(ch.root + 12);
  const i0 = Math.floor(ts * SR), i1 = Math.min(N, Math.floor((te + rel) * SR));
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const env = clamp((t - ts) / att) * (t > te ? Math.max(0, 1 - (t - te) / rel) : 1);
    put(i, Math.sin(2 * Math.PI * f0 * (t - ts)) * env * auto(t).pad * 0.05, 0, 0.2);
  }
}
console.timeEnd('pad');

console.time('arp+bass+drums');
// Arp：16 分音符，在和弦音上上下行
const ARP = [0, 1, 2, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2];
for (let n = 0; n * S16 < TOTAL; n++) {
  const t0 = n * S16, a = auto(t0);
  if (a.arp < 0.02) continue;
  const ch = chordAt(t0);
  const step = n % 16;
  const m = ch.pad[ARP[step]] + 12 + (step >= 12 && a.arp > 0.85 ? 12 : 0);
  const f = mtof(m), dur = 0.22, i0 = Math.floor(t0 * SR);
  const lp = new Biquad('lp', 2200 + 2500 * a.drums, 0.8);
  const accent = step % 4 === 0 ? 1 : 0.7;
  for (let j = 0; j < dur * SR; j++) {
    const t = j / SR, ph = (f * t) % 1;
    const w = (ph < 0.5 ? 1 : -1) * 0.5 + (4 * Math.abs(ph - 0.5) - 1) * 0.5;
    put(i0 + j, lp.run(w) * Math.exp(-t * 16) * a.arp * 0.045 * accent, n % 2 ? 0.45 : -0.45, 0.2, 0.4);
  }
}

// Bass：8 分音符脈衝
for (let n = 0; n * BEAT / 2 < TOTAL; n++) {
  const t0 = n * BEAT / 2, a = auto(t0);
  if (a.bass < 0.02) continue;
  const f = mtof(chordAt(t0).root), i0 = Math.floor(t0 * SR), dur = 0.26;
  const lp = new Biquad('lp', 380, 1.1);
  const off = n % 2 ? 0.75 : 1;
  for (let j = 0; j < dur * SR; j++) {
    const t = j / SR, ph = (f * t) % 1;
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 7);
    const v = (Math.sin(2 * Math.PI * f * t) * 0.8 + lp.run(2 * ph - 1) * 0.5) * env;
    put(i0 + j, v * a.bass * 0.2 * off, 0, 0.05);
  }
}

// 鼓組
function kick(t0, amp) {
  const i0 = Math.floor(t0 * SR); let ph = 0;
  for (let j = 0; j < 0.5 * SR; j++) {
    const t = j / SR, f = 45 + 95 * Math.exp(-t * 28);
    ph += f / SR;
    put(i0 + j, Math.sin(2 * Math.PI * ph) * Math.exp(-t * 6.5) * amp + (j < 60 ? noise() * 0.15 * amp : 0), 0, 0.03);
  }
}
function snare(t0, amp) {
  const i0 = Math.floor(t0 * SR), bp = new Biquad('bp', 1800, 0.7);
  for (let j = 0; j < 0.35 * SR; j++) {
    const t = j / SR;
    const v = bp.run(noise()) * Math.exp(-t * 16) * 1.6 + Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 32) * 0.6;
    put(i0 + j, v * amp, 0.05, 0.3);
  }
}
function hat(t0, amp, pan) {
  const i0 = Math.floor(t0 * SR), hp = new Biquad('hp', 7000, 0.7);
  for (let j = 0; j < 0.06 * SR; j++) put(i0 + j, hp.run(noise()) * Math.exp(-j / SR * 70) * amp, pan, 0.08);
}
for (let n = 0; n * S16 < TOTAL; n++) {
  const t0 = n * S16, d = auto(t0).drums;
  if (d < 0.05) continue;
  const s = n % 16;
  if (s % 4 === 0 && (d >= 0.7 || s % 8 === 0) && d >= 0.25) kick(t0, 0.55 * Math.min(1, d + 0.2));
  if ((s === 4 || s === 12) && d >= 0.55) snare(t0, 0.22 * d);
  if (s % 2 === 0 || d >= 0.9) hat(t0, (s % 4 === 2 ? 0.09 : 0.05) * d, 0.3);
}
console.timeEnd('arp+bass+drums');

// ---------- 音效 ----------
const SFX = {
  whoosh(T, o) {
    const dur = o.dur || 1.0, i0 = Math.floor(T * SR), bp = new Biquad('bp', 500, 1.2);
    for (let j = 0; j < dur * SR; j++) {
      const u = j / (dur * SR);
      if ((j & 31) === 0) bp.set(300 * Math.pow(18, Math.sin(Math.PI * Math.min(1, u * 1.15))), 1.2);
      put(i0 + j, bp.run(noise()) * Math.pow(Math.sin(Math.PI * u), 2) * 0.55, lerp(-0.8, 0.8, u), 0.3);
    }
  },
  impact(T) {
    const i0 = Math.floor(T * SR), lp = new Biquad('lp', 900); let ph = 0;
    for (let j = 0; j < 1.8 * SR; j++) {
      const t = j / SR; ph += (30 + 30 * Math.exp(-t * 6)) / SR;
      put(i0 + j, Math.sin(2 * Math.PI * ph) * Math.exp(-t * 2.8) * 0.5 + lp.run(noise()) * Math.exp(-t * 11) * 0.35, 0, 0.5);
    }
  },
  boom(T) {
    const i0 = Math.floor(T * SR), lp = new Biquad('lp', 450), hp = new Biquad('hp', 5000); let ph = 0;
    for (let j = 0; j < 3.8 * SR; j++) {
      const t = j / SR; ph += (26 + 30 * Math.exp(-t * 3)) / SR;
      const v = Math.tanh(Math.sin(2 * Math.PI * ph) * Math.exp(-t * 1.4) * 1.6) * 0.55 + lp.run(noise()) * Math.exp(-t * 3.5) * 0.4 + hp.run(noise()) * Math.exp(-t * 5) * 0.08;
      put(i0 + j, v, 0, 0.6);
    }
  },
  riser(T, o) {
    const dur = o.dur || 3, i0 = Math.floor(T * SR), bp = new Biquad('bp', 300, 2); let ph = 0;
    for (let j = 0; j < dur * SR; j++) {
      const u = j / (dur * SR);
      if ((j & 31) === 0) bp.set(250 * Math.pow(24, u), 2);
      ph += (140 * Math.pow(10, u)) / SR;
      put(i0 + j, (bp.run(noise()) * 0.5 + Math.sin(2 * Math.PI * ph) * 0.08) * u * u, Math.sin(u * 20) * 0.3, 0.4);
    }
  },
  swell(T, o) {
    const dur = o.dur || 2, i0 = Math.floor(T * SR), hp = new Biquad('hp', 2500);
    for (let j = 0; j < dur * SR; j++) {
      const u = j / (dur * SR);
      put(i0 + j, hp.run(noise()) * u * u * u * 0.35, 0, 0.6);
    }
  },
  tick(T) {
    const i0 = Math.floor(T * SR), pan = rnd() * 0.6 - 0.3, f = 2200 + rnd() * 600;
    for (let j = 0; j < 0.03 * SR; j++) put(i0 + j, Math.sin(2 * Math.PI * f * j / SR) * Math.exp(-j / SR * 260) * 0.1, pan, 0.1);
  },
  blip(T) {
    const i0 = Math.floor(T * SR); let ph = 0;
    for (let j = 0; j < 0.09 * SR; j++) {
      const t = j / SR; ph += (1100 + 600 * Math.min(1, t / 0.05)) / SR;
      put(i0 + j, Math.sin(2 * Math.PI * ph) * Math.min(1, t / 0.004) * Math.exp(-t * 40) * 0.09, 0.2, 0.2, 0.35);
    }
  },
  zap(T) {
    const i0 = Math.floor(T * SR), pan = rnd() * 1.2 - 0.6, hp = new Biquad('hp', 1500); let ph = 0, mph = 0;
    for (let j = 0; j < 0.4 * SR; j++) {
      const t = j / SR, fc = 120 + 900 * Math.exp(-t * 12);
      mph += 57 / SR; ph += fc * (1 + 0.8 * Math.sin(2 * Math.PI * mph * 13)) / SR;
      const crackle = rnd() < 0.02 ? noise() * 2 : 0;
      put(i0 + j, (Math.sign(Math.sin(2 * Math.PI * ph)) * 0.35 + hp.run(crackle)) * Math.exp(-t * 9) * 0.22, pan, 0.35);
    }
  },
  chime(T) {
    const i0 = Math.floor(T * SR), base = 1174.66;
    const parts = [[1, 1, 2.6], [2.0, 0.45, 1.8], [2.76, 0.32, 1.2], [4.07, 0.18, 0.8], [5.4, 0.1, 0.5]];
    for (let j = 0; j < 3 * SR; j++) {
      const t = j / SR; let v = 0;
      for (const [m, a, d] of parts) v += Math.sin(2 * Math.PI * base * m * t) * a * Math.exp(-t * 3 / d);
      put(i0 + j, v * Math.min(1, t / 0.003) * 0.055, -0.2, 0.55, 0.3);
    }
  },
  type(T, o) {
    const dur = o.dur || 2, rate = o.rate || 0.07;
    for (let t = 0; t < dur; t += rate * (0.7 + rnd() * 0.6)) SFX.tick(T + t);
  },
  glitch(T) {
    const i0 = Math.floor(T * SR); let f = 300, ph = 0, gate = 1;
    for (let j = 0; j < 0.32 * SR; j++) {
      if (j % Math.floor(0.028 * SR) === 0) { f = 80 + rnd() * 1800; gate = rnd() < 0.75 ? 1 : 0; }
      ph += f / SR;
      const sq = Math.round(Math.sign(Math.sin(2 * Math.PI * ph)) * 4) / 4 + (rnd() < 0.1 ? noise() : 0);
      put(i0 + j, sq * gate * 0.07, rnd() * 0.8 - 0.4, 0.15);
    }
  },
  sweep(T, o) {
    const dur = o.dur || 3, i0 = Math.floor(T * SR), bp = new Biquad('bp', 1200, 0.6);
    for (let j = 0; j < dur * SR; j++) {
      const u = j / (dur * SR);
      if ((j & 63) === 0) bp.set(900 + 900 * Math.sin(u * 9) ** 2, 0.6);
      const env = Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.3);
      put(i0 + j, bp.run(noise()) * env * 0.22, lerp(-0.9, 0.9, u), 0.25);
    }
  },
  stamp(T) {
    const i0 = Math.floor(T * SR), lp = new Biquad('lp', 2200); let ph = 0;
    for (let j = 0; j < 0.6 * SR; j++) {
      const t = j / SR; ph += (50 + 60 * Math.exp(-t * 20)) / SR;
      put(i0 + j, Math.sin(2 * Math.PI * ph) * Math.exp(-t * 12) * 0.5 + lp.run(noise()) * Math.exp(-t * 40) * 0.4, 0, 0.3);
    }
  },
};

console.time('sfx');
let count = 0;
for (const s of DATA.scenes) {
  for (const e of s.sfx) {
    if (e[0] === 'loop' || e[0] === 'layers') {
      const [, t0, step, n, type] = e;
      for (let k = 0; k < n; k++) { SFX[type](s.start + t0 + k * step, {}); count++; }
    } else {
      SFX[e[1]](s.start + e[0], e[2] || {}); count++;
    }
  }
}
console.timeEnd('sfx');
console.log('sfx events:', count);

// ---------- 殘響（Freeverb 風格）與乒乓延遲 ----------
console.time('fx');
function comb(inp, out, len, fb, damp, gain) {
  const buf = new Float32Array(len); let idx = 0, store = 0;
  for (let i = 0; i < N; i++) {
    const y = buf[idx];
    store = y * (1 - damp) + store * damp;
    buf[idx] = inp[i] + store * fb;
    if (++idx >= len) idx = 0;
    out[i] += y * gain;
  }
}
function allpass(io, len) {
  const buf = new Float32Array(len); let idx = 0;
  for (let i = 0; i < N; i++) {
    const b = buf[idx], x = io[i];
    io[i] = -x + b; buf[idx] = x + b * 0.5;
    if (++idx >= len) idx = 0;
  }
}
const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
for (const [inp, spread, dry] of [[RL, 0, L], [RR, 23, R]]) {
  const wet = new Float32Array(N);
  for (const c of combs) comb(inp, wet, c + spread, 0.86, 0.3, 0.06);
  for (const a of aps) allpass(wet, a + spread);
  for (let i = 0; i < N; i++) dry[i] += wet[i];
}
// 乒乓延遲：3/16 拍
{
  const d = Math.floor(S16 * 3 * SR);
  const bl = new Float32Array(N), br = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const fl = i >= d ? br[i - d] : 0, fr = i >= d ? bl[i - d] : 0;
    bl[i] = DL[i] + fl * 0.4; br[i] = DR[i] + fr * 0.4;
    L[i] += fl * 0.6; R[i] += fr * 0.6;
  }
}
console.timeEnd('fx');

// ---------- 主控：軟削波 + 輸出 16-bit WAV ----------
const out = process.argv[2] || path.join(__dirname, 'soundtrack.wav');
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
let peak = 0;
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (SR * 0.5));
  const l = Math.tanh(L[i] * 1.2) * fade, r = Math.tanh(R[i] * 1.2) * fade;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
  buf.writeInt16LE(Math.round(clamp(l, -1, 1) * 32000), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(r, -1, 1) * 32000), 46 + i * 4);
}
fs.writeFileSync(out, buf);
console.log('wrote', out, (TOTAL).toFixed(1) + 's', 'peak', peak.toFixed(3));
