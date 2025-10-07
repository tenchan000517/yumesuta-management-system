# 次月号準備管理 UI設計書

**作成日**: 2025-10-07
**対象**: ゆめマガ制作進捗管理ダッシュボード - 次月号準備エリア

---

## 📋 概要

### 目的
今月号制作中の「回答待ち期間（19〜27日目）」に並行実施する次月号準備工程の進捗を管理

### 配置位置
**カテゴリ別予実管理の上部**（進捗サマリーの下）

### 表示条件
- 次月号準備工程（S-1, S-2, A-1, K-1, L-1〜3, M-1〜3, H-1, I-1, C-1, C-3）が存在する場合のみ表示
- 月号が識別できている場合のみ表示

---

## 🎨 UI構成

### レイアウト

```
┌─────────────────────────────────────────────────┐
│ 📅 次月号事前準備（12月号）            [更新] │
├─────────────────────────────────────────────────┤
│                                                 │
│  進捗サマリー: ■■■■□□□□□□ 4/14 (28%) │
│  完了: 4工程 | 進行中: 2工程 | 未着手: 8工程  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ S-1     │  │ S-2     │  │ A-1     │  ... │
│  │ 企画決定│  │ 企画書  │  │ 実施報告│      │
│  │         │  │         │  │         │      │
│  │ ✅完了  │  │ 🔵進行中│  │ ⚪未着手│      │
│  │ 10/8    │  │ 10/8    │  │ 10/9    │      │
│  └─────────┘  └─────────┘  └─────────┘      │
│                                                 │
│  [工程詳細を表示]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📦 コンポーネント構成

### 1. NextMonthPrepSection（親コンポーネント）

**Props**:
```typescript
interface NextMonthPrepSectionProps {
  currentMonthIssue: string;      // 現在の月号（例: "2025年11月号"）
  nextMonthIssue: string;          // 次月号（例: "2025年12月号"）
  nextMonthProcesses: ProcessData[]; // 次月号準備工程データ
  onRefresh: () => void;           // 更新ハンドラー
}
```

**State**:
```typescript
const [showDetails, setShowDetails] = useState(false);
```

**構造**:
```tsx
<section className="mb-8 bg-white rounded-lg shadow p-6">
  {/* ヘッダー */}
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold flex items-center gap-2">
      <Calendar className="w-6 h-6" />
      次月号事前準備（{nextMonthIssue}）
    </h2>
    <button onClick={onRefresh}>更新</button>
  </div>

  {/* 進捗サマリー */}
  <NextMonthProgressSummary processes={nextMonthProcesses} />

  {/* 工程カード一覧 */}
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
    {nextMonthProcesses.map(process => (
      <NextMonthProcessCard key={process.processNo} process={process} />
    ))}
  </div>

  {/* 工程詳細展開ボタン */}
  <button onClick={() => setShowDetails(!showDetails)}>
    工程詳細を{showDetails ? '閉じる' : '表示'}
  </button>

  {/* 工程詳細テーブル（展開時） */}
  {showDetails && <NextMonthProcessTable processes={nextMonthProcesses} />}
</section>
```

### 2. NextMonthProgressSummary（進捗サマリー）

**Props**:
```typescript
interface NextMonthProgressSummaryProps {
  processes: ProcessData[];
}
```

**表示内容**:
- プログレスバー
- 完了数 / 総数
- 完了・進行中・未着手の内訳

**実装**:
```tsx
export function NextMonthProgressSummary({ processes }: NextMonthProgressSummaryProps) {
  const completed = processes.filter(p => p.actualDate).length;
  const inProgress = processes.filter(p => !p.actualDate && p.plannedDate <= today).length;
  const notStarted = processes.filter(p => !p.actualDate && p.plannedDate > today).length;
  const total = processes.length;
  const progress = (completed / total) * 100;

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-bold">{completed}/{total} ({progress.toFixed(0)}%)</span>
      </div>
      <div className="text-sm text-gray-600">
        完了: {completed}工程 | 進行中: {inProgress}工程 | 未着手: {notStarted}工程
      </div>
    </div>
  );
}
```

### 3. NextMonthProcessCard（工程カード）

**Props**:
```typescript
interface NextMonthProcessCardProps {
  process: ProcessData;
}

