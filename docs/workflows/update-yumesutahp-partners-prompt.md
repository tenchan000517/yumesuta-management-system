# yumesutaHP パートナーデータ更新 - スタートプロンプト

**作成日**: 2025-10-05
**用途**: Google Sheetsからパートナーデータを取得してyumesutaHPを更新
**前提**: 画像処理スクリプト実行済み・Xserverアップロード済み

---

## 📋 使用タイミング

- マネジメントシステム（Google Sheets）でパートナー情報を更新した後
- yumesutaHPに反映したい時

---

## 🚀 スタートプロンプト（コピペ用）

```
# yumesutaHP パートナーデータ更新

以下の手順でyumesutaHPのパートナーデータを更新してください。

## 前提確認
1. 画像処理スクリプト実行済み（node scripts/process-partner-images.js）
2. Google Sheetsに画像URLが保存済み
3. Xserverに画像アップロード済み（https://yumesuta.com/partner-images/）

## 実行手順

### Step 1: データ取得・差分検出
1. Google Sheets（PARTNERS_SPREADSHEET_ID）の「パートナーDB」シートからデータ取得
2. yumesutaHPの既存データを読み込み:
   - /mnt/c/yumesutaHP/src/data/partners-database.ts
   - /mnt/c/yumesutaHP/src/app/partners/partner-data.ts
   - /mnt/c/yumesutaHP/src/app/page.tsx (partnerLogos配列)
3. 差分を検出して報告:
   - 新規追加が必要なパートナー
   - 更新が必要な既存パートナー
   - 削除が必要なパートナー（isActive: false）

### Step 2: SEO・LLMO最適化チェック
以下を確認:
- [ ] 画像URLがGoogle Sheetsから正しく取得できているか
- [ ] alt属性用データが揃っているか（企業名、代表者名、業種）
- [ ] Person/Organization schema用データが揃っているか
- [ ] ファイル名が命名規則に従っているか

### Step 3: ファイル更新
以下のファイルを更新:

#### 1. partners-database.ts
```typescript
{
  id: '{企業ID}',
  companyName: '{企業名}',
  representativeName: '{代表者名}',
  jobTitle: '{役職}',
  partnerType: '{パートナータイプ}',
  fee: {料金},
  hasMessage: {メッセージあり/なし},
  hasInterview: {インタビューあり/なし},
  isDisplayedOnTop: true,
  isDisplayedOnPartners: true,
  isDisplayedOnSNS: false,
  isActive: true,
  hasContract: {契約状況},
  displayOrder: {表示順序},
  websiteUrl: '{WebサイトURL}',
  logoImage: '{SheetsのロゴURL}',  // ← 重要: Sheetsから取得
  representativeImage: '{Sheetsの代表者写真URL}',  // ← 重要: Sheetsから取得
  qrCode: '{SheetsのQR_URL}',  // ← 重要: Sheetsから取得
  category: '{カテゴリ}',
  hasCompanyPage: {企業ページあり/なし},
  companyPageSlug: '{企業ページスラッグ}',
  message: '{パートナーメッセージ}'
}
```

#### 2. partner-data.ts（簡易版）
```typescript
{
  id: '{企業ID}',
  name: '{代表者名}様',
  organization: '{企業名}',
  jobTitle: '{役職}',
  category: '{カテゴリ}',
  image: '{Sheetsの代表者写真URL}',  // ← 重要: Sheetsから取得
  message: '{パートナーメッセージ}'
}
```

#### 3. page.tsx (partnerLogos配列)
```typescript
{
  name: '{企業名}',
  filename: '{ロゴファイル名}',  // URLから抽出
  alt: '{企業名}ロゴ - ゆめスタパートナー・{業種}',  // SEO最適化
  url: '{WebサイトURL}'
}
```

#### 4. company-data.ts（企業ページありの場合のみ）
```typescript
{
  id: '{企業ID}',
  name: '{企業名}',
  slug: '{企業ページスラッグ}',
  description: '{企業説明}',
  link: '/companies/{slug}',
  image: '{企業ページhero画像URL}',
  industry: '{業種}',
  location: '{所在地}'
}
```

### Step 4: 画像URL処理の注意点
- Google Sheetsの「ロゴURL」「代表者写真URL」「QR_URL」列の値をそのまま使用
- yumesutaHPの `/public/img/` にコピー不要（外部URL参照）
- マネジメントシステムも同じURLを参照するため一貫性が保たれる

### Step 5: 変更内容レポート
以下を報告:
- ✅ 追加されたパートナー: ○件（企業名リスト）
- ✅ 更新されたパートナー: ○件（企業名リスト）
- ✅ 削除されたパートナー: ○件（企業名リスト）
- ✅ 更新されたファイル: ○個（ファイル名リスト）
- ⚠️ 警告・注意事項（あれば）

## 実行後の確認事項
1. yumesutaHPの開発サーバーで表示確認
2. 画像が正しく表示されるか確認
3. alt属性が最適化されているか確認
4. 構造化データが生成されているか確認（必要に応じて）

## トラブルシューティング
- 画像が表示されない → Xserverアップロード確認
- URLが間違っている → Google Sheetsの画像URL列を確認
- 差分が検出されない → PARTNERS_SPREADSHEET_ID確認
```

---

## ⚠️ 重要な注意事項

### 画像URL参照方式
- yumesutaHPは **Google Sheetsの画像URLを直接参照**
- `/public/img/` への画像配置は**不要**
- マネジメントシステムとyumesutaHPが**同じURLを参照**するため一貫性が保たれる

### SEO・LLMO最適化
- alt属性は「{企業名}ロゴ - ゆめスタパートナー・{業種}」形式
- 代表者写真は「{代表者名}氏（{企業名}{役職}）- ゆめスタパートナー」形式
- AI が「誰の」「何の」画像か理解できるよう詳細に記述

### データ一貫性
- マスターDB: Google Sheets（マネジメントシステム）
- yumesutaHP: Google Sheetsから取得したデータを表示
- 画像: Xserver上の1つの場所に保存・全システムが参照

---

## 📊 Google Sheets構造（参考）

| 企業ID | 企業名 | 代表者名 | 役職 | パートナータイプ | 元画像_ロゴ | 元画像_代表者 | 元画像_QR | ロゴURL | 代表者写真URL | QR_URL |
|--------|--------|----------|------|----------------|------------|--------------|----------|---------|--------------|--------|
| marutomo | 株式会社マルトモ | 錦見裕介 | 代表取締役 | ゆめスタパートナー | logo.png | president.jpg | qr.png | https://yumesuta.com/partner-images/pertnerlogo/marutomo-logo.svg | https://yumesuta.com/partner-images/yumestapertner/marutomo-yusuke-nishimi.avif | https://yumesuta.com/partner-images/qr/marutomo-qr.png |

**URL列は自動生成**（process-partner-images.js実行時）

---

## 🔄 フロー全体図

```
【事前準備（1回のみ）】
1. 画像を /public/partner-images/raw/ に配置
2. node scripts/process-partner-images.js 実行
3. processed/ フォルダをXserverにアップロード

【パートナー追加時】
1. Google Sheetsにデータ入力
2. 上記の事前準備を実行（画像がある場合）
3. このスタートプロンプトを実行
4. yumesutaHP更新完了
```

---

**作成者**: Claude Code
**最終更新**: 2025-10-05
