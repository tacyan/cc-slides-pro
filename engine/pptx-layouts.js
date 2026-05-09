// ─── PPTX レイアウト ────────────────────────────────────────────
// pptxgenjs で同じ10種のレイアウトを「ネイティブの編集可能テキスト」
// として出力する。PowerPoint / Keynote / Google Slides で本文を直接
// 書き換え可能(画像化されない)。
//
// 各関数のシグネチャ: (slide, text, t, slideMeta)
//   slide    = pptxgenjs Slide オブジェクト
//   text     = { main, sub, other: string[] }
//   t        = STYLE_TOKENS のエントリ
//   slideMeta= { idx, total, deck, layoutKey } 共通枠用

// ─── 色変換 ────────────────────────────────────────────────────
// CSS の '#RRGGBB' / 'rgba(...)' → PPTX の 'RRGGBB' (no #)
export function hex(c) {
  if (typeof c !== "string") return "000000";
  let s = c.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(s)) return s.toUpperCase();
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    return s.split("").map(ch => ch + ch).join("").toUpperCase();
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(",").map(x => parseInt(x.trim(), 10));
    return parts.slice(0, 3).map(n => (n & 0xff).toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  return "000000";
}

// ─── フォント解決 ──────────────────────────────────────────────
// CSS font-family 文字列から、PowerPoint で確実に使える代表フォント名を返す
function resolveFont(cssFamily) {
  const f = String(cssFamily || "").toLowerCase();
  if (f.includes("serif jp") || f.includes("tiempos") || f.includes("georgia")) return "Yu Mincho";
  if (f.includes("noto") || f.includes("hiragino") || f.includes("yu gothic") || f.includes("gothic")) return "Yu Gothic";
  if (f.includes("inter") || f.includes("sf pro") || f.includes("helvetica")) return "Helvetica Neue";
  if (f.includes("bebas")) return "Impact";
  if (f.includes("mono") || f.includes("jetbrains")) return "Menlo";
  return "Helvetica Neue";
}

// "01  資料作成" → { num, label }
function splitNumbered(item) {
  const m = String(item).match(/^\s*([0-9①-⑳一-十]+|[①-⑳])\s+(.+)$/);
  if (m) return { num: m[1], label: m[2] };
  return { num: "", label: String(item) };
}
function splitPriced(item) {
  const m = String(item).match(/^\s*([①-⑳0-9]+)\s+(.+?)\s+(¥[\d,]+)\s*$/);
  if (m) return { num: m[1], label: m[2], price: m[3] };
  return { num: "", label: String(item), price: "" };
}

// ─── 共通フッター(ページ番号・デッキ名・横線) ───────────────────
export function addFrame(slide, t, { idx, total, deck }) {
  // 下のヘアライン (rule)
  slide.addShape("line", {
    x: "8%", y: "94%", w: "84%", h: 0,
    line: { color: hex(t.rule), width: 0.5, transparency: 50 },
  });
  // デッキ名 (左下)
  slide.addText(String(deck.deck_id || ""), {
    x: "8%", y: "95.5%", w: "40%", h: "3.5%",
    fontFace: resolveFont(t.fontNum), fontSize: 8, color: hex(t.muted),
    charSpacing: 3, bold: false,
  });
  // ページ番号 (右下)
  const pageNum = String(idx + 1).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");
  slide.addText(
    [
      { text: pageNum, options: { color: hex(t.accent), bold: true } },
      { text: ` / ${totalStr}`, options: { color: hex(t.muted) } },
    ],
    {
      x: "52%", y: "95.5%", w: "40%", h: "3.5%",
      fontFace: resolveFont(t.fontNum), fontSize: 8,
      align: "right", charSpacing: 3,
    }
  );
}

