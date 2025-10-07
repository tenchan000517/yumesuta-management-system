# バックエンド実装完了 - 引き継ぎ書

**日付**: 2025-10-07
**セッション**: yumemaga-v2 バックエンド実装準備
**次のステップ**: yumemaga-v2のAPIを実装し、モックデータを置き換える

---

## 🎯 このセッションで完了したこと

### 1. 進捗入力シート管理機能の実装

#### 作成したAPI（3つ）

1. **`/api/yumemaga-sheets/update-progress-columns` (POST)**
   - 進捗入力シートに必要な列を追加
   - 列構成：`工程No | 工程名 | 必要データ | 月号 | 逆算予定日 | 入力予定日 | 実績日 | 先方確認ステータス | ステータス | 備考`
   - 既存データを保持しながら列構造を変換

2. **`/api/yumemaga-sheets/merge-processes` (POST)**
   - 新工程マスター（97工程）から進捗入力シートに工程をマージ
   - 新規工程を追加、廃止工程を `archived` ステータスに更新
   - 実績データは保持（履歴を削除しない）

3. **`/api/yumemaga-sheets/update-planned-dates` (POST)**
   - ガントシートから各工程の実施日を抽出
   - 進捗入力シートの「逆算予定日」列を更新
   - リクエストボディ: `{ issue: "2025年11月号" }`

#### 追加したUI

**場所**: `/app/dashboard/yumemaga-sheets/page.tsx` (549-659行目)

進捗入力シート表示時に3つのボタンを表示：
- **列構造を更新**: 最初に1回実行（月号・先方確認ステータス列を追加）
- **新工程をマージ**: 新工程マスターから同期（新規追加・アーカイブ処理）
- **逆算予定日を更新**: ガントシートから予定日を取得

---

## 📊 進捗入力シートの最終構造（設計）

### 列構成

| 列 | 列名 | 説明 | 例 |
|----|------|------|-----|
| A | 工程No | 工程ID | `A-3` |
| B | 工程名 | 工程の正式名称 | `メイン文字起こし` |
| C | 必要データ | 工程に必要な成果物 | `録音データ` |
| D | 月号 | 対象月号 | `2025年11月号` |
| E | 逆算予定日 | ガントから自動取得 | `9/29` |
| F | 入力予定日 | ユーザーが調整可能 | `9/30` |
| G | 実績日 | 実際の完了日 | `10/1` |
| H | 先方確認ステータス | 確認状態 | `確認待ち` |
| I | ステータス | active/archived | `active` |
| J | 備考 | 補足情報 | |

### 先方確認ステータスの値

| 値 | 意味 |
|----|------|
| `未送付` | まだ先方に送付していない |
| `確認待ち` | 送付済み、返答待ち |
| `確認OK` | 先方確認完了 |
| `-` | 確認不要な工程 |

### ステータスの値

| 値 | 意味 |
|----|------|
| `active` | 現役工程（表示対象） |
| `archived` | アーカイブ済み（非表示） |

---

## 🔍 重要な調査結果

### 1. スプレッドシートの構造

全14シート構成：
1. シート1（空）
2. **カテゴリ同期マスター** - 工程グループの同期ルール
3. **負荷制約マスター** - 担当者の負荷制限
4. 期間制約マスター
5. 拡張工程マスター
6. 設定マスター
7. **新依存関係マスター** - 工程間の依存関係
8. **新工程マスター** - 全97工程の基本情報（⭐️ここから工程を取得）
9. 理想形_ガント_2025年11月号
10. **逆算配置_ガント_2025年11月号** - 実際の逆算スケジュール（⭐️ここから予定日を取得）
11. 理想形_ガント_2025年10月号
12. 工程マスター確認
13. **進捗入力シート** - 実績完了日の入力シート（⭐️APIで更新する対象）
14. カレンダーマスター

### 2. ガントシートの構造

```
列A: 工程（例: "A-3 メイン文字起こし"）
列B: レイヤー（例: "Layer 3"）
列C: 配置理由（例: "文字起こし同期: 9日目"）
列D〜: 日付列（9/21〜11/20）
```

**重要**: セルに値がある = その日に工程を実施

### 3. 次月号工程の識別方法

ガントシートの最後に次月号工程が存在：
```
S-1 【12月号】ゆめマガ○月号企画決定
A-1 【12月号】メインインタビュー実施日報告
...
```

**識別方法**:
- レイヤー列: "次月号"
- 工程名に `【○月号】` プレフィックス

---

## 🚀 次にやること（yumemaga-v2のバックエンド実装）

### 前提条件：進捗入力シートの準備

1. http://localhost:3000/dashboard/yumemaga-sheets にアクセス
2. 「進捗入力シート」を表示
3. 以下を順番に実行：
   - **列構造を更新** ボタンをクリック（1回のみ）
   - **新工程をマージ** ボタンをクリック（97工程を追加）
   - **逆算予定日を更新** ボタンをクリック（月号: `2025年11月号` を入力）

