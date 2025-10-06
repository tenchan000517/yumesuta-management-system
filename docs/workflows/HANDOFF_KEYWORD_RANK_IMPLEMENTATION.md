# キーワード順位機能 実装引き継ぎドキュメント

**作成日**: 2025-10-06
**重要度**: ★★★★★
**ステータス**: 🔴 実装途中・動作未確認・エラー発生中
**次世代担当者**: このドキュメントを最初から最後まで読んでから作業開始

---

## 🚨 現在の問題

### エラー内容
```
Export updateSheetData doesn't exist in target module
./lib/cache/sheets-rank-cache.ts:18:1
```

### 原因
- `lib/google-sheets.ts` に `updateSheetData` 関数を追加した
- しかしTurbopackのキャッシュが残っている
- `.next` フォルダを削除したが、まだエラーが出る

### 試したこと
1. ✅ `updateSheetData` 関数を `lib/google-sheets.ts:129-151` に追加済み
2. ✅ `.next` フォルダを削除
3. ✅ Next.jsプロセスをkill
4. ❌ まだエラーが出る

---

## 📋 実装した内容

### 1. Google Sheetsをキャッシュとして使用する仕組み

**目的**: Custom Search APIの課金を防ぐため、キーワード順位をGoogle Sheetsに保存

**スプレッドシート**:
- ID: `TASKS_SPREADSHEET_ID` (1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k)
- シート名: `キーワード順位`
- URL: https://docs.google.com/spreadsheets/d/1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k/edit?gid=1417720552

**列構成**:
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| キーワード | 順位 | URL | 最終更新日時 | 前回順位 | 変動 | 目標順位 | 優先度 |

**初期データ**: 8つの重要キーワードが既に入力済み
- ゆめスタ (目標1位, high)
- ゆめマガ (目標5位, high)
- 高校生 就職 愛知 (目標10位, high)
- 就活情報誌 (目標15位, medium)
- 高卒採用 三重 (目標20位, medium)
- 高校生 就職情報誌 (目標15位, medium)
- 愛知 高校生 求人 (目標20位, medium)
- 東海 高校生 就職 (目標30位, low)

---

### 2. 実装したファイル

#### ✅ `lib/cache/sheets-rank-cache.ts` (新規作成)
- Google Sheetsからキャッシュを読み込む: `loadRankCacheFromSheets()`
- Google Sheetsにキャッシュを保存: `saveRankCacheToSheets()`
- 特定キーワードを更新: `updateKeywordRankInSheets()`

#### ✅ `lib/google-custom-search.ts` (新規作成)
- Custom Search APIで検索順位を取得: `getSearchRank()`
- 複数キーワードを一括取得: `getBatchSearchRanks()`
- **課金防止機能**:
  - Sheetsにデータがあれば絶対にAPIを叩かない
  - APIを叩く場合は500ms間隔で順次実行
  - 結果をSheetsに自動保存

#### ✅ `lib/google-sheets.ts` (関数追加)
- `updateSheetData()` を追加 (129-151行目)
- Sheetsのデータを上書き更新する関数

#### ✅ `app/api/analytics/route.ts` (修正)
- Custom Search APIを使用するように変更 (183-187行目)
- `getBatchSearchRanks()` にスプレッドシートIDを渡す

#### ✅ `app/dashboard/analytics/page.tsx` (UI修正)
- キャッシュ警告を表示 (477-491行目)
- 「⚠️ 24時間キャッシュ（課金防止）」
- 「Custom Search API使用: 更新ボタンを押すと8クエリ消費」

#### ✅ `docs/setup/google-custom-search-setup.md` (新規作成)
- Custom Search APIのセットアップ手順
- APIキー取得方法
- プログラマブル検索エンジン作成方法

#### ✅ `app/api/test-sheets-list/route.ts` (テスト用API)
- スプレッドシートのシート一覧を取得
- 動作確認済み

---

## 🔧 次世代担当者がすべきこと

### Step 1: エラー解決

**問題**: `updateSheetData` がインポートできない

**試すべきこと**:

1. **ファイルの存在確認**:
```bash
grep -n "export async function updateSheetData" /mnt/c/yumesuta-management-system/lib/google-sheets.ts
```
→ 129行目に存在するはず

2. **Turbopackの完全クリア**:
```bash
rm -rf .next
rm -rf node_modules/.cache
killall -9 node 2>/dev/null
npm run dev
```