// =============================================================
// LAYOUT: cover
// =============================================================
export function pptxCover(slide, { main, sub, other }, t) {
  // 上部のゴールドの細いライン
  slide.addShape("line", {
    x: "9%", y: "22%", w: "6.5%", h: 0,
    line: { color: hex(t.accent), width: 3 },
  });
  // 巨大タイトル
  slide.addText(String(main || ""), {
    x: "9%", y: "48%", w: "82%", h: "30%",
    fontFace: resolveFont(t.fontHead), bold: true, fontSize: 56,
    color: hex(t.fg), valign: "top", align: "left",
  });
  // サブタイトル
  if (sub) {
    slide.addText(String(sub), {
      x: "9%", y: "82%", w: "82%", h: "6%",
      fontFace: resolveFont(t.fontBody), fontSize: 18,
      color: hex(t.muted), align: "left",
    });
  }
  // フッター (アイテムを · で区切って1行)
  if (other && other.length) {
    slide.addText(other.join("   ·   "), {
      x: "9%", y: "89%", w: "82%", h: "5%",
      fontFace: resolveFont(t.fontBody), fontSize: 11,
      color: hex(t.muted), charSpacing: 4, align: "left",
    });
  }
}

// =============================================================
// LAYOUT: hero-number
// =============================================================
export function pptxHeroNumber(slide, { main, sub, other }, t) {
  // 中央巨大数字
  slide.addText(String(main || ""), {
    x: "5%", y: "20%", w: "90%", h: "45%",
    fontFace: resolveFont(t.fontNum), bold: true, fontSize: 220,
    color: hex(t.accent), align: "center", valign: "middle",
  });
  // サブ
  if (sub) {
    slide.addText(String(sub), {
      x: "10%", y: "68%", w: "80%", h: "8%",
      fontFace: resolveFont(t.fontBody), fontSize: 22,
      color: hex(t.fg), align: "center",
    });
  }
  // キャプション
  if (other && other[0]) {
    slide.addText(String(other[0]), {
      x: "10%", y: "78%", w: "80%", h: "5%",
      fontFace: resolveFont(t.fontBody), fontSize: 14,
      color: hex(t.muted), align: "center",
    });
  }
}

// =============================================================
// LAYOUT: three-col-numbered
// =============================================================
export function pptxThreeColNumbered(slide, { main, sub, other }, t) {
  slide.addText(String(main || ""), {
    x: "8%", y: "8%", w: "84%", h: "12%",
    fontFace: resolveFont(t.fontHead), bold: true, fontSize: 36,
    color: hex(t.fg), align: "left",
  });
  if (sub) {
    slide.addText(String(sub), {
      x: "8%", y: "21%", w: "84%", h: "6%",
      fontFace: resolveFont(t.fontBody), fontSize: 16,
      color: hex(t.muted), align: "left",
    });
  }
  const items = other || [];
  const n = items.length || 1;
  const colW = 84 / n;
  items.forEach((it, i) => {
    const { num, label } = splitNumbered(it);
    const x = `${8 + colW * i}%`;
    slide.addText(num, {
      x, y: "48%", w: `${colW}%`, h: "5%",
      fontFace: resolveFont(t.fontNum), bold: true, fontSize: 12,
      color: hex(t.accent), charSpacing: 6, align: "left",
    });
    slide.addShape("line", {
      x, y: "55%", w: "3%", h: 0,
      line: { color: hex(t.accent), width: 2 },
    });
    slide.addText(label, {
      x, y: "60%", w: `${colW - 2}%`, h: "12%",
      fontFace: resolveFont(t.fontHead), bold: true, fontSize: 28,
      color: hex(t.fg), align: "left",
    });
  });
}

