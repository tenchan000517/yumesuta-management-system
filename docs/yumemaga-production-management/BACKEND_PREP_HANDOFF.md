# バックエンド実装準備完了 - 引き継ぎ書

**日付**: 2025-10-07
**セッション**: Google Sheets API統合準備
**次のステップ**: `/app/dashboard/yumemaga-v2/page.tsx` のバックエンド実装

---

## 🎯 このセッションで完了したこと

### 1. **シート管理ページの作成**
**URL**: http://localhost:3000/dashboard/yumemaga-sheets

**機能**:
- ✅ 全14シートの一覧表示・検索
- ✅ シートデータの表示（行数制限付き）
- ✅ **セル編集**（クリック → 編集 → Enter保存）
- ✅ **行追加**（シート末尾に追加）
- ✅ **列追加**（指定位置に挿入）
- ✅ **列削除**（指定位置を削除）
- ✅ **行削除**（指定位置を削除）
- ✅ CSVダウンロード

### 2. **Google Sheets API完全統合**

#### **ライブラリ関数** (`lib/google-sheets.ts`)
```typescript
// データ取得
getSheetData(spreadsheetId, range): Promise<any[][]>
getBatchSheetData(spreadsheetId, ranges[]): Promise<any[][][]>
getSpreadsheetMetadata(spreadsheetId): Promise<any>

// データ更新
updateSheetData(spreadsheetId, range, values): Promise<void>
updateCell(spreadsheetId, sheetName, row, col, value): Promise<void>
appendSheetData(spreadsheetId, sheetName, values): Promise<void>

// 構造変更（batchUpdate API）
insertColumns(spreadsheetId, sheetId, startIndex, count): Promise<void>
deleteColumns(spreadsheetId, sheetId, startIndex, count): Promise<void>
deleteRows(spreadsheetId, sheetId, startIndex, count): Promise<void>
```

#### **API エンドポイント** (`/api/yumemaga-sheets`)

**GET**: シート一覧・データ取得
```bash
# シート一覧
GET /api/yumemaga-sheets
# → { success: true, data: { sheets: [...], totalSheets: 14 } }

# 特定シートのデータ
GET /api/yumemaga-sheets?sheet=カテゴリ同期マスター&limit=100
# → { success: true, data: { sheetName, rows, rowCount, columnCount } }
```

**PUT**: セル更新
```bash
curl -X PUT http://localhost:3000/api/yumemaga-sheets \
  -H "Content-Type: application/json" \
  -d '{"sheetName":"カテゴリ同期マスター","row":1,"col":7,"value":"テスト列"}'
```

**POST**: 行追加・列追加
```bash
# 行追加
curl -X POST http://localhost:3000/api/yumemaga-sheets \
  -H "Content-Type: application/json" \
  -d '{"action":"appendRows","sheetName":"進捗入力シート","rows":[["A-1","工程名","9/21","9/22","-"]]}'

# 列追加
curl -X POST http://localhost:3000/api/yumemaga-sheets \
  -H "Content-Type: application/json" \
  -d '{"action":"insertColumns","sheetId":1771253255,"startIndex":6,"count":1}'
```

**DELETE**: 列削除・行削除
```bash
# 列削除
curl -X DELETE http://localhost:3000/api/yumemaga-sheets \
  -H "Content-Type: application/json" \
  -d '{"type":"columns","sheetId":1771253255,"startIndex":6,"count":1}'

# 行削除
curl -X DELETE http://localhost:3000/api/yumemaga-sheets \
  -H "Content-Type: application/json" \
  -d '{"type":"rows","sheetId":1771253255,"startIndex":10,"count":1}'
```

### 3. **動作確認済み**

#### テスト実行例
```bash
# G列を追加（成功確認済み）
curl -X POST http://localhost:3000/api/yumemaga-sheets \
  -H "Content-Type: application/json" \
  -d '{"action":"insertColumns","sheetId":1771253255,"startIndex":6,"count":1}'
# → {"success":true,"message":"Inserted 1 column(s) at index 6"}

# G1にヘッダー追加（成功確認済み）
echo '{"sheetName":"カテゴリ同期マスター","row":1,"col":7,"value":"テスト列"}' | \
  curl -X PUT http://localhost:3000/api/yumemaga-sheets \
  -H "Content-Type: application/json" -d @-
# → {"success":true,"message":"Updated cell G1 in カテゴリ同期マスター"}
```

