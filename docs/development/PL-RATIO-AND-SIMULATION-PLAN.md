# P/L比率表示 & シミュレーション予測機能 実装計画書（完全版）

**作成日**: 2025-10-19
**最終更新**: 2025-10-19
**対象バージョン**: Phase 1（基本機能実装） + Phase 2（履歴保存・精度向上）
**優先度**: 🔴 **高**

---

## 📋 目次

1. [背景・目的](#背景目的)
2. [要件定義](#要件定義)
   - 要件1: P/Lに売上高比率（％）を追加
   - 要件2: シミュレーションベースの予測キャッシュフロー
   - 要件3: 税金支払設定（経営マストイベント）
   - 要件4: PL履歴保存機能（Phase 2）
3. [データ構造設計](#データ構造設計)
4. [実装計画](#実装計画)
   - Phase 1: 基本機能実装
   - Phase 2: 履歴保存・精度向上
5. [UI設計](#ui設計)
6. [実装ファイル一覧](#実装ファイル一覧)
7. [テスト項目](#テスト項目)

---

## 🎯 背景・目的

### 現状の課題

1. **P/Lに比率表示がない**
   - 各経費項目が売上高の何％を占めているか分からない
   - 経費コントロールの目安がない
   - 過去の実績を比較できない

2. **予測キャッシュフローの精度が低い**
   - 現在は「過去3ヶ月の平均」を使用
   - 売上が増減しても、経費が連動しない
   - 将来のビジネスプランをシミュレーションできない

3. **税金支払のインパクトが見えない**
   - 法人税、消費税などの支払月にキャッシュが大きく減る
   - 税金支払を考慮したキャッシュフロー予測ができない
   - 資金繰りの見通しが甘くなる

### 目指すゴール

1. **P/Lに売上高比率（％）を表示**
   - 交通費率、人件費率、接待交際費率、原価率などを可視化
   - 経営判断の指標として活用
   - 履歴を保存して、トレンド分析・PDCA改善

2. **シミュレーションベースの予測キャッシュフロー**
   - 「実績ベース」と「シミュレーションベース」をタブ切り替え
   - シミュレーション設定シートで、各経費の目標売上比率（％）を設定
   - 予測売上に対して、設定した％を掛けて経費を計算
   - 売上増減に連動して経費も変動するため、精度が向上

3. **税金支払を組み込んだ予測**
   - 法人税、消費税などの支払月・金額を設定
   - キャッシュフロー予測に税金を反映
   - 資金繰りの見通しを正確化

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
- 既存の `SALES_SPREADSHEET_ID` のスプレッドシート内に「シミュレーション設定」シートを追加
- 新しい環境変数は不要

---

#### 2.2 予測キャッシュフロー: 2つのモード

**モード1: 実績ベース（現行仕様、変更なし）**

- **予定入金**: 入金予定日ベース
- **予測経費**: 過去3ヶ月の実績平均（C/Fベース）
- **予測給与**: 過去3ヶ月の実績平均（C/Fベース）
- **予測固定費**: 固定費マスタから計算

**モード2: シミュレーションベース（新規追加）**

- **予定入金**: 入金予定日ベース（実績ベースと同じ）
- **予測経費**: **予定入金 × シミュレーション設定の売上比率（％）の合計**
  - 計算式: `(交通費率 + 接待交際費率 + 雑費率 + 印刷代率 + 配送費率) × 予定入金`
  - 例: 予定入金が100万円、経費系の合計比率が29%の場合 → 29万円
- **予測給与**: **予定入金 × シミュレーション設定の人件費率（％）**
  - 計算式: `人件費率 × 予定入金`
  - 例: 予定入金が100万円、人件費率が25%の場合 → 25万円
- **予測固定費**: 固定費マスタから計算（実績ベースと同じ）
- **税金**: 税金支払設定から計算（後述）

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

---

### 要件3: 税金支払設定（経営マストイベント）

#### 3.1 背景

**経営上の重要イベント（税金支払）**:
- 法人税、消費税などの支払月にキャッシュが大きく減少
- 税金を考慮しないと、キャッシュフロー予測が甘くなる
- 資金繰りの見通しが不正確になる

#### 3.2 税金支払設定シート（新規作成）

**Googleスプレッドシート**: 「税金支払設定」シート（新規作成）

**列構造**:

| 列 | Index | 内容 | 説明 | 例 |
|---|---|---|---|---|
| A | 0 | 税金種別 | 税金の名前 | `法人税等` |
| B | 1 | 支払月（1-12） | 支払う月 | `11` |
| C | 2 | 計算方法 | `固定` / `売上比率` / `利益比率` | `利益比率` |
| D | 3 | 比率または金額 | ％または円 | `30` |
| E | 4 | 備考 | メモ欄 | `実効税率30%` |

**初期データ例（WEB制作・広告業、9月決算法人）**:

```
税金種別       | 支払月 | 計算方法   | 比率/金額 | 備考
------------------------------------------------------------
法人税等       | 11    | 利益比率   | 30       | 実効税率30%（年間利益×30%）
法人税等（中間）| 5     | 固定      | 500000   | 前年実績の半分
消費税（確定）  | 11    | 売上比率   | 5        | 簡易課税・第五種（年間売上×5%）
消費税（中間）  | 5     | 固定      | 300000   | 前年実績の半分
```

**計算方法の説明**:

1. **固定**: 設定した金額をそのまま使用
   - 用途: 中間納付（前年実績ベース）
   - 例: `500,000円`

2. **売上比率**: 月次予定入金 × 設定した比率（％）
   - 用途: 消費税（売上に連動）
   - 計算式: `予定入金 × (比率 / 100)`
   - 例: 予定入金100万円、比率5% → 5万円

3. **利益比率**: 年間予測利益 × 設定した比率（％）
   - 用途: 法人税（利益に連動）
   - 計算式: `(月次予定入金 - 月次予測経費 - 月次予測給与 - 月次予測固定費) × 12 × (比率 / 100)`
   - 例: 月次利益30万円 → 年間利益360万円 → 法人税108万円（30%）

#### 3.3 日本の税制（2024-2025年時点）

**法人税**:
- 支払時期: 事業年度終了の翌日から2ヶ月以内
- 中間納付: 事業年度開始から6ヶ月後の2ヶ月以内
- 実効税率: 約30%（法人税+地方法人税等）

**消費税**:
- 支払時期: 事業年度終了の翌日から2ヶ月以内
- 中間納付: 前年の消費税額に応じて年1回、3回、または11回
- 簡易課税制度（WEB制作・広告業＝第五種）:
  - みなし仕入率: 50%
  - 実質納付率: 売上の約5%

#### 3.4 シミュレーション予測への反映

**予測キャッシュフロー（シミュレーションバージョン）の計算式**:
```
純増減 = 予定入金 - 予測経費 - 予測給与 - 予測固定費 - 税金支払
```

**該当月のみ税金が差し引かれる例**:
```
2025/3月: 純増減 = 100万 - 29万 - 25万 - 20万 - 0（税金なし） = 26万
2025/5月: 純増減 = 100万 - 29万 - 25万 - 20万 - 80万（法人税中間+消費税中間） = -54万
2025/11月: 純増減 = 100万 - 29万 - 25万 - 20万 - 188万（法人税確定+消費税確定） = -162万
```

#### 3.5 UI表示

**予測テーブルに「税金」カラムを追加**:

```
月     | 予定入金 | 予測経費 | 予測給与 | 予測固定費 | 税金    | 純増減  | 累積残高
---------------------------------------------------------------------------------
2025/3 | 100万   | 29万    | 25万    | 20万      | 0      | 26万    | 126万
2025/5 | 100万   | 29万    | 25万    | 20万      | 80万   | -54万   | 72万
2025/11| 100万   | 29万    | 25万    | 20万      | 188万  | -162万  | -90万 ⚠️
```

---

### 要件4: PL履歴保存機能（Phase 2）

#### 4.1 目的

- P/Lの％実績値を月次で保存
- 過去の推移を可視化（トレンド分析）
- シミュレーション精度の向上（過去の平均利益率から税金を計算）

#### 4.2 保存する項目

**PL履歴保存シート（新規作成）**: 「PL比率履歴」

| 列 | 内容 | 例 |
|---|---|---|
| A | 年月 | `2025/10` |
| B | 売上高 | `1000000` |
| C | 売上原価 | `200000` |
| D | 売上原価率(%) | `20.0` |
| E | 人件費 | `250000` |
| F | 人件費率(%) | `25.0` |
| G | 交通費 | `30000` |
| H | 交通費率(%) | `3.0` |
| I | 接待交際費 | `50000` |
| J | 接待交際費率(%) | `5.0` |
| K | 雑費 | `20000` |
| L | 雑費率(%) | `2.0` |
| M | 固定費 | `200000` |
| N | 固定費率(%) | `20.0` |
| O | 営業利益 | `250000` |
| P | 営業利益率(%) | `25.0` |

#### 4.3 保存タイミング

**手動更新ボタン**:
- P/L表示画面に「履歴保存」ボタンを追加
- ボタンをクリックすると、現在表示中のP/Lデータを履歴シートに追加
- APIエンドポイント: `POST /api/financial-statements/save-history`

#### 4.4 履歴データの活用

**トレンド分析**:
- 過去3-6ヶ月の各比率を折れ線グラフで表示
- 「人件費率が上昇傾向」などの気づきを得る

**シミュレーション精度向上**:
- 過去の平均利益率から税金を自動計算
- 計算式: `年間予測利益 = 月次予定入金 × 過去平均利益率 × 12`

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
```

#### 税金支払設定の型

```typescript
/**
 * 税金支払設定項目
 */
export interface TaxPaymentSetting {
  taxType: string;                               // A列: 税金種別
  paymentMonth: number;                          // B列: 支払月（1-12）
  calculationMethod: 'fixed' | 'salesRatio' | 'profitRatio';  // C列: 計算方法
  rateOrAmount: number;                          // D列: 比率（％）または金額（円）
  notes?: string;                                // E列: 備考
}
```

#### PL履歴の型

```typescript
/**
 * PL比率履歴項目
 */
export interface PLHistoryRecord {
  yearMonth: string;          // A列: 年月（YYYY/MM）
  revenue: number;            // B列: 売上高
  costOfSalesRatio: number;   // D列: 売上原価率(%)
  salaryRatio: number;        // F列: 人件費率(%)
  travelExpenseRatio: number; // H列: 交通費率(%)
  entertainmentRatio: number; // J列: 接待交際費率(%)
  miscExpenseRatio: number;   // L列: 雑費率(%)
  fixedCostRatio: number;     // N列: 固定費率(%)
  operatingProfitRatio: number; // P列: 営業利益率(%)
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
 * 月次予測データ（拡張版）
 */
export interface MonthlyPrediction {
  year: number;
  month: number;
  period: string;

  // 予測値
  predictedRevenue: number;
  predictedExpenses: number;
  predictedSalary: number;
  predictedFixedCosts: number;
  predictedTax: number;           // ← 追加: 予測税金

  // 計算値
  netCashFlow: number;
  cumulativeCashFlow: number;

  // メタ情報
  isPredicted: true;
}

/**
 * 未来予測レスポンス（拡張版）
 */
export interface FuturePredictionResponse {
  baseYear: number;
  baseMonth: number;
  mode: PredictionMode;  // ← 追加: 予測モード
  currentCash: number;   // 現在の現金残高
  historicalAverage: {
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

#### 新規作成1: 「シミュレーション設定」シート

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

#### 新規作成2: 「税金支払設定」シート

**シート名**: `税金支払設定`

**ヘッダー行（1行目）**:
```
A列: 税金種別
B列: 支払月（1-12）
C列: 計算方法
D列: 比率または金額
E列: 備考
```

**データ例（2行目以降、WEB制作・広告業、9月決算法人）**:
```
法人税等       | 11 | 利益比率 | 30     | 実効税率30%（年間利益×30%）
法人税等（中間）| 5  | 固定    | 500000 | 前年実績の半分
消費税（確定）  | 11 | 売上比率 | 5      | 簡易課税・第五種（年間売上×5%）
消費税（中間）  | 5  | 固定    | 300000 | 前年実績の半分
```

---

#### 新規作成3: 「PL比率履歴」シート（Phase 2）

**シート名**: `PL比率履歴`

**ヘッダー行（1行目）**:
```
A列: 年月
B列: 売上高
C列: 売上原価
D列: 売上原価率(%)
E列: 人件費
F列: 人件費率(%)
G列: 交通費
H列: 交通費率(%)
I列: 接待交際費
J列: 接待交際費率(%)
K列: 雑費
L列: 雑費率(%)
M列: 固定費
N列: 固定費率(%)
O列: 営業利益
P列: 営業利益率(%)
```

---

## 🛠️ 実装計画

### Phase 1: 基本機能実装（優先）

#### タスク1-1: データ準備（手動作業）

**シミュレーション設定シートの作成**:
1. Googleスプレッドシート（既存の売上管理スプレッドシート）を開く
2. 新しいシート「シミュレーション設定」を追加
3. ヘッダー行と初期データを入力（前述の通り）

**税金支払設定シートの作成**:
1. 同じスプレッドシート内に「税金支払設定」シートを追加
2. ヘッダー行と初期データを入力（前述の通り）

---

#### タスク1-2: バックエンド実装

**1. シミュレーション設定API作成**

**ファイル**: `app/api/simulation-settings/route.ts`（新規作成）

**エンドポイント**: `GET /api/simulation-settings`

**実装内容**:
```typescript
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { SimulationSetting } from '@/types/financial';

export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const rawData = await getSheetData(spreadsheetId, 'シミュレーション設定!A:C');

    const settings: SimulationSetting[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row[0]) continue;

      settings.push({
        itemName: row[0] || '',
        salesRatio: parseFloat(row[1]) || 0,
        notes: row[2] || undefined
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
```

---

**2. 税金支払設定API作成**

**ファイル**: `app/api/tax-payment-settings/route.ts`（新規作成）

**エンドポイント**: `GET /api/tax-payment-settings`

**実装内容**:
```typescript
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { TaxPaymentSetting } from '@/types/financial';

export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const rawData = await getSheetData(spreadsheetId, '税金支払設定!A:E');

    const settings: TaxPaymentSetting[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const calculationMethod = row[2];
      let method: 'fixed' | 'salesRatio' | 'profitRatio' = 'fixed';
      if (calculationMethod === '売上比率') method = 'salesRatio';
      else if (calculationMethod === '利益比率') method = 'profitRatio';

      settings.push({
        taxType: row[0] || '',
        paymentMonth: parseInt(row[1]) || 1,
        calculationMethod: method,
        rateOrAmount: parseFloat(row[3]) || 0,
        notes: row[4] || undefined
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
```

---

**3. 未来予測API拡張**

**ファイル**: `lib/financial-calculations.ts`（既存ファイルを修正）

**変更内容**: `predictFutureCashFlow` 関数を拡張

```typescript
export async function predictFutureCashFlow(
  baseYear: number,
  baseMonth: number,
  months: number = 6,
  mode: PredictionMode = 'actual'
): Promise<FuturePredictionResponse> {
  const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

  // データ取得
  const [currentBS, contractData, expenditureData, fixedCostData, simulationSettings, taxSettings] = await Promise.all([
    calculateBalanceSheet(baseYear, baseMonth),
    getSheetData(spreadsheetId, '契約・入金管理!A:AH'),
    getSheetData(spreadsheetId, '支出管理マスタ!A:J'),
    getSheetData(spreadsheetId, '固定費マスタ!A:H'),
    mode === 'simulation' ? getSheetData(spreadsheetId, 'シミュレーション設定!A:C') : Promise.resolve([]),
    mode === 'simulation' ? getSheetData(spreadsheetId, '税金支払設定!A:E') : Promise.resolve([])
  ]);

  const currentCash = currentBS.assets.currentAssets.cash;

  // シミュレーション設定をパース
  const simSettings = mode === 'simulation' ? parseSimulationSettings(simulationSettings) : [];
  const taxPayments = mode === 'simulation' ? parseTaxPaymentSettings(taxSettings) : [];

  // 予測ループ
  const predictions: MonthlyPrediction[] = [];
  let cumulativeCash = currentCash;

  for (let i = 1; i <= months; i++) {
    const futureYear = baseMonth + i > 12 ? baseYear + 1 : baseYear;
    const futureMonth = (baseMonth + i - 1) % 12 + 1;

    let predictedRevenue = calculatePredictedRevenueForMonth(contractData, futureYear, futureMonth);
    let predictedExpenses = 0;
    let predictedSalary = 0;
    let predictedTax = 0;

    if (mode === 'actual') {
      // 実績ベース
      predictedExpenses = calculatePredictedExpensesForMonth(expenditureData, futureYear, futureMonth);
      predictedSalary = calculatePredictedSalaryForMonth(expenditureData, futureYear, futureMonth);
    } else {
      // シミュレーションベース
      const expenseRatios = simSettings
        .filter(s => ['交通費', '接待交際費', '雑費', '印刷代', '配送費'].includes(s.itemName))
        .reduce((sum, s) => sum + s.salesRatio, 0);
      const salaryRatio = simSettings.find(s => s.itemName === '人件費')?.salesRatio || 0;

      predictedExpenses = Math.round(predictedRevenue * (expenseRatios / 100));
      predictedSalary = Math.round(predictedRevenue * (salaryRatio / 100));

      // 税金計算
      predictedTax = calculateTaxForMonth(
        futureMonth,
        predictedRevenue,
        predictedExpenses,
        predictedSalary,
        taxPayments
      );
    }

    const predictedFixedCosts = calculatePredictedFixedCostsForMonth(fixedCostData, futureYear, futureMonth);
    const netCashFlow = Math.round(predictedRevenue - predictedExpenses - predictedSalary - predictedFixedCosts - predictedTax);
    cumulativeCash = Math.round(cumulativeCash + netCashFlow);

    predictions.push({
      year: futureYear,
      month: futureMonth,
      period: `${futureYear}/${String(futureMonth).padStart(2, '0')}`,
      predictedRevenue,
      predictedExpenses,
      predictedSalary,
      predictedFixedCosts,
      predictedTax,
      netCashFlow,
      cumulativeCashFlow: cumulativeCash,
      isPredicted: true
    });
  }

  // 履歴平均計算（実績ベース用）
  const historicalAverage = mode === 'actual'
    ? await getHistoricalAverages(baseYear, baseMonth)
    : { revenue: 0, expenses: 0, salary: 0, fixedCosts: 0, netCashFlow: 0 };

  return {
    baseYear,
    baseMonth,
    mode,
    currentCash,
    historicalAverage,
    predictions,
    cashDepletionWarning: calculateCashDepletionWarning(predictions),
    updatedAt: new Date().toISOString()
  };
}

/**
 * 税金計算（該当月のみ）
 */
function calculateTaxForMonth(
  month: number,
  revenue: number,
  expenses: number,
  salary: number,
  fixedCosts: number,
  taxSettings: TaxPaymentSetting[]
): number {
  let totalTax = 0;

  // 該当月の税金設定を抽出
  const monthlyTaxes = taxSettings.filter(t => t.paymentMonth === month);

  for (const tax of monthlyTaxes) {
    if (tax.calculationMethod === 'fixed') {
      totalTax += tax.rateOrAmount;
    } else if (tax.calculationMethod === 'salesRatio') {
      totalTax += revenue * (tax.rateOrAmount / 100);
    } else if (tax.calculationMethod === 'profitRatio') {
      const monthlyProfit = revenue - expenses - salary - fixedCosts;
      const annualProfit = monthlyProfit * 12;
      totalTax += annualProfit * (tax.rateOrAmount / 100);
    }
  }

  return Math.round(totalTax);
}
```

---

#### タスク1-3: フロントエンド実装

**1. P/Lコンポーネントに売上高比率を追加**

**ファイル**: `components/financial-statements/PLDisplay.tsx`（既存ファイルを修正）

**変更内容**: テーブルに「売上比率」カラムを追加

```typescript
export function PLDisplay({ data, loading = false }: PLDisplayProps) {
  if (!data) return <div>データがありません</div>;

  const revenue = data.revenue;

  const calcRatio = (value: number): number => {
    if (revenue === 0) return 0;
    return (value / revenue) * 100;
  };

  const rows = [
    { type: 'header', label: '売上高', value: revenue, salesRatio: 100.0 },
    // ... 他の項目に salesRatio を追加 ...
  ];

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>項目</th>
          <th>金額</th>
          <th>売上比率</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            <td>{row.label}</td>
            <td>{row.value?.toLocaleString()}円</td>
            <td>{row.salesRatio?.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

**2. 予測キャッシュフローにタブ切り替えを追加**

**ファイル**: `app/dashboard/financial-statements/page.tsx`（既存ファイルを修正）

**変更内容**:
- `predictionMode` state 追加
- タブボタンUI追加
- 予測テーブルに「税金」カラム追加

---

**3. 予測テーブルコンポーネントの拡張**

**ファイル**: `components/financial-statements/FutureCashFlowPrediction.tsx`（既存ファイルを修正）

**変更内容**: テーブルに「税金」カラムを追加

```typescript
<th>税金</th>
// ...
<td>{formatCurrency(prediction.predictedTax)}</td>
```

---

### Phase 2: 履歴保存・精度向上（後回しOK）

#### タスク2-1: PL履歴保存シートの作成

**手動作業**: Googleスプレッドシート内に「PL比率履歴」シートを作成

---

#### タスク2-2: PL履歴保存API作成

**ファイル**: `app/api/financial-statements/save-history/route.ts`（新規作成）

**エンドポイント**: `POST /api/financial-statements/save-history`

**リクエストボディ**:
```json
{
  "year": 2025,
  "month": 10,
  "plData": { /* P/Lデータ */ }
}
```

---

#### タスク2-3: UI: 履歴保存ボタン追加

**ファイル**: `components/financial-statements/PLDisplay.tsx`

**変更内容**: 「履歴保存」ボタンを追加

---

#### タスク2-4: 履歴データ表示

**新規コンポーネント**: `components/financial-statements/PLHistoryChart.tsx`

**内容**: 過去3-6ヶ月の比率推移を折れ線グラフで表示

---

## 📂 実装ファイル一覧

### 新規作成ファイル（Phase 1）

1. **`app/api/simulation-settings/route.ts`** - シミュレーション設定API
2. **`app/api/tax-payment-settings/route.ts`** - 税金支払設定API

### 修正ファイル（Phase 1）

1. **`types/financial.ts`** - 型定義追加
2. **`lib/financial-calculations.ts`** - 予測計算ロジック拡張
3. **`app/api/financial-statements/future-prediction/route.ts`** - クエリパラメータ追加
4. **`components/financial-statements/PLDisplay.tsx`** - 売上比率カラム追加
5. **`components/financial-statements/FutureCashFlowPrediction.tsx`** - 税金カラム追加
6. **`app/dashboard/financial-statements/page.tsx`** - タブ切り替えUI追加

### 新規作成ファイル（Phase 2）

1. **`app/api/financial-statements/save-history/route.ts`** - PL履歴保存API
2. **`components/financial-statements/PLHistoryChart.tsx`** - 履歴グラフ表示

---

## ✅ テスト項目

### Phase 1: 基本機能

#### シミュレーション設定API

- [ ] `GET /api/simulation-settings` が正常にレスポンスを返す
- [ ] 6項目のデータが取得できる
- [ ] `salesRatio` が数値として正しく取得されている

#### 税金支払設定API

- [ ] `GET /api/tax-payment-settings` が正常にレスポンスを返す
- [ ] 計算方法が正しくパースされている（`固定` → `fixed`）
- [ ] 支払月が1-12の範囲内

#### 未来予測API（シミュレーションモード）

- [ ] 予測経費が `予定入金 × 経費系比率合計` で計算されている
- [ ] 予測給与が `予定入金 × 人件費率` で計算されている
- [ ] 税金が該当月のみ加算されている
- [ ] 法人税が `年間利益 × 30%` で計算されている（利益比率）
- [ ] 消費税が `予定入金 × 5%` で計算されている（売上比率）

#### UI確認

- [ ] P/Lに「売上比率」カラムが表示されている
- [ ] タブ切り替えが動作する（実績ベース ⇔ シミュレーション）
- [ ] 予測テーブルに「税金」カラムが表示されている
- [ ] 税金支払月に金額が表示され、それ以外の月は0円

### Phase 2: 履歴保存

- [ ] PL履歴保存APIが動作する
- [ ] 履歴シートにデータが追加される
- [ ] 履歴グラフが表示される

---

## 📌 実装上の注意点

### 1. エラーハンドリング

- シミュレーション設定シートが存在しない場合のフォールバック
- 税金支払設定シートが存在しない場合は税金=0として扱う
- 売上高が0円の場合のゼロ除算エラー対策

### 2. データ整合性

- 計算方法の文字列（`固定` / `売上比率` / `利益比率`）の正規化
- 支払月が1-12の範囲外の場合のバリデーション

### 3. パフォーマンス

- API呼び出しを最小化（並列実行）
- タブ切り替え時のみデータ再取得

---

## 🚀 リリース手順

### Phase 1

1. Googleスプレッドシートに「シミュレーション設定」「税金支払設定」シートを作成
2. バックエンド実装（API作成・拡張）
3. フロントエンド実装（UI変更）
4. ローカルテスト
5. コミット・プッシュ
6. 本番デプロイ

### Phase 2

1. 「PL比率履歴」シート作成
2. 履歴保存API実装
3. 履歴表示UI実装
4. テスト・デプロイ

---

## 📚 参考情報

### 関連ドキュメント

- `docs/development/development-progress.md` - 開発進捗
- `docs/development/REVENUE-RECOGNITION-REQUIREMENTS.md` - 売上認識要件
- `CLAUDE.md` - 開発ガイド

### 関連ファイル

- `lib/financial-calculations.ts` - 財務計算ロジック
- `types/financial.ts` - 型定義
- `app/dashboard/financial-statements/page.tsx` - 財務諸表ダッシュボード

---

**このドキュメントを読めば、次世代Claude Codeが暗黙知なしで実装できます！**