// =============================================================
// LAYOUT: 2x2-grid
// =============================================================
export function pptx2x2Grid(slide, { main, sub, other }, t) {
  slide.addText(String(main || ""), {
    x: "8%", y: "7%", w: "84%", h: "11%",
    fontFace: resolveFont(t.fontHead), bold: true, fontSize: 34,
    color: hex(t.fg), align: "left",
  });
  if (sub) {
    slide.addText(String(sub), {
      x: "8%", y: "19%", w: "84%", h: "6%",
      fontFace: resolveFont(t.fontBody), fontSize: 15,
      color: hex(t.muted), align: "left",
    });
  }
  // グリッド枠 (細線)
  slide.addShape("rect", {
    x: "8%", y: "32%", w: "84%", h: "55%",
    fill: { type: "none" }, line: { color: hex(t.rule), width: 0.5 },
  });
  slide.addShape("line", {
    x: "50%", y: "32%", w: 0, h: "55%",
    line: { color: hex(t.rule), width: 0.5 },
  });
  slide.addShape("line", {
    x: "8%", y: "59.5%", w: "84%", h: 0,
    line: { color: hex(t.rule), width: 0.5 },
  });

  const cells = (other || []).slice(0, 4);
  const positions = [
    { x: "10%", y: "34%" }, { x: "52%", y: "34%" },
    { x: "10%", y: "61.5%" }, { x: "52%", y: "61.5%" },
  ];
  cells.forEach((it, i) => {
    const { num, label } = splitNumbered(it);
    const p = positions[i];
    slide.addText(num, {
      x: p.x, y: p.y, w: "38%", h: "5%",
      fontFace: resolveFont(t.fontNum), bold: true, fontSize: 11,
      color: hex(t.accent), charSpacing: 6,
    });
    slide.addText(label, {
      x: p.x, y: `${parseFloat(p.y) + 7}%`, w: "38%", h: "16%",
      fontFace: resolveFont(t.fontHead), bold: true, fontSize: 30,
      color: hex(t.fg),
    });
  });
}

// =============================================================
// LAYOUT: split-hero-number
// =============================================================
export function pptxSplitHeroNumber(slide, { main, sub, other }, t) {
  // main から金額/数字を抽出
  const mainStr = String(main || "");
  const numMatch = mainStr.match(/(¥[\d,]+|[\d,]+\s*万円|[\d,]+\s*億円|[\d,.]+\s*%)/);
  let kicker = "";
  let hero = mainStr;
  if (numMatch) {
    hero = numMatch[1].replace(/\s+/g, "");
    kicker = mainStr.replace(numMatch[0], "").replace(/[、。.,!?！？]+/g, " ").trim();
  }

  // 左:キッカー + ヒーロー数字
  if (kicker) {
    slide.addText(kicker, {
      x: "9%", y: "38%", w: "40%", h: "6%",
      fontFace: resolveFont(t.fontNum), bold: true, fontSize: 14,
      color: hex(t.accent), charSpacing: 4,
    });
  }
  slide.addText(hero, {
    x: "9%", y: "44%", w: "40%", h: "20%",
    fontFace: resolveFont(t.fontNum), bold: true, fontSize: 96,
    color: hex(t.accent), valign: "middle",
  });
  // 中央の縦ライン
  slide.addShape("line", {
    x: "50%", y: "30%", w: 0, h: "40%",
    line: { color: hex(t.rule), width: 0.5 },
  });
  // 右:サブ + リスト
  if (sub) {
    slide.addText(String(sub), {
      x: "53%", y: "32%", w: "39%", h: "10%",
      fontFace: resolveFont(t.fontBody), bold: true, fontSize: 16,
      color: hex(t.fg),
    });
  }
  (other || []).forEach((it, i) => {
    slide.addShape("line", {
      x: "53%", y: `${48 + i * 7}%`, w: "1%", h: 0,
      line: { color: hex(t.accent), width: 1.5 },
    });
    slide.addText(String(it), {
      x: "55%", y: `${46 + i * 7}%`, w: "37%", h: "6%",
      fontFace: resolveFont(t.fontBody), fontSize: 14,
      color: hex(t.muted),
    });
  });
}

