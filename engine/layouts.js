// ─── レイアウト定義 ────────────────────────────────────────────
// 各レイアウトは (text, t, deck) を受け取り、<body> 内に展開する HTML を返す
//   text  = { main, sub, other: string[] }
//   t     = STYLE_TOKENS のエントリ
//   deck  = { footer, badge, ... } (スライド共通の付帯情報)

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// "01  資料作成" のような "番号 ラベル" を分解
function splitNumbered(item) {
  const m = String(item).match(/^\s*([0-9①-⑳一-十]+|[①-⑳])\s+(.+)$/);
  if (m) return { num: m[1], label: m[2] };
  // 全角数字や ① の場合
  const m2 = String(item).match(/^\s*([①-⑳])\s*(.+)$/);
  if (m2) return { num: m2[1], label: m2[2] };
  return { num: "", label: String(item) };
}

// "① 講義  ¥349,000" のような "番号 ラベル 価格" を分解
function splitPriced(item) {
  const m = String(item).match(/^\s*([①-⑳0-9]+)\s+(.+?)\s+(¥[\d,]+)\s*$/);
  if (m) return { num: m[1], label: m[2], price: m[3] };
  return { num: "", label: String(item), price: "" };
}

function splitHeroNumberText(main) {
  const mainStr = String(main || "");
  const heroPattern = /(¥[\d,]+|[\d,]+\s*(?:秒間|秒|分間|分|時間|日間|ヶ月間|ヶ月|年間|年|週間|週|名|人|枚|本|個|件|回|つ|万円|億円)|[\d.]+\s*%)/;
  const heroMatch = mainStr.match(heroPattern);
  if (!heroMatch) return { heroNum: "", headTxt: mainStr };
  const heroNum = heroMatch[1].replace(/\s+/g, "");
  const headTxt = mainStr
    .replace(heroMatch[0], "")
    .replace(/^[、。.,\sの]+|[、。.,\s]+$/g, "")
    .trim();
  return { heroNum, headTxt };
}

function fitHeroFontSize(text, max = 200, min = 72) {
  const len = Array.from(String(text || "")).length;
  if (len <= 6) return max;
  return Math.max(min, Math.floor(max - (len - 6) * 16));
}

function splitMetricText(main) {
  const mainStr = String(main || "");
  const metricPattern = /(¥[\d,]+|[\d,]+\s*(?:秒間|秒|分間|分|時間|日間|ヶ月間|ヶ月|年間|年|週間|週|名|人|枚|本|個|件|回|つ|万円|億円)|[\d,.]+\s*%)/;
  const metricMatch = mainStr.match(metricPattern);
  if (!metricMatch) return { kicker: mainStr, hero: "" };
  const hero = metricMatch[1].replace(/\s+/g, "");
  const kicker = mainStr
    .replace(metricMatch[0], "")
    .replace(/[、。.,!?！？]+/g, " ")
    .trim();
  return { kicker, hero };
}

function fitSplitHeroFontSize(text) {
  const len = Array.from(String(text || "")).length;
  if (len <= 6) return 148;
  return Math.max(76, 148 - (len - 6) * 12);
}

// =============================================================
// LAYOUT: cover  (1枚目用 ヒーローカバー)
// =============================================================
export function layoutCover({ main, sub, other }, t) {
  const footer = (other || []).map(esc).join(`<span class="dot"></span>`);
  return `
  <div class="cover">
    <div class="rule-top"></div>
    <div class="cover-body">
      <h1 class="hero-title">${esc(main)}</h1>
      <p class="hero-sub">${esc(sub)}</p>
    </div>
    <div class="cover-foot">${footer}</div>
  </div>
  <style>
    .cover{position:absolute;inset:0;padding:9% 9% 6%;display:flex;flex-direction:column;justify-content:space-between}
    .rule-top{width:120px;height:3px;background:${t.accent};margin-bottom:auto}
    .cover-body{margin-top:6%;max-width:84%}
    .hero-title{
      font-family:${t.fontHead};font-weight:${t.weightHead};
      font-size:108px;line-height:1.18;letter-spacing:-0.02em;
      color:${t.fg};margin:0 0 28px;
    }
    .hero-sub{
      font-family:${t.fontBody};font-weight:500;font-size:30px;
      color:${t.muted};margin:0;letter-spacing:0.02em;
    }
    .cover-foot{
      font-family:${t.fontBody};font-size:18px;color:${t.muted};
      letter-spacing:0.08em;display:flex;align-items:center;gap:18px;
    }
    .dot{width:4px;height:4px;border-radius:50%;background:${t.muted};display:inline-block}
  </style>`;
}

