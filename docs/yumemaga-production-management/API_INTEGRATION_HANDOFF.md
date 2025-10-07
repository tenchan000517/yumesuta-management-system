# yumemaga-v2 API統合 完全引き継ぎ書

**作成日**: 2025-10-07
**状態**: API実装完了、フロントエンド統合が未完了（データが表示されない問題あり）
**次のClaude Codeへ**: このドキュメントを読めば、前提知識なしで作業を続行できます

---

## 📋 目次

1. [現在の状況サマリー](#現在の状況サマリー)
2. [完了した作業](#完了した作業)
3. [未完了の作業と問題点](#未完了の作業と問題点)
4. [システムアーキテクチャ](#システムアーキテクチャ)
5. [API仕様](#api仕様)
6. [フロントエンド構成](#フロントエンド構成)
7. [デバッグ手順](#デバッグ手順)
8. [次のステップ](#次のステップ)

---

## 現在の状況サマリー

### ✅ 完了していること

1. **進捗入力シートの準備** - Google Sheetsに97工程が登録済み
2. **6つのAPI実装** - すべてのAPIが正常に動作（curlで確認済み）
3. **フロントエンドの基本構造** - page.tsx、3つのコンポーネントが存在
4. **API呼び出しロジック** - fetchAllData関数が実装済み

### ❌ 未完了・問題あり

- **データが表示されない**: APIは動作するが、UIに反映されない（すべて「0」表示）
- **原因不明**: ブラウザコンソールのエラー確認が必要

---

## 完了した作業

### 1. 進捗入力シート準備（Google Sheets側）

**場所**: `http://localhost:3000/dashboard/yumemaga-sheets`

**実行済みの操作**:
1. 「列構造を更新」ボタン → 進捗入力シートに列を追加
2. 「新工程をマージ」ボタン → 97工程を追加
3. 「逆算予定日を更新」ボタン → 月号「2025年11月号」で予定日を設定

**結果**: 進捗入力シートに以下の列構成で97工程が登録されている

| 列 | 列名 | 説明 |
|----|------|------|
| A | 工程No | 例: `A-3` |
| B | 工程名 | 例: `メイン文字起こし` |
| C | 必要データ | 例: `録音データ` |
| D | 月号 | 例: `2025年11月号` |
| E | 逆算予定日 | 例: `9/29` |
| F | 入力予定日 | ユーザー調整可能 |
| G | 実績日 | 実際の完了日 |
| H | 先方確認ステータス | `未送付`/`確認待ち`/`確認OK`/`-` |
| I | ステータス | `active`/`archived` |
| J | 備考 | 補足情報 |

### 2. API実装（6つ）

すべて `/app/api/yumemaga-v2/` 配下に実装済み。

#### API 1: 月号一覧取得

**パス**: `/api/yumemaga-v2/issues/route.ts`
**メソッド**: GET
**パラメータ**: なし

**動作確認**:
```bash
curl -s "http://localhost:3000/api/yumemaga-v2/issues" | python3 -m json.tool
```

**レスポンス例**:
```json
{
  "success": true,
  "issues": ["2025年11月号"]
}
```

**実装内容**:
- `getSpreadsheetMetadata()` でスプレッドシートのシート一覧を取得
- シート名に「逆算配置_ガント」を含むものを抽出
- 正規表現 `/(\d+年\d+月号)/` で月号を抽出

---

#### API 2: 工程データ取得

**パス**: `/api/yumemaga-v2/processes/route.ts`
**メソッド**: GET
**パラメータ**: `?issue=2025年11月号` (URLエンコード必須)

**動作確認**:
```bash
curl -s "http://localhost:3000/api/yumemaga-v2/processes?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7"
```

**レスポンス例**:
```json
{
  "success": true,
  "processes": [
    {
      "processNo": "A-3",
      "processName": "メイン文字起こし",
      "requiredData": "録音データ",
      "issue": "",
      "plannedDate": "",
      "inputPlannedDate": "",
      "actualDate": "",
      "confirmationStatus": "-",
      "scheduledDates": ["9/29"],
      "status": "not_started"
    }
  ],
  "summary": {
    "total": 97,
    "completed": 0,
    "in_progress": 0,
    "delayed": 0,
    "not_started": 97
  }
}
```

**実装内容**:
1. ガントシート（`逆算配置_ガント_${issue}`）から工程スケジュールを取得
2. 進捗入力シートから実績データを取得（`status='active'`のみ）
3. 両者を結合してレスポンス

**ステータス判定ロジック** (`determineStatus`関数):
```typescript
if (actualDate) return 'completed';
if (!plannedDate) return 'not_started';

const today = new Date();
const planned = parseDate(plannedDate);

if (today > planned) return 'delayed';
if (isSameDay(today, planned)) return 'in_progress';
return 'not_started';
```

---

#### API 3: カテゴリ別進捗取得

**パス**: `/api/yumemaga-v2/progress/route.ts`
**メソッド**: GET
**パラメータ**: `?issue=2025年11月号`

**動作確認**:
```bash
curl -s "http://localhost:3000/api/yumemaga-v2/progress?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7"
```

**レスポンス例**:
```json
{
  "success": true,
  "categories": {
    "A": {
      "category": "A",
      "total": 15,
      "completed": 0,
      "progress": 0,
      "processes": [
        {
          "processNo": "A-2",
          "processName": "メインインタビューデータ提出・撮影",
          "actualDate": "",
          "confirmationStatus": "-"
        }
      ]
    },
    "K": { ... },
    "H": { ... },
    "I": { ... },
    "L": { ... },
    "M": { ... },
    "C": { ... },
    "E": { ... },
    "P": { ... },
    "Z": { ... }
  }
}
```

**カテゴリ説明**:
| ID | 名称 | 説明 |
|----|------|------|
| A | メインインタビュー | メイン記事の工程 |
| K | インタビュー② | サブインタビュー工程 |
| H | STAR① | STAR記事1 |
| I | STAR② | STAR記事2 |
| L | 記事L | その他記事 |
| M | 記事M | その他記事 |
| C | 新規企業 | 新規企業ページ |
| E | 既存企業 | 既存企業ページ |
| P | パートナー一覧 | パートナーページ |
| Z | 全体進捗 | 全工程の進捗 |

**実装内容**:
- 進捗入力シートから全工程を取得
- 工程No（例: `A-3`）のプレフィックス（`A`）でカテゴリ分類
- 各カテゴリの進捗率を計算

---

#### API 4: 次月号準備データ取得

**パス**: `/api/yumemaga-v2/next-month/route.ts`
**メソッド**: GET
**パラメータ**: `?currentIssue=2025年11月号`

**動作確認**:
```bash
curl -s "http://localhost:3000/api/yumemaga-v2/next-month?currentIssue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7"
```

**レスポンス例**:
```json
{
  "success": true,
  "nextMonthIssue": "2025年12月号",
  "processes": [
    {
      "processNo": "S-1",
      "name": "S-1 【12月号】ゆめマガ○月号企画決定",
      "nextMonthIssue": "2025年12月号",
      "layer": "次月号",
      "isNextMonth": true
    }
  ]
}
```

**実装内容**:
- ガントシートから、レイヤー列が「次月号」の工程を抽出
- 工程名から月号を抽出（正規表現: `/【(\d+月号)】/`）

---

#### API 5: 実績日更新

**パス**: `/api/yumemaga-v2/actual-date/route.ts`
**メソッド**: PUT
**リクエストボディ**:
```json
{
  "issue": "2025年11月号",
  "processNo": "A-3",
  "actualDate": "2025-09-29"
}
```

**動作確認**:
```bash
curl -X PUT "http://localhost:3000/api/yumemaga-v2/actual-date" \
  -H "Content-Type: application/json" \
  -d '{"issue":"2025年11月号","processNo":"A-3","actualDate":"2025-09-29"}'
```

**レスポンス例**:
```json
{
  "success": true,
  "message": "実績日を更新しました",
  "processNo": "A-3",
  "actualDate": "2025-09-29"
}
```

**実装内容**:
- 進捗入力シートから該当行を検索（工程No + 月号でマッチ）
- G列（実績日）を更新
- `updateSheetData()` を使用

---

#### API 6: 先方確認ステータス更新

**パス**: `/api/yumemaga-v2/confirmation-status/route.ts`
**メソッド**: PUT
**リクエストボディ**:
```json
{
  "issue": "2025年11月号",
  "processNo": "A-14",
  "status": "確認待ち"
}
```

**有効なステータス値**: `未送付`, `確認待ち`, `確認OK`, `-`

**動作確認**:
```bash
curl -X PUT "http://localhost:3000/api/yumemaga-v2/confirmation-status" \
  -H "Content-Type: application/json" \
  -d '{"issue":"2025年11月号","processNo":"A-14","status":"確認待ち"}'
```

**レスポンス例**:
```json
{
  "success": true,
  "message": "先方確認ステータスを更新しました",
  "processNo": "A-14",
  "status": "確認待ち"
}
```

**実装内容**:
- 進捗入力シートから該当行を検索
- H列（先方確認ステータス）を更新
- ステータス値のバリデーション実装済み

---

## 未完了の作業と問題点

### 🐛 問題: データが表示されない

**症状**:
- ページは正常に表示される（http://localhost:3000/dashboard/yumemaga-v2）
- しかし、すべてのデータが「0」と表示される
  - 完了: 0
  - 進行中: 0
  - 未着手: 0
  - 遅延: 0

**確認済みの事実**:
1. ✅ APIは正常に動作（curlで確認済み）
2. ✅ サーバーログにAPIリクエストが記録されている
3. ✅ page.tsxに`fetchAllData()`関数が実装されている
4. ✅ `useEffect`で初回データ取得が実行される

**未確認の事項**:
1. ❓ ブラウザのJavaScriptコンソールにエラーが出ているか
2. ❓ `fetchAllData()`が実際に呼ばれているか
3. ❓ APIレスポンスが`setState`に正しく渡されているか
4. ❓ コンポーネントが`categories`や`summary`のstateを参照しているか

---

## システムアーキテクチャ

### ディレクトリ構造

```
yumesuta-management-system/
├── app/
│   ├── api/
│   │   └── yumemaga-v2/          ← API実装（6つ）
│   │       ├── issues/route.ts
│   │       ├── processes/route.ts
│   │       ├── progress/route.ts
│   │       ├── next-month/route.ts
│   │       ├── actual-date/route.ts
│   │       └── confirmation-status/route.ts
│   └── dashboard/
│       └── yumemaga-v2/
│           └── page.tsx           ← メインページ（472行）
├── components/
│   ├── next-month/                ← 次月号準備セクション
│   │   ├── NextMonthPrepSection.tsx
│   │   ├── NextMonthCategoryCard.tsx
│   │   ├── NextMonthProcessCard.tsx
│   │   ├── NextMonthProcessTable.tsx
│   │   └── NextMonthProgressSummary.tsx
│   ├── category-management/       ← カテゴリ別管理セクション
│   │   └── CategoryManagementSection.tsx
│   └── data-submission/           ← データ提出セクション
│       └── DataSubmissionSection.tsx
├── lib/
│   └── google-sheets.ts           ← Google Sheets API ラッパー
└── docs/
    └── yumemaga-production-management/
        ├── BACKEND_HANDOFF_2025-10-07.md  ← 前回の引き継ぎ書
        └── API_INTEGRATION_HANDOFF.md     ← この文書
```

### データフロー

```
Google Sheets (YUMEMAGA_SPREADSHEET_ID)
  ├── 進捗入力シート       ← 実績データ（97工程）
  ├── 新工程マスター       ← 工程定義
  └── 逆算配置_ガント_*    ← スケジュール

        ↓ (API経由)

Next.js API Routes (/app/api/yumemaga-v2/)
  ├── issues          → 月号一覧
  ├── processes       → 工程データ（ガント + 進捗結合）
  ├── progress        → カテゴリ別進捗
  ├── next-month      → 次月号準備
  ├── actual-date     → 実績日更新
  └── confirmation-status → 先方確認更新

        ↓ (fetch API)

React Component (page.tsx)
  - useState で状態管理:
    - issues: string[]
    - summary: { completed, inProgress, notStarted, delayed }
    - categories: CategoryData[]
    - nextMonthProcesses: ProcessData[]

  - useEffect で初回データ取得:
    - selectedIssue が変更されたら fetchAllData() を実行

        ↓ (props経由)

3つの子コンポーネント
  ├── NextMonthPrepSection      (次月号準備)
  ├── CategoryManagementSection (カテゴリ別管理)
  └── DataSubmissionSection     (データ提出)
```

---

## フロントエンド構成

### page.tsx の構造

**ファイル**: `/app/dashboard/yumemaga-v2/page.tsx`
**行数**: 472行（コンポーネント化済み、適切なサイズ）

#### State管理

```typescript
export default function YumeMagaV2Page() {
  // 基本設定
  const [publishDate, setPublishDate] = useState('2025-11-08');
  const [selectedIssue, setSelectedIssue] = useState('2025年11月号');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('A');
  const [confirmationStatus, setConfirmationStatus] = useState<Record<string, string>>({});

  // APIから取得したデータ
  const [issues, setIssues] = useState<string[]>([]);
  const [summary, setSummary] = useState({
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    delayed: 0
  });
  const [nextMonthProcesses, setNextMonthProcesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
```

#### データ取得関数

**場所**: page.tsx 35-96行目

```typescript
const fetchAllData = async () => {
  if (!selectedIssue) return;

  setLoading(true);
  try {
    // 1. 工程データ取得でサマリーも取得
    const processesRes = await fetch(
      `/api/yumemaga-v2/processes?issue=${encodeURIComponent(selectedIssue)}`
    );
    const processesData = await processesRes.json();
    if (processesData.success) {
      setSummary({
        completed: processesData.summary.completed,
        inProgress: processesData.summary.in_progress,
        notStarted: processesData.summary.not_started,
        delayed: processesData.summary.delayed,
      });
    }

    // 2. カテゴリ別進捗取得
    const progressRes = await fetch(
      `/api/yumemaga-v2/progress?issue=${encodeURIComponent(selectedIssue)}`
    );
    const progressData = await progressRes.json();
    if (progressData.success) {
      const categoryList = Object.keys(progressData.categories).map(catId => {
        const cat = progressData.categories[catId];
        return {
          id: catId,
          name: getCategoryName(catId),
          progress: cat.progress,
          completed: cat.completed,
          total: cat.total,
          canvaUrl: null,
          confirmationRequired: ['A', 'K', 'H', 'I'].includes(catId),
          processes: cat.processes.map((p: any) => ({
            id: p.processNo,
            name: p.processName,
            plannedDate: '-',
            actualDate: p.actualDate,
            status: p.actualDate ? 'completed' : 'not_started',
          })),
          requiredData: getRequiredData(catId),
        };
      });
      setCategories(categoryList);
    }

    // 3. 次月号準備データ取得
    const nextMonthRes = await fetch(
      `/api/yumemaga-v2/next-month?currentIssue=${encodeURIComponent(selectedIssue)}`
    );
    const nextMonthData = await nextMonthRes.json();
    if (nextMonthData.success) {
      setNextMonthProcesses(nextMonthData.processes.map((p: any) => ({
        processNo: p.processNo,
        name: p.name,
        plannedDate: '-',
        actualDate: '',
        status: 'not_started' as const,
      })));
    }
  } catch (error) {
    console.error('データ取得エラー:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 初回データ取得

**場所**: page.tsx 120-123行目

```typescript
useEffect(() => {
  fetchAllData();
}, [selectedIssue]);
```

**重要**: `selectedIssue`が変更されるたびに`fetchAllData()`が実行される。

#### カテゴリ名マッピング

**場所**: page.tsx 98-106行目

```typescript
const getCategoryName = (catId: string) => {
  const names: Record<string, string> = {
    A: 'メインインタビュー',
    K: 'インタビュー②',
    H: 'STAR①',
    I: 'STAR②',
    L: '記事L',
    M: '記事M',
    C: '新規企業',
    E: '既存企業',
    P: 'パートナー一覧',
    Z: '全体進捗',
  };
  return names[catId] || catId;
};
```

#### モックデータの扱い

**場所**: page.tsx 125-277行目

**現在の状態**:
```typescript
const mockCategories = categories.length > 0 ? categories : [
  // ... 大量のモックデータ（153行）
];
```

**問題点**: `mockCategories`が定義されているが使われていない（TypeScript警告あり）

**解決策**: この行を削除し、直接`categories`を使用する

---

## デバッグ手順

### ステップ1: サーバー起動確認

```bash
# 開発サーバーが動いているか確認
ps aux | grep "npm run dev"

# 停止している場合は起動
npm run dev
```

**期待する出力**:
```
✓ Ready in 26.2s
- Local: http://localhost:3000
```

### ステップ2: APIの動作確認

```bash
# 1. 月号一覧
curl -s "http://localhost:3000/api/yumemaga-v2/issues" | python3 -m json.tool

# 2. 工程データ
curl -s "http://localhost:3000/api/yumemaga-v2/processes?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" \
  | python3 -m json.tool | head -50

# 3. カテゴリ別進捗
curl -s "http://localhost:3000/api/yumemaga-v2/progress?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" \
  | python3 -m json.tool | head -50

# 4. 次月号準備
curl -s "http://localhost:3000/api/yumemaga-v2/next-month?currentIssue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" \
  | python3 -m json.tool
```

**期待する結果**: すべてのAPIが`{"success": true, ...}`を返す

### ステップ3: ブラウザで確認

1. http://localhost:3000/dashboard/yumemaga-v2 を開く
2. F12キーで開発者ツールを開く
3. **Consoleタブ**を確認

**チェックポイント**:
- [ ] エラーメッセージが出ているか
- [ ] `fetchAllData()`が呼ばれているか（`console.log`を追加して確認）
- [ ] APIレスポンスが正しく返ってきているか（Networkタブで確認）

### ステップ4: データフロー確認

page.tsxに以下のデバッグログを追加：

```typescript
useEffect(() => {
  console.log('🔄 useEffect triggered, selectedIssue:', selectedIssue);
  fetchAllData();
}, [selectedIssue]);

const fetchAllData = async () => {
  console.log('📡 fetchAllData START');
  if (!selectedIssue) {
    console.log('❌ selectedIssue is empty, aborting');
    return;
  }

  setLoading(true);
  try {
    // 工程データ取得
    console.log('📡 Fetching processes...');
    const processesRes = await fetch(...);
    const processesData = await processesRes.json();
    console.log('✅ Processes data:', processesData);

    if (processesData.success) {
      console.log('✅ Setting summary:', processesData.summary);
      setSummary({ ... });
    }

    // カテゴリ別進捗取得
    console.log('📡 Fetching progress...');
    const progressRes = await fetch(...);
    const progressData = await progressRes.json();
    console.log('✅ Progress data:', progressData);

    if (progressData.success) {
      console.log('✅ Setting categories, count:', Object.keys(progressData.categories).length);
      setCategories(categoryList);
    }

    // 次月号準備
    console.log('📡 Fetching next month...');
    const nextMonthRes = await fetch(...);
    const nextMonthData = await nextMonthRes.json();
    console.log('✅ Next month data:', nextMonthData);

  } catch (error) {
    console.error('❌ データ取得エラー:', error);
  } finally {
    setLoading(false);
    console.log('📡 fetchAllData END');
  }
};
```

### ステップ5: コンポーネントのprop確認

page.tsxのreturn文で、コンポーネントに正しくpropsが渡されているか確認：

```typescript
// 進捗サマリーセクション（390-448行目あたり）
<div className="text-3xl font-bold text-green-900 mt-2">
  {summary.completed}  {/* ← ここが0になっている */}
</div>

// デバッグ: この部分に console.log を追加
console.log('📊 Rendering summary:', summary);
```

---

## 次のステップ

### 優先度1: データが表示されない問題の解決

**作業手順**:

1. **デバッグログを追加**
   ```typescript
   // page.tsx の fetchAllData 関数に console.log を追加
   // 上記「ステップ4: データフロー確認」を参照
   ```

2. **ブラウザで確認**
   - http://localhost:3000/dashboard/yumemaga-v2 を開く
   - F12 → Console タブでログを確認
   - Network タブでAPIリクエスト/レスポンスを確認

3. **問題の特定**

   **パターンA: fetchAllDataが呼ばれていない**
   - 原因: `useEffect`の依存配列が間違っている
   - 解決策: 依存配列を確認・修正

   **パターンB: APIエラーが発生している**
   - 原因: エンドポイントが間違っている、または環境変数が未設定
   - 解決策: `.env.local`を確認（`YUMEMAGA_SPREADSHEET_ID`が設定されているか）

   **パターンC: データは取得できているが、UIに反映されない**
   - 原因: コンポーネントが`state`ではなく`mockCategories`を参照している
   - 解決策: page.tsxで`mockCategories`を完全削除し、`categories`を使用

4. **修正と確認**
   - 問題を修正
   - ページをリロード（Ctrl+Shift+R / Cmd+Shift+R）
   - データが表示されることを確認

### 優先度2: モックデータの完全削除

**作業内容**:

1. page.tsx 125-277行目の`mockCategories`定義を削除
2. TypeScript警告を解消（未使用変数の削除）
3. コンパイルエラーがないことを確認

**削除すべきコード**:
```typescript
// 削除対象: page.tsx 125-277行目
const mockCategories = categories.length > 0 ? categories : [
  // ... 大量のモックデータ
];
```

### 優先度3: 実績日・先方確認ステータス更新機能の実装

**現状**: APIは実装済みだが、UIからの呼び出しが未実装

**作業内容**:

1. **実績日更新ハンドラーの実装**
   ```typescript
   const handleUpdateActualDate = async (processNo: string, date: string) => {
     try {
       const res = await fetch('/api/yumemaga-v2/actual-date', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           issue: selectedIssue,
           processNo,
           actualDate: date,
         }),
       });
       const data = await res.json();
       if (data.success) {
         // データ再取得
         await fetchAllData();
         alert('実績日を更新しました');
       }
     } catch (error) {
       console.error('更新エラー:', error);
       alert('更新に失敗しました');
     }
   };
   ```

2. **先方確認ステータス更新ハンドラーの実装**
   ```typescript
   const handleUpdateConfirmation = async (categoryId: string, status: string) => {
     // 実装は上記と同様
     // エンドポイント: /api/yumemaga-v2/confirmation-status
   };
   ```

3. **コンポーネントにpropsとして渡す**
   ```typescript
   <CategoryManagementSection
     categories={categories}
     onUpdateActualDate={handleUpdateActualDate}
     onUpdateConfirmation={handleUpdateConfirmation}
   />
   ```

### 優先度4: 「更新」ボタンの追加

**現状**: 初回読み込み時のみデータ取得、手動更新ができない

**作業内容**:

1. ヘッダーセクションに「更新」ボタンを追加
   ```typescript
   <button
     onClick={fetchAllData}
     disabled={loading}
     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
   >
     {loading ? '更新中...' : '更新'}
   </button>
   ```

### 優先度5: ローディング状態の表示

**現状**: `loading` stateは定義済みだが未使用

**作業内容**:

1. ローディング中のUIを表示
   ```typescript
   if (loading) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="text-xl">データを読み込み中...</div>
       </div>
     );
   }
   ```

---

## 環境変数

**ファイル**: `.env.local`

**必須の変数**:
```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
YUMEMAGA_SPREADSHEET_ID='1234567890abcdefghijklmnopqrstuvwxyz'
```

**確認方法**:
```bash
# 環境変数が設定されているか確認
grep -E "(GOOGLE_SERVICE_ACCOUNT_KEY|YUMEMAGA_SPREADSHEET_ID)" .env.local
```

**未設定の場合**:
- プロジェクトオーナーに確認
- Google Cloud Consoleでサービスアカウントキーを取得

---

## トラブルシューティング

### Q1: APIが404エラーを返す

**原因**: ルートファイルが見つからない、またはサーバーが認識していない

**解決策**:
1. ファイルが存在するか確認
   ```bash
   ls -la app/api/yumemaga-v2/issues/route.ts
   ```
2. サーバーを再起動
   ```bash
   # すべてのnpmプロセスを停止
   pkill -f "npm run dev"
   # 再起動
   npm run dev
   ```

### Q2: Google Sheets APIでクォータエラー

**エラーメッセージ**: `Quota exceeded for quota metric 'Write requests'`

**原因**: 1分間に60回以上の書き込みリクエストを送信

**解決策**:
1. 1-2分待つ
2. リクエストをバッチ化する（`updateSheetData`で複数行を一度に更新）

### Q3: TypeScriptエラー

**エラー**: `'mockCategories' is declared but its value is never read.`

**解決策**:
```typescript
// page.tsx 125-277行目を削除
// const mockCategories = ... を完全に削除
```

### Q4: データが古い

**原因**: ブラウザキャッシュ、またはGoogle Sheetsの変更が反映されていない

**解決策**:
1. ブラウザでスーパーリロード（Ctrl+Shift+R / Cmd+Shift+R）
2. APIを直接curlで確認して、最新データが返るか確認

---

## 参考資料

### ドキュメント

1. **前回の引き継ぎ書**: `/docs/yumemaga-production-management/BACKEND_HANDOFF_2025-10-07.md`
2. **要件定義**: `/docs/yumemaga-production-management/REQUIREMENTS.md`
3. **データ構造設計**: `/docs/yumemaga-production-management/DATA_STRUCTURE_DESIGN.md`

### コードの場所

| 機能 | ファイルパス |
|------|-------------|
| API実装 | `/app/api/yumemaga-v2/*/route.ts` |
| メインページ | `/app/dashboard/yumemaga-v2/page.tsx` |
| 次月号コンポーネント | `/components/next-month/NextMonthPrepSection.tsx` |
| カテゴリ管理 | `/components/category-management/CategoryManagementSection.tsx` |
| データ提出 | `/components/data-submission/DataSubmissionSection.tsx` |
| Google Sheets API | `/lib/google-sheets.ts` |

---

## チェックリスト（次のClaude Code用）

このセクションを最初に確認してください。

### 作業開始前の確認

- [ ] 開発サーバーが起動している（`npm run dev`）
- [ ] `.env.local`に環境変数が設定されている
- [ ] 進捗入力シートに97工程が登録されている（yumemaga-sheetsページで確認）

### データが表示されない問題の調査

- [ ] ブラウザのコンソールでエラーを確認
- [ ] page.tsxに`console.log`を追加して`fetchAllData()`の動作を確認
- [ ] NetworkタブでAPIリクエスト/レスポンスを確認
- [ ] `summary`、`categories`のstateに値が入っているか確認

### 修正作業

- [ ] `mockCategories`の定義を削除（125-277行目）
- [ ] データが正しく表示されることを確認
- [ ] 「更新」ボタンを追加
- [ ] 実績日更新機能を実装
- [ ] 先方確認ステータス更新機能を実装

---

## 最後に

このドキュメントは、次のClaude Codeが**前提知識ゼロ**の状態から作業を再開できるように作成されています。

### 質問があるとき

1. まず、このドキュメントの該当セクションを読む
2. `/docs/yumemaga-production-management/BACKEND_HANDOFF_2025-10-07.md`を参照
3. コードを直接読む（ファイルパスはこのドキュメントに記載）

### 作業を始めるとき

1. **「チェックリスト」セクション**を最初に確認
2. **「デバッグ手順」**に従ってシステムの状態を確認
3. **「次のステップ」**の優先度順に作業を進める

---

**Good luck! 🚀**
