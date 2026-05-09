# cc-slides-pro

Claude Code に話しかけるだけで、スライドを **PNG 画像** と **編集できる PowerPoint ファイル(PPTX)** で作れるツールです。

プログラミング経験がなくても、下の手順どおりに進めれば使えます。外部 API キー、クレジットカード登録、追加課金は不要です。

## これで何ができますか？

- スライド画像をまとめて作れます
- PowerPoint / Keynote / Google Slides で編集できる PPTX を作れます
- Claude Code に「この内容でスライドを作って」と頼めます
- すでに用意されているテンプレートから、すぐにサンプルを生成できます

## まず必要なもの

最初に、次の2つを用意してください。

| 必要なもの | 何に使うか | 入手先 |
|---|---|---|
| Node.js | スライドを作るための実行環境 | https://nodejs.org/ |
| Claude Code | AI に作業を頼むためのツール | https://docs.anthropic.com/claude-code |

Node.js は **LTS** と書かれている版を選んでください。

Claude Code を使わず、手動コマンドだけで生成することもできます。その場合も Node.js は必要です。

## いちばん簡単な始め方

### 1. このプロジェクトをダウンロードする

GitHub の画面で、次の順番にクリックします。

1. 緑色の **Code** ボタンをクリック
2. **Download ZIP** をクリック
3. ダウンロードした ZIP ファイルを開く
4. 出てきたフォルダを、わかりやすい場所に移動する

例:

- Mac: `Downloads` や `Documents`
- Windows: `ダウンロード` や `ドキュメント`

### 2. ターミナルを開く

Mac の場合:

1. `ターミナル` アプリを開く
2. プロジェクトのフォルダをターミナルにドラッグします
3. 表示されたパスの前に `cd ` を付けて Enter を押します

例:

```bash
cd /Users/your-name/Downloads/cc-slides-pro
```

Windows の場合:

1. プロジェクトのフォルダを開く
2. フォルダ内の何もない場所で右クリック
3. **ターミナルで開く** または **PowerShell で開く** を選びます

### 3. 初回だけ準備する

ターミナルで次を入力して Enter を押します。

```bash
npm install --prefix engine
```

`engine` は「スライドを作るプログラムが入っているフォルダ名」です。コマンドはそのままコピーすれば大丈夫です。

初回は Chromium というブラウザ部品をダウンロードするため、少し時間がかかります。

### 4. サンプルスライドを作る

次を入力して Enter を押します。

```bash
node engine/render.js --template cc-bootcamp
```

完了すると、次の場所にファイルができます。

```text
output/cc-bootcamp/
```

中には次のようなファイルが入っています。

```text
slide-01.png
slide-02.png
...
cc-bootcamp.pptx
```

`slide-01.png` などは画像ファイルです。`cc-bootcamp.pptx` は PowerPoint などで編集できます。

## Claude Code で使う方法

Claude Code を開いて、このプロジェクトのフォルダで作業します。

初めて使うときは、次のように話しかけてください。

```text
初めてです。セットアップからサンプルスライド作成まで案内して
```

Claude Code がこのプロジェクトを見つけたら、Mac か Windows か、Node.js が入っているか、初回準備が終わっているかを確認しながら進めます。まだ何も設定していない場合でも、上の「いちばん簡単な始め方」と同じ流れで案内できます。

準備が終わっている場合は、次のように依頼してください。

```text
Claude Code初心者向けの説明スライドを作って
```

```text
自社サービスの営業資料を10枚で作って。PPTXも欲しい
```

```text
3枚目だけ、もっと初心者向けの言葉に直して
```

このプロジェクトには Claude Code 用の説明ファイル `CLAUDE.md` が入っています。Claude Code はその内容を見ながら、テンプレート編集やスライド生成を進められます。

### 初めての人に伝える最短ルート

パソコン操作に慣れていない人は、まず次の3つだけ覚えれば大丈夫です。

1. `npm install --prefix engine` は初回準備
2. `node engine/render.js --template cc-bootcamp` はサンプル作成
3. 完成ファイルは `output/cc-bootcamp/` に入る

Windows でも Mac でも、コマンドは同じです。違うのは、ターミナルの開き方だけです。

## すでに入っているテンプレート

| テンプレート名 | 内容 | 生成コマンド |
|---|---|---|
| `cc-bootcamp` | 10枚のサンプルスライド | `node engine/render.js --template cc-bootcamp` |
| `cc-bootcamp-extended` | 13枚の長めのサンプル | `node engine/render.js --template cc-bootcamp-extended` |
| `cc-bootcamp-evaluation-30` | 評価タスク提出向けの30枚販売スライド | `node engine/render.js --template cc-bootcamp-evaluation-30` |
| `claude-code-organization-beginner` | Claude Code 組織導入の初心者向け資料 | `node engine/render.js --template claude-code-organization-beginner` |

## よく使うコマンド

PNG と PPTX の両方を作る:

```bash
node engine/render.js --template cc-bootcamp
```

PNG 画像だけ作る:

```bash
node engine/render.js --template cc-bootcamp --format png
```

PPTX だけ作る:

```bash
node engine/render.js --template cc-bootcamp --format pptx
```

3枚目だけ画像を作り直す:

```bash
node engine/render.js --template cc-bootcamp --only 3 --format png
```

デザインの雰囲気を変える:

```bash
node engine/render.js --template cc-bootcamp --style anthropic
```

## 自分用のスライドを作る流れ

1. `templates` フォルダの中にある JSON ファイルをコピーします
2. ファイル名を変えます  
   例: `my-service.json`
3. 中の文章を自分の内容に書き換えます
4. 次のコマンドで生成します

```bash
node engine/render.js --template my-service
```

テンプレート名に `.json` は付けません。

## フォルダの意味

```text
cc-slides-pro/
├── README.md       この説明書
├── CLAUDE.md       Claude Code に読ませる詳しい作業ルール
├── templates/      スライドの元データ
├── engine/         スライド作成プログラム
└── output/         作られた画像とPPTXの保存先
```

普段よく触るのは `templates` と `output` です。`engine` は基本的に触らなくて大丈夫です。

## 困ったとき

### `node` が見つからないと言われる

Node.js が入っていない、またはターミナルを開き直す必要があります。

1. https://nodejs.org/ から Node.js の LTS 版を入れる
2. ターミナルを閉じる
3. もう一度ターミナルを開く
4. 再度コマンドを実行する

### `npm install` に時間がかかる

初回だけ必要なブラウザ部品をダウンロードします。数分かかることがあります。

### 生成したファイルが見つからない

`output` フォルダを開いてください。テンプレート名と同じ名前のフォルダの中に出力されます。

例:

```text
output/cc-bootcamp/
```

### PowerPoint で文字を直したい

`.pptx` ファイルを PowerPoint / Keynote / Google Slides で開いてください。文字は画像ではなく、編集できるテキストとして入っています。

## このツールの特徴

- API キー不要
- 追加課金なし
- ローカル環境で動作
- PNG と PPTX を同時出力
- スライド枚数の制限なし
- PowerPoint / Keynote / Google Slides で編集可能

## ライセンス

MIT