// =============================================================
// LAYOUT: three-col-numbered (2枚目: 01/02/03 横3カラム)
// =============================================================
export function layoutThreeColNumbered({ main, sub, other }, t) {
  const cols = (other || [])
    .map((it) => {
      const { num, label } = splitNumbered(it);
      return `
        <div class="col">
          <div class="num">${esc(num)}</div>
          <div class="rule"></div>
          <div class="label">${esc(label)}</div>
        </div>`;
    })
    .join("");
  return `
  <div class="wrap">
    <header class="head">
      <h1>${esc(main)}</h1>
      <p>${esc(sub)}</p>
    </header>
    <section class="cols">${cols}</section>
  </div>
  <style>
    .wrap{position:absolute;inset:0;padding:7% 8%;display:flex;flex-direction:column;gap:80px}
    .head h1{font-family:${t.fontHead};font-weight:${t.weightHead};font-size:64px;line-height:1.25;letter-spacing:-0.015em;color:${t.fg};margin:0 0 18px;max-width:88%}
    .head p{font-family:${t.fontBody};font-size:24px;color:${t.muted};margin:0}
    .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:80px;flex:1;align-content:center}
    .col{display:flex;flex-direction:column;gap:18px}
    .num{font-family:${t.fontNum};font-weight:600;font-size:18px;letter-spacing:0.18em;color:${t.accent}}
    .col .rule{width:48px;height:2px;background:${t.accent}}
    .label{font-family:${t.fontHead};font-weight:800;font-size:44px;color:${t.fg};line-height:1.25}
  </style>`;
}

// =============================================================
// LAYOUT: hero-number (3枚目: 巨大数字センター)
// =============================================================
export function layoutHeroNumber({ main, sub, other }, t) {
  const caption = (other && other[0]) ? `<p class="cap">${esc(other[0])}</p>` : "";
  return `
  <div class="wrap">
    <div class="hero">${esc(main)}</div>
    <p class="sub">${esc(sub)}</p>
    ${caption}
  </div>
  <style>
    .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8%;text-align:center}
    .hero{
      font-family:${t.fontNum};font-weight:900;
      font-size:340px;line-height:0.9;letter-spacing:-0.04em;
      color:${t.accent};margin:0 0 60px;
    }
    .sub{font-family:${t.fontBody};font-weight:500;font-size:32px;color:${t.fg};margin:0 0 24px;max-width:880px;line-height:1.5}
    .cap{font-family:${t.fontBody};font-size:20px;color:${t.muted};margin:0;letter-spacing:0.04em}
  </style>`;
}

// =============================================================
// LAYOUT: 2x2-grid (4枚目: 4つのソリューション)
// =============================================================
export function layout2x2Grid({ main, sub, other }, t) {
  const cells = (other || []).map((it) => {
    const { num, label } = splitNumbered(it);
    return `
      <div class="cell">
        <div class="cnum">${esc(num)}</div>
        <div class="clabel">${esc(label)}</div>
      </div>`;
  }).join("");
  return `
  <div class="wrap">
    <header>
      <h1>${esc(main)}</h1>
      <p>${esc(sub)}</p>
    </header>
    <section class="grid">${cells}</section>
  </div>
  <style>
    .wrap{position:absolute;inset:0;padding:6% 8%;display:flex;flex-direction:column;gap:60px}
    header h1{font-family:${t.fontHead};font-weight:${t.weightHead};font-size:60px;line-height:1.22;letter-spacing:-0.015em;color:${t.fg};margin:0 0 14px;max-width:88%}
    header p{font-family:${t.fontBody};font-size:22px;color:${t.muted};margin:0}
    .grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:0;flex:1;border-top:1px solid ${t.rule};border-left:1px solid ${t.rule}}
    .cell{padding:48px 56px;border-right:1px solid ${t.rule};border-bottom:1px solid ${t.rule};display:flex;flex-direction:column;justify-content:center;gap:18px}
    .cnum{font-family:${t.fontNum};font-weight:600;font-size:18px;letter-spacing:0.18em;color:${t.accent}}
    .clabel{font-family:${t.fontHead};font-weight:800;font-size:48px;color:${t.fg};line-height:1.2}
  </style>`;
}

