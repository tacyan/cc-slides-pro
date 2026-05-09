# cc-slides-pro

> Claude Code に話しかけるだけで、販売現場で使えるレベルのスライドを **PNG 画像 + 編集可能な PPTX** で自動生成する。

外部 API キー不要・課金ゼロ・完全オフライン動作。**スライド枚数は無制限**(JSON テンプレートの `images` 配列の長さがそのまま反映)。HTML + headless Chromium で PNG 画像を、pptxgenjs で **PowerPoint / Keynote / Google Slides で本文を直接書き換え可能なネイティブ PPTX** を出力します。

## 30秒で使う

```bash
# 1. 依存インストール (初回のみ)
cd engine && npm install && cd ..

# 2. 一気に PNG + PPTX 生成
node engine/render.js --template cc-bootcamp
```

`output/cc-bootcamp/` に以下が**約7秒**で出力されます:

```
slide-01.png 〜 slide-10.png       ← 1920x1080 高解像度PNG
cc-bootcamp.pptx                    ← PowerPoint/Keynote で開けば即編集可能
```

## 出力形式の使い分け

```bash
node engine/render.js --template cc-bootcamp                   # 既定: PNG + PPTX 両方
node engine/render.js --template cc-bootcamp --format png      # PNG のみ
node engine/render.js --template cc-bootcamp --format pptx     # PPTX のみ
node engine/render.js --template cc-bootcamp --format both     # 両方 (明示指定)
```

## PPTX の編集可能性

生成された PPTX は **すべての文字列がネイティブテキストボックス**として保存されます。画像化・図形化されません。

- PowerPoint で開く → クリックして即編集
- Keynote で開く → クリックして即編集
- Google Slides にアップロード → クリックして即編集
- フォント・色・位置も全て調整可能

## Claude Code から使う

このプロジェクトは Claude Code の SKILL として登録済みです。

```
あなた: ブートキャンプのスライド作って
あなた: 自社サービスの12枚スライド、Anthropic風で作って
あなた: 3枚目だけ作り直して
あなた: PPTXだけ欲しい
```

詳細は [CLAUDE.md](CLAUDE.md) を参照。

## 主な機能

- **完全無料・APIキー不要**: ローカルの Headless Chromium + pptxgenjs
- **スライド枚数無制限**: 10枚 / 13枚 / 30枚どんなデッキでも OK ([cc-bootcamp.json](templates/cc-bootcamp.json) は10枚版、[cc-bootcamp-extended.json](templates/cc-bootcamp-extended.json) は13枚版)
- **2形式同時出力**: PNG (高解像度画像) + PPTX (編集可能スライド)
- **15種のスタイル**: bootcamp / stripe / apple / anthropic / linear / vercel / mckinsey / notion / google / figma / netflix / canva / nike / muji / bootcamp_light
- **6種のフォーマット**: presentation / video-slide / doc-slide / thumbnail / sns-square / sns-story
- **10種のレイアウト**: cover / hero-number / 2x2-grid / split-hero-number / three-col-numbered / three-col-priced / two-col-list / hero-number-list / price-contrast / cta
- **部分再生成**: `--only 3,7` のような指定で個別 PNG だけ作り直せる
- **スタイル上書き**: `--style anthropic` で全スタイルを切替

## CLI オプション

```bash
node engine/render.js --template <deck_id> [options]

  --template <id>     templates/<id>.json を読み込む
  --format <type>     png / pptx / both  (既定: both)
  --only 3,7          指定スライドのみ PNG 再生成 (例: 1-3 / 1,4,7)
  --style <name>      スタイル上書き (bootcamp / anthropic / apple / ...)
  --no-open           生成後にフォルダを開かない
  --list-layouts      利用可能レイアウト一覧
```

## 必要環境

- Node.js >= 18
- 初回 `npm install` 時に Puppeteer が Chromium をダウンロード (約 170MB)

## ドキュメント

- [CLAUDE.md](CLAUDE.md) — Claude Code 用スキル定義 + 全フロー
- [templates/](templates/) — デッキ定義 JSON
- [engine/layouts.js](engine/layouts.js) — HTML/CSS レイアウト関数 (PNG用)
- [engine/pptx-layouts.js](engine/pptx-layouts.js) — PPTX レイアウト関数 (編集可能テキスト)
- [engine/style-tokens.js](engine/style-tokens.js) — スタイル別 CSS / 色トークン

## 評価軸との対応

| 評価軸 | 仕組み |
|--------|--------|
| **AI活用力** | Claude Code が `purpose` を執筆・レイアウト選択 → エンジンが PNG + PPTX 出力。AIに「やらせる」設計 |
| **スピード** | ローカル並列レンダで 13枚 PNG + PPTX 約10秒 |
| **クオリティ** | HTML/CSS と pptxgenjs で厳密制御。日本語・金額・レイアウトが100%崩れない |
| **センス** | `purpose` フィールドと専用レイアウト関数で「削る/盛る」を構造的に明文化 |
| **コミュニケーション** | フィードバックループは `templates/*.json` の差分修正で完結。PPTX で直接編集も可能 |
| **再現性** | API キー・課金・レート制限ゼロ。誰の環境でも `npm install` だけで動く |
| **柔軟性** | スライド枚数無制限・PNG/PPTX 切替・15スタイルから選択 |

## ライセンス

MIT