### 実装すべきAPI（6つ）

#### 1. `/api/yumemaga-v2/issues` (GET)
月号一覧を取得

```typescript
// ガントシート名から月号を抽出
const metadata = await getSpreadsheetMetadata(spreadsheetId);
const ganttSheets = metadata.sheets
  .filter(s => s.properties.title.includes('逆算配置_ガント'))
  .map(s => {
    const match = s.properties.title.match(/(\d+年\d+月号)/);
    return match ? match[1] : null;
  })
  .filter(Boolean);

// レスポンス: { success: true, issues: ['2025年11月号', '2025年10月号'] }
```

#### 2. `/api/yumemaga-v2/processes` (GET)
工程データ取得（ガント + 進捗シート結合）

```typescript
// クエリパラメータ: ?issue=2025年11月号

// 1. ガントシートから工程スケジュールを取得
const ganttData = await getSheetData(spreadsheetId, `逆算配置_ガント_${issue}!A1:ZZ1000`);
const headers = ganttData[0];
const dateHeaders = headers.slice(3);

const processSchedule: Record<string, string[]> = {};
ganttData.slice(1).forEach(row => {
  const processName = row[0]; // "A-3 メイン文字起こし"
  const match = processName.match(/^([A-Z]-\d+)/);
  if (!match) return;

  const processNo = match[1];
  const scheduledDates: string[] = [];

  dateHeaders.forEach((date, i) => {
    if (row[i + 3]) scheduledDates.push(date);
  });

  processSchedule[processNo] = scheduledDates;
});

// 2. 進捗入力シートから実績を取得（ステータス='active'のみ）
const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

const processes = progressData.slice(1)
  .filter(row => row[8] === 'active' || !row[8]) // I列: ステータス
  .map(row => ({
    processNo: row[0],           // A列
    processName: row[1],         // B列
    requiredData: row[2],        // C列
    issue: row[3],               // D列
    plannedDate: row[4],         // E列: 逆算予定日
    inputPlannedDate: row[5],    // F列: 入力予定日
    actualDate: row[6],          // G列: 実績日
    confirmationStatus: row[7] || '-', // H列
    scheduledDates: processSchedule[row[0]] || [],
    status: determineStatus(row[4], row[6]), // 今日と比較して判定
  }));

// レスポンス: { success: true, processes, summary: {...} }
```

**ステータス判定ロジック**:
```typescript
function determineStatus(plannedDate: string, actualDate: string): string {
  if (actualDate) return 'completed';
  if (!plannedDate) return 'not_started';

  const today = new Date();
  const planned = parseDate(plannedDate); // "9/29" → Date

  if (today > planned) return 'delayed';
  if (isSameDay(today, planned)) return 'in_progress';
  return 'not_started';
}
```

#### 3. `/api/yumemaga-v2/progress` (GET)
カテゴリ別進捗データ取得

```typescript
// クエリパラメータ: ?issue=2025年11月号

// 工程Noのプレフィックスでカテゴリ分類
const categories = { A: [], K: [], H: [], I: [], L: [], M: [], C: [], E: [], P: [], Z: [] };

progressData.slice(1)
  .filter(row => row[8] === 'active')
  .forEach(row => {
    const processNo = row[0]; // "A-3"
    const prefix = processNo.split('-')[0]; // "A"

    if (categories[prefix]) {
      categories[prefix].push({
        processNo: row[0],
        actualDate: row[6],
        confirmationStatus: row[7],
      });
    }
  });

// 各カテゴリの進捗率を計算
const progress = {};
Object.keys(categories).forEach(cat => {
  const processes = categories[cat];
  const completed = processes.filter(p => p.actualDate).length;
  progress[cat] = {
    total: processes.length,
    completed,
    progress: (completed / processes.length) * 100,
    confirmationStatus: processes[0]?.confirmationStatus || '-',
  };
});

// レスポンス: { success: true, categories: progress }
```

#### 4. `/api/yumemaga-v2/next-month` (GET)
次月号準備データ取得

```typescript
// クエリパラメータ: ?currentIssue=2025年11月号

const ganttData = await getSheetData(spreadsheetId, `逆算配置_ガント_${currentIssue}!A1:ZZ1000`);

// レイヤー列が "次月号" の工程を抽出
const nextMonthProcesses = ganttData.slice(1)
  .filter(row => row[1] === '次月号')
  .map(row => {
    const processName = row[0]; // "S-1 【12月号】ゆめマガ○月号企画決定"
    const match = processName.match(/^([A-Z]-\d+)/);
    const monthMatch = processName.match(/【(\d+月号)】/);

    return {
      processNo: match ? match[1] : '',
      name: processName,
      nextMonthIssue: monthMatch ? `2025年${monthMatch[1]}` : '',
      layer: row[1],
      isNextMonth: true,
    };
  });

// レスポンス: { success: true, nextMonthIssue: '2025年12月号', processes: nextMonthProcesses }
```