// =============================================================
// LAYOUT: split-hero-number (5枚目: 左ヒーロー数字 + 右リスト)
// =============================================================
export function layoutSplitHeroNumber({ main, sub, other }, t) {
  // main から数字フレーズ (¥xxx / xxx万円 / 30分 / xxx%) を抜き出してヒーローに
  // 残りの前置きを kicker に。例: "初月売上、4,500万円。" → kicker:"初月売上" hero:"4,500万円"
  const { kicker, hero } = splitMetricText(main);
  const heroBlock = hero ? `<div class="hero" style="font-size:${fitSplitHeroFontSize(hero)}px">${esc(hero)}</div>` : "";

  const list = (other || []).map(it => `<li>${esc(it)}</li>`).join("");
  return `
  <div class="wrap">
    <div class="left">
      ${kicker ? `<div class="kicker">${esc(kicker)}</div>` : ""}
      ${heroBlock}
    </div>
    <div class="divider"></div>
    <div class="right">
      <p class="sub">${esc(sub)}</p>
      <ul>${list}</ul>
    </div>
  </div>
  <style>
    .wrap{position:absolute;inset:0;display:grid;grid-template-columns:1.05fr 1px 0.95fr;padding:8%;gap:80px;align-items:center}
    .left{display:flex;flex-direction:column;gap:24px;min-width:0}
    .kicker{font-family:${t.fontNum};font-weight:600;font-size:22px;letter-spacing:0.18em;color:${t.accent}}
    .hero{font-family:${t.fontNum};font-weight:900;line-height:0.95;letter-spacing:-0.04em;color:${t.accent};white-space:nowrap;max-width:100%;overflow-wrap:anywhere}
    .divider{background:${t.rule};width:1px;height:60%;justify-self:center}
    .right{display:flex;flex-direction:column;gap:28px}
    .sub{font-family:${t.fontBody};font-weight:600;font-size:26px;color:${t.fg};margin:0;line-height:1.45}
    ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:16px}
    li{font-family:${t.fontBody};font-size:22px;color:${t.muted};padding-left:22px;position:relative;line-height:1.5}
    li::before{content:"";position:absolute;left:0;top:14px;width:10px;height:2px;background:${t.accent}}
  </style>`;
}

// =============================================================
// LAYOUT: three-col-priced (6枚目: 3カラム + 価格)
// =============================================================
export function layoutThreeColPriced({ main, sub, other }, t) {
  const cols = (other || []).map((it) => {
    const { num, label, price } = splitPriced(it);
    return `
      <div class="pcol">
        <div class="pnum">${esc(num)}</div>
        <div class="plabel">${esc(label)}</div>
        <div class="pline"></div>
        <div class="pprice">${esc(price)}</div>
      </div>`;
  }).join("");
  return `
  <div class="wrap">
    <header>
      <h1>${esc(main)}</h1>
      <p>${esc(sub)}</p>
    </header>
    <section class="pgrid">${cols}</section>
  </div>
  <style>
    .wrap{position:absolute;inset:0;padding:7% 8%;display:flex;flex-direction:column;gap:60px}
    header h1{font-family:${t.fontHead};font-weight:${t.weightHead};font-size:58px;line-height:1.22;letter-spacing:-0.015em;color:${t.fg};margin:0 0 16px}
    header p{font-family:${t.fontBody};font-size:22px;color:${t.muted};margin:0}
    .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:60px;flex:1;align-content:center}
    .pcol{display:flex;flex-direction:column;gap:14px;padding:0 8px}
    .pnum{font-family:${t.fontNum};font-weight:700;font-size:32px;color:${t.accent};line-height:1}
    .plabel{font-family:${t.fontHead};font-weight:800;font-size:28px;color:${t.fg};line-height:1.3;min-height:78px}
    .pline{width:36px;height:2px;background:${t.accent};margin-top:6px}
    .pprice{font-family:${t.fontNum};font-weight:800;font-size:42px;color:${t.fg};margin-top:6px;letter-spacing:-0.01em}
  </style>`;
}

