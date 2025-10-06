# ダッシュボード改善プロセス - 営業管理の事例

このドキュメントは、営業管理ダッシュボードの改善プロセスを記録したものです。
他のダッシュボード（ゆめマガ制作、タスク管理、SNS投稿、LLMO）の改善時にも同じプロセスを適用してください。

## 改善の目的

**TOPページと専用ダッシュボードのUI統一**
- TOPページ: 概要表示（サマリー）
- 専用ダッシュボード: 詳細表示
- 両者のレイアウト・データ構造・色分けルールを統一

## 改善前の状態

### 問題点
1. **TOPページと営業管理ダッシュボードでレイアウトが異なる**
   - 週別商談予定カレンダー: TOPは全週表示、ダッシュボードは5週のみ
   - ステータス別件数: TOPは初回商談待ちのみ、ダッシュボードは全ステータス
   - 行動量ステータス: TOPは「過不足」のみ、ダッシュボードは詳細（目標/必要/実績/過不足）
   - ゆめマガ配布状況: TOPは「実績/目標」形式、ダッシュボードは詳細カード

2. **APIレスポンス構造の問題**
   - Analytics APIのレスポンス構造が間違っていた（`summary` → `metrics`）

3. **週別商談予定のロジック不備**
   - 11/9のような次月の日付が正しい週にカウントされない
   - 月末の週が途中で切れてしまう

4. **データ取得の非効率性**
   - KPIダッシュボード、月次予実管理、顧客マスタを個別に取得していた

## 改善プロセス

### Phase 1: 問題の調査と分析

#### 1-1. API側の調査
**ファイル**: `app/api/sales-kpi/route.ts`

1. **Google Sheetsのデータ構造を確認**
   - KPIダッシュボード: A1:K25（転換率データを含む）
   - 月次予実管理: A1:W15（10月データは3行目）
   - 顧客マスタ: A1:S100（ネクスト日=Q列、ステータス=R列）

2. **必要なデータを洗い出し**
   - 月次予実管理: 契約件数、売上、入金、未入金
   - 顧客マスタ: 週別商談予定、報告待ち、ステータス別件数
   - KPIダッシュボード: 行動量メトリクス、転換率、ゆめマガ配布状況

3. **型定義の追加**
   **ファイル**: `types/sales.ts`
   ```typescript
   export interface MonthlyPerformance {
     contractTarget: number;
     contractActual: number;
     contractGap: number;
     revenueTarget: number;
     revenueActual: number;
     revenueGap: number;
     paymentTarget: number;
     paymentActual: number;
     unpaidAmount: number;
   }

   export interface CustomerMasterStats {
     weeklyMeetings: Array<{
       weekLabel: string;
       weekRange: string;
       count: number;
     }>;
     awaitingReport: number;
     statusCounts: {
       initialMeeting: number;
       awaitingResponse: number;
       inNegotiation: number;
       suspended: number;
       closed: number;
     };
   }
   ```

#### 1-2. データ取得の最適化

**変更内容**:
```typescript
// Before: 個別取得
const kpiData = await getSheetData(spreadsheetId, 'KPIダッシュボード!A1:K20');

// After: 一括取得
const [kpiData, monthlyData, customerData, statusColumn] = await getBatchSheetData(
  spreadsheetId,
  [
    'KPIダッシュボード!A1:K25',
    '月次予実管理!A1:W15',
    '顧客マスタ!A1:S100',
    '顧客マスタ!R1:R100', // ステータス列を直接取得
  ]
);
```

**理由**: 複数シートからのデータ取得を1回のAPI呼び出しに集約し、パフォーマンスを改善

#### 1-3. データパース関数の実装