---

## 📊 スプレッドシート構造の理解

### 全14シート構成

| # | シート名 | sheetId | 役割 |
|---|---------|---------|------|
| 1 | シート1 | 0 | 空シート |
| 2 | **カテゴリ同期マスター** | 1771253255 | 工程グループの同期ルール |
| 3 | 負荷制約マスター | 2128428735 | 担当者の負荷制限 |
| 4 | 期間制約マスター | 1796462541 | 工程実施可能期間 |
| 5 | 拡張工程マスター | 1564166483 | 工程の詳細設定 |
| 6 | 設定マスター | 1598704762 | システム全体設定 |
| 7 | 新依存関係マスター | 983423705 | 工程間の依存関係 |
| 8 | **新工程マスター** | 1045956022 | 全工程の基本情報 |
| 9 | 理想形_ガント_2025年11月号 | 548026099 | 理想的な工程配置 |
| 10 | **逆算配置_ガント_2025年11月号** | 1583399674 | 実際の逆算スケジュール |
| 11 | 理想形_ガント_2025年10月号 | 63049515 | 前号の理想配置 |
| 12 | 工程マスター確認 | 820132991 | マスターデータ確認用 |
| 13 | **進捗入力シート** | 1472299859 | **実績完了日の入力シート** |
| 14 | カレンダーマスター | 1158424563 | 営業日・休日管理 |

### 重要シートの詳細

#### **進捗入力シート**（実績入力用）
想定列構造（`DATA_STRUCTURE_DESIGN.md`参照）:
- A列: 月号（例: `2025年11月号`）
- B列: 工程No（例: `A-3`）
- C列: 工程名
- D列: 必要データ
- E列: 逆算予定日（ガントから自動取得）
- F列: 入力予定日（ユーザー調整可能）
- G列: 実績日（ユーザー入力）
- H列: 先方確認ステータス（未送付/確認待ち/確認OK/-）

#### **逆算配置_ガントシート**（月号ごと）
列構成:
- A列: 工程（例: `A-3 メイン文字起こし`）
- B列: レイヤー（例: `Layer 3`）
- C列: 配置理由（例: `文字起こし同期: 9日目`）
- D列〜: 日付列（セルに値がある = その日に工程を実施）

### Phase4逆算スケジューラーのロジック
- **7層構造**の階層的スケジューリング
- **Layer 7**で次月号準備工程を並行配置（`NEXT_` プレフィックス）
- **発行日から60日間逆算**で各工程の実施日を自動計算
- **6種類のマスターデータ**で依存関係・制約・同期ルールを定義

詳細は `/docs/investigation/GAS_SCHEDULER_ANALYSIS.md` を参照

---

## 🚀 次にやること（yumemaga-v2のバックエンド実装）

### 実装すべきAPI

#### 1. **月号一覧取得API**
```typescript
GET /api/yumemaga-v2/issues
// ガントシート名から月号を抽出
// → ['2025年11月号', '2025年10月号']
```

#### 2. **工程データ取得API**
```typescript
GET /api/yumemaga-v2/processes?issue=2025年11月号
// ガントシート + 進捗入力シートを結合
// → { processes: [...], summary: {...} }
```

#### 3. **進捗データ取得API**
```typescript
GET /api/yumemaga-v2/progress?issue=2025年11月号
// カテゴリ別に進捗を集計
// → { categories: { A: {...}, K: {...}, ... } }
```

#### 4. **次月号準備データ取得API**
```typescript
GET /api/yumemaga-v2/next-month?currentIssue=2025年11月号
// Layer 7の次月号工程を抽出
// → { nextMonthIssue: '2025年12月号', processes: [...] }
```

#### 5. **実績日更新API**
```typescript
PUT /api/yumemaga-v2/actual-date
{ issue: '2025年11月号', processNo: 'A-3', actualDate: '2025-09-29' }
// 進捗入力シートのG列を更新
```

#### 6. **先方確認ステータス更新API**
```typescript
PUT /api/yumemaga-v2/confirmation-status
{ issue: '2025年11月号', processNo: 'A-14', status: '確認待ち' }
// 進捗入力シートのH列を更新
```

### 実装パターン