// =============================================================
// LAYOUT: two-col-list (7枚目: 13テーマ 2カラム)
// =============================================================
export function layoutTwoColList({ main, sub, other }, t) {
  const items = other || [];
  const half = Math.ceil(items.length / 2);
  const colA = items.slice(0, half);
  const colB = items.slice(half);
  const renderItem = (it) => {
    const { num, label } = splitNumbered(it);
    return `<li><span class="ln">${esc(num)}</span><span class="ll">${esc(label)}</span></li>`;
  };
  return `
  <div class="wrap">
    <header>
      <h1>${esc(main)}</h1>
      <p>${esc(sub)}</p>
    </header>
    <section class="lists">
      <ul>${colA.map(renderItem).join("")}</ul>
      <ul>${colB.map(renderItem).join("")}</ul>
    </section>
  </div>
  <style>
    .wrap{position:absolute;inset:0;padding:6.5% 8%;display:flex;flex-direction:column;gap:48px}
    header h1{font-family:${t.fontHead};font-weight:${t.weightHead};font-size:54px;line-height:1.22;letter-spacing:-0.015em;color:${t.fg};margin:0 0 14px}
    header p{font-family:${t.fontBody};font-size:20px;color:${t.muted};margin:0}
    .lists{display:grid;grid-template-columns:1fr 1fr;gap:80px;flex:1}
    ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px}
    li{display:grid;grid-template-columns:62px 1fr;gap:18px;align-items:baseline;padding:8px 0;border-bottom:1px solid ${t.rule}}
    .ln{font-family:${t.fontNum};font-weight:600;font-size:18px;color:${t.accent};letter-spacing:0.06em}
    .ll{font-family:${t.fontBody};font-weight:500;font-size:22px;color:${t.fg};line-height:1.4}
  </style>`;
}

// =============================================================
// LAYOUT: hero-number-list (8枚目: 巨大金額 + 内訳3行)
// =============================================================
export function layoutHeroNumberList({ main, sub, other }, t) {
  // mainからヒーロー数字と見出しを分離。¥金額 / 日間 / ヶ月 / 名 / 枚 等にも対応
  // 例: main="2期生限定、特典 ¥1,836,000 相当。" → hero="¥1,836,000"
  // 例: main="30日間、全額返金保証。"          → hero="30日間"
  const { heroNum, headTxt } = splitHeroNumberText(main);
  const heroBlock = heroNum ? `<div class="hero" style="font-size:${fitHeroFontSize(heroNum)}px">${esc(heroNum)}</div>` : "";
  const rows = (other || []).map(it => {
    const m = String(it).match(/^(.+?)\s+(¥[\d,]+)\s*$/);
    if (m) return `<li><span class="lab">${esc(m[1])}</span><span class="prc">${esc(m[2])}</span></li>`;
    return `<li><span class="lab">${esc(it)}</span></li>`;
  }).join("");
  return `
  <div class="wrap">
    <header>
      <h1>${esc(headTxt)}</h1>
      <p>${esc(sub)}</p>
    </header>
    ${heroBlock}
    <div class="rule"></div>
    <ul class="rows">${rows}</ul>
  </div>
  <style>
    .wrap{position:absolute;inset:0;padding:5% 8%;display:flex;flex-direction:column;gap:32px;align-items:center;text-align:center}
    header{max-width:100%}
    header h1{font-family:${t.fontHead};font-weight:${t.weightHead};font-size:46px;line-height:1.25;color:${t.fg};margin:0 0 12px}
    header p{font-family:${t.fontBody};font-size:20px;color:${t.muted};margin:0}
    .hero{font-family:${t.fontNum};font-weight:900;line-height:1;letter-spacing:-0.04em;color:${t.accent};margin:8px 0;max-width:92%;overflow-wrap:anywhere}
    .rule{width:80px;height:2px;background:${t.accent};margin:0 auto}
    .rows{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px;width:780px;max-width:90%}
    .rows li{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid ${t.rule}}
    .lab{font-family:${t.fontBody};font-weight:500;font-size:20px;color:${t.fg}}
    .prc{font-family:${t.fontNum};font-weight:700;font-size:22px;color:${t.fg};letter-spacing:-0.01em}
  </style>`;
}

