# 奈米建築學 — THE ART OF DEPOSITION

**線上觀看：https://lidude1547.github.io/Work_instruction/**　·　Shawn_Lin made

9 分鐘的動態圖像 showreel，主題是 CVD／PVD／ALD 薄膜沉積，觀眾設定為晶圓廠的製程與設備工程師。
所有畫面都是程式即時繪製的向量動畫（Canvas 2D），不是剪輯素材，所以任何時間點都能精準跳轉、變速或逐格輸出。

## 成品

| 檔案 | 說明 |
|---|---|
| `output/DEPOSITION_showreel_1080p.mp4` | 1920×1080 / 30 fps / H.264 + AAC，內嵌**可切換的繁中字幕軌**（播放器裡開關字幕、調速度即可） |
| `index.html` | 互動播放器：變速 0.5×–2×、字幕開關、章節跳轉、AI 旁白（實驗） |
| `output/subtitles.zh-TW.srt` / `.vtt` | 獨立字幕檔（上傳 YouTube／Vimeo 用） |
| `SCRIPT.md` | 完整腳本：14 章節、80 句旁白與時間碼 |

## 開啟互動播放器

```bash
node tools/serve.js 8080
```

然後用瀏覽器開 http://localhost:8080 。（直接雙擊 `index.html` 也能播，但部分瀏覽器在 `file://` 下拖曳進度條會不準。）

| 按鍵 | 功能 |
|---|---|
| Space / K | 播放／暫停 |
| C | 字幕開／關 |
| `<` `>` | 降速／加速（0.5×、0.75×、1×、1.25×、1.5×、2×，音高不變） |
| ← → / J L | 倒退／快轉 5 秒／10 秒 |
| N / P | 下一章／上一章 |
| M / F | 靜音／全螢幕 |

網址參數：`?t=125` 從第 125 秒開始；`?subs=0` 預設關字幕。

## 修改內容

- **片尾署名**：`app/data.js` 的 `config.author`（目前是 `Your Name`）。
- **字幕／腳本文字**：`app/data.js` 的 `cues`。改完執行 `node tools/build_glyphs.js` 與 `node tools/export_subs.js`。
- **畫面**：`app/scenes*.js`，每個場景是一個 `draw(c, t)` 函式。
- **配樂**：`node tools/make_audio.js out.wav` 會依 `data.js` 的強度曲線與音效時間點重新合成，再用 ffmpeg 轉 mp3（見下方）。

重新輸出 MP4：

```bash
node tools/render_mp4.js 30 8
```

（需要先開著 `serve.js`；參數是 fps 與平行數。`RANGE=60-75` 可只輸出一段測試。）

## 素材授權

- **圖片**：8 張來自 Pexels（Pexels License：可免費商用、無須署名），清單見 `assets/CREDITS.md`。
- **音樂與音效**：全部由 `tools/make_audio.js` 以程式合成的原創配樂（D 小調、120 BPM、317 個與畫面對齊的音效），沒有任何第三方音訊，可放心公開。