##### 月次予実管理のパース
```typescript
function parseMonthlyPerformance(data: any[][]): MonthlyPerformance {
  // 10月のデータは3行目（インデックス2）
  const octoberRow = data[2] || [];

  const parseNumber = (val: string) => {
    if (!val) return 0;
    return parseInt(val.replace(/[¥,]/g, '')) || 0;
  };

  return {
    contractTarget: parseNumber(octoberRow[1]), // B列
    contractActual: parseNumber(octoberRow[6]), // G列
    contractGap: parseNumber(octoberRow[8]), // I列
    revenueTarget: parseNumber(octoberRow[9]), // J列
    revenueActual: parseNumber(octoberRow[10]), // K列
    revenueGap: parseNumber(octoberRow[12]), // M列
    paymentTarget: parseNumber(octoberRow[13]), // N列
    paymentActual: parseNumber(octoberRow[14]), // O列
    unpaidAmount: parseNumber(octoberRow[16]), // Q列
  };
}
```

**ポイント**:
- 通貨記号（¥）とカンマを除去してから数値変換
- 列インデックスはGoogle Sheetsの列と正確に対応

##### 顧客マスタのパース（週別商談予定）

**初期実装の問題点**:
```typescript
// 問題: 10月の5週まで（10/27-10/31）しか生成されない
const monthEnd = new Date(currentYear, currentMonth + 1, 0);
```

**修正後**:
```typescript
// 解決: 来月末まで拡張し、週を途中で切らない
const extendedEnd = new Date(currentYear, currentMonth + 2, 0); // 11月末まで

while (currentWeekStart < monthEnd) {
  // 週の終了日を計算（常に日曜日まで）
  const weekStartDay = currentWeekStart.getDay();
  const daysUntilSunday = weekStartDay === 0 ? 0 : 7 - weekStartDay;
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + daysUntilSunday);
  currentWeekEnd.setHours(23, 59, 59, 999);

  // 週情報を追加
  weeks.push({
    weekLabel: `第${weekNumber}週 (${formatDate(currentWeekStart)}-${formatDate(currentWeekEnd)})`,
    weekRange: `${currentWeekStart.getTime()}-${currentWeekEnd.getTime()}`,
    count: 0,
  });

  // 次の週へ（日曜の翌日=月曜）
  currentWeekStart = new Date(currentWeekEnd);
  currentWeekStart.setDate(currentWeekStart.getDate() + 1);
  currentWeekStart.setHours(0, 0, 0, 0);
  weekNumber++;
}
```

**結果**:
- 第5週: 10/27-11/2（月をまたぐ週も正しく処理）
- 第6週: 11/3-11/9（11月の週も含まれる）
- 11/9の商談予定が正しくカウントされるようになった

##### ネクスト日のパース

**複数フォーマット対応**:
```typescript
function parseNextDate(dateStr: string, currentDate: Date): Date | null {
  if (!dateStr) return null;

  // "10/9" 形式
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1]);
    const day = parseInt(slashMatch[2]);
    let year = currentDate.getFullYear();

    // 1ヶ月以上過去の場合は来年扱い
    if (month < currentDate.getMonth() - 1) {
      year++;
    }

    return new Date(year, month - 1, day);
  }

  // "10月9日" 形式
  const kanjiMatch = dateStr.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (kanjiMatch) {
    const month = parseInt(kanjiMatch[1]);
    const day = parseInt(kanjiMatch[2]);
    let year = currentDate.getFullYear();

    if (month < currentDate.getMonth() - 1) {
      year++;
    }

    return new Date(year, month - 1, day);
  }

  return null;
}
```

##### ステータス集計の改善

**問題**: ステータス取得時に余分なスペースがあった

**修正**:
```typescript
// Before
const status = statusColumn[i]?.[0] || '';

// After
const status = (statusColumn[i]?.[0] || '').trim();
```

**結果**: 初回商談待ちが16件に正しくカウントされるようになった

#### 1-4. 転換率データの追加

**変更内容**:
```typescript
// Before: アポ獲得率のみ
const conversionRates = {
  appointmentRate: parseConversionRow(data[19]),
};

// After: 全転換率
const conversionRates = {
  appointmentRate: parseConversionRow(data[19]), // アポ獲得率（シート行20）
  meetingRate: parseConversionRow(data[20]),     // 商談率（シート行21）
  closingRate: parseConversionRow(data[21]),     // クロージング率（シート行22）
  contractRate: parseConversionRow(data[22]),    // 契約率（シート行23）
};
```

