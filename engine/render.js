#!/usr/bin/env node
// ─── スライド画像生成エンジン (PNG + PPTX) ──────────────────────
//
// PNG  : Headless Chromium (Puppeteer) で HTML/CSS をレンダリング
// PPTX : pptxgenjs でネイティブの編集可能テキストとして出力
//        (PowerPoint / Keynote / Google Slides で本文を直接書き換え可能)
//
// 外部 API キー不要・課金ゼロ・完全オフライン動作。スライド枚数は無制限
// (テンプレート JSON の images 配列の長さがそのまま出力枚数になる)。
//
// 使い方:
//   node engine/render.js --template cc-bootcamp
//   node engine/render.js --template cc-bootcamp --format pptx
//   node engine/render.js --template cc-bootcamp --format both
//   node engine/render.js --template cc-bootcamp --only 3,7
//   node engine/render.js --template cc-bootcamp --style anthropic
//
// 出力:
//   output/<deck_id>/slide-XX.png
//   output/<deck_id>/<deck_id>.pptx
//

import puppeteer from "puppeteer";
import PptxGenJS from "pptxgenjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { PRESETS } from "./presets.js";
import { getTokens } from "./style-tokens.js";
import { LAYOUTS, autoDetectLayout } from "./layouts.js";
import { PPTX_LAYOUTS, addFrame as addPptxFrame, hex } from "./pptx-layouts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ANSI color (no deps)
const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
};

const SIZE_BY_PRESET = {
  presentation: { w: 1920, h: 1080 },
  "video-slide": { w: 1920, h: 1080 },
  "doc-slide": { w: 1920, h: 1080 },
  thumbnail: { w: 1920, h: 1080 },
  "sns-square": { w: 1080, h: 1080 },
  "sns-story": { w: 1080, h: 1920 },
};

// ─── HTML 組み立て ─────────────────────────────────────────────
function buildHtml(slide, idx, total, deck, opts) {
  const styleName = opts.styleOverride || deck.style_base || "bootcamp";
  const t = getTokens(styleName);
  const presetName = deck.preset || "presentation";
  const size = SIZE_BY_PRESET[presetName] || SIZE_BY_PRESET.presentation;

  // レイアウト選択: スライドごとの layout 指定 → 自動検出
  const layoutKey = slide.layout || autoDetectLayout(slide, idx, total);
  const renderFn = LAYOUTS[layoutKey] || LAYOUTS.default;
  const inner = renderFn(slide.text || {}, t, deck);

  // 共通フレーム要素 (ページ番号、デッキ名)
  const pageNum = String(idx + 1).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${idx + 1}/${total}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;600;700;800;900&family=Noto+Serif+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  html,body{margin:0;padding:0}
  body{
    width:${size.w}px;height:${size.h}px;
    background:${t.bg};color:${t.fg};
    font-family:${t.fontBody};
    overflow:hidden;
    position:relative;
  }
  .deck-meta{
    position:absolute;left:8%;bottom:3.4%;
    font-family:${t.fontNum};font-size:14px;color:${t.muted};
    letter-spacing:0.18em;text-transform:uppercase;
    z-index:5;
  }
  .deck-page{
    position:absolute;right:8%;bottom:3.4%;
    font-family:${t.fontNum};font-size:14px;color:${t.muted};
    letter-spacing:0.18em;
    z-index:5;
  }
  .deck-page b{color:${t.accent};font-weight:600}
  .frame-rule{
    position:absolute;left:8%;right:8%;bottom:3%;
    height:1px;background:${t.rule};opacity:0.5;z-index:4;
  }
  .deck-content{
    position:absolute;inset:0;
    transform:scale(var(--fit-scale, 1));
    transform-origin:center center;
    z-index:1;
  }
</style>
</head>
<body>
  <div class="deck-content">${inner}</div>
  <div class="frame-rule"></div>
  <div class="deck-meta">${escapeHtml(deck.deck_id || "")}</div>
  <div class="deck-page"><b>${pageNum}</b> / ${totalStr}</div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── PPTX レンダラー ──────────────────────────────────────────
async function renderPptx(deck, targetIndices, styleOverride, outPath) {
  const styleName = styleOverride || deck.style_base || "bootcamp";
  const t = getTokens(styleName);
  const total = (deck.images || []).length;

  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE"; // 13.333" x 7.5" (16:9)
  pres.author = "cc-slides-pro";
  pres.title = deck.deck_id || "deck";
  pres.subject = deck.description || "";

  // 全スライドを順番通りに追加 (PPTX は連続したファイルとして開かれるため、
  // --only 指定でも全スライドを生成する。--only は PNG のみ対象)。
  for (let i = 0; i < total; i++) {
    const slideData = deck.images[i];
    const slide = pres.addSlide();
    slide.background = { color: hex(t.bg) };

    const layoutKey = slideData.layout || autoDetectLayout(slideData, i, total);
    const renderFn = PPTX_LAYOUTS[layoutKey] || PPTX_LAYOUTS.default;
    renderFn(slide, slideData.text || {}, t, deck);
    addPptxFrame(slide, t, { idx: i, total, deck });
  }

  await pres.writeFile({ fileName: outPath });
  return { total };
}

// ─── Puppeteer レンダラー ──────────────────────────────────────
async function renderOne(browser, html, outPath, size) {
  const page = await browser.newPage();
  await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
  // 念のためフォントロード待ち
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });

  const scales = [1, 0.94, 0.88, 0.82, 0.76];
  let lastOverflow = [];
  let usedScale = 1;
  for (const scale of scales) {
    await page.evaluate((value) => {
      document.documentElement.style.setProperty("--fit-scale", String(value));
    }, scale);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));

    lastOverflow = await getViewportOverflow(page);
    if (!lastOverflow.length) {
      usedScale = scale;
      break;
    }
  }

  if (lastOverflow.length) {
    const target = path.basename(outPath);
    await page.close();
    throw new Error(`Viewport overflow detected in ${target}: ${JSON.stringify(lastOverflow)}`);
  }

  await page.screenshot({ path: outPath, type: "png", fullPage: false, clip: { x: 0, y: 0, width: size.w, height: size.h } });
  await page.close();
  return { scale: usedScale };
}