#### 月号一覧の取得
```typescript
import { getSpreadsheetMetadata } from '@/lib/google-sheets';

const metadata = await getSpreadsheetMetadata(spreadsheetId);
const ganttSheets = metadata.sheets
  .filter(s => s.properties.title.includes('逆算配置_ガント'))
  .map(s => {
    const match = s.properties.title.match(/(\d+年\d+月号)/);
    return match ? match[1] : null;
  })
  .filter(Boolean);
// → ['2025年11月号', '2025年10月号']
```

#### ガントシートからスケジュール取得
```typescript
import { getSheetData } from '@/lib/google-sheets';

const ganttData = await getSheetData(
  spreadsheetId,
  `逆算配置_ガント_2025年11月号!A1:ZZ1000`
);

const headers = ganttData[0]; // ['工程', 'レイヤー', '配置理由', '9/21', '9/22', ...]
const dateHeaders = headers.slice(3);

const processes = ganttData.slice(1).map(row => {
  const processName = row[0]; // "A-3 メイン文字起こし"
  const [processNo, name] = processName.split(' ');

  // この工程が実施される日付を抽出
  const scheduledDates = [];
  dateHeaders.forEach((date, i) => {
    if (row[i + 3]) scheduledDates.push(date);
  });

  return { processNo, name, scheduledDates };
});
```

#### 進捗入力シートから実績取得
```typescript
const progressData = await getSheetData(
  spreadsheetId,
  '進捗入力シート!A1:H100'
);

const progressByProcess = {};
progressData.slice(1).forEach(row => {
  const [issue, processNo, name, requiredData, plannedDate, inputDate, actualDate, confirmStatus] = row;

  progressByProcess[processNo] = {
    issue,
    processNo,
    name,
    plannedDate,
    actualDate,
    confirmationStatus: confirmStatus || '-',
    status: actualDate ? 'completed' : (new Date(inputDate) < new Date() ? 'delayed' : 'not_started')
  };
});
```

#### 実績日の更新
```typescript
import { updateCell } from '@/lib/google-sheets';

// 該当行を検索してG列を更新
const rowIndex = findRowByProcessNo(progressData, 'A-3'); // 自前で実装
await updateCell(spreadsheetId, '進捗入力シート', rowIndex, 7, '2025-09-29');
```

---

## 📝 重要な注意点

### 1. **sheetIdの取得**
- 列・行の追加・削除には**sheetId**（数値）が必要
- シート名（文字列）ではなく、metadataから取得した`sheetId`を使用

### 2. **インデックスは0始まり**
- `startIndex: 6` = G列（A=0, B=1, ..., G=6）
- `row: 1` = 1行目（1-indexed）、`col: 7` = G列（1-indexed）

### 3. **API制限**
- Google Sheets APIには**レート制限**あり（1分あたり60リクエスト）
- 大量更新時は`batchUpdate`や`updateSheetData`（複数セル一括更新）を使用

### 4. **次月号工程の識別**
- スケジュールキー: `NEXT_${工程No}`（例: `NEXT_S-1`）
- name: `【12月号】工程名`
- workCategory: `次月号準備`
- layer: `7`
- isNextMonth: `true`

---

## 🔗 参考ドキュメント

必読:
1. `/docs/investigation/GAS_SCHEDULER_ANALYSIS.md` - GASの逆算スケジューラーロジック解析
2. `/docs/yumemaga-production-management/DATA_STRUCTURE_DESIGN.md` - データ構造設計
3. `/docs/investigation/PROCESS_SCHEDULE_STRUCTURE_REPORT.md` - スプレッドシート構造の完全調査

参考:
4. `/docs/yumemaga-production-management/REQUIREMENTS.md` - 要件定義
5. `/docs/yumemaga-production-management/SPREADSHEET_STRUCTURE.md` - スプレッドシート構造

---

## ✅ 成功基準

yumemaga-v2のバックエンド実装が完了したら:

1. モックデータを削除
2. 実際のスプレッドシートからデータを取得できる
3. UIが正しく動作する
4. 「更新」ボタンで最新データを取得できる
5. 実績日・先方確認ステータスをGoogle Sheetsに保存できる

---

**最終更新**: 2025-10-07
**次のClaude Codeへ**: このドキュメントを読んでから `/app/dashboard/yumemaga-v2/page.tsx` のバックエンド実装を開始してください。
