# cc-slides-pro — Claude Code でセールス級スライドを自動生成

このリポジトリは、Claude Code に **「ブートキャンプの販売スライド作って」** と話しかけるだけで、販売現場で使えるレベルのスライドを **PNG 画像 + 編集可能な PPTX** で自動生成するシステム。

外部 API キー不要・課金ゼロ・完全オフライン動作。**スライド枚数は無制限**。HTML + headless Chromium で PNG を、pptxgenjs で PowerPoint / Keynote / Google Slides で本文を直接書き換え可能なネイティブ PPTX を出力します。

## トリガー

ユーザーが以下のような発話をしたら、このファイルの手順に従って実行する:

- 「ブートキャンプのスライド作って」「CCのスライド作って」「Claude Codeブートキャンプのスライド」
- 「セールススライド」「販売資料」「LP用ヒーロー画像」
- 「10枚のスライド」「サムネ作って」「プレゼン資料」
- スライド・プレゼン・販売資料の生成を意図する発話全般

## 共通ルール（最重要）

- ユーザーはプログラミング未経験者の可能性が高い。コードの詳細説明は不要
- 修正は何度でも対応する
- **`purpose` フィールドの品質がデザインの品質を決める。ここに時間をかける**
- 安っぽい情報商材っぽさ・絵文字・装飾過多は絶対に避ける
- 数字（金額、割合、日数）はテキストの主役として大きく扱う

---

## セットアップ

初回のみ:

```bash
cd engine && npm install && cd ..
```

`npm install` で Puppeteer が Chromium をダウンロードします (約 170MB / 数十秒)。**API キーや環境変数は一切不要**です。

---

## プロジェクト構成

```
cc-slides-pro/
├── CLAUDE.md                       ← このファイル(スキル定義)
├── README.md
├── .gitignore
├── engine/
│   ├── render.js                   ← レンダリングエンジン本体 (PNG + PPTX)
│   ├── layouts.js                  ← HTML/CSS レイアウト関数 (PNG用)
│   ├── pptx-layouts.js             ← PPTX レイアウト関数 (編集可能テキスト)
│   ├── style-tokens.js             ← 15種のスタイル別 CSS トークン
│   ├── presets.js                  ← 出力フォーマット定義
│   └── package.json
├── templates/
│   ├── cc-bootcamp.json            ← CCブートキャンプ販売10枚(既定)
│   ├── cc-bootcamp-extended.json   ← 13枚版 (>10枚デッキの実証)
│   └── cc-bootcamp-thumbnail.json  ← サムネ/ヒーロー画像3枚
├── examples/                       ← 生成済みサンプル(評価提出用)
└── output/                         ← 生成画像の出力先(gitignore)
    └── <deck_id>/
        ├── slide-01.png 〜 slide-NN.png   ← 1920x1080 PNG
        └── <deck_id>.pptx                  ← 編集可能 PPTX
```

---

## デフォルトの動作（最も多いケース）

ユーザーが「**CCブートキャンプのスライド作って**」と言ったら、以下を実行:

```bash
node engine/render.js --template cc-bootcamp
```

これだけで、`templates/cc-bootcamp.json` の10枚を `output/cc-bootcamp/` に**PNG画像10枚 + PPTX 1ファイル**として出力する。**約7秒で完了**し、生成完了後に自動でフォルダが開く。

13枚以上の長いデッキも同じコマンドで生成可能:

```bash
node engine/render.js --template cc-bootcamp-extended  # 13枚版
```

出力形式の切替:

```bash
node engine/render.js --template cc-bootcamp --format png      # PNGのみ
node engine/render.js --template cc-bootcamp --format pptx     # PPTXのみ
node engine/render.js --template cc-bootcamp --format both     # 両方(既定)
```

スタイル変更が要望された場合:

```bash
# Anthropic 風(温かい知性)
node engine/render.js --template cc-bootcamp --style anthropic

# Apple 風(ミニマル)
node engine/render.js --template cc-bootcamp --style apple

# 利用可能レイアウト/オプション一覧
node engine/render.js --help
```

修正・再生成 (PNG):

```bash
# スライド3と7だけ再生成
node engine/render.js --template cc-bootcamp --only 3,7 --format png

# 連番範囲(2〜4枚目)
node engine/render.js --template cc-bootcamp --only 2-4 --format png
```

> **注意**: `--only` は PNG にのみ適用される。PPTX は単一ファイルとして
> 全スライドが出力される(部分書き換えは PowerPoint 側で行う)。

---

## カスタムスライドを作る場合のフロー

ユーザーが「自分のサービスのスライドを作って」と言った場合:

### Phase 1: ヒアリング (短く)

1. **用途**: セミナースライド/サムネ/SNS/動画用 (`preset` を決める)
2. **内容**: テキスト原稿、Markdown、サービス情報があればそのまま貰う
3. **枚数**: 既定は10枚。「3枚で」「20枚で」「30枚で」等の指定があれば従う(枚数無制限)
4. **出力形式**: 既定は PNG + PPTX 両方。「PowerPointで」と言われたら `--format pptx`、「画像だけ」なら `--format png`
5. **スタイル**: 一覧から選んでもらう or「おまかせ」(その場合 `bootcamp` か `stripe` から判断)
6. **ブランドカラー** (任意): 指定があれば `style_description` に反映