// =============================================================
// LAYOUT: price-contrast (9枚目: 価値→投資 の対比)
// =============================================================
export function layoutPriceContrast({ main, sub, other }, t) {
  // main から 2 つの金額を抜き出す
  const prices = String(main).match(/¥[\d,]+/g) || [];
  const before = prices[0] || "";
  const after = prices[1] || "";
  const footer = (other || []).map(it => `<span>${esc(it)}</span>`).join(`<span class="sep">/</span>`);
  return `
  <div class="wrap">
    <header>
      <p class="sub">${esc(sub)}</p>
    </header>
    <section class="contrast">
      <div class="left">
        <div class="cap">受け取る価値</div>
        <div class="amount muted">${esc(before)}</div>
        <div class="muted2">相当</div>
      </div>
      <div class="arrow">→</div>
      <div class="right">
        <div class="cap">あなたの投資</div>
        <div class="amount accent">${esc(after)}</div>
        <div class="muted2">(税抜)</div>
      </div>
    </section>
    <footer>${footer}</footer>
  </div>
  <style>
    .wrap{position:absolute;inset:0;padding:6% 7%;display:flex;flex-direction:column;justify-content:space-between}
    header .sub{font-family:${t.fontHead};font-weight:700;font-size:36px;color:${t.fg};margin:0;line-height:1.4;text-align:center;letter-spacing:-0.01em}
    .contrast{display:grid;grid-template-columns:1fr auto 1fr;gap:60px;align-items:center;flex:1}
    .left,.right{display:flex;flex-direction:column;align-items:center;gap:14px}
    .cap{font-family:${t.fontNum};font-weight:600;font-size:18px;color:${t.muted};letter-spacing:0.18em;text-transform:uppercase}
    .amount{font-family:${t.fontNum};font-weight:900;line-height:1;letter-spacing:-0.045em}
    .amount.muted{font-size:120px;color:${t.muted};text-decoration:line-through;text-decoration-thickness:3px;text-decoration-color:${t.accent}}
    .amount.accent{font-size:200px;color:${t.accent}}
    .muted2{font-family:${t.fontBody};font-size:18px;color:${t.muted}}
    .arrow{font-family:${t.fontNum};font-size:80px;color:${t.accent};line-height:1;font-weight:300}
    footer{display:flex;justify-content:center;align-items:center;gap:18px;color:${t.muted};font-family:${t.fontBody};font-size:18px;letter-spacing:0.04em}
    footer .sep{color:${t.rule}}
  </style>`;
}