// =============================================================
// LAYOUT: three-col-priced
// =============================================================
export function pptxThreeColPriced(slide, { main, sub, other }, t) {
  slide.addText(String(main || ""), {
    x: "8%", y: "8%", w: "84%", h: "11%",
    fontFace: resolveFont(t.fontHead), bold: true, fontSize: 32,
    color: hex(t.fg),
  });
  if (sub) {
    slide.addText(String(sub), {
      x: "8%", y: "20%", w: "84%", h: "6%",
      fontFace: resolveFont(t.fontBody), fontSize: 14,
      color: hex(t.muted),
    });
  }
  const items = (other || []).slice(0, 3);
  items.forEach((it, i) => {
    const { num, label, price } = splitPriced(it);
    const x = `${8 + (84 / 3) * i}%`;
    slide.addText(num, {
      x, y: "44%", w: "26%", h: "8%",
      fontFace: resolveFont(t.fontNum), bold: true, fontSize: 24,
      color: hex(t.accent),
    });
    slide.addText(label, {
      x, y: "53%", w: "26%", h: "12%",
      fontFace: resolveFont(t.fontHead), bold: true, fontSize: 18,
      color: hex(t.fg),
    });
    slide.addShape("line", {
      x, y: "67%", w: "2.5%", h: 0,
      line: { color: hex(t.accent), width: 1.5 },
    });
    slide.addText(price, {
      x, y: "70%", w: "26%", h: "12%",
      fontFace: resolveFont(t.fontNum), bold: true, fontSize: 28,
      color: hex(t.fg),
    });
  });
}

// =============================================================
// LAYOUT: two-col-list
// =============================================================
export function pptxTwoColList(slide, { main, sub, other }, t) {
  slide.addText(String(main || ""), {
    x: "8%", y: "6%", w: "84%", h: "10%",
    fontFace: resolveFont(t.fontHead), bold: true, fontSize: 30,
    color: hex(t.fg),
  });
  if (sub) {
    slide.addText(String(sub), {
      x: "8%", y: "17%", w: "84%", h: "5%",
      fontFace: resolveFont(t.fontBody), fontSize: 13,
      color: hex(t.muted),
    });
  }
  const items = other || [];
  const half = Math.ceil(items.length / 2);
  const colA = items.slice(0, half);
  const colB = items.slice(half);
  const startY = 28;
  const rowH = (94 - startY - 8) / Math.max(half, 1);
  const drawCol = (list, baseX) => {
    list.forEach((it, i) => {
      const { num, label } = splitNumbered(it);
      const y = `${startY + rowH * i}%`;
      slide.addText(num, {
        x: baseX, y, w: "4%", h: `${rowH - 0.5}%`,
        fontFace: resolveFont(t.fontNum), bold: true, fontSize: 11,
        color: hex(t.accent), charSpacing: 4,
      });
      slide.addText(label, {
        x: `${parseFloat(baseX) + 4}%`, y, w: "36%", h: `${rowH - 0.5}%`,
        fontFace: resolveFont(t.fontBody), fontSize: 13,
        color: hex(t.fg),
      });
      slide.addShape("line", {
        x: baseX, y: `${startY + rowH * (i + 1) - 0.3}%`, w: "40%", h: 0,
        line: { color: hex(t.rule), width: 0.5 },
      });
    });
  };
  drawCol(colA, "8%");
  drawCol(colB, "52%");
}

