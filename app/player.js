// 播放器：以音軌為主時鐘；變速（音高不變）、字幕開關、章節、鍵盤快捷鍵、逐格輸出模式。
(function () {
  const params = new URLSearchParams(location.search);
  const RENDER = params.get('render') === '1';
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const TOTAL = DATA.total;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('dep.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('dep.' + k, JSON.stringify(v)); } catch (e) { /* 私密模式等情況下忽略 */ } },
  };
  const state = {
    speed: store.get('speed', 1),
    subs: params.has('subs') ? params.get('subs') !== '0' : store.get('subs', true),
    tts: false,
    muted: store.get('muted', false),
    playing: false,
  };

  // ---------- 字幕 ----------
  const CUES = [];
  for (const s of DATA.scenes) for (const [a, b, tx] of s.cues) CUES.push({ a: s.start + a, b: s.start + b, tx });
  const cueAt = (t) => CUES.find((q) => t >= q.a && t < q.b);
  function wrap(c, s, maxW) {
    const out = []; let cur = '';
    for (const ch of [...s]) {
      if (measure(c, cur + ch, 44, 500) > maxW && cur) { out.push(cur); cur = ch; } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }
  function drawSubs(c, t) {
    const q = cueAt(t); if (!q) return;
    const a = Math.min(1, (t - q.a) / 0.15, (q.b - t) / 0.15);
    const lines = wrap(c, q.tx, 1560);
    lines.forEach((ln, k) => {
      const y = H - 62 - (lines.length - 1 - k) * 62;
      const w = measure(c, ln, 44, 500);
      c.save(); c.globalAlpha = 0.62 * a; c.fillStyle = '#000'; rr(c, W / 2 - w / 2 - 22, y - 46, w + 44, 60, 8); c.fill(); c.restore();
      text(c, ln, W / 2, y, { size: 44, w: 500, align: 'center', color: '#ffffff', a });
    });
  }

  // ---------- 單格渲染 ----------
  function sceneAt(t) {
    let i = DATA.scenes.findIndex((s) => t >= s.start && t < s.start + s.dur);
    if (i < 0) i = t < 0 ? 0 : DATA.scenes.length - 1;
    return i;
  }
  function renderFrame(t, subs = state.subs) {
    t = clamp(t, 0, TOTAL - 1e-3);
    const i = sceneAt(t), s = DATA.scenes[i], lt = t - s.start;
    ctx.save();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.shadowBlur = 0;
    SCENES[s.id](ctx, lt, s);
    ctx.restore();
    // 場景轉場：短暫壓暗 + 光條掃過
    const dIn = i > 0 ? 1 - clamp(lt / 0.35) : 0;
    const dOut = i < DATA.scenes.length - 1 ? 1 - clamp((s.dur - lt) / 0.3) : 0;
    const dip = Math.max(dIn, dOut);
    if (dip > 0) {
      ctx.save(); ctx.globalAlpha = dip * 0.9; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
      const u = dOut > 0 ? (1 - (s.dur - lt) / 0.3) * 0.5 : 0.5 + (lt / 0.35) * 0.5;
      for (let k = 0; k < 7; k++) {
        const y = H * (k + 0.5) / 7, x = lerp(-W * 0.6, W * 1.2, E.ioQ(u) + (hash(k + i) - 0.5) * 0.2);
        const g = ctx.createLinearGradient(x, 0, x + W * 0.5, 0);
        g.addColorStop(0, 'rgba(56,232,255,0)'); g.addColorStop(0.8, rgba(k % 2 ? C.cy : C.vi, 0.5 * dip)); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x, y - 3, W * 0.5, 6);
      }
    }
    // 底片顆粒 + 暗角
    grain(ctx, t, 0.07);
    vignette(ctx, 0.55);
    // HUD
    const hudA = s.id === 'intro' ? seg(lt, 25, 26) * (1 - seg(lt, 33.6, 34.4)) : s.id === 'outro' ? 1 - seg(lt, 13.6, 14) : 1;
    if (hudA > 0) {
      const tc = fmt(t) + ':' + String(Math.floor((t % 1) * 30)).padStart(2, '0');
      text(ctx, tc, W - 72, 92, { size: 18, f: F.mono, align: 'right', color: C.ink, a: hudA * 0.8, ls: 2 });
      text(ctx, DATA.config.titleEn, W - 72, 66, { size: 14, f: F.mono, align: 'right', color: C.dim, a: hudA, ls: 4 });
      ctx.save(); ctx.globalAlpha = hudA * 0.5; ctx.fillStyle = C.cy; ctx.fillRect(W - 72 - 160 * (t / TOTAL), 104, 160 * (t / TOTAL), 2); ctx.restore();
      dot(ctx, W - 250, 86, 5, C.rd, hudA * (0.5 + 0.5 * Math.sin(t * 4)));
    }
    // 開場與片尾的角落署名（壓在字幕框下方，不會互相重疊）
    const sig = s.id === 'intro' ? seg(lt, 0.3, 1.3) * (1 - seg(lt, 35.4, 36)) : s.id === 'outro' ? seg(lt, 14.5, 15.5) * (1 - seg(lt, 25.6, 27.6, E.inQ)) : 0;
    if (sig > 0) {
      const sw = measure(ctx, DATA.config.signature, 20, 500, F.en, 3);
      line(ctx, W - 48 - sw - 44, H - 34, W - 48 - sw - 14, H - 34, C.cy, 2, sig);
      text(ctx, DATA.config.signature, W - 48, H - 28, { size: 20, w: 500, f: F.en, align: 'right', color: C.wh, a: sig * 0.85, ls: 3 });
    }
    if (subs) drawSubs(ctx, t);
  }
  const fmt = (t) => { t = Math.max(0, t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0'); };

  // ---------- 資源載入 ----------
  async function loadAll() {
    const fams = [['400', F.tc], ['500', F.tc], ['700', F.tc], ['900', F.tc], ['500', F.en], ['700', F.en], ['400', F.mono], ['600', F.mono]];
    const sample = (typeof GLYPHS !== 'undefined' ? GLYPHS : '') + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const fontP = Promise.all(fams.map(([w, f]) => document.fonts.load(`${w} 40px ${f.split(',')[0]}`, sample).catch(() => null)));
    const imgP = loadImages([['city', 'assets/img/city.jpg'], ['cleanroom', 'assets/img/cleanroom.jpg'], ['engineer', 'assets/img/engineer.jpg'], ['layers', 'assets/img/layers.jpg'], ['wafer', 'assets/img/wafer.jpg'], ['plasma', 'assets/img/plasma.jpg'], ['cpu', 'assets/img/cpu.jpg'], ['orchestra', 'assets/img/orchestra.jpg']]);
    await Promise.race([Promise.all([fontP, imgP]), new Promise((r) => setTimeout(r, 15000))]);
    await document.fonts.ready;
  }

  // 逐格輸出模式（給 tools/render_mp4.js 使用）
  if (RENDER) {
    document.body.classList.add('render');
    window.__ready = loadAll().then(() => true);
    window.__render = (t) => { renderFrame(t, params.get('subs') === '1'); return true; };
    window.__total = TOTAL;
    return;
  }

  // ---------- 一般播放 ----------
  const audio = new Audio('assets/audio/soundtrack.mp3');
  audio.preload = 'auto';
  audio.preservesPitch = true;
  let audioOk = true;
  audio.addEventListener('error', () => { audioOk = false; });
  let freeT = 0, lastNow = 0;
  const now = () => (audioOk && audio.readyState >= 2 ? audio.currentTime : freeT);
  function seek(t) {
    t = clamp(t, 0, TOTAL - 0.05);
    freeT = t;
    if (audioOk) audio.currentTime = t;
    if (state.tts) speechSynthesis.cancel();
    lastCue = null;
    if (!state.playing) renderFrame(t);
  }
  function play() {
    state.playing = true; ui.root.classList.add('playing'); ui.root.classList.remove('ended');
    lastNow = performance.now();
    if (audioOk) audio.play().catch(() => { audioOk = false; });
    poke();
  }
  function pause() {
    state.playing = false; ui.root.classList.remove('playing');
    audio.pause(); if (state.tts) speechSynthesis.cancel();
    ui.root.classList.add('show-ui');
  }
  function setSpeed(v) {
    state.speed = v; audio.playbackRate = v; store.set('speed', v);
    ui.speed.forEach((b) => b.classList.toggle('on', +b.dataset.v === v));
    ui.speedLabel.textContent = v + '×';
    toast('播放速度 ' + v + '×');
  }
  function setSubs(v) {
    state.subs = v; store.set('subs', v);
    ui.cc.classList.toggle('on', v); ui.cc.setAttribute('aria-pressed', v);
    toast(v ? '字幕：開' : '字幕：關');
    if (!state.playing) renderFrame(now());
  }
  function setTts(v) {
    if (!('speechSynthesis' in window)) { toast('此瀏覽器不支援語音旁白'); return; }
    state.tts = v; ui.tts.classList.toggle('on', v); ui.tts.setAttribute('aria-pressed', v);
    audio.volume = v ? 0.45 : 1; if (!v) speechSynthesis.cancel();
    lastCue = null;
    toast(v ? 'AI 旁白：開（使用瀏覽器內建語音）' : 'AI 旁白：關');
  }
  function setMuted(v) { state.muted = v; audio.muted = v; store.set('muted', v); ui.mute.classList.toggle('on', !v); toast(v ? '靜音' : '聲音：開'); }

  let lastCue = null;
  function speakCue(t) {
    if (!state.tts || !state.playing) return;
    const q = cueAt(t);
    if (q && q !== lastCue) {
      lastCue = q;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(q.tx.replace(/[—「」（）]/g, ' '));
      u.lang = 'zh-TW'; u.rate = Math.min(2, 1.1 * state.speed);
      const v = speechSynthesis.getVoices().find((x) => /zh[-_]TW/i.test(x.lang)) || speechSynthesis.getVoices().find((x) => /^zh/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    }
  }

  // ---------- 介面 ----------
  const $ = (q) => document.querySelector(q);
  const ui = {
    root: $('#player'), playBtn: $('#btn-play'), big: $('#big-play'), time: $('#time'), bar: $('#bar'), fill: $('#bar-fill'), head: $('#bar-head'),
    ticks: $('#bar-ticks'), tip: $('#bar-tip'), speed: [...document.querySelectorAll('[data-v]')], speedLabel: $('#speed-label'), speedMenu: $('#speed-menu'),
    cc: $('#btn-cc'), tts: $('#btn-tts'), mute: $('#btn-mute'), fs: $('#btn-fs'), chap: $('#btn-chap'), chapMenu: $('#chap-menu'), toast: $('#toast'), loading: $('#loading'),
  };
  DATA.scenes.forEach((s) => {
    const tk = document.createElement('i'); tk.style.left = (s.start / TOTAL * 100) + '%'; ui.ticks.appendChild(tk);
    const li = document.createElement('button');
    li.className = 'chap-item'; li.innerHTML = `<span>${s.ch}</span>${s.zh}<em>${fmt(s.start)}</em>`;
    li.onclick = () => { seek(s.start + 0.01); ui.chapMenu.classList.remove('open'); if (!state.playing) play(); };
    ui.chapMenu.appendChild(li);
  });
  let toastT = 0;
  function toast(m) { ui.toast.textContent = m; ui.toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => ui.toast.classList.remove('on'), 1400); }
  let idleT = 0;
  function poke() { ui.root.classList.add('show-ui'); clearTimeout(idleT); idleT = setTimeout(() => { if (state.playing) ui.root.classList.remove('show-ui'); }, 2600); }

  ui.playBtn.onclick = () => (state.playing ? pause() : play());
  ui.big.onclick = () => play();
  canvas.onclick = () => (state.playing ? pause() : play());
  ui.cc.onclick = () => setSubs(!state.subs);
  ui.tts.onclick = () => setTts(!state.tts);
  ui.mute.onclick = () => setMuted(!state.muted);
  ui.fs.onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else ui.root.requestFullscreen().catch(() => {}); };
  $('#btn-speed').onclick = (e) => { e.stopPropagation(); ui.speedMenu.classList.toggle('open'); ui.chapMenu.classList.remove('open'); };
  ui.chap.onclick = (e) => { e.stopPropagation(); ui.chapMenu.classList.toggle('open'); ui.speedMenu.classList.remove('open'); };
  ui.speed.forEach((b) => (b.onclick = () => { setSpeed(+b.dataset.v); ui.speedMenu.classList.remove('open'); }));
  document.addEventListener('click', () => { ui.speedMenu.classList.remove('open'); ui.chapMenu.classList.remove('open'); });
  ui.root.addEventListener('mousemove', poke);

  // 進度條拖曳
  const posT = (e) => { const r = ui.bar.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width) * TOTAL; };
  let drag = false;
  ui.bar.addEventListener('pointerdown', (e) => { drag = true; ui.bar.setPointerCapture(e.pointerId); seek(posT(e)); });
  ui.bar.addEventListener('pointermove', (e) => {
    const t = posT(e), s = DATA.scenes[sceneAt(t)];
    ui.tip.textContent = fmt(t) + '  ·  ' + s.ch + ' ' + s.zh;
    ui.tip.style.left = (t / TOTAL * 100) + '%';
    if (drag) seek(t);
  });
  ui.bar.addEventListener('pointerup', () => (drag = false));

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key;
    if (k === ' ' || k === 'k' || k === 'K') { e.preventDefault(); state.playing ? pause() : play(); }
    else if (k === 'ArrowRight') seek(now() + 5);
    else if (k === 'ArrowLeft') seek(now() - 5);
    else if (k === 'l' || k === 'L') seek(now() + 10);
    else if (k === 'j' || k === 'J') seek(now() - 10);
    else if (k === 'c' || k === 'C') setSubs(!state.subs);
    else if (k === 'm' || k === 'M') setMuted(!state.muted);
    else if (k === 'f' || k === 'F') ui.fs.onclick();
    else if (k === '>' || k === '.') setSpeed(SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(state.speed) + 1)] || 1);
    else if (k === '<' || k === ',') setSpeed(SPEEDS[Math.max(0, SPEEDS.indexOf(state.speed) - 1)] || 1);
    else if (k === 'PageDown' || k === 'n' || k === 'N') { const i = sceneAt(now()); if (i < DATA.scenes.length - 1) seek(DATA.scenes[i + 1].start + 0.01); }
    else if (k === 'PageUp' || k === 'p' || k === 'P') { const i = sceneAt(now()), s = DATA.scenes[i]; seek(now() - s.start > 2 || i === 0 ? s.start + 0.01 : DATA.scenes[i - 1].start + 0.01); }
    else return;
    poke();
  });

  audio.addEventListener('ended', () => { pause(); ui.root.classList.add('ended'); });

  function loop(ts) {
    if (state.playing) {
      if (!audioOk || audio.readyState < 2) { freeT += (ts - lastNow) / 1000 * state.speed; if (freeT >= TOTAL) { freeT = TOTAL - 0.01; pause(); ui.root.classList.add('ended'); } }
      lastNow = ts;
      const t = now();
      renderFrame(t);
      speakCue(t);
    }
    const t = now();
    const p = t / TOTAL * 100;
    ui.fill.style.width = p + '%'; ui.head.style.left = p + '%';
    ui.time.textContent = fmt(t) + ' / ' + fmt(TOTAL);
    requestAnimationFrame(loop);
  }

  loadAll().then(() => {
    ui.loading.classList.add('done');
    setSpeed(state.speed); audio.muted = state.muted; ui.mute.classList.toggle('on', !state.muted);
    ui.cc.classList.toggle('on', state.subs); ui.cc.setAttribute('aria-pressed', state.subs);
    ui.toast.classList.remove('on');
    const t0 = parseFloat(params.get('t'));
    seek(isNaN(t0) ? 21.2 : t0);   // 封面停在標題畫面
    if (isNaN(t0)) { freeT = 0; if (audioOk) audio.currentTime = 0; }
    requestAnimationFrame(loop);
  });
  window.__seek = seek; window.__render = renderFrame;
})();