3. **それでもダメなら、VSCodeを再起動**

4. **最終手段: インポート文を修正**:
```typescript
// lib/cache/sheets-rank-cache.ts の18行目
import { getSheetData } from '@/lib/google-sheets';

// updateSheetData を直接実装（一時的）
async function updateSheetData(spreadsheetId: string, range: string, values: any[][]) {
  const { google } = await import('googleapis');
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}
```

---

### Step 2: Custom Search API セットアップ

**必須**: APIキーがないと動作しません

1. `docs/setup/google-custom-search-setup.md` の手順に従う
2. Google Cloud Console で Custom Search API を有効化
3. APIキーを取得
4. プログラマブル検索エンジンを作成
5. `.env.local` に追加:
```bash
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_here
```

**⚠️ 重要**: セットアップしない場合、キーワード順位は表示されません

---

### Step 3: 動作確認

1. **サーバー起動**:
```bash
npm run dev
```

2. **ダッシュボードにアクセス**:
```
http://localhost:3000/dashboard/analytics
```

3. **更新ボタンをクリック**:
- 初回: Custom Search APIを叩く（8クエリ消費、約$0.04）
- 結果がSheetsに保存される
- 2回目以降: Sheetsから読み込むだけ（課金なし）

4. **Sheetsを確認**:
- https://docs.google.com/spreadsheets/d/1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k/edit?gid=1417720552
- B列（順位）にデータが入っているか確認

---

### Step 4: トラブルシューティング

#### エラー: "Custom Search API not configured"
→ `.env.local` にAPIキーがない
→ Step 2を実施

#### エラー: "Failed to load rank cache from Sheets"
→ スプレッドシートの権限を確認
→ サービスアカウントに閲覧・編集権限があるか

#### キーワード順位が全て999位（ランク外）
→ Custom Search APIのクエリが間違っている可能性
→ 10位以内に見つからない
→ 手動でSheetsに正しい順位を入力してもOK

---

## 📊 データフロー

```
ダッシュボード「更新」ボタン
  ↓
app/api/analytics/route.ts
  ↓
lib/google-custom-search.ts: getBatchSearchRanks()
  ↓
[Sheetsをチェック]
  ├─ データあり → Sheetsから返す（APIを叩かない）
  └─ データなし → Custom Search APIを叩く
       ↓
     getSearchRank() × 8回（500ms間隔）
       ↓
     結果をSheetsに保存
       ↓
     ダッシュボードに表示
```

---

## ⚠️ 重要な注意事項

### 課金について
- Custom Search API: 1日100クエリまで無料
- 101クエリ目以降: $5/1000クエリ
- **この実装では8クエリ/回**
- 1日1回更新なら月240クエリ（無料枠超過、約$7/月）

### 開発時の注意
- **Sheetsにデータがあれば絶対にAPIを叩かない**設計
- 開発中は手動でSheetsに順位を入力してもOK
- APIキーを設定しなくても、Sheetsから読み込める

---

## 📝 未実装・改善案

### 未実装
- [ ] 前回順位との比較（データ構造は準備済み、UIは未実装）
- [ ] 順位変動のグラフ表示
- [ ] 手動で順位を入力するUI

### 改善案
- Sheetsに更新日時を記録して、古すぎる場合に警告
- 目標順位未達のキーワードをハイライト（一部実装済み）
- 順位履歴を別シートに保存

---

## 🔗 関連ドキュメント

- `docs/workflows/analytics-data-investigation-results.md` - データ調査結果
- `docs/setup/google-custom-search-setup.md` - Custom Search APIセットアップ手順
- `docs/workflows/HANDOFF_ANALYTICS_DASHBOARD.md` - 元の引き継ぎドキュメント

---

## 🤝 次世代担当者への最後のメッセージ

**エラー解決が最優先です。**

`updateSheetData` のインポートエラーは、Turbopackのキャッシュ問題の可能性が高いです。

最悪の場合、`lib/cache/sheets-rank-cache.ts` の中に `updateSheetData` を直接実装してください（上記のコード参照）。

**その後、必ずCustom Search APIをセットアップしてください。** これがないとキーワード順位機能は意味がありません。

頑張ってください！

---

**作成者**: Claude Code (2025-10-06)
**トークン残量**: 8% (引き継ぎ時点)
**次世代担当者**: [あなたの名前]
**作業開始日**: [記入してください]