// =============================================================
// LAYOUT: hero-number-list
// =============================================================
export function pptxHeroNumberList(slide, { main, sub, other }, t) {
  const mainStr = String(main || "");
  const heroPattern = /(¥[\d,]+|[\d,]+\s*(?:日間|ヶ月間|ヶ月|年間|年|週間|週|名|人|万円|億円)|[\d.]+\s*%)/;
  const heroMatch = mainStr.match(heroPattern);
  const heroNum = heroMatch ? heroMatch[1].replace(/\s+/g, "") : mainStr;
  const headTxt = heroMatch
    ? mainStr.replace(heroMatch[0], "").replace(/^[、。.,\s]+|[、。.,\s]+$/g, "").trim()
    : "";

  if (headTxt) {
    slide.addText(headTxt, {
      x: "8%", y: "5%", w: "84%", h: "8%",
      fontFace: resolveFont(t.fontHead), bold: true, fontSize: 26,
      color: hex(t.fg), align: "center",
    });
  }
  if (sub) {
    slide.addText(String(sub), {
      x: "8%", y: "14%", w: "84%", h: "5%",
      fontFace: resolveFont(t.fontBody), fontSize: 13,
      color: hex(t.muted), align: "center",
    });
  }
  // ヒーロー金額
  slide.addText(heroNum, {
    x: "8%", y: "22%", w: "84%", h: "26%",
    fontFace: resolveFont(t.fontNum), bold: true, fontSize: 130,
    color: hex(t.accent), align: "center", valign: "middle",
  });
  // 区切り線
  slide.addShape("line", {
    x: "47%", y: "53%", w: "6%", h: 0,
    line: { color: hex(t.accent), width: 1.5 },
  });
  // 内訳行
  const rows = other || [];
  const rowStartY = 60;
  const rowH = 6;
  rows.forEach((it, i) => {
    const m = String(it).match(/^(.+?)\s+(¥[\d,]+)\s*$/);
    const label = m ? m[1] : it;
    const price = m ? m[2] : "";
    const y = `${rowStartY + rowH * i}%`;
    slide.addText(label, {
      x: "22%", y, w: "40%", h: `${rowH - 0.5}%`,
      fontFace: resolveFont(t.fontBody), fontSize: 13,
      color: hex(t.fg),
    });
    slide.addText(price, {
      x: "62%", y, w: "16%", h: `${rowH - 0.5}%`,
      fontFace: resolveFont(t.fontNum), bold: true, fontSize: 14,
      color: hex(t.fg), align: "right",
    });
    slide.addShape("line", {
      x: "22%", y: `${rowStartY + rowH * (i + 1) - 0.3}%`, w: "56%", h: 0,
      line: { color: hex(t.rule), width: 0.5 },
    });
  });
}

// =============================================================
// LAYOUT: price-contrast
// =============================================================
export function pptxPriceContrast(slide, { main, sub, other }, t) {
  const mainStr = String(main || "");
  const prices = mainStr.match(/¥[\d,]+/g) || [];
  const before = prices[0] || "";
  const after = prices[1] || "";

  if (sub) {
    slide.addText(String(sub), {
      x: "8%", y: "8%", w: "84%", h: "8%",
      fontFace: resolveFont(t.fontHead), bold: true, fontSize: 22,
      color: hex(t.fg), align: "center",
    });
  }
  // 左: キャプション
  slide.addText("受け取る価値", {
    x: "5%", y: "37%", w: "38%", h: "5%",
    fontFace: resolveFont(t.fontNum), bold: true, fontSize: 11,
    color: hex(t.muted), charSpacing: 4, align: "center",
  });
  // 左: 価値(取り消し線)
  slide.addText(before, {
    x: "5%", y: "43%", w: "38%", h: "20%",
    fontFace: resolveFont(t.fontNum), bold: true, fontSize: 56,
    color: hex(t.muted), strike: true, align: "center", valign: "middle",
  });
  slide.addText("相当", {
    x: "5%", y: "65%", w: "38%", h: "4%",
    fontFace: resolveFont(t.fontBody), fontSize: 11,
    color: hex(t.muted), align: "center",
  });

  // 矢印
  slide.addText("→", {
    x: "44%", y: "44%", w: "12%", h: "18%",
    fontFace: "Helvetica Neue", fontSize: 60,
    color: hex(t.accent), align: "center", valign: "middle",
  });

  // 右: キャプション
  slide.addText("あなたの投資", {
    x: "57%", y: "37%", w: "38%", h: "5%",
    fontFace: resolveFont(t.fontNum), bold: true, fontSize: 11,
    color: hex(t.muted), charSpacing: 4, align: "center",
  });
  // 右: 投資額
  slide.addText(after, {
    x: "57%", y: "43%", w: "38%", h: "22%",
    fontFace: resolveFont(t.fontNum), bold: true, fontSize: 92,
    color: hex(t.accent), align: "center", valign: "middle",
  });
  slide.addText("(税抜)", {
    x: "57%", y: "65%", w: "38%", h: "4%",
    fontFace: resolveFont(t.fontBody), fontSize: 11,
    color: hex(t.muted), align: "center",
  });

  // フッター
  if (other && other.length) {
    slide.addText(other.join("   /   "), {
      x: "8%", y: "82%", w: "84%", h: "5%",
      fontFace: resolveFont(t.fontBody), fontSize: 12,
      color: hex(t.muted), charSpacing: 3, align: "center",
    });
  }
}

