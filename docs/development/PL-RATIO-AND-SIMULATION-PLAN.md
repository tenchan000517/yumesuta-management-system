# P/L比率表示 & シミュレーション予測機能 実装計画書

**作成日**: 2025-10-19
**対象バージョン**: Phase 1（基本機能実装）
**優先度**: 🔴 **高**

---

## 📋 目次

1. [背景・目的](#背景目的)
2. [要件定義](#要件定義)
3. [データ構造設計](#データ構造設計)
4. [実装計画](#実装計画)
5. [UI設計](#ui設計)
6. [実装ファイル一覧](#実装ファイル一覧)
7. [テスト項目](#テスト項目)

---

## 🎯 背景・目的

### 現状の課題

1. **P/Lに比率表示がない**
   - 各経費項目が売上高の何％を占めているか分からない
   - 経費コントロールの目安がない

2. **予測キャッシュフローの精度が低い**
   - 現在は「過去3ヶ月の平均」を使用
   - 売上が増減しても、経費が連動しない
   - 将来のビジネスプランをシミュレーションできない

### 目指すゴール

1. **P/Lに売上高比率（％）を表示**
   - 交通費率、人件費率、接待交際費率、原価率などを可視化
   - 経営判断の指標として活用

2. **シミュレーションベースの予測キャッシュフロー**
   - 「実績ベース」と「シミュレーションベース」をタブ切り替え
   - シミュレーション設定シートで、各経費の目標売上比率（％）を設定
   - 予測売上に対して、設定した％を掛けて経費を計算
   - 売上増減に連動して経費も変動するため、精度が向上

---

## 📝 要件定義

### 要件1: P/Lに売上高比率（％）を追加

#### 仕様

- **表示場所**: 損益計算書（P/L）の各項目の横
- **計算式**: `売上高比率(%) = (項目金額 ÷ 売上高) × 100`
- **対象項目**:
  - 売上原価（印刷代・サーバー代等）
  - 人件費（給与）
  - 交通費
  - 接待交際費
  - 雑費
  - その他経費
  - 営業利益
  - 経常利益

#### UI表示イメージ

```
損益計算書（P/L）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
項目                | 金額        | 売上比率
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
売上高              | 1,000,000円 | 100.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
売上原価            |   200,000円 |  20.0%
  印刷代            |   150,000円 |  15.0%
  サーバー代        |    50,000円 |   5.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
売上総利益          |   800,000円 |  80.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
販売費及び一般管理費 |   550,000円 |  55.0%
  人件費（給与）     |   250,000円 |  25.0%
  交通費            |    30,000円 |   3.0%
  接待交際費        |    50,000円 |   5.0%
  雑費              |    20,000円 |   2.0%
  固定費            |   200,000円 |  20.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
営業利益            |   250,000円 |  25.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
経常利益            |   250,000円 |  25.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 実装上の注意点

- **売上高が0円の場合**: 比率は `-` または `0.0%` と表示（ゼロ除算エラーを防ぐ）
- **小数点以下**: 1桁表示（例: `25.5%`）
- **マイナス値**: 赤字表示（例: 営業利益がマイナスの場合）

---

### 要件2: シミュレーションベースの予測キャッシュフロー

#### 2.1 シミュレーション設定シート（新規作成）

**Googleスプレッドシート**: 「シミュレーション設定」シート（新規作成）

**列構造**:

| 列 | Index | 内容 | 説明 | 例 |
|---|---|---|---|---|
| A | 0 | 項目名 | 経費項目の名前 | `交通費` |
| B | 1 | 売上比率(%) | 売上高に対する目標比率 | `3.0` |
| C | 2 | 備考 | メモ欄 | `営業活動に伴う交通費` |

**初期データ例**:

```
項目名         | 売上比率(%) | 備考
-------------------------------------------------
交通費         |  3.0        | 営業活動に伴う交通費
接待交際費     |  5.0        | クライアント接待費
雑費           |  2.0        | その他諸経費
印刷代         | 15.0        | 雑誌印刷コスト
配送費         |  4.0        | 雑誌配送コスト
人件費         | 25.0        | 給与・賞与
```

**環境変数**:
- `.env.local` に以下を追加:
  ```
  SIMULATION_SPREADSHEET_ID=（スプレッドシートID）
  ```
  ※注: 既存のSALES_SPREADSHEET_IDと同じスプレッドシート内に「シミュレーション設定」シートを追加する場合は、新規の環境変数は不要。

**推奨アプローチ**:
- 既存の `SALES_SPREADSHEET_ID` のスプレッドシート内に「シミュレーション設定」シートを追加する
- 新しい環境変数を追加せず、`process.env.SALES_SPREADSHEET_ID` を使用

---

#### 2.2 予測キャッシュフロー: 2つのモード

**モード1: 実績ベース（現行仕様、変更なし）**

- **予測売上**: 入金予定日ベース
- **予測経費**: 過去3ヶ月の実績平均（C/Fベース）
- **予測給与**: 過去3ヶ月の実績平均（C/Fベース）
- **予測固定費**: 固定費マスタから計算

**モード2: シミュレーションベース（新規追加）**

- **予測売上**: 入金予定日ベース（実績ベースと同じ）
- **予測経費**: **予測売上 × シミュレーション設定の売上比率（％）の合計**
  - 計算式: `(交通費率 + 接待交際費率 + 雑費率 + 印刷代率 + 配送費率) × 予測売上`
  - 例: 予測売上が100万円、経費系の合計比率が29%の場合 → 29万円
- **予測給与**: **予測売上 × シミュレーション設定の人件費率（％）**
  - 計算式: `人件費率 × 予測売上`
  - 例: 予測売上が100万円、人件費率が25%の場合 → 25万円
- **予測固定費**: 固定費マスタから計算（実績ベースと同じ）

---

#### 2.3 UI: タブ切り替え

**表示場所**: `/app/dashboard/financial-statements/page.tsx` の「予定キャッシュフロー」セクション

**UI構成**:

```
┌─────────────────────────────────────────┐
│ 予定キャッシュフロー                      │
├─────────────────────────────────────────┤
│ [実績ベース] [シミュレーションベース]     │ ← タブ切り替え
├─────────────────────────────────────────┤
│ （タブに応じた内容を表示）                │
│ - 現金枯渇警告                            │
│ - 月次予測テーブル                        │
└─────────────────────────────────────────┘
```

**実装方法**:
- React `useState` で `predictionMode` を管理
- `predictionMode` が `"actual"` または `"simulation"` に応じてAPIを呼び分ける
- タブボタンは Tailwind CSS のスタイルで実装（既存の年次・月次切り替えと同じデザイン）

---

## 🗂️ データ構造設計

### 1. 型定義の追加（`types/financial.ts`）

#### シミュレーション設定の型

```typescript
/**
 * シミュレーション設定項目
 */
export interface SimulationSetting {
  itemName: string;           // A列: 項目名
  salesRatio: number;         // B列: 売上比率（％、例: 3.0 = 3%）
  notes?: string;             // C列: 備考
}

/**
 * シミュレーション設定レスポンス
 */
export interface SimulationSettingsResponse {
  success: boolean;
  data?: SimulationSetting[];
  error?: string;
}
```

#### P/L表示行の型（既存の型を拡張）

```typescript
/**
 * P/L表示用の行データ（拡張版）
 */
export interface PLDisplayRow {
  type: 'header' | 'section' | 'item' | 'subtotal' | 'total' | 'separator';
  label: string;
  value?: number;
  section: string;
  isBold?: boolean;
  isTotal?: boolean;
  salesRatio?: number;  // ← 追加: 売上高比率（％）
}
```

#### 未来予測レスポンスの拡張

```typescript
/**
 * 未来予測のモード
 */
export type PredictionMode = 'actual' | 'simulation';

/**
 * 未来予測レスポンス（拡張版）
 */
export interface FuturePredictionResponse {
  baseYear: number;
  baseMonth: number;
  mode: PredictionMode;  // ← 追加: 予測モード
  currentMonth: {
    revenue: number;
    expenses: number;
    salary: number;
    fixedCosts: number;
    netCashFlow: number;
  };
  predictions: MonthlyPrediction[];
  cashDepletionWarning: CashDepletionWarning;
  updatedAt: string;
}
```

---

### 2. Googleシート構造

#### 新規作成: 「シミュレーション設定」シート

**シート名**: `シミュレーション設定`

**ヘッダー行（1行目）**:
```
A列: 項目名
B列: 売上比率(%)
C列: 備考
```

**データ例（2行目以降）**:
```
交通費         | 3.0  | 営業活動に伴う交通費
接待交際費     | 5.0  | クライアント接待費
雑費           | 2.0  | その他諸経費
印刷代         | 15.0 | 雑誌印刷コスト
配送費         | 4.0  | 雑誌配送コスト
人件費         | 25.0 | 給与・賞与
```

---

## 🛠️ 実装計画

### Phase 1: データ準備（手動作業）

#### タスク1-1: シミュレーション設定シートの作成

**手順**:
1. Googleスプレッドシート（既存の売上管理スプレッドシート）を開く
2. 新しいシート「シミュレーション設定」を追加
3. ヘッダー行を作成:
   ```
   A1: 項目名
   B1: 売上比率(%)
   C1: 備考
   ```
4. 初期データを入力:
   ```
   A2: 交通費         B2: 3.0   C2: 営業活動に伴う交通費
   A3: 接待交際費     B3: 5.0   C3: クライアント接待費
   A4: 雑費           B4: 2.0   C4: その他諸経費
   A5: 印刷代         B5: 15.0  C5: 雑誌印刷コスト
   A6: 配送費         B6: 4.0   C6: 雑誌配送コスト
   A7: 人件費         B7: 25.0  C7: 給与・賞与
   ```

**確認方法**:
- シート名が「シミュレーション設定」であることを確認
- B列の値が数値（％表示ではなく、`3.0` のような小数）であることを確認

---

### Phase 2: バックエンド実装

#### タスク2-1: シミュレーション設定API作成

**ファイル**: `app/api/simulation-settings/route.ts`（新規作成）

**仕様**:
- **エンドポイント**: `GET /api/simulation-settings`
- **レスポンス**:
  ```typescript
  {
    success: true,
    data: [
      { itemName: "交通費", salesRatio: 3.0, notes: "営業活動に伴う交通費" },
      { itemName: "接待交際費", salesRatio: 5.0, notes: "クライアント接待費" },
      // ...
    ]
  }
  ```

**実装内容**:
```typescript
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { SimulationSetting, SimulationSettingsResponse } from '@/types/financial';

export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const rawData = await getSheetData(spreadsheetId, 'シミュレーション設定!A:C');

    const settings: SimulationSetting[] = [];

    // 1行目（ヘッダー）をスキップ
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row[0]) continue;

      settings.push({
        itemName: row[0] || '',
        salesRatio: parseFloat(row[1]) || 0,
        notes: row[2] || undefined
      });
    }

    const response: SimulationSettingsResponse = {
      success: true,
      data: settings
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('シミュレーション設定取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      } as SimulationSettingsResponse,
      { status: 500 }
    );
  }
}
```

---

#### タスク2-2: 未来予測API拡張

**ファイル**: `app/api/financial-statements/future-prediction/route.ts`（既存ファイルを修正）

**変更内容**:

1. **クエリパラメータ追加**:
   - `mode`: `actual` または `simulation`（デフォルト: `actual`）

2. **APIエンドポイント例**:
   ```
   GET /api/financial-statements/future-prediction?year=2025&month=10&months=6&mode=actual
   GET /api/financial-statements/future-prediction?year=2025&month=10&months=6&mode=simulation
   ```

3. **シミュレーションモードの計算ロジック**:

```typescript
// lib/financial-calculations.ts の predictFutureCashFlow 関数を拡張

export async function predictFutureCashFlow(
  baseYear: number,
  baseMonth: number,
  months: number = 6,
  mode: PredictionMode = 'actual'  // ← 新規パラメータ
): Promise<FuturePredictionResponse> {
  // ... 既存の処理 ...

  // シミュレーション設定を取得（modeが'simulation'の場合のみ）
  let simulationSettings: SimulationSetting[] = [];
  if (mode === 'simulation') {
    const settingsData = await getSheetData(spreadsheetId, 'シミュレーション設定!A:C');
    simulationSettings = parseSimulationSettings(settingsData);
  }

  // 未来N月分の予測を生成
  for (let i = 1; i <= months; i++) {
    // ... 月の計算 ...

    let predictedExpenses = 0;
    let predictedSalary = 0;

    if (mode === 'actual') {
      // 実績ベース（既存の処理）
      predictedExpenses = calculatePredictedExpensesForMonth(expenditureData, futureYear, futureMonth);
      predictedSalary = calculatePredictedSalaryForMonth(expenditureData, futureYear, futureMonth);
    } else {
      // シミュレーションベース
      const predictedRevenue = calculatePredictedRevenueForMonth(contractData, futureYear, futureMonth);

      // 経費系の合計比率を計算
      const expenseRatios = simulationSettings
        .filter(s => ['交通費', '接待交際費', '雑費', '印刷代', '配送費'].includes(s.itemName))
        .reduce((sum, s) => sum + s.salesRatio, 0);

      // 人件費率を取得
      const salaryRatio = simulationSettings.find(s => s.itemName === '人件費')?.salesRatio || 0;

      // 予測経費・給与を計算
      predictedExpenses = Math.round(predictedRevenue * (expenseRatios / 100));
      predictedSalary = Math.round(predictedRevenue * (salaryRatio / 100));
    }

    // 固定費は両モード共通
    const predictedFixedCosts = calculatePredictedFixedCostsForMonth(fixedCostData, futureYear, futureMonth);

    // ... 残りの処理 ...
  }

  return {
    // ...
    mode,  // ← レスポンスにモードを含める
    // ...
  };
}

/**
 * シミュレーション設定データをパース
 */
function parseSimulationSettings(rows: any[][]): SimulationSetting[] {
  const settings: SimulationSetting[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;

    settings.push({
      itemName: row[0] || '',
      salesRatio: parseFloat(row[1]) || 0,
      notes: row[2] || undefined
    });
  }

  return settings;
}
```

**APIルート側の変更**:

```typescript
// app/api/financial-statements/future-prediction/route.ts

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');
    const months = parseInt(searchParams.get('months') || '6');
    const mode = (searchParams.get('mode') || 'actual') as PredictionMode;  // ← 追加

    // バリデーション
    if (!mode || !['actual', 'simulation'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode parameter' },
        { status: 400 }
      );
    }

    const result = await predictFutureCashFlow(year, month, months, mode);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    // ... エラーハンドリング ...
  }
}
```

---

#### タスク2-3: P/L計算ロジック拡張

**ファイル**: `lib/financial-calculations.ts`（既存ファイルを修正）

**変更内容**: `calculateProfitAndLoss` 関数のレスポンスに売上高比率を追加

**修正方針**:
- 現在のP/Lは `ProfitAndLoss` 型でネストされた構造
- 表示時に売上高比率を計算して追加する方が柔軟
- **→ バックエンドでは変更不要、フロントエンドで計算**

---

### Phase 3: フロントエンド実装

#### タスク3-1: P/Lコンポーネントに売上高比率を追加

**ファイル**: `components/financial-statements/PLDisplay.tsx`（既存ファイルを修正）

**変更内容**:

1. **表示データの拡張**:
   - 各行データに `salesRatio` プロパティを追加
   - 売上高を基準に比率を計算

2. **UI変更**:
   - テーブルのカラムを追加: `項目 | 金額 | 売上比率`

**実装例**:

```typescript
export function PLDisplay({ data, loading = false }: PLDisplayProps) {
  if (!data) return <div>データがありません</div>;

  const revenue = data.revenue;  // 売上高

  // 売上高比率を計算する関数
  const calcRatio = (value: number): number => {
    if (revenue === 0) return 0;
    return (value / revenue) * 100;
  };

  // 表示用データ（既存の構造に salesRatio を追加）
  const rows = [
    { type: 'header', label: '売上高', value: revenue, salesRatio: 100.0 },
    { type: 'separator' },
    { type: 'section', label: '売上原価' },
    { type: 'item', label: '　印刷代', value: data.costOfSales, salesRatio: calcRatio(data.costOfSales) },
    // ... 他の項目も同様に salesRatio を追加 ...
    { type: 'subtotal', label: '売上総利益', value: data.grossProfit, salesRatio: calcRatio(data.grossProfit) },
    // ...
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">損益計算書（P/L）</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-4">項目</th>
            <th className="text-right py-2 px-4">金額</th>
            <th className="text-right py-2 px-4">売上比率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            if (row.type === 'separator') {
              return <tr key={index}><td colSpan={3} className="border-t-2 border-gray-300"></td></tr>;
            }

            return (
              <tr key={index}>
                <td className="py-3 px-4">{row.label}</td>
                <td className="py-3 px-4 text-right">
                  {row.value !== undefined ? `${row.value.toLocaleString()}円` : ''}
                </td>
                <td className="py-3 px-4 text-right text-gray-600">
                  {row.salesRatio !== undefined ? `${row.salesRatio.toFixed(1)}%` : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### タスク3-2: 予測キャッシュフローにタブ切り替えを追加

**ファイル**: `app/dashboard/financial-statements/page.tsx`（既存ファイルを修正）

**変更内容**:

1. **State追加**:
   ```typescript
   const [predictionMode, setPredictionMode] = useState<PredictionMode>('actual');
   ```

2. **API呼び出し変更**:
   ```typescript
   const fetchFuturePrediction = async () => {
     setPredictionLoading(true);
     const response = await fetch(
       `/api/financial-statements/future-prediction?year=${selectedYear}&month=${selectedMonth}&months=${predictionMonths}&mode=${predictionMode}`
     );
     // ...
   };
   ```

3. **useEffect更新**:
   ```typescript
   useEffect(() => {
     if (!isAnnual && selectedMonth !== null) {
       fetchFuturePrediction();
     }
   }, [selectedYear, selectedMonth, isAnnual, predictionMonths, predictionMode]);  // predictionMode を依存配列に追加
   ```

4. **UI: タブボタン追加**:
   ```typescript
   {/* 予定キャッシュフロー（月次表示時のみ） */}
   {!isAnnual && selectedMonth !== null && (
     <div className="bg-white border border-gray-200 rounded-lg p-6">
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
           <h2 className="text-xl font-bold text-gray-900">予定キャッシュフロー</h2>
         </div>

         {/* 予測モード切り替え */}
         <div className="flex items-center gap-2">
           <button
             onClick={() => setPredictionMode('actual')}
             className={`px-4 py-2 rounded-lg font-medium transition-colors ${
               predictionMode === 'actual'
                 ? 'bg-purple-600 text-white'
                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
             }`}
           >
             実績ベース
           </button>
           <button
             onClick={() => setPredictionMode('simulation')}
             className={`px-4 py-2 rounded-lg font-medium transition-colors ${
               predictionMode === 'simulation'
                 ? 'bg-purple-600 text-white'
                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
             }`}
           >
             シミュレーション
           </button>
         </div>

         {/* 予測期間選択 */}
         <div className="flex items-center gap-2">
           <label className="text-sm font-medium text-gray-700">予測期間:</label>
           <select
             value={predictionMonths}
             onChange={(e) => setPredictionMonths(Number(e.target.value))}
             className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
           >
             <option value={3}>3ヶ月</option>
             <option value={6}>6ヶ月</option>
             <option value={12}>12ヶ月</option>
             <option value={24}>24ヶ月</option>
           </select>
         </div>
       </div>

       {/* モード別の説明文 */}
       <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
         <p className="text-sm text-blue-800">
           {predictionMode === 'actual'
             ? '過去3ヶ月の実績平均から予測しています'
             : 'シミュレーション設定の売上比率から予測しています'}
         </p>
       </div>

       {/* 予測データ表示 */}
       {predictionLoading ? (
         <div className="animate-pulse space-y-4">
           <div className="h-20 bg-gray-200 rounded"></div>
           <div className="h-64 bg-gray-200 rounded"></div>
         </div>
       ) : futurePrediction ? (
         <div className="space-y-6">
           <CashDepletionAlert warning={futurePrediction.cashDepletionWarning} />
           <FutureCashFlowPrediction data={futurePrediction} />
         </div>
       ) : (
         <p className="text-gray-500 text-center py-8">データがありません</p>
       )}
     </div>
   )}
   ```

---

## 📂 実装ファイル一覧

### 新規作成ファイル

1. **`app/api/simulation-settings/route.ts`**
   - シミュレーション設定API

### 修正ファイル

1. **`types/financial.ts`**
   - `SimulationSetting` 型追加
   - `SimulationSettingsResponse` 型追加
   - `PredictionMode` 型追加
   - `FuturePredictionResponse` に `mode` プロパティ追加
   - `PLDisplayRow` に `salesRatio` プロパティ追加（オプション）

2. **`lib/financial-calculations.ts`**
   - `predictFutureCashFlow` 関数に `mode` パラメータ追加
   - `parseSimulationSettings` 関数追加
   - シミュレーションモードの計算ロジック追加

3. **`app/api/financial-statements/future-prediction/route.ts`**
   - クエリパラメータ `mode` の追加
   - バリデーション追加

4. **`components/financial-statements/PLDisplay.tsx`**
   - 売上高比率カラムの追加
   - 各行データに `salesRatio` を計算して表示

5. **`app/dashboard/financial-statements/page.tsx`**
   - `predictionMode` state 追加
   - タブ切り替えUI追加
   - モード別の説明文追加

---

## ✅ テスト項目

### Phase 1: データ準備の確認

- [ ] Googleスプレッドシートに「シミュレーション設定」シートが作成されている
- [ ] ヘッダー行が正しく設定されている（A1: 項目名, B1: 売上比率(%), C1: 備考）
- [ ] 初期データが6項目入力されている（交通費、接待交際費、雑費、印刷代、配送費、人件費）
- [ ] B列の値が数値（例: `3.0`）であり、パーセント記号がない

### Phase 2: API動作確認

#### シミュレーション設定API

- [ ] `GET /api/simulation-settings` が正常にレスポンスを返す
- [ ] レスポンスに6項目のデータが含まれている
- [ ] `salesRatio` が数値として正しく取得されている

**テストコマンド**:
```bash
curl "http://127.0.0.1:3000/api/simulation-settings" | python3 -m json.tool
```

**期待レスポンス**:
```json
{
  "success": true,
  "data": [
    { "itemName": "交通費", "salesRatio": 3.0, "notes": "営業活動に伴う交通費" },
    { "itemName": "接待交際費", "salesRatio": 5.0, "notes": "クライアント接待費" },
    { "itemName": "雑費", "salesRatio": 2.0, "notes": "その他諸経費" },
    { "itemName": "印刷代", "salesRatio": 15.0, "notes": "雑誌印刷コスト" },
    { "itemName": "配送費", "salesRatio": 4.0, "notes": "雑誌配送コスト" },
    { "itemName": "人件費", "salesRatio": 25.0, "notes": "給与・賞与" }
  ]
}
```

#### 未来予測API（実績ベース）

- [ ] `GET /api/financial-statements/future-prediction?year=2025&month=10&months=6&mode=actual` が正常動作
- [ ] レスポンスの `mode` が `"actual"` になっている
- [ ] 予測値が過去3ヶ月の実績平均と一致している

#### 未来予測API（シミュレーションベース）

- [ ] `GET /api/financial-statements/future-prediction?year=2025&month=10&months=6&mode=simulation` が正常動作
- [ ] レスポンスの `mode` が `"simulation"` になっている
- [ ] 予測経費・給与が、予測売上 × シミュレーション設定比率で計算されている

**検証例**:
```
予測売上: 1,000,000円
経費系合計比率: 3% + 5% + 2% + 15% + 4% = 29%
人件費比率: 25%

期待値:
予測経費: 1,000,000 × 29% = 290,000円
予測給与: 1,000,000 × 25% = 250,000円
```

### Phase 3: UI確認

#### P/L表示

- [ ] 損益計算書に「売上比率」カラムが表示されている
- [ ] 各項目の売上比率が正しく計算されている（売上高が100.0%、他の項目が適切な％）
- [ ] 売上高が0円の場合、エラーが発生せず `0.0%` または `-` が表示される
- [ ] 小数点以下1桁で表示されている（例: `25.5%`）

#### 予測キャッシュフロー

- [ ] 「実績ベース」と「シミュレーションベース」のタブボタンが表示されている
- [ ] タブを切り替えると、データが再取得されている（ローディング表示が出る）
- [ ] 実績ベースとシミュレーションベースで予測値が異なっている
- [ ] モード別の説明文が表示されている
  - 実績ベース: 「過去3ヶ月の実績平均から予測しています」
  - シミュレーションベース: 「シミュレーション設定の売上比率から予測しています」

### Phase 4: 統合テスト

- [ ] 財務諸表ページで、P/Lの％とシミュレーション設定の％を比較できる
- [ ] シミュレーション設定シートの値を変更すると、予測キャッシュフロー（シミュレーションベース）の値が変わる
- [ ] 実績ベースとシミュレーションベースで、現金枯渇警告が異なる場合がある
- [ ] ビルドが成功する（TypeScriptエラーがない）
- [ ] 本番環境にデプロイできる

---

## 📌 実装上の注意点

### 1. エラーハンドリング

- シミュレーション設定シートが存在しない場合のエラーハンドリング
- 売上高が0円の場合のゼロ除算エラー対策
- APIレスポンスが不正な場合のフォールバック

### 2. パフォーマンス

- シミュレーションモードでも、既存のデータ取得ロジックを再利用
- API呼び出しを最小化（タブ切り替え時のみ再取得）

### 3. UI/UX

- タブ切り替え時のローディング表示
- モード別の説明文を明確に表示
- モバイル対応（タブボタンのレスポンシブデザイン）

### 4. データ整合性

- シミュレーション設定の項目名が固定（ハードコードではなく、柔軟に対応）
- 項目名の揺れ（全角・半角、スペースなど）に対応する場合は正規化処理を追加

---

## 🚀 リリース手順

1. **データ準備**: シミュレーション設定シートを作成
2. **バックエンド実装**: API作成・既存API拡張
3. **フロントエンド実装**: UI変更・タブ追加
4. **ローカルテスト**: 上記テスト項目を全て確認
5. **コミット・プッシュ**: Git管理
6. **本番デプロイ**: Vercel本番環境へデプロイ
7. **本番確認**: 実際のデータで動作確認

---

## 📚 参考情報

### 関連ドキュメント

- `docs/development/development-progress.md` - 現在の開発状況
- `docs/development/REVENUE-RECOGNITION-REQUIREMENTS.md` - 売上・入金認識の要件定義
- `CLAUDE.md` - プロジェクト全体の開発ガイド

### 関連ファイル

- `lib/financial-calculations.ts` - 財務計算ロジック
- `types/financial.ts` - 財務関連の型定義
- `app/dashboard/financial-statements/page.tsx` - 財務諸表ダッシュボード

---

**このドキュメントを読めば、次世代Claude Codeが暗黙知なしで実装できます！**
