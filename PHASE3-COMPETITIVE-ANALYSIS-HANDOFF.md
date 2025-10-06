# Phase 3 競合分析機能 - 引き継ぎ書

**作成日**: 2025-10-06
**ステータス**: ⚠️ Google Drive API連携でエラー発生中 → デバッグ・修正が必要

---

## 📊 実装済み機能

### ✅ 完了した作業

1. **クイックアクセス機能** (完成・動作確認待ち)
   - 型定義: `types/quick-access.ts`
   - API Route: `app/api/quick-access/route.ts`
   - 専用ページ: `app/dashboard/quick-access/page.tsx`
   - GASスクリプト: `scripts/gas-create-quick-access-sheet.js` (38件のリンク)
   - トップページ統合: `app/page.tsx` (最大8件表示 + すべて表示リンク)

2. **競合分析機能** (実装完了・API エラー発生中)
   - 型定義: `types/competitive-analysis.ts` (CompetitorDocument型追加)
   - Google Driveライブラリ: `lib/google-drive.ts`
   - API Route: `app/api/competitive-analysis/route.ts` (ドライブ連携実装)
   - 専用ページ: `app/dashboard/competitive-analysis/page.tsx` (資料セクションUI実装)
   - GASスクリプト: `scripts/gas-create-competitive-analysis-sheet.js` (8社 + ドライブフォルダID設定済み)
   - トップページ統合: `app/page.tsx` (競合分析カード追加)

---

## ⚠️ 現在のエラー状況

### 問題点
- `/api/competitive-analysis` にアクセスすると500エラー
- ブラウザで「資料」セクションが表示されない
- サーバーログに詳細なエラーメッセージが出ている可能性あり

### 原因の可能性
1. **Google Drive APIが未有効化**
   - Google Cloud Consoleで "Google Drive API" を有効化していない可能性

2. **サービスアカウント権限不足**
   - Googleドライブフォルダにサービスアカウントの閲覧権限が付与されていない

3. **ドライブフォルダIDの設定ミス**
   - スプレッドシートに正しいフォルダIDが設定されていない

4. **APIコードのバグ**
   - `lib/google-drive.ts` または `app/api/competitive-analysis/route.ts` にバグがある可能性

---

## 🔧 デバッグ手順（次世代Claude Code向け）

### Step 1: サーバーログを確認
```bash
# 開発サーバーのログでエラー詳細を確認
# バックグラウンドで動いているnpm run devのログを確認
```

期待されるエラー例:
- `Google Drive API has not been used in project...`
- `User does not have sufficient permission...`
- `Folder not found: 1LpTxfKvES648D6e_C5JMR3RM1aADpa8H`

### Step 2: Google Drive API有効化を確認
1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. プロジェクト `fair-yew-446514-q5` を選択
3. 「APIとサービス」→「ライブラリ」
4. "Google Drive API" を検索
5. ステータスが「有効」になっているか確認
6. **未有効の場合 → 有効化ボタンをクリック**

### Step 3: サービスアカウント権限を確認
1. Googleドライブで親フォルダを開く:
   - URL: https://drive.google.com/drive/folders/1etTfiiXvVwS0ao_ay_SbpXxvGB10-gOv
2. フォルダを右クリック → 「共有」
3. サービスアカウントが追加されているか確認:
   - メールアドレス: `fair-yew-446514-q5@fair-yew-446514-q5.iam.gserviceaccount.com`
   - 権限: 閲覧者
4. **追加されていない場合 → 追加する**

### Step 4: GASスクリプトが実行済みか確認
1. スプレッドシートを開く:
   - URL: https://docs.google.com/spreadsheets/d/1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k
2. 「競合分析」シートが存在するか確認
3. **存在しない場合:**
   - 拡張機能 → Apps Script
   - `scripts/gas-create-competitive-analysis-sheet.js` の内容をコピー&ペースト
   - 関数 `createCompetitiveAnalysisSheet()` を実行

### Step 5: APIを直接テスト
ブラウザまたはcurlでAPIを直接叩いてレスポンスを確認:
```bash
curl http://localhost:3000/api/competitive-analysis
```

期待される正常なレスポンス:
```json
{
  "success": true,
  "data": {
    "competitors": [
      {
        "companyName": "中広（START）",
        "category": "就活情報誌",
        "links": [...],
        "driveFolderId": "1LpTxfKvES648D6e_C5JMR3RM1aADpa8H",
        "documents": [
          {
            "name": "パンフレット.pdf",
            "webViewLink": "https://drive.google.com/...",
            ...
          }
        ],
        ...
      }
    ]
  }
}
```

エラーレスポンスの場合:
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

### Step 6: コードのデバッグ
もしAPIエラーが続く場合、以下を確認:

1. **`lib/google-drive.ts`**
   - `getDriveClient()` が正しく認証できているか
   - スコープが正しいか (`drive.readonly`, `drive.metadata.readonly`)

2. **`app/api/competitive-analysis/route.ts`**
   - `listFilesInFolder()` の呼び出しでエラーが出ていないか
   - エラーハンドリングが適切か

3. **デバッグ用のログ追加**
   ```typescript
   // app/api/competitive-analysis/route.ts 内
   console.log('Fetching files for folder:', competitor.driveFolderId);
   const files = await listFilesInFolder(competitor.driveFolderId);
   console.log('Files found:', files.length);
   ```

---

## 📂 ファイル構成