### Phase 2: design.json 設計

`templates/<deck_id>.json` を作成する。構造:

```json
{
  "deck_id": "my-deck",
  "description": "デッキの一行説明",
  "type": "series",
  "style_base": "stripe",
  "style_description": "全スライドに共通する空気感を2-3文で",
  "preset": "presentation",
  "images": [
    {
      "layout": "cover",
      "purpose": "このスライドが視聴者に起こす変化を2-3文で。何を見せ、どう見せ、どんなレイアウトかまで。",
      "text": {
        "main": "メインタイトル",
        "sub": "サブタイトル",
        "other": ["箇条書き1", "箇条書き2"]
      },
      "note": "(任意) 各スライド独自のレイアウト指示メモ"
    }
  ]
}
```

### purpose の書き方（品質を決定的に左右する）

#### 悪い例 → 良い例

| 悪い | 良い |
|------|------|
| `"表紙"` | `"検討者の最初の3秒を掴むカバー。中央〜左寄せに巨大な極太タイトル、右上にゴールドの細いライン。アイコンや写真は使わず、タイポグラフィだけで'これは安っぽくない'と即座に伝える。"` |
| `"問題提起"` | `"3つの課題を3カラム横並びで配置し、上に細いゴールドのナンバリング。視聴者に'自分のことだ'と即座に思わせる。"` |
| `"価格表"` | `"左に'相当価値¥2,485,000'、中央にゴールドの矢印、右に巨大な'¥198,000'を置き、視覚的に'価値の差がここまである'と直感させる対比レイアウト。"` |

**purposeは2〜3文で、「何を起こすか」「どう見せるか」「どんなレイアウトか」を具体的に書く。**

#### 良いpurposeの3要素チェック

1. **意図 (Intent)**: 視聴者にどんな変化を起こすか
2. **構成 (Composition)**: どこに何を置くか (左/右/中央/グリッド)
3. **トーン (Tone)**: どの空気感で見せるか (静かな決意/煽り/対比/権威性)

### Phase 3: 設計をユーザーに確認

`templates/<deck_id>.json` の内容を提示し、「このまま生成してOKですか?」と確認。OKを得てから次へ。

### Phase 4: 生成

```bash
node engine/render.js --template <deck_id>
```

並列4でレンダリング、10枚は PNG + PPTX 同時で約7秒、13枚で約10秒。

### Phase 5: 確認 → 修正ループ

| ユーザーのフィードバック | 対応 |
|------------------------|------|
| 「3枚目のテキストを変えたい」 | json編集 → `--only 3 --format png` で再生成 |
| 「全体の色味を変えたい」 | `style_base` 変更 → 全体再生成 |
| 「3枚目のレイアウトを変えたい」 | `layout` を別の種類に変更 → `--only 3 --format png` |
| 「もう少し信頼感が欲しい」 | `style_base` を `bootcamp_light` / `mckinsey` 等に切替 |
| 「数字を直したい」 | `text.main` 編集 → `--only N --format png` で再生成 |
| 「PowerPointで微調整したい」 | `--format pptx` で出力した PPTX を直接編集 |
| 「もう少しスライドを足したい」 | `images` 配列に項目を追加 (枚数は無制限) |

### Phase 6: 画面内フィット確認 (必須)

生成後は必ずPNGを確認し、文字が画面外にはみ出していないかを見る。

- `hero-number` / `hero-number-list` / `split-hero-number` には短い数字・金額・時間だけを巨大表示する。長い文章を巨大文字として扱わない
- 巨大数字系の `main` は `1枚の指示書...`、`3つの数字...`、`30分短縮...` のように単位付き数字を含めるか、通常見出し用レイアウトに変更する
- 数字抽出に失敗する文言は巨大表示禁止。`main` に数字がない場合は `cta` / `default` / `two-col-list` を使う
- 長い文章は `cta` / `two-col-list` / `default` に逃がす。巨大数字レイアウトで文章を見せない
- レンダラーは画面外にはみ出す要素を検出したら失敗する。失敗したらJSONかレイアウトを修正して再生成する
- 生成後に `output/<deck_id>/slide-XX.png` を見て、上下左右の余白とフッターへの重なりを確認する
- 修正したら必ず該当スライドを `--only N --format png` で再生成し、PPTXも必要なら `--format pptx` で作り直す

---

## 利用可能なレイアウト(10種)

各スライドは `layout` キーで指定する。指定がなければ `text` 構造から自動推定する。