// =============================================================
// LAYOUT: cta (10枚目: クロージング)
// =============================================================
export function layoutCTA({ main, sub, other }, t) {
  const ctaLabel = (other && other[0]) || "お申し込みはこちら";
  const footer = (other || []).slice(1).map(esc).join(`<span class="sep">/</span>`);
  return `
  <div class="wrap">
    <div class="head">
      <h1>${esc(main)}</h1>
      <div class="rule"></div>
      <p>${esc(sub)}</p>
    </div>
    <div class="cta">${esc(ctaLabel)}</div>
    <div class="foot">${footer}</div>
  </div>
  <style>
    .wrap{position:absolute;inset:0;padding:8%;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center}
    .head{margin-top:4%;display:flex;flex-direction:column;align-items:center;gap:32px;max-width:1100px}
    .head h1{font-family:${t.fontHead};font-weight:${t.weightHead};font-size:74px;line-height:1.22;letter-spacing:-0.02em;color:${t.fg};margin:0}
    .rule{width:80px;height:2px;background:${t.accent}}
    .head p{font-family:${t.fontBody};font-size:26px;color:${t.muted};margin:0;line-height:1.5}
    .cta{font-family:${t.fontHead};font-weight:600;font-size:38px;color:${t.accent};letter-spacing:0.04em;padding:18px 0;border-top:1px solid ${t.rule};border-bottom:1px solid ${t.rule}}
    .foot{display:flex;justify-content:center;gap:18px;color:${t.muted};font-family:${t.fontBody};font-size:18px;letter-spacing:0.04em}
    .foot .sep{color:${t.rule}}
  </style>`;
}

// =============================================================
// LAYOUT: default fallback
// =============================================================
export function layoutDefault({ main, sub, other }, t) {
  const list = (other || []).map(it => `<li>${esc(it)}</li>`).join("");
  return `
  <div class="wrap">
    <h1>${esc(main)}</h1>
    <p>${esc(sub)}</p>
    <ul>${list}</ul>
  </div>
  <style>
    .wrap{position:absolute;inset:0;padding:8%;display:flex;flex-direction:column;justify-content:center;gap:24px}
    h1{font-family:${t.fontHead};font-weight:${t.weightHead};font-size:64px;color:${t.fg};margin:0;line-height:1.25}
    p{font-family:${t.fontBody};font-size:24px;color:${t.muted};margin:0}
    ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px}
    li{font-family:${t.fontBody};font-size:22px;color:${t.fg};padding-left:22px;position:relative}
    li::before{content:"";position:absolute;left:0;top:14px;width:10px;height:2px;background:${t.accent}}
  </style>`;
}

export const LAYOUTS = {
  cover: layoutCover,
  "three-col-numbered": layoutThreeColNumbered,
  "hero-number": layoutHeroNumber,
  "2x2-grid": layout2x2Grid,
  "split-hero-number": layoutSplitHeroNumber,
  "three-col-priced": layoutThreeColPriced,
  "two-col-list": layoutTwoColList,
  "hero-number-list": layoutHeroNumberList,
  "price-contrast": layoutPriceContrast,
  cta: layoutCTA,
  default: layoutDefault,
};

// レイアウトが指定されていない場合の自動推測（汎用デッキ用）
export function autoDetectLayout(slide, idx, total) {
  const text = slide.text || {};
  const items = text.other || [];
  const main = String(text.main || "");
  // 1枚目はカバー
  if (idx === 0) return "cover";
  // 巨大数字単独（"0.1%" のような短いもの）
  if (main.length <= 6 && /^[\d¥%.,]+$/.test(main.replace(/\s/g, ""))) return "hero-number";
  // 価値→投資
  if (/¥[\d,]+.*[→⇒].*¥[\d,]+/.test(main) || (main.match(/¥[\d,]+/g) || []).length >= 2) return "price-contrast";
  // 価格付き3項目
  if (items.length === 3 && items.every(i => /¥[\d,]+/.test(i))) return "three-col-priced";
  // 巨大数字+リスト
  if (/¥[\d,]+/.test(main) && items.length >= 2 && items.every(i => /¥[\d,]+/.test(i))) return "hero-number-list";
  // 4項目
  if (items.length === 4) return "2x2-grid";
  // 3項目（番号付きが多い）
  if (items.length === 3) return "three-col-numbered";
  // 大量リスト
  if (items.length >= 8) return "two-col-list";
  // 最終
  if (idx === total - 1) return "cta";
  return "default";
}
