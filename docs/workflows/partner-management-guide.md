# パートナー管理完全ガイド

**作成日**: 2025-10-05
**対象**: マネージャー・開発者
**目的**: パートナー情報の一元管理・yumesutaHP更新フロー

---

## 📋 目次

1. [システム概要](#システム概要)
2. [画像管理フロー](#画像管理フロー)
3. [パートナー追加手順](#パートナー追加手順)
4. [SEO・LLMO最適化](#seo・llmo最適化)
5. [トラブルシューティング](#トラブルシューティング)

---

## システム概要

### データフロー

```
Google Sheets（マネジメントシステム）
    ↓ マスターデータ
    ├─ パートナー基本情報
    ├─ 画像URL（Xserver上）
    └─ SEO・LLMO用メタデータ

    ↓ スタートプロンプト実行

yumesutaHP（表示サイト）
    ├─ partners-database.ts
    ├─ partner-data.ts
    ├─ page.tsx (TOPページ)
    └─ company-data.ts

マネジメントシステムダッシュボード
    └─ 同じ画像URLを参照
```

### 重要な設計方針

#### 1. **画像一元管理**
- すべての画像をXserver（https://yumesuta.com/partner-images/）に配置
- Google Sheetsに画像URLを保存
- マネジメントシステム・yumesutaHP共に**同じURL**を参照
- **一貫性が完璧に保たれる**

#### 2. **SEO・LLMO最適化**
- 画像ファイル名: 英語・AI認識向け（例: `marutomo-logo.svg`）
- alt属性: 詳細・文脈含む（例: `株式会社マルトモロゴ - ゆめスタパートナー・鋳物製造業`）
- 構造化データ: Person/Organization schema自動生成

#### 3. **データマスター**
- **Google Sheets = 唯一の真実**
- yumesutaHPは読み取り専用・表示のみ
- 更新は全てGoogle Sheetsで実施

---

## 画像管理フロー

### ディレクトリ構造

```
yumesuta-management-system/
└── public/
    └── partner-images/
        ├── raw/                    # 受領画像（リネーム前）
        │   ├── 新規企業ロゴ.png
        │   ├── 社長写真.jpg
        │   └── qr_code.png
        │
        └── processed/              # リネーム後（アップロード用）
            ├── pertnerlogo/
            │   └── marutomo-logo.svg
            ├── yumestapertner/
            │   └── marutomo-yusuke-nishimi.avif
            └── qr/
                └── marutomo-qr.png
```

### 画像命名規則

#### ロゴ画像
```
{企業ID}-logo.{拡張子}

例:
- marutomo-logo.svg
- ichimura-logo.svg
- inagaki-logo.png
```

#### 代表者写真
```
{企業ID}-{代表者英語名}.avif

例:
- marutomo-yusuke-nishimi.avif
- ichimura-kazuhiko-wakayama.avif
```

#### QRコード
```
{企業ID}-qr.png

例:
- marutomo-qr.png
- ichimura-qr.png
```

### 推奨ファイル形式（SEO・LLMO最適化）

| 用途 | 推奨形式 | 理由 | サイズ目安 |
|------|---------|------|-----------|
| ロゴ | `.svg` | ベクター・無限拡大・AI認識良 | 10-30KB |
| ロゴ（写真） | `.avif` | 次世代形式・高圧縮・高画質 | 2-10KB |
| 代表者写真 | `.avif` | 次世代形式・高圧縮・高画質 | 4-12KB |
| QRコード | `.png` | 互換性・透過対応 | 300-600B |

---

## パートナー追加手順

### Step 1: Google Sheetsに基本情報入力

**パートナーDBシート**に以下を入力:

| 列名 | 内容 | 例 |
|------|------|-----|
| 企業ID | 英語・小文字・ハイフンのみ | `marutomo` |
| 企業名 | 正式名称 | `株式会社マルトモ` |
| 企業英語名 | 英語正式名称 | `Marutomo Co., Ltd.` |
| 代表者名 | フルネーム | `錦見裕介` |
| 代表者英語名 | ローマ字 | `Yusuke Nishimi` |
| 役職 | 役職名 | `代表取締役` |
| パートナータイプ | 契約種別 | `ゆめスタパートナー` |
| カテゴリ | 分類 | `corporation` |
| WebサイトURL | 公式サイト | `https://marutomo-imono.com` |
| 業種 | 業種・業態 | `鋳物製造業` |
| 所在地 | 都道府県・市区町村 | `愛知県春日井市` |
| 設立年 | 創業年 | `1950` |
| 従業員数 | 人数 | `50名` |
| 事業内容 | 50文字程度 | `鋳物製品の製造・販売...` |
| 企業理念 | 100文字程度 | `ものづくりを通じて...` |
| パートナーメッセージ | 応援メッセージ | `若者を応援したい...` |
| 元画像_ロゴ | 受領ファイル名 | `新規企業ロゴ.png` |
| 元画像_代表者 | 受領ファイル名 | `社長写真.jpg` |
| 元画像_QR | 受領ファイル名 | `qr_code.png` |

**画像URL列は空欄のまま**（スクリプトが自動入力）

### Step 2: 画像準備・リネーム

#### 2-1. 画像を配置
```bash
# 受領した画像を raw/ フォルダに配置
cp 新規企業ロゴ.png /mnt/c/yumesuta-management-system/public/partner-images/raw/
cp 社長写真.jpg /mnt/c/yumesuta-management-system/public/partner-images/raw/
cp qr_code.png /mnt/c/yumesuta-management-system/public/partner-images/raw/
```

#### 2-2. リネーム・配置スクリプト実行
```bash
cd /mnt/c/yumesuta-management-system
node scripts/process-partner-images.js
```

**スクリプトが自動実行**:
1. Google Sheetsからデータ取得
2. raw/から画像読み込み
3. 命名規則に従ってリネーム
4. processed/に配置
5. 画像URLをGoogle Sheetsに保存

**実行結果例**:
```
🚀 パートナー画像処理を開始します...

📦 処理中: 株式会社マルトモ (marutomo)
✅ 新規企業ロゴ.png → marutomo-logo.svg
✅ 社長写真.jpg → marutomo-yusuke-nishimi.avif
✅ qr_code.png → marutomo-qr.png

📝 Google Sheetsに画像URLを保存中...
✅ 1件のURLを保存しました

🎉 画像処理が完了しました！

📤 次のステップ:
1. public/partner-images/processed/ フォルダを確認
2. Xserverの /partner-images/ にアップロード
3. スタートプロンプトを実行してyumesutaHPを更新
```

### Step 3: Xserverにアップロード

#### 方法A: FTPクライアント（推奨）
```
1. FileZilla等でXserverに接続
2. /partner-images/ ディレクトリ作成（初回のみ）
3. processed/ フォルダの中身を一括アップロード
   - pertnerlogo/
   - yumestapertner/
   - qr/
```

#### 方法B: Xserver管理画面
```
1. Xserverファイルマネージャーにログイン
2. /public_html/partner-images/ に移動
3. processed/ フォルダの中身をアップロード
```

**確認**: https://yumesuta.com/partner-images/pertnerlogo/marutomo-logo.svg にアクセスして画像表示確認

### Step 4: yumesutaHP更新（スタートプロンプト実行）

#### 4-1. スタートプロンプトをコピー

[update-yumesutahp-partners-prompt.md](./update-yumesutahp-partners-prompt.md) の「スタートプロンプト（コピペ用）」をコピー

#### 4-2. Claude Codeに貼り付け・実行

Claude Codeが自動実行:
1. Google Sheetsからデータ取得
2. 既存データとの差分検出
3. 以下のファイルを更新:
   - `/mnt/c/yumesutaHP/src/data/partners-database.ts`
   - `/mnt/c/yumesutaHP/src/app/partners/partner-data.ts`
   - `/mnt/c/yumesutaHP/src/app/page.tsx` (partnerLogos配列)
   - `/mnt/c/yumesutaHP/src/app/companies/company-data.ts`（企業ページありの場合）
4. SEO・LLMO最適化チェック
5. 変更内容レポート

#### 4-3. 確認・デプロイ

```bash
# yumesutaHPで開発サーバー起動
cd /mnt/c/yumesutaHP
npm run dev

# ブラウザで確認
# - TOPページ: パートナーロゴ表示確認
# - パートナーページ: 一覧・詳細確認
# - 画像表示確認
```

問題なければコミット・デプロイ

---

## SEO・LLMO最適化

### alt属性最適化

#### ロゴ画像
```html
<!-- 悪い例 -->
<img alt="マルトモロゴ" ... />

<!-- 良い例（AI理解向け） -->
<img alt="株式会社マルトモ（Marutomo）企業ロゴ - ゆめスタパートナー・鋳物製造業" ... />
```

#### 代表者写真
```html
<!-- 悪い例 -->
<img alt="錦見様" ... />

<!-- 良い例（AI理解向け） -->
<img alt="錦見裕介氏（株式会社マルトモ代表取締役）- ゆめスタパートナー" ... />
```

### 構造化データ（JSON-LD）

スタートプロンプト実行時に以下を自動生成:

#### Person Schema（代表者）
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "錦見裕介",
  "givenName": "裕介",
  "familyName": "錦見",
  "alternateName": "Yusuke Nishimi",
  "jobTitle": "代表取締役",
  "worksFor": {
    "@type": "Organization",
    "@id": "https://yumesuta.com/partners/marutomo#organization"
  },
  "image": "https://yumesuta.com/partner-images/yumestapertner/marutomo-yusuke-nishimi.avif",
  "url": "https://marutomo-imono.com"
}
```

#### Organization Schema（企業）
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://yumesuta.com/partners/marutomo#organization",
  "name": "株式会社マルトモ",
  "alternateName": "Marutomo Co., Ltd.",
  "legalName": "株式会社マルトモ",
  "url": "https://marutomo-imono.com",
  "logo": "https://yumesuta.com/partner-images/pertnerlogo/marutomo-logo.svg",
  "image": "https://yumesuta.com/partner-images/yumestapertner/marutomo-yusuke-nishimi.avif",
  "description": "鋳物製造業を営む愛知県の企業。若者の成長を応援し、高校新卒採用に積極的。",
  "foundingDate": "1950",
  "numberOfEmployees": "50名",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "愛知県",
    "addressLocality": "春日井市"
  },
  "memberOf": {
    "@type": "Organization",
    "name": "ゆめスタパートナー",
    "url": "https://yumesuta.com"
  }
}
```

### LLMO効果

上記の最適化により:
- ✅ ChatGPT/Claude/Geminiが企業・人物を正確に理解
- ✅ AI検索結果に表示されやすくなる
- ✅ AI引用時に正確な情報が参照される
- ✅ 企業間の関係性（パートナーシップ）をAIが理解

---

## トラブルシューティング

### 画像が表示されない

#### 原因1: Xserverアップロード未完了
```bash
# 確認
curl -I https://yumesuta.com/partner-images/pertnerlogo/marutomo-logo.svg

# 200 OKが返ればOK
# 404 Not Foundなら未アップロード
```

**対処**: Step 3を再実行

#### 原因2: 画像URL誤り
```bash
# Google Sheetsの画像URL列を確認
# 正しいURL: https://yumesuta.com/partner-images/pertnerlogo/marutomo-logo.svg
```

**対処**: process-partner-images.js を再実行

### スクリプトエラー

#### エラー: "PARTNERS_SPREADSHEET_ID is not defined"
```bash
# .env.local確認
cat .env.local | grep PARTNERS_SPREADSHEET_ID

# 未設定なら追加
echo "PARTNERS_SPREADSHEET_ID=your_spreadsheet_id" >> .env.local
```

#### エラー: "Image not found in raw/"
```bash
# raw/フォルダ確認
ls public/partner-images/raw/

# 該当ファイルがなければ配置
cp 新規企業ロゴ.png public/partner-images/raw/
```

### 差分が検出されない

#### 原因: シート名・範囲指定誤り
```javascript
// scripts/process-partner-images.js 確認
const RANGE = 'パートナーDB!A2:Z100';

// 実際のシート名と一致するか確認
```

**対処**: スクリプト内の RANGE を修正

---

## まとめ

### パートナー追加フロー（再掲）

```
1. Google Sheetsに基本情報入力
   ↓
2. 画像をraw/に配置
   ↓
3. node scripts/process-partner-images.js 実行
   ↓
4. processed/をXserverにアップロード
   ↓
5. スタートプロンプト実行
   ↓
6. yumesutaHP更新完了 ✅
```

### 重要なポイント

- ✅ **画像一元管理**: Xserver1箇所・全システムが参照
- ✅ **SEO・LLMO最適化**: 自動適用・AI認識向上
- ✅ **データ一貫性**: Google Sheetsがマスター
- ✅ **効率化**: スクリプト・プロンプトで自動化
- ✅ **抜けもれ防止**: チェック機能内蔵

---

**作成者**: Claude Code
**最終更新**: 2025-10-05
**関連ドキュメント**:
- [update-yumesutahp-partners-prompt.md](./update-yumesutahp-partners-prompt.md)
- [process-partner-images.js](../../scripts/process-partner-images.js)