interface ProcessData {
  processNo: string;
  name: string;
  plannedDate: string;    // 逆算予定日（MM/DD）
  actualDate?: string;    // 実績日（MM/DD）
  status: 'completed' | 'in_progress' | 'not_started';
}
```

**表示内容**:
- 工程No
- 工程名（簡略版）
- ステータスアイコン
- 予定日 / 実績日

**実装**:
```tsx
export function NextMonthProcessCard({ process }: NextMonthProcessCardProps) {
  const statusConfig = {
    completed: { icon: '✅', label: '完了', color: 'bg-green-100 border-green-500' },
    in_progress: { icon: '🔵', label: '進行中', color: 'bg-blue-100 border-blue-500' },
    not_started: { icon: '⚪', label: '未着手', color: 'bg-gray-100 border-gray-300' }
  };

  const { icon, label, color } = statusConfig[process.status];

  return (
    <div className={`border-2 rounded-lg p-4 ${color}`}>
      <div className="font-bold text-sm mb-1">{process.processNo}</div>
      <div className="text-xs text-gray-700 mb-3 line-clamp-2">
        {process.name.replace('ゆめマガ○月号', '')}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <div className="text-right">
          <div className="text-xs text-gray-500">予定</div>
          <div className="text-sm font-bold">{process.plannedDate}</div>
        </div>
      </div>
      {process.actualDate && (
        <div className="mt-2 text-xs text-gray-600">
          実績: {process.actualDate}
        </div>
      )}
    </div>
  );
}
```

### 4. NextMonthProcessTable（工程詳細テーブル）

**Props**:
```typescript
interface NextMonthProcessTableProps {
  processes: ProcessData[];
  onUpdateActualDate: (processNo: string, date: string) => void;
}
```

**表示内容**:
- 工程No
- 工程名
- 予定日
- 実績日（入力可能）
- ステータス

**実装**:
```tsx
export function NextMonthProcessTable({ processes, onUpdateActualDate }: NextMonthProcessTableProps) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">工程No</th>
            <th className="border px-4 py-2">工程名</th>
            <th className="border px-4 py-2">予定日</th>
            <th className="border px-4 py-2">実績日</th>
            <th className="border px-4 py-2">ステータス</th>
          </tr>
        </thead>
        <tbody>
          {processes.map(process => (
            <tr key={process.processNo}>
              <td className="border px-4 py-2">{process.processNo}</td>
              <td className="border px-4 py-2">{process.name}</td>
              <td className="border px-4 py-2">{process.plannedDate}</td>
              <td className="border px-4 py-2">
                <input
                  type="date"
                  value={process.actualDate || ''}
                  onChange={(e) => onUpdateActualDate(process.processNo, e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </td>
              <td className="border px-4 py-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  process.status === 'completed' ? 'bg-green-100 text-green-800' :
                  process.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {process.status === 'completed' ? '完了' :
                   process.status === 'in_progress' ? '進行中' : '未着手'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔄 データフロー

### 1. データ取得

**APIエンドポイント**: `/api/process-schedule?issue=2025年11月号`

**レスポンス構造**:
```typescript
{
  success: true,
  data: {
    currentMonthIssue: "2025年11月号",
    nextMonthIssue: "2025年12月号",
    nextMonthProcesses: [
      {
        processNo: "S-1",
        name: "ゆめマガ12月号企画決定",
        plannedDate: "10/8",
        actualDate: null,
        status: "not_started"
      },
      // ...
    ]
  }
}
```

### 2. データ抽出ロジック（API側）

```typescript
// 1. ガントシートから次月号工程を抽出
const ganttData = await getSheetData(spreadsheetId, `逆算配置_ガント_${currentMonthIssue}!A1:ZZ1000`);

// 2. NEXT_接頭辞を持つ工程を抽出
const nextMonthProcesses = ganttData
  .filter(row => row[0].startsWith('NEXT_'))
  .map(row => {
    const processNo = row[0].replace('NEXT_', '');
    const name = row[1]; // 【12月号】工程名
    const plannedDate = extractPlannedDate(row); // 日付列から抽出

    return {
      processNo,
      name,
      plannedDate,
      actualDate: null, // 進捗入力シートから取得
      status: 'not_started'
    };
  });

// 3. 進捗入力シートから実績日を取得
const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:Z1000');
const progressMap = new Map(
  progressData
    .filter(row => row[0] === nextMonthIssue) // 月号でフィルタ
    .map(row => [row[1], row[6]]) // [工程No, 実績日]
);

// 4. 実績日をマージ
nextMonthProcesses.forEach(process => {
  const actualDate = progressMap.get(process.processNo);
  if (actualDate) {
    process.actualDate = actualDate;
    process.status = 'completed';
  } else if (process.plannedDate <= today) {
    process.status = 'in_progress';
  }
});
```

### 3. 実績日更新

**APIエンドポイント**: `PUT /api/process-schedule/actual-date`

**リクエスト**:
```typescript
{
  monthIssue: "2025年12月号",
  processNo: "S-1",
  actualDate: "2025-10-08"
}
```

**処理**:
```typescript
// 進捗入力シートの該当行を更新
const row = findRowByMonthAndProcess(progressData, monthIssue, processNo);
if (row) {
  await updateSheetCell(spreadsheetId, '進捗入力シート', row, 6, actualDate);
} else {
  // 行が存在しない場合は追加
  await appendSheetRow(spreadsheetId, '進捗入力シート', [
    monthIssue, processNo, name, requiredData, plannedDate, '', actualDate, '', ''
  ]);
}
```

---

## 🎯 ステータス判定ロジック

### 判定基準

```typescript
function determineStatus(process: ProcessData, today: Date): Status {
  if (process.actualDate) {
    return 'completed';
  }

  const plannedDate = new Date(process.plannedDate);

  if (plannedDate <= today) {
    return 'in_progress';
  }

  return 'not_started';
}
```

| 条件 | ステータス |
|------|-----------|
| 実績日が入力済み | 完了 |
| 実績日が空白 かつ 予定日 ≤ 今日 | 進行中 |
| 実績日が空白 かつ 予定日 > 今日 | 未着手 |

---

## 📱 レスポンシブ対応

### ブレークポイント

- **モバイル（〜768px）**: 1列表示
- **タブレット（768px〜1024px）**: 3列表示
- **デスクトップ（1024px〜）**: 4列表示

### CSS
```css
.grid {
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 🔐 エラーハンドリング

### ケース1: 次月号工程が存在しない

```typescript
if (!nextMonthProcesses || nextMonthProcesses.length === 0) {
  return null; // セクション自体を非表示
}
```

### ケース2: API取得失敗

```tsx
{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    次月号準備データの取得に失敗しました。
  </div>
)}
```

### ケース3: 実績日更新失敗

```tsx
const handleUpdateActualDate = async (processNo: string, date: string) => {
  try {
    const response = await fetch('/api/process-schedule/actual-date', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthIssue: nextMonthIssue, processNo, actualDate: date })
    });

    if (!response.ok) throw new Error('更新失敗');

    // 成功時はデータを再取得
    onRefresh();
  } catch (error) {
    alert('実績日の更新に失敗しました');
  }
};
```

---

## 🎨 スタイリング

### カラーパレット

| 用途 | カラー | 説明 |
|------|--------|------|
| セクション背景 | `bg-blue-50` | 次月号は青系で区別 |
| ヘッダー | `bg-blue-600 text-white` | 強調 |
| 完了カード | `bg-green-100 border-green-500` | 緑 |
| 進行中カード | `bg-blue-100 border-blue-500` | 青 |
| 未着手カード | `bg-gray-100 border-gray-300` | グレー |

### アイコン

- 📅 Calendar（セクションタイトル）
- ✅ 完了
- 🔵 進行中
- ⚪ 未着手
- ↻ 更新ボタン

---

## 📝 実装チェックリスト

### Phase 1: コンポーネント作成
- [ ] NextMonthPrepSection.tsx
- [ ] NextMonthProgressSummary.tsx
- [ ] NextMonthProcessCard.tsx
- [ ] NextMonthProcessTable.tsx

### Phase 2: API実装
- [ ] GET /api/process-schedule（次月号工程含む）
- [ ] PUT /api/process-schedule/actual-date

### Phase 3: ダッシュボード統合
- [ ] yumemaga-v2/page.tsx に組み込み
- [ ] 進捗サマリーの下に配置
- [ ] データ取得・更新ロジック

### Phase 4: テスト
- [ ] 次月号工程の表示確認
- [ ] 実績日入力・更新確認
- [ ] ステータス判定確認
- [ ] レスポンシブ表示確認

---

**最終更新**: 2025-10-07