// =============================================================
// LAYOUT: cta
// =============================================================
export function pptxCTA(slide, { main, sub, other }, t) {
  slide.addText(String(main || ""), {
    x: "8%", y: "20%", w: "84%", h: "20%",
    fontFace: resolveFont(t.fontHead), bold: true, fontSize: 42,
    color: hex(t.fg), align: "center", valign: "middle",
  });
  // 下線
  slide.addShape("line", {
    x: "47%", y: "44%", w: "6%", h: 0,
    line: { color: hex(t.accent), width: 1.5 },
  });
  if (sub) {
    slide.addText(String(sub), {
      x: "10%", y: "47%", w: "80%", h: "8%",
      fontFace: resolveFont(t.fontBody), fontSize: 18,
      color: hex(t.muted), align: "center",
    });
  }
  // CTA
  const ctaLabel = (other && other[0]) || "お申し込みはこちら";
  slide.addShape("line", {
    x: "30%", y: "63%", w: "40%", h: 0,
    line: { color: hex(t.rule), width: 0.5 },
  });
  slide.addText(ctaLabel, {
    x: "20%", y: "65%", w: "60%", h: "10%",
    fontFace: resolveFont(t.fontHead), bold: true, fontSize: 26,
    color: hex(t.accent), charSpacing: 4, align: "center", valign: "middle",
  });
  slide.addShape("line", {
    x: "30%", y: "76%", w: "40%", h: 0,
    line: { color: hex(t.rule), width: 0.5 },
  });
  // フッター
  const footer = (other || []).slice(1);
  if (footer.length) {
    slide.addText(footer.join("   /   "), {
      x: "8%", y: "82%", w: "84%", h: "5%",
      fontFace: resolveFont(t.fontBody), fontSize: 12,
      color: hex(t.muted), charSpacing: 3, align: "center",
    });
  }
}

// =============================================================
// LAYOUT: default fallback
// =============================================================
export function pptxDefault(slide, { main, sub, other }, t) {
  slide.addText(String(main || ""), {
    x: "8%", y: "20%", w: "84%", h: "16%",
    fontFace: resolveFont(t.fontHead), bold: true, fontSize: 36,
    color: hex(t.fg),
  });
  if (sub) {
    slide.addText(String(sub), {
      x: "8%", y: "38%", w: "84%", h: "8%",
      fontFace: resolveFont(t.fontBody), fontSize: 18,
      color: hex(t.muted),
    });
  }
  (other || []).forEach((it, i) => {
    slide.addShape("line", {
      x: "8%", y: `${52 + i * 6}%`, w: "1%", h: 0,
      line: { color: hex(t.accent), width: 1.5 },
    });
    slide.addText(String(it), {
      x: "10%", y: `${50 + i * 6}%`, w: "82%", h: "5%",
      fontFace: resolveFont(t.fontBody), fontSize: 14,
      color: hex(t.fg),
    });
  });
}

export const PPTX_LAYOUTS = {
  cover: pptxCover,
  "hero-number": pptxHeroNumber,
  "three-col-numbered": pptxThreeColNumbered,
  "2x2-grid": pptx2x2Grid,
  "split-hero-number": pptxSplitHeroNumber,
  "three-col-priced": pptxThreeColPriced,
  "two-col-list": pptxTwoColList,
  "hero-number-list": pptxHeroNumberList,
  "price-contrast": pptxPriceContrast,
  cta: pptxCTA,
  default: pptxDefault,
};