async function getViewportOverflow(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tolerance = 2;
    const nodes = [...document.body.querySelectorAll("*")];
    const offenders = [];

    for (const el of nodes) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const hasText = (el.textContent || "").trim().length > 0;
      const isRule = rect.height <= 3 || rect.width <= 3;
      if (!hasText && isRule) continue;

      const out =
        rect.left < -tolerance ||
        rect.top < -tolerance ||
        rect.right > vw + tolerance ||
        rect.bottom > vh + tolerance;

      const clipped =
        hasText &&
        (el.scrollWidth > el.clientWidth + tolerance || el.scrollHeight > el.clientHeight + tolerance) &&
        style.overflow !== "visible";

      if (out || clipped) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          className: String(el.className || ""),
          text: (el.textContent || "").trim().slice(0, 80),
          reason: out ? "viewport" : "clipped",
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
          },
        });
      }
    }

    return offenders.slice(0, 5);
  });
}

// ─── CLI ──────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { template: null, only: null, style: null, format: "both", openAfter: true, listLayouts: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--template" || a === "-t") args.template = argv[++i];
    else if (a === "--only") args.only = argv[++i];
    else if (a === "--style") args.style = argv[++i];
    else if (a === "--format" || a === "-f") args.format = argv[++i];
    else if (a === "--no-open") args.openAfter = false;
    else if (a === "--list-layouts") args.listLayouts = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  if (!["png", "pptx", "both"].includes(args.format)) {
    console.error(c.red(`Invalid --format: ${args.format} (must be png / pptx / both)`));
    process.exit(1);
  }
  return args;
}

function help() {
  console.log(`
${c.bold("cc-slides-pro / slide render engine")}

Usage:
  node engine/render.js --template <deck_id> [options]

Options:
  --template <id>     テンプレート ID (templates/<id>.json)
  --format <type>     出力形式: png / pptx / both  (既定: both)
  --only 3,7          指定スライドのみ再生成 (例: 1-3 / 1,4,7)
  --style <name>      スタイル上書き (bootcamp / anthropic / apple / ...)
  --no-open           生成後にフォルダを開かない
  --list-layouts      利用可能レイアウト一覧

PPTX 出力は PowerPoint / Keynote / Google Slides で開いて
本文を直接書き換え可能なネイティブテキストとして出力されます。
`);
}