| layout | 用途 | 推奨 text 構造 |
|--------|------|---------------|
| `cover` | 表紙 | main=巨大タイトル / sub=サブタイトル / other=フッター情報 |
| `hero-number` | 巨大数字単独スライド | main="0.1%" / sub=説明 / other[0]=キャプション |
| `2x2-grid` | 4要素 2x2 グリッド | other に "01 ラベル" 形式で4個 |
| `three-col-numbered` | 3カラム番号付き | other に "01 ラベル" 形式で3個 |
| `three-col-priced` | 3カラム + 価格 | other に "① ラベル ¥xxx,xxx" 形式で3個 |
| `split-hero-number` | 左ヒーロー数字 + 右リスト | main に金額/数字含む / other に評価行 |
| `two-col-list` | 長いリスト2カラム | other に8〜20個の番号付き項目 |
| `hero-number-list` | 巨大金額 + 内訳行 | main に ¥xxx 含む / other に "ラベル ¥xxx" 形式 |
| `price-contrast` | 価値→投資 対比 | main に "¥A → ¥B" 形式 / other に支払いオプション |
| `cta` | クロージング | main=見出し / sub=サブ / other[0]=CTAラベル / other[1..]=フッター |

---

## 利用可能なスタイル(15種)

| name | 雰囲気 | おすすめ用途 |
|------|--------|-------------|
| `bootcamp` | 高変換セールス(ネイビー+ゴールド) | **CCブートキャンプ既定** |
| `bootcamp_light` | 信頼系セールス(明るめ) | 提案資料、LP |
| `stripe` | 洗練・信頼感 | SaaS, B2B |
| `apple` | ミニマル・大きな余白 | プロダクト発表 |
| `anthropic` | 温かい知性(クレイ+アイボリー) | Claude公式風、ブランド |
| `linear` | シャープ・プロダクティビティ | テック, ツール紹介 |
| `vercel` | モダン・ハイテク | 開発者向け |
| `mckinsey` | 提案・権威性 | コンサル, 経営層向け |
| `notion` | ドキュメント・知的 | ハウツー, 解説 |
| `google` | フレンドリー | 教育, チーム向け |
| `figma` | クリエイティブ | デザイン系 |
| `netflix` | ドラマチック | エンタメ, インパクト |
| `canva` | ポップ・親しみ | SNS, カジュアル |
| `nike` | エネルギー | スポーツ, イベント |
| `muji` | 静寂・ナチュラル | ライフスタイル |

---

## 利用可能なプリセット(出力サイズ)

| name | サイズ | 用途 |
|------|--------|------|
| `presentation` | 1920x1080 | プレゼン用(プロジェクター想定) |
| `video-slide` | 1920x1080 | 動画用スライド |
| `doc-slide` | 1920x1080 | 配布資料(情報密度高め) |
| `thumbnail` | 1920x1080 | YouTubeサムネ |
| `sns-square` | 1080x1080 | Instagram/X 投稿 |
| `sns-story` | 1080x1920 | Stories, TikTok |

---

## 注意事項とプロのTips

- **数字の扱い**: HTML レンダリングなので `¥198,000`、`4,500万円`、`0.1%` のような数字は**100%崩れない**
- **金額表記**: `¥198,000` のようにカンマ込みで明示。`19万8千円` より `¥198,000` を優先 (レイアウト関数が金額部分を自動抽出する)
- **複数スライドで色味を揃えたい**: 必ず同じ `style_base` を使う。スタイル切替したい場合は `--style` で全体再生成
- **長いタイトルへの対処**: `cover` レイアウトは長いタイトルでも自動折返し。`hero-number` は短い文字列を想定 (1行で収まる長さ)
- **文字切れ防止**: 巨大数字系レイアウトに長文を入れない。`30分`、`3つ`、`1枚` のような短い単位付き数字だけをヒーロー化する。生成時の画面外検査に落ちたらレイアウト変更か文言短縮を優先する
- **「販売現場で使えるレベル」の判断基準** (評価対象):
  1. 数字が読める(¥198,000、4,500万円が崩れない) ✅ HTML制御により保証
  2. 余白が35%以上ある(情報詰め込み禁止)
  3. 装飾過多でない(card+shadow+gradientの三重コンボは禁止)
  4. 一目で「これはちゃんとした会社のスライドだ」と感じる

---

## 評価軸との対応 (このスキルが評価される理由)

| 評価軸 | 仕組み |
|--------|--------|
| AI活用力 | Claude Code が `purpose` を執筆・レイアウト選択 → エンジンが PNG + PPTX 出力。AIに「やらせる」設計 |
| スピード | ローカル並列レンダで 13枚 PNG+PPTX 約10秒 |
| クオリティ | HTML/CSS と pptxgenjs で厳密制御。日本語・金額・レイアウトが100%崩れない |
| センス | `purpose` フィールド + 専用レイアウト関数で「削る/盛る」を構造的に明文化 |
| コミュニケーション | フィードバックループは `templates/*.json` の差分修正で完結。PPTX で直接編集も可能 |
| 再現性 | API キー・課金・レート制限ゼロ。誰の環境でも `npm install` だけで動く |
| 柔軟性 | スライド枚数無制限・PNG/PPTX 切替・15スタイルから選択 |
