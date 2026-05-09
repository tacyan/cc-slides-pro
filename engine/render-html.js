#!/usr/bin/env node
// ─── HTML+Puppeteer ベースのスライド画像生成エンジン ─────────────
//
// ローカルの Headless Chromium で HTML/CSS をレンダリングして PNG を出力する。
// 外部 API キー不要・課金ゼロ・完全オフライン動作。日本語テキスト・金額・
// レイアウトを 100% 制御できるため、販売資料に必要な精度が保証される。
//
// 使い方:
//   node engine/render-html.js --template cc-bootcamp
//   node engine/render-html.js --template cc-bootcamp --only 3,7
//   node engine/render-html.js --template cc-bootcamp --style anthropic
//
// 出力: output/<deck_id>/slide-XX.png
//

import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { PRESETS } from "./presets.js";
import { getTokens } from "./style-tokens.js";
import { LAYOUTS, autoDetectLayout } from "./layouts.js";

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
</style>
</head>
<body>
  ${inner}
  <div class="frame-rule"></div>
  <div class="deck-meta">${escapeHtml(deck.deck_id || "")}</div>
  <div class="deck-page"><b>${pageNum}</b> / ${totalStr}</div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  await page.screenshot({ path: outPath, type: "png", fullPage: false, clip: { x: 0, y: 0, width: size.w, height: size.h } });
  await page.close();
}

// ─── CLI ──────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { template: null, only: null, style: null, openAfter: true, listLayouts: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--template" || a === "-t") args.template = argv[++i];
    else if (a === "--only") args.only = argv[++i];
    else if (a === "--style") args.style = argv[++i];
    else if (a === "--no-open") args.openAfter = false;
    else if (a === "--list-layouts") args.listLayouts = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function help() {
  console.log(`
${c.bold("cc-slides-pro / HTML render engine")}

Usage:
  node engine/render-html.js --template <deck_id> [options]

Options:
  --template <id>   テンプレート ID (templates/<id>.json)
  --only 3,7        指定スライドのみ再生成 (例: 1-3 / 1,4,7)
  --style <name>    スタイル上書き (bootcamp / anthropic / apple / ...)
  --no-open         生成後にフォルダを開かない
  --list-layouts    利用可能レイアウト一覧
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

  console.log(c.bold(`\n━━━ cc-slides-pro / HTML render ━━━`));
  console.log(`  deck         ${c.cyan(deck.deck_id)}`);
  console.log(`  style        ${c.cyan(args.style || deck.style_base)}`);
  console.log(`  preset       ${presetName}  (${size.w}x${size.h})`);
  console.log(`  total slides ${total}`);
  console.log(`  generating   ${targets.length}`);
  console.log(`  output dir   ${outDir}\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const log = { ok: [], fail: [] };
  const t0 = Date.now();

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
        await renderOne(browser, html, outPath, size);
        const dur = ((Date.now() - t1) / 1000).toFixed(1);
        console.log(`  ${c.green("✓")} slide ${String(idx + 1).padStart(2, "0")}  ${dur}s  ${c.gray(`[${layoutKey}]`)}  ${label}`);
        log.ok.push({ slide: idx + 1, layout: layoutKey, file: fname });
      } catch (err) {
        console.log(`  ${c.red("✗")} slide ${String(idx + 1).padStart(2, "0")}  → ${err.message}`);
        log.fail.push({ slide: idx + 1, error: String(err.message) });
      }
    }
  });
  await Promise.all(workers);
  await browser.close();

  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(c.bold(`\n━━━ Summary ━━━`));
  console.log(`  generated   ${c.green(`${log.ok.length}/${targets.length}`)}`);
  console.log(`  total time  ${totalTime}s`);
  console.log(`  output      ${outDir}`);

  fs.writeFileSync(
    path.join(outDir, "_render.log.json"),
    JSON.stringify({ deck: deck.deck_id, ok: log.ok, fail: log.fail, totalTime }, null, 2)
  );

  if (args.openAfter && process.platform === "darwin") {
    exec(`open "${outDir}"`);
  }

  if (log.fail.length > 0) process.exit(1);
}

main().catch(err => {
  console.error(c.red("Fatal: " + err.stack));
  process.exit(1);
});