#### 5. `/api/yumemaga-v2/actual-date` (PUT)
実績日更新

```typescript
// リクエストボディ: { issue: '2025年11月号', processNo: 'A-3', actualDate: '2025-09-29' }

// 進捗入力シートから該当行を検索
const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

const rowIndex = progressData.findIndex((row, i) =>
  i > 0 && row[0] === processNo && row[3] === issue
);

if (rowIndex === -1) {
  return NextResponse.json({ success: false, error: '工程が見つかりません' }, { status: 404 });
}

// G列（実績日）を更新
await updateSheetData(spreadsheetId, `進捗入力シート!G${rowIndex + 1}`, [[actualDate]]);

// レスポンス: { success: true, message: '実績日を更新しました' }
```

#### 6. `/api/yumemaga-v2/confirmation-status` (PUT)
先方確認ステータス更新

```typescript
// リクエストボディ: { issue: '2025年11月号', processNo: 'A-14', status: '確認待ち' }

// 進捗入力シートから該当行を検索
const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

const rowIndex = progressData.findIndex((row, i) =>
  i > 0 && row[0] === processNo && row[3] === issue
);

if (rowIndex === -1) {
  return NextResponse.json({ success: false, error: '工程が見つかりません' }, { status: 404 });
}

// H列（先方確認ステータス）を更新
await updateSheetData(spreadsheetId, `進捗入力シート!H${rowIndex + 1}`, [[status]]);

// レスポンス: { success: true, message: 'ステータスを更新しました' }
```

---

## 🔧 リファクタリング推奨事項

### 問題点

`/app/dashboard/yumemaga-v2/page.tsx` が既に長い（472行）

### 推奨アクション

コンポーネントを分割：

1. **`/components/yumemaga-v2/IssueSelector.tsx`**
   - 新規号作成 / 月号選択セクション

2. **`/components/yumemaga-v2/ProgressSummary.tsx`**
   - 進捗サマリーセクション

3. **`/components/yumemaga-v2/CategoryManagementSection.tsx`** （既存）
   - カテゴリ別予実管理セクション

4. **`/components/yumemaga-v2/DataSubmissionSection.tsx`** （既存）
   - データ提出進捗管理セクション

5. **`/components/yumemaga-v2/NextMonthPrepSection.tsx`** （既存）
   - 次月号事前準備セクション

6. **`/components/yumemaga-v2/GanttChartSection.tsx`**
   - ガントチャートセクション（後で実装）

---

## 📝 参考ドキュメント

必読：
1. `/docs/investigation/GAS_SCHEDULER_ANALYSIS.md` - Phase4逆算スケジューラーの完全解析
2. `/docs/yumemaga-production-management/DATA_STRUCTURE_DESIGN.md` - データ構造設計
3. `/docs/investigation/PROCESS_SCHEDULE_STRUCTURE_REPORT.md` - スプレッドシート構造調査

参考：
4. `/docs/yumemaga-production-management/REQUIREMENTS.md` - 要件定義
5. `/docs/yumemaga-production-management/SPREADSHEET_STRUCTURE.md` - スプレッドシート構造

---

## ✅ 次のClaude Codeへのメッセージ

### やるべきこと（優先順位順）

1. **進捗入力シートの準備**（最初に1回のみ）
   - yumemaga-sheetsページで3つのボタンを順番に実行
   - 97工程が進捗入力シートに追加されることを確認

2. **yumemaga-v2用のAPI実装**
   - 上記の6つのAPIを `/app/api/yumemaga-v2/` 配下に作成
   - 各APIの実装例は上記を参照

3. **yumemaga-v2のpage.tsxを更新**
   - モックデータを削除
   - APIを呼び出すように変更
   - 「更新」ボタンでデータを再取得

4. **リファクタリング**（余裕があれば）
   - page.tsxからコンポーネントを分割
   - 上記の推奨コンポーネント構成を参照

### 注意点

- ガントシート関連は**後回し**（モックのまま残す）
- API実装時は必ず `status !== 'archived'` でフィルタリング
- 日付のパースに注意（"9/29" → Date変換）

### 成功基準

1. yumemaga-v2ページでモックデータではなく実データが表示される
2. 「更新」ボタンでGoogle Sheetsから最新データを取得できる
3. 実績日・先方確認ステータスをGoogle Sheetsに保存できる

---

**最終更新**: 2025-10-07
**次のセッション**: yumemaga-v2のAPI実装 → モックデータ置き換え → 動作確認