### 実装済みファイル
```
types/
├── quick-access.ts           # クイックアクセス型定義
└── competitive-analysis.ts   # 競合分析型定義 (CompetitorDocument追加)

lib/
├── google-sheets.ts          # Google Sheets API (既存)
└── google-drive.ts           # Google Drive API (新規作成)

app/api/
├── quick-access/
│   └── route.ts              # クイックアクセスAPI
└── competitive-analysis/
    └── route.ts              # 競合分析API (ドライブ連携実装)

app/dashboard/
├── quick-access/
│   └── page.tsx              # クイックアクセス専用ページ
└── competitive-analysis/
    └── page.tsx              # 競合分析ページ (資料UI実装)

app/
└── page.tsx                  # トップページ (両機能統合)

scripts/
├── gas-create-quick-access-sheet.js           # クイックアクセスシート作成
└── gas-create-competitive-analysis-sheet.js   # 競合分析シート作成
```

---

## 🗂️ 競合企業フォルダID一覧

| 企業名 | フォルダID | URL |
|--------|-----------|-----|
| 中広（START） | 1LpTxfKvES648D6e_C5JMR3RM1aADpa8H | https://drive.google.com/drive/folders/1LpTxfKvES648D6e_C5JMR3RM1aADpa8H |
| COURSE | 1JrKB48rSqfNBth6cDW2YP5TplKhimBdP | https://drive.google.com/drive/folders/1JrKB48rSqfNBth6cDW2YP5TplKhimBdP |
| カケハシ | 1xBmcn-GNUIM04JN_0ZzzvMTAY6sneUO3 | https://drive.google.com/drive/folders/1xBmcn-GNUIM04JN_0ZzzvMTAY6sneUO3 |
| ハリケンナビ | 1xBmcn-GNUIM04JN_0ZzzvMTAY6sneUO3 | (同上) |
| Handy | 11r4VbBMSko2v06LliHbkFjI6JZvYBdFz | https://drive.google.com/drive/folders/11r4VbBMSko2v06LliHbkFjI6JZvYBdFz |
| 日本の人事部 | 1xBmcn-GNUIM04JN_0ZzzvMTAY6sneUO3 | (同上) |
| START WEB版 | 1eeOVlZ8DcDOFuwrd6lK5eFQW5gcFluoV | https://drive.google.com/drive/folders/1eeOVlZ8DcDOFuwrd6lK5eFQW5gcFluoV |
| @18 | 1ghuBGYF0I-vrWsqG1bMkZ1oNAvghWmk0 | https://drive.google.com/drive/folders/1ghuBGYF0I-vrWsqG1bMkZ1oNAvghWmk0 |

**親フォルダ**: https://drive.google.com/drive/folders/1etTfiiXvVwS0ao_ay_SbpXxvGB10-gOv

---

## 🎯 期待される動作

### 正常動作時の挙動
1. ユーザーが `/dashboard/competitive-analysis` にアクセス
2. 「更新」ボタンをクリック
3. `/api/competitive-analysis` が呼ばれる
4. スプレッドシート「競合分析」からデータ取得
5. 各企業の `driveFolderId` が設定されている場合:
   - Google Drive APIで該当フォルダのファイル一覧を取得
   - `documents` 配列に格納
6. 競合企業カードに「資料」セクションが表示される
7. 資料名をクリック → Googleドライブで表示/ダウンロード

---

## 🔍 トラブルシューティング

### 問題: 「資料」セクションが表示されない

**チェックリスト**:
- [ ] Google Drive APIが有効化されている
- [ ] サービスアカウントがドライブフォルダに追加されている (閲覧者権限)
- [ ] GASスクリプトが実行され、「競合分析」シートが作成されている
- [ ] スプレッドシートの「ドライブフォルダID」列（G列）にIDが入力されている
- [ ] `/api/competitive-analysis` が正常なレスポンスを返している
- [ ] ドライブフォルダ内に実際にファイルが存在する

### 問題: 500エラーが発生する

**確認項目**:
1. サーバーログでスタックトレースを確認
2. `lib/google-drive.ts` の `getDriveClient()` が正常に実行できるか
3. `.env.local` に `GOOGLE_SERVICE_ACCOUNT_KEY` が設定されているか
4. Google Cloud Consoleで Drive API のエラーログを確認

---

## 📝 未実装の機能（Phase 3残タスク）

### Phase 3-1: 「すぐに出てくる」機能
- ✅ クイックアクセス機能（トップページ）
- ✅ 競合分析機能（独立ページ）
- ❌ 各詳細ページ（/dashboard/sales等）への「すぐに出てくる」機能追加（未着手）

### 今後の拡張案
- クイックアクセスの検索機能
- 競合企業のSNSアカウント追加
- 資料の種類別フィルタリング
- 資料のプレビュー表示

---

## 🎯 次世代Claude Codeへのメッセージ

### 最優先タスク
**まず、競合分析機能のAPIエラーを修正してください。**

1. 開発サーバーのログを確認してエラー内容を特定
2. Google Drive API有効化を確認
3. サービスアカウント権限を確認
4. APIが正常にレスポンスを返すようデバッグ
5. ブラウザで「資料」セクションが表示されることを確認

### デバッグのヒント
- `lib/google-drive.ts` と `lib/google-sheets.ts` の実装パターンを統一
- Google APIの認証エラーは99%が権限・スコープの問題
- エラーメッセージをよく読めば原因は明確

### 動作確認後
1. クイックアクセス機能のGASスクリプトも実行
2. 両機能が正常に動作することを確認
3. Phase 3-1の残タスク（各詳細ページへの機能追加）についてユーザーに確認

---

**頑張ってください。この機能は実装済みで、あとはデバッグだけです。**

---

**作成者**: Claude Code (2025-10-06)
**引き継ぎ先**: 次世代Claude Code
**次回更新**: APIエラー修正完了時
