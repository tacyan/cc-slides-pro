# cc-slides-pro

> Claude Code に話しかけるだけで、販売現場で使えるレベルのスライド画像を10枚自動生成する。

外部 API キー不要・課金ゼロ・完全オフライン動作。HTML + headless Chromium (Puppeteer) でレンダリングするため、日本語テキストや金額(¥198,000 等)が一切崩れません。15種のスタイルプリセット、6種の出力フォーマット、CCブートキャンプ販売10枚の既定テンプレート、Claude Code SKILL 登録済み。

## 30秒で使う

```bash
# 1. 依存インストール (初回のみ)
cd engine && npm install && cd ..

# 2. 10枚一気に生成
node engine/render-html.js --template cc-bootcamp
```

`output/cc-bootcamp/slide-01.png` 〜 `slide-10.png` が**約6秒**で出力され、生成完了後に自動でフォルダが開きます。

## Claude Code から使う

このプロジェクトは Claude Code の SKILL として登録済みです。

```
あなた: ブートキャンプのスライド作って
```

と話しかけるだけで、Claude Code が自動でこのスキルを呼び出して10枚生成します。

スタイル変更:

```
あなた: Anthropic 風で作り直して
```

修正:

```
あなた: 3枚目だけ作り直して
```

詳細は [CLAUDE.md](CLAUDE.md) を参照。

## 主な機能

- **完全無料・APIキー不要**: ローカルの Headless Chromium で HTML/CSS をレンダリング
- **Default 10枚スライド**: CCブートキャンプの販売資料を1コマンドで生成 (約6秒)
- **15種のスタイル**: bootcamp / stripe / apple / anthropic / linear / vercel / mckinsey / notion / google / figma / netflix / canva / nike / muji / bootcamp_light
- **6種のフォーマット**: presentation / video-slide / doc-slide / thumbnail / sns-square / sns-story
- **10種のレイアウト**: cover / hero-number / 2x2-grid / split-hero-number / three-col-numbered / three-col-priced / two-col-list / hero-number-list / price-contrast / cta
- **部分再生成**: `--only 3,7` のような指定で個別スライドだけ作り直せる
- **スタイル上書き**: `--style anthropic` で全スタイルを切替

## CLI オプション

```bash
node engine/render-html.js --template <deck_id> [options]

  --template <id>     templates/<id>.json を読み込む
  --only 3,7          指定スライドのみ再生成 (例: 1-3 / 1,4,7)
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
- [engine/layouts.js](engine/layouts.js) — レイアウト関数
- [engine/style-tokens.js](engine/style-tokens.js) — スタイル別 CSS トークン

## 評価軸との対応

| 評価軸 | 仕組み |
|--------|--------|
| **AI活用力** | Claude Code が `purpose` を執筆 → HTML レンダリングまで自動。AIに「やらせる」設計 |
| **スピード** | ローカル並列レンダで 10枚 約6秒 |
| **クオリティ** | HTML/CSS で厳密制御。日本語・金額・レイアウトが100%崩れない |
| **センス** | `purpose` フィールドと専用レイアウト関数で「削る/盛る」を構造的に明文化 |
| **コミュニケーション** | フィードバックループは `templates/*.json` の差分修正で完結 |
| **再現性** | API キー・課金・レート制限ゼロ。誰の環境でも `npm install` だけで動く |

## ライセンス

MIT