function parseOnly(only, total) {
  if (!only) return null;
  const set = new Set();
  for (const part of String(only).split(",")) {
    const m = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)].sort((x, y) => x - y);
      for (let i = a; i <= b; i++) set.add(i);
    } else if (/^\d+$/.test(part.trim())) set.add(parseInt(part.trim(), 10));
  }
  return [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) return help();
  if (args.listLayouts) {
    console.log(c.bold("Available layouts:"));
    Object.keys(LAYOUTS).forEach(k => console.log("  " + c.cyan(k)));
    return;
  }
  if (!args.template) {
    help();
    process.exit(1);
  }

  const tplPath = path.join(ROOT, "templates", `${args.template}.json`);
  if (!fs.existsSync(tplPath)) {
    console.error(c.red(`Template not found: ${tplPath}`));
    process.exit(1);
  }
  const deck = JSON.parse(fs.readFileSync(tplPath, "utf8"));
  const total = (deck.images || []).length;
  const onlyList = parseOnly(args.only, total);
  const targets = onlyList || Array.from({ length: total }, (_, i) => i + 1);

  const presetName = deck.preset || "presentation";
  const size = SIZE_BY_PRESET[presetName] || SIZE_BY_PRESET.presentation;

  const outDir = path.join(ROOT, "output", deck.deck_id);
  fs.mkdirSync(outDir, { recursive: true });

  const wantPng = args.format === "png" || args.format === "both";
  const wantPptx = args.format === "pptx" || args.format === "both";

  console.log(c.bold(`\n━━━ cc-slides-pro / render ━━━`));
  console.log(`  deck         ${c.cyan(deck.deck_id)}`);
  console.log(`  style        ${c.cyan(args.style || deck.style_base)}`);
  console.log(`  preset       ${presetName}  (${size.w}x${size.h})`);
  console.log(`  total slides ${total}`);
  console.log(`  format       ${c.cyan(args.format)}`);
  if (wantPng) console.log(`  png slides   ${targets.length}`);
  console.log(`  output dir   ${outDir}\n`);

  const log = { png: { ok: [], fail: [] }, pptx: null };
  const t0 = Date.now();

  // ─── PNG レンダリング ────────────────────────────
  if (wantPng) {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    // 並列に流し過ぎるとフォントロードが詰まるので 4 並列で
    const concurrency = 4;
    const queue = [...targets];
    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length) {
        const idx = queue.shift() - 1;
        const slide = deck.images[idx];
        const html = buildHtml(slide, idx, total, deck, { styleOverride: args.style });
        const fname = `slide-${String(idx + 1).padStart(2, "0")}.png`;
        const outPath = path.join(outDir, fname);
        const layoutKey = slide.layout || autoDetectLayout(slide, idx, total);
        const label = (slide.text?.main || "").slice(0, 36);
        const t1 = Date.now();
        try {
          const rendered = await renderOne(browser, html, outPath, size);
          const dur = ((Date.now() - t1) / 1000).toFixed(1);
          const scaleNote = rendered.scale < 1 ? `  ${c.yellow(`fit ${rendered.scale}`)}` : "";
          console.log(`  ${c.green("✓")} png slide ${String(idx + 1).padStart(2, "0")}  ${dur}s  ${c.gray(`[${layoutKey}]`)}${scaleNote}  ${label}`);
          log.png.ok.push({ slide: idx + 1, layout: layoutKey, file: fname, scale: rendered.scale });
        } catch (err) {
          console.log(`  ${c.red("✗")} png slide ${String(idx + 1).padStart(2, "0")}  → ${err.message}`);
          log.png.fail.push({ slide: idx + 1, error: String(err.message) });
        }
      }
    });
    await Promise.all(workers);
    await browser.close();
  }

  // ─── PPTX レンダリング ──────────────────────────
  if (wantPptx) {
    const t1 = Date.now();
    const pptxName = `${deck.deck_id}.pptx`;
    const pptxPath = path.join(outDir, pptxName);
    try {
      const { total: pptxTotal } = await renderPptx(deck, targets, args.style, pptxPath);
      const dur = ((Date.now() - t1) / 1000).toFixed(1);
      console.log(`  ${c.green("✓")} pptx (${pptxTotal} slides)  ${dur}s  ${c.gray(pptxName)}`);
      log.pptx = { ok: true, slides: pptxTotal, file: pptxName };
    } catch (err) {
      console.log(`  ${c.red("✗")} pptx  → ${err.message}`);
      log.pptx = { ok: false, error: String(err.message) };
    }
  }

  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(c.bold(`\n━━━ Summary ━━━`));
  if (wantPng) {
    console.log(`  png         ${c.green(`${log.png.ok.length}/${targets.length}`)}`);
  }
  if (wantPptx) {
    const ok = log.pptx && log.pptx.ok;
    console.log(`  pptx        ${ok ? c.green("ok") : c.red("failed")}  (${total} slides, fully editable text)`);
  }
  console.log(`  total time  ${totalTime}s`);
  console.log(`  output      ${outDir}`);

  fs.writeFileSync(
    path.join(outDir, "_render.log.json"),
    JSON.stringify({ deck: deck.deck_id, format: args.format, png: log.png, pptx: log.pptx, totalTime }, null, 2)
  );

  if (args.openAfter && process.platform === "darwin") {
    exec(`open "${outDir}"`);
  }

  const failed = (wantPng && log.png.fail.length > 0) || (wantPptx && log.pptx && !log.pptx.ok);
  if (failed) process.exit(1);
}

main().catch(err => {
  console.error(c.red("Fatal: " + err.stack));
  process.exit(1);
});