### Phase 2: フロントエンドの統一

#### 2-1. TOPページのAnalyticsエラー修正

**ファイル**: `app/page.tsx:116`

**問題**: APIレスポンス構造が間違っていた
```typescript
// Before（誤り）
monthlyUsers: analyticsData.data?.googleAnalytics?.summary?.activeUsers || 0,

// After（正しい）
monthlyUsers: analyticsData.data?.googleAnalytics?.metrics?.activeUsers || 0,
```

#### 2-2. 週別商談予定カレンダーの統一

**Before（TOPページ）**:
```tsx
{summary.sales.customerStats.weeklyMeetings.map((week: any, index: number) => (
  <div key={index} className={`p-2 rounded text-center text-xs ...`}>
    <div className="text-gray-600 mb-1">{week.weekLabel.split(' ')[0]}</div>
    <div className={`font-bold ...`}>{week.count}件</div>
  </div>
))}
```

**After（統一後）**:
```tsx
{summary.sales.customerStats.weeklyMeetings.slice(0, 5).map((week: any, index: number) => (
  <div key={index} className={`p-3 rounded-lg border-2 ${week.count > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
    <p className="text-xs text-gray-600 mb-1">{week.weekLabel}</p>
    <p className={`text-xl font-bold ${week.count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{week.count}件</p>
  </div>
))}
```

**変更点**:
- `.slice(0, 5)`: 第5週まで表示に制限（TOPページはサマリー）
- `p-3 rounded-lg border-2`: ダッシュボードと同じスタイル
- `text-xl font-bold`: フォントサイズを統一

#### 2-3. ステータス別件数の統一

**Before（TOPページ）**:
```tsx
<div className="flex items-center gap-1">
  <span className="text-gray-600">初回商談待ち:</span>
  <span className="font-semibold">{summary.sales.customerStats.statusCounts.initialMeeting}件</span>
</div>
```

**After（統一後）**:
```tsx
<div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
  <p className="text-xs font-semibold text-gray-700 mb-2">ステータス別件数</p>
  <div className="space-y-1 text-xs">
    <div className="flex justify-between">
      <span className="text-gray-600">初回商談待ち:</span>
      <span className="font-bold text-gray-900">{summary.sales.customerStats.statusCounts.initialMeeting}件</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">返事待ち:</span>
      <span className="font-bold text-gray-900">{summary.sales.customerStats.statusCounts.awaitingResponse}件</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">商談中:</span>
      <span className="font-bold text-gray-900">{summary.sales.customerStats.statusCounts.inNegotiation}件</span>
    </div>
  </div>
</div>
```

**変更点**:
- 全ステータスを表示（初回商談待ち、返事待ち、商談中）
- カード形式で統一
- `flex justify-between`: 左右配置

#### 2-4. 行動量の日次進捗の統一

**Before（TOPページ）**:
```tsx
<div className={`p-2 rounded text-center text-xs ...`}>
  <div className="text-gray-700 font-semibold mb-1">{labels[key]}</div>
  <div className={`font-bold ...`}>
    {metric.gap >= 0 ? '+' : ''}{metric.gap}
  </div>
</div>
```

**After（統一後）**:
```tsx
<div className={`p-2 rounded-lg border-2 ${metric.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
  <p className="text-xs font-semibold text-gray-700 mb-1">{labels[key as keyof typeof labels]}</p>
  <div className="space-y-0.5 text-xs">
    <div className="flex justify-between">
      <span className="text-gray-600">月間目標:</span>
      <span className="font-semibold">{metric.monthlyTarget}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">必要:</span>
      <span className="font-semibold">{metric.requiredToday}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">実績:</span>
      <span className="font-bold text-blue-600">{metric.actual}</span>
    </div>
    <div className="flex justify-between border-t pt-0.5">
      <span className="text-gray-600">過不足:</span>
      <span className={`font-bold ${metric.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {metric.gap >= 0 ? '+' : ''}{metric.gap}
      </span>
    </div>
  </div>
  <div className="mt-1 text-center">
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${metric.status === 'ok' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
      {metric.status === 'ok' ? '✅順調' : '⚠遅延'}
    </span>
  </div>
</div>
```

**変更点**:
- 詳細情報を追加（月間目標、必要、実績、過不足）
- ステータスバッジを追加（✅順調 / ⚠遅延）
- ステータスに応じた背景色（緑=OK、赤=遅延）

#### 2-5. ゆめマガ配布状況の統一

**Before（TOPページ）**:
```tsx
<div className="p-2 bg-gray-50 rounded text-center text-xs">
  <div className="text-gray-600 mb-1">配布可能校</div>
  <div className="font-bold text-gray-900">
    {summary.sales.magazineDistribution.availableSchools.actual}/
    {summary.sales.magazineDistribution.availableSchools.target}校
  </div>
</div>
```

**After（統一後）**:
```tsx
{Object.entries(summary.sales.magazineDistribution).map(([key, metric]: [string, any]) => {
  const labels: Record<string, string> = {
    availableSchools: '配布可能校',
    distributedSchools: '配布学校数',
    distributedCopies: '配布部数',
  };
  return (
    <div key={key} className={`p-2 rounded-lg border-2 ${metric.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <p className="text-xs font-semibold text-gray-700 mb-1">{labels[key as keyof typeof labels]}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">目標:</span>
          <span className="font-semibold">{metric.target.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">実績:</span>
          <span className="font-bold text-blue-600">{metric.actual.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">達成率:</span>
          <span className="font-semibold">{metric.achievementRate}%</span>
        </div>
        <div className="flex justify-between border-t pt-0.5">
          <span className="text-gray-600">過不足:</span>
          <span className={`font-bold ${metric.gap >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {metric.gap >= 0 ? '+' : ''}{metric.gap.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="mt-1 text-center">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${metric.status === 'ok' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
          {metric.status === 'ok' ? '✅達成' : '⚠未達'}
        </span>
      </div>
    </div>
  );
})}
```

**変更点**:
- 目標・実績・達成率・過不足を詳細表示
- ステータスバッジを追加（✅達成 / ⚠未達）
- ステータスに応じた色分け

### Phase 3: Analytics APIのエラーハンドリング改善

**ファイル**: `lib/google-analytics.ts`

**問題**: `GOOGLE_SERVICE_ACCOUNT_KEY`が未設定の場合に「File URL path must be absolute」エラー

**修正**:
```typescript
function getAnalyticsClient() {
  if (!analyticsDataClient) {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const credentials = JSON.parse(serviceAccountKey);

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Invalid service account credentials: missing client_email or private_key');
    }

    analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
  }

  return analyticsDataClient;
}
```

## 改善後の状態

### 達成したこと

1. ✅ **TOPページと営業管理ダッシュボードのUI完全統一**
   - 週別商談予定カレンダー: 同じレイアウト（TOPは5週、ダッシュボードは全週）
   - ステータス別件数: 全ステータス表示
   - 行動量の日次進捗: 詳細表示（目標/必要/実績/過不足/ステータス）
   - ゆめマガ配布状況: 詳細カード表示

2. ✅ **週別商談予定のロジック修正**
   - 月をまたぐ週を正しく処理（10/27-11/2など）
   - 11月の週も含まれる（11/3-11/9など）

3. ✅ **データ取得の最適化**
   - `getBatchSheetData`で一括取得
   - パフォーマンス向上

4. ✅ **エラーハンドリングの改善**
   - Analytics APIのエラーを適切にキャッチ
   - 明確なエラーメッセージ

### 変更されたファイル

1. `app/api/sales-kpi/route.ts` - API実装（データ取得・パース）
2. `types/sales.ts` - 型定義追加
3. `app/page.tsx` - TOPページのUI統一
4. `app/dashboard/sales/page.tsx` - 営業管理ダッシュボード（参照元）
5. `lib/google-analytics.ts` - エラーハンドリング改善

## 他のダッシュボードへの適用手順

### 前提条件
- Google Sheetsにデータが存在すること
- API route (`/api/[feature]/route.ts`) が存在すること
- 専用ダッシュボード (`/dashboard/[feature]/page.tsx`) が存在すること

### Step 1: データ構造の調査

1. **Google Sheetsの構造を確認**
   ```typescript
   // テストAPI作成
   export async function GET() {
     const data = await getSheetData(spreadsheetId, 'シート名!A1:Z100');
     console.log(JSON.stringify(data, null, 2));
     return NextResponse.json({ data });
   }
   ```

2. **必要なデータを洗い出し**
   - TOPページに表示すべきサマリー情報
   - 専用ダッシュボードに表示すべき詳細情報
   - どの列にどのデータがあるか

3. **型定義を作成**
   ```typescript
   // types/[feature].ts
   export interface [Feature]Data {
     // フィールド定義
   }

   export interface [Feature]Response {
     success: boolean;
     data?: [Feature]Data;
     error?: string;
   }
   ```

### Step 2: API実装

1. **データ取得の最適化**
   ```typescript
   // 複数シートから一括取得
   const [sheet1Data, sheet2Data] = await getBatchSheetData(
     spreadsheetId,
     ['シート1!A1:Z100', 'シート2!A1:Z100']
   );
   ```

2. **パース関数の実装**
   ```typescript
   function parse[Feature]Data(data: any[][]): [Feature]Data {
     // 列インデックスを正確に指定
     // 数値変換時は記号を除去
     // 日付パース時は複数フォーマット対応
   }
   ```

3. **エラーハンドリング**
   ```typescript
   try {
     // データ取得・パース
   } catch (error: any) {
     console.error('API error:', error);
     return NextResponse.json(
       { success: false, error: error.message },
       { status: 500 }
     );
   }
   ```

### Step 3: 専用ダッシュボードの実装

1. **レイアウトの基本構造**
   ```tsx
   <div className="min-h-screen bg-gray-50 p-8">
     <div className="max-w-7xl mx-auto">
       {/* ヘッダー */}
       {/* セクション1 */}
       <div className="bg-white rounded-lg shadow-md p-6 mb-8">
         <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
           <Icon className="w-6 h-6" />
           セクションタイトル
         </h2>
         {/* コンテンツ */}
       </div>
       {/* セクション2... */}
     </div>
   </div>
   ```

2. **カードのスタイルパターン**
   ```tsx
   {/* ステータスに応じた色分けカード */}
   <div className={`p-4 rounded-lg border-2 ${
     status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
   }`}>
     <p className="text-sm font-semibold text-gray-700 mb-2">ラベル</p>
     <div className="space-y-1 text-sm">
       <div className="flex justify-between">
         <span className="text-gray-600">項目:</span>
         <span className="font-semibold">値</span>
       </div>
     </div>
     <div className="mt-2 text-center">
       <span className={`text-xs font-semibold px-2 py-1 rounded ${
         status === 'ok' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
       }`}>
         {status === 'ok' ? '✅OK' : '⚠NG'}
       </span>
     </div>
   </div>
   ```

### Step 4: TOPページの統一

1. **専用ダッシュボードと同じレイアウトを適用**
   - クラス名を完全に一致させる
   - 色分けルールを統一
   - フォントサイズを統一

2. **表示件数の制限**
   ```tsx
   {/* TOPページはサマリーなので件数制限 */}
   {data.slice(0, 5).map(...)}
   ```

3. **詳細リンクの追加**
   ```tsx
   <Link href="/dashboard/[feature]" className="text-sm text-blue-600 hover:underline">
     詳細 →
   </Link>
   ```

### Step 5: 動作確認

1. **開発サーバー起動**
   ```bash
   npm run dev
   ```

2. **APIレスポンス確認**
   ```bash
   curl -s http://localhost:3000/api/[feature] | python3 -m json.tool
   ```

3. **ブラウザで確認**
   - TOPページ: http://localhost:3000
   - 専用ダッシュボード: http://localhost:3000/dashboard/[feature]

4. **レイアウトの一致確認**
   - カードサイズ
   - 色分けルール
   - フォントサイズ
   - 余白

## デザインガイドライン

### 色分けルール

```typescript
// ステータスに応じた背景色
const statusColors = {
  ok: 'bg-green-50 border-green-200',      // 緑: 正常/達成
  warning: 'bg-yellow-50 border-yellow-200', // 黄: 警告
  error: 'bg-red-50 border-red-200',        // 赤: エラー/未達
  neutral: 'bg-gray-50 border-gray-200',    // グレー: 中立
  info: 'bg-blue-50 border-blue-200',       // 青: 情報
};

// テキスト色
const textColors = {
  ok: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  neutral: 'text-gray-600',
  info: 'text-blue-600',
};

// バッジ色
const badgeColors = {
  ok: 'bg-green-200 text-green-800',
  warning: 'bg-yellow-200 text-yellow-800',
  error: 'bg-red-200 text-red-800',
  neutral: 'bg-gray-200 text-gray-800',
  info: 'bg-blue-200 text-blue-800',
};
```

### スペーシング

```typescript
// セクション間
mb-8  // 2rem (32px)

// カード間
gap-4  // 1rem (16px)

// カード内の余白
p-4   // padding: 1rem (16px)
p-6   // padding: 1.5rem (24px)

// 要素間
space-y-1  // 0.25rem (4px)
space-y-2  // 0.5rem (8px)
```

### フォントサイズ

```typescript
// タイトル
text-xl font-bold    // 1.25rem (20px) - セクションタイトル
text-lg font-bold    // 1.125rem (18px) - サブタイトル

// ラベル
text-sm font-semibold  // 0.875rem (14px) - カードラベル
text-xs font-semibold  // 0.75rem (12px) - 小ラベル

// 値
text-3xl font-bold   // 1.875rem (30px) - 大きい数値
text-2xl font-bold   // 1.5rem (24px) - 中くらいの数値
text-xl font-bold    // 1.25rem (20px) - 小さい数値
```

## トラブルシューティング

### 週別データが正しくカウントされない

**原因**: 日付パースの問題、または週の範囲計算の問題

**解決策**:
1. 日付フォーマットを確認（"10/9", "10月9日"など）
2. 週の範囲を来月末まで拡張
3. 週の終了日を日曜日まで延長

### ステータス集計が合わない

**原因**: 余分なスペース、大文字小文字の違い

**解決策**:
```typescript
const status = (statusColumn[i]?.[0] || '').trim().toLowerCase();
```

### APIレスポンスが遅い

**原因**: 個別にシートを取得している

**解決策**:
```typescript
// getBatchSheetDataで一括取得
const [data1, data2, data3] = await getBatchSheetData(
  spreadsheetId,
  ['Sheet1!A1:Z100', 'Sheet2!A1:Z100', 'Sheet3!A1:Z100']
);
```

### 数値がNaNになる

**原因**: 通貨記号やカンマが含まれている

**解決策**:
```typescript
const parseNumber = (val: string) => {
  if (!val) return 0;
  return parseInt(val.replace(/[¥,$,]/g, '')) || 0;
};
```

## まとめ

営業管理ダッシュボードの改善プロセスは以下の通り:

1. **調査**: Google Sheetsのデータ構造を把握
2. **設計**: 型定義とAPIレスポンス構造を設計
3. **実装**: パース関数とエラーハンドリングを実装
4. **統一**: TOPページと専用ダッシュボードのUIを統一
5. **検証**: 動作確認とレイアウトの一致確認

このプロセスを他のダッシュボード（ゆめマガ制作、タスク管理、SNS投稿、LLMO）にも適用することで、一貫性のあるUI/UXを実現できます。
