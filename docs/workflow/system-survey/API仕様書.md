# API仕様書

**作成日**: 2025年10月11日
**作成者**: Claude Code
**目的**: メインダッシュボードと2つのダッシュボードで使用されているAPIの仕様を事実ベースで記録する

**重要**: 使用されていないAPIは記載していません。

---

## 📋 調査対象

- メインダッシュボード: `app/page.tsx`
- ゆめマガ制作進捗ダッシュボード: `app/dashboard/yumemaga-v2/page.tsx`
- 営業進捗管理ダッシュボード: `app/dashboard/sales/page.tsx`

---

## 🔧 Google Sheets API (`lib/google-sheets.ts`)

### 使用されているメソッド

#### 1. `getSheetData(spreadsheetId, range)`

**説明**: スプレッドシートからデータを取得

**引数**:
- `spreadsheetId`: string - スプレッドシートID
- `range`: string - 取得範囲（例: 'Sheet1!A1:Z100'）

**戻り値**: `Promise<any[][]>` - 2次元配列

**実装** (`lib/google-sheets.ts` 59-76行目):
```tsx
export async function getSheetData(
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    throw error;
  }
}
```

#### 2. `getBatchSheetData(spreadsheetId, ranges)`

**説明**: 複数の範囲からデータを一括取得

**引数**:
- `spreadsheetId`: string - スプレッドシートID
- `ranges`: string[] - 取得範囲の配列

**戻り値**: `Promise<any[][][]>` - 各範囲のデータ配列

**実装** (`lib/google-sheets.ts` 84-101行目):
```tsx
export async function getBatchSheetData(
  spreadsheetId: string,
  ranges: string[]
): Promise<any[][][]> {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    return response.data.valueRanges?.map((vr) => vr.values || []) || [];
  } catch (error) {
    console.error('Failed to fetch batch sheet data:', error);
    throw error;
  }
}
```

#### 3. `getSpreadsheetMetadata(spreadsheetId)`

**説明**: スプレッドシートのメタデータを取得

**引数**:
- `spreadsheetId`: string - スプレッドシートID

**戻り値**: `Promise<any>` - スプレッドシートのメタデータ

**実装** (`lib/google-sheets.ts` 108-121行目):
```tsx
export async function getSpreadsheetMetadata(spreadsheetId: string) {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch spreadsheet metadata:', error);
    throw error;
  }
}
```

#### 4. `updateSheetCell(spreadsheetId, sheetName, cellAddress, value)`

**説明**: 単一セルを更新

**引数**:
- `spreadsheetId`: string - スプレッドシートID
- `sheetName`: string - シート名
- `cellAddress`: string - セルアドレス（例: "G5", "AX10"）
- `value`: string - 書き込む値

**戻り値**: `Promise<void>`

**実装** (`lib/google-sheets.ts` 367-390行目):
```tsx
export async function updateSheetCell(
  spreadsheetId: string,
  sheetName: string,
  cellAddress: string,
  value: string
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${cellAddress}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });

    console.log(`✅ Updated cell ${sheetName}!${cellAddress} with value: ${value}`);
  } catch (error) {
    console.error(`Failed to update cell ${sheetName}!${cellAddress}:`, error);
    throw error;
  }
}
```

**注意**: このメソッドはゆめマガダッシュボード（`app/dashboard/yumemaga-v2/page.tsx`）内で実績日更新APIに使用されています。

---

## 📡 APIエンドポイント

### メインダッシュボードで使用されているAPI

**実装** (`app/page.tsx` 75-84行目):
```tsx
const [salesRes, yumemagaRes, tasksRes, analyticsRes, snsRes, partnersRes, quickAccessRes, keywordRankRes] = await Promise.all([
  fetch('/api/sales-kpi'),
  fetch('/api/process-schedule'),
  fetch('/api/tasks'),
  fetch('/api/analytics'),
  fetch('/api/sns'),
  fetch('/api/partners'),
  fetch('/api/quick-access'),
  fetch('/api/keyword-rank'),
]);
```

#### 1. `/api/sales-kpi`

**メソッド**: GET

**説明**: 営業KPIデータを取得

**レスポンス型**: `SalesKPIResponse`

**使用箇所**: メインダッシュボード、営業ダッシュボード

---

#### 2. `/api/process-schedule`

**メソッド**: GET

**説明**: ゆめマガ制作工程データを取得

**使用箇所**: メインダッシュボード

---

#### 3. `/api/tasks`

**メソッド**: GET

**説明**: タスク管理データを取得

**使用箇所**: メインダッシュボード

---

#### 4. `/api/analytics`

**メソッド**: GET

**説明**: HP・LLMO分析データを取得

**使用箇所**: メインダッシュボード

---

#### 5. `/api/sns`

**メソッド**: GET

**説明**: SNS投稿管理データを取得

**使用箇所**: メインダッシュボード

---

#### 6. `/api/partners`

**メソッド**: GET

**説明**: パートナー・スターデータを取得

**使用箇所**: メインダッシュボード

---

#### 7. `/api/quick-access`

**メソッド**: GET

**説明**: クイックアクセスボタンのデータを取得

**使用箇所**: メインダッシュボード

---

#### 8. `/api/keyword-rank`

**メソッド**: GET

**説明**: キーワード順位データを取得

**使用箇所**: メインダッシュボード

---

### 営業ダッシュボードで使用されているAPI

**実装** (`app/dashboard/sales/page.tsx` 59行目):
```tsx
const response = await fetch('/api/sales-kpi');
```

#### 1. `/api/sales-kpi`

**メソッド**: GET

**説明**: 営業KPIデータを取得

**レスポンス型**: `SalesKPIResponse`

**レスポンス構造** (`app/dashboard/sales/page.tsx` 116行目):
```tsx
{
  success: boolean;
  data?: {
    kpi: {
      month: number;
      totalBusinessDays: number;
      elapsedBusinessDays: number;
      progressRate: number;
      metrics: {
        telAppointments: { monthlyTarget, requiredToday, actual, gap, status };
        appointments: { ... };
        meetings: { ... };
        closings: { ... };
        contracts: { ... };
      };
      conversionRates: {
        appointmentRate: { actualRate, expectedRate, gap, status };
        meetingRate: { ... };
        closingRate: { ... };
        contractRate: { ... };
      };
    };
    magazineDistribution: {
      availableSchools: { target, actual, achievementRate, gap, status };
      distributedSchools: { ... };
      distributedCopies: { ... };
    };
    monthlyPerformance: {
      contractTarget, contractActual, contractGap,
      revenueTarget, revenueActual, revenueGap,
      paymentTarget, paymentActual, unpaidAmount
    };
    customerStats: {
      weeklyMeetings: [ { weekLabel, count }, ... ];
      awaitingReport: number;
      statusCounts: {
        initialMeeting, awaitingResponse, inNegotiation
      };
    };
    updatedAt: string;
  };
  error?: string;
}
```

---

### ゆめマガダッシュボードで使用されているAPI

**実装** (`app/dashboard/yumemaga-v2/page.tsx` 51-147行目):
```tsx
const processesRes = await fetch(`/api/yumemaga-v2/processes?issue=${encodeURIComponent(selectedIssue)}`);
const progressRes = await fetch(`/api/yumemaga-v2/progress?issue=${encodeURIComponent(selectedIssue)}`);
const nextMonthRes = await fetch(`/api/yumemaga-v2/next-month?currentIssue=${encodeURIComponent(selectedIssue)}`);
const readyRes = await fetch(`/api/yumemaga-v2/ready-processes?issue=${encodeURIComponent(selectedIssue)}`);
const companiesRes = await fetch(`/api/yumemaga-v2/company-processes?issue=${encodeURIComponent(selectedIssue)}`);
const productionRes = await fetch(`/api/yumemaga-v2/company-page-production?issue=${encodeURIComponent(selectedIssue)}`);
```

#### 1. `/api/yumemaga-v2/processes`

**メソッド**: GET

**クエリパラメータ**:
- `issue`: string - 月号（例: "2025年11月号"）

**説明**: 工程データとサマリーを取得

---

#### 2. `/api/yumemaga-v2/progress`

**メソッド**: GET

**クエリパラメータ**:
- `issue`: string - 月号

**説明**: カテゴリ別進捗データを取得

---

#### 3. `/api/yumemaga-v2/next-month`

**メソッド**: GET

**クエリパラメータ**:
- `currentIssue`: string - 現在の月号

**説明**: 次月号準備データを取得

---

#### 4. `/api/yumemaga-v2/ready-processes`

**メソッド**: GET

**クエリパラメータ**:
- `issue`: string - 月号

**説明**: 準備OK工程と遅延工程を取得

---

#### 5. `/api/yumemaga-v2/company-processes`

**メソッド**: GET

**クエリパラメータ**:
- `issue`: string - 月号

**説明**: 企業別工程データを取得

---

#### 6. `/api/yumemaga-v2/company-page-production`

**メソッド**: GET

**クエリパラメータ**:
- `issue`: string - 月号

**説明**: 企業別ページ制作進捗を取得

---

#### 7. `/api/yumemaga-v2/categories`

**メソッド**: GET

**説明**: カテゴリマスターデータを取得

**使用箇所** (`app/dashboard/yumemaga-v2/page.tsx` 208-221行目):
```tsx
useEffect(() => {
  const fetchCategoryMetadata = async () => {
    try {
      const res = await fetch('/api/yumemaga-v2/categories');
      const data = await res.json();
      if (data.success) {
        setCategoryMetadata(data.categories);
      }
    } catch (error) {
      console.error('カテゴリマスター取得エラー:', error);
    }
  };
  fetchCategoryMetadata();
}, []);
```

---

#### 8. `/api/yumemaga-v2/available-issues`

**メソッド**: GET

**説明**: 利用可能な月号一覧を取得

**使用箇所** (`app/dashboard/yumemaga-v2/page.tsx` 224-237行目):
```tsx
useEffect(() => {
  const fetchAvailableIssues = async () => {
    try {
      const res = await fetch('/api/yumemaga-v2/available-issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.issues);
      }
    } catch (error) {
      console.error('月号一覧取得エラー:', error);
    }
  };
  fetchAvailableIssues();
}, []);
```

---

#### 9. `/api/yumemaga-v2/actual-date`

**メソッド**: PUT

**ボディ**:
```tsx
{
  issue: string;      // 月号
  processNo: string;  // 工程番号
  actualDate: string; // 実績日
}
```

**説明**: 工程の実績日を更新

**使用箇所** (`app/dashboard/yumemaga-v2/page.tsx` 247-269行目):
```tsx
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
      await fetchAllData();
      alert('実績日を更新しました');
    } else {
      alert(`更新に失敗しました: ${data.error}`);
    }
  } catch (error) {
    console.error('実績日更新エラー:', error);
    alert('更新に失敗しました');
  }
};
```

---

#### 10. `/api/yumemaga-v2/company-status`

**メソッド**: POST

**ボディ**:
```tsx
{
  companyId: string; // 企業ID
  status: string;    // ステータス
}
```

**説明**: 企業ステータスを更新

**使用箇所** (`app/dashboard/yumemaga-v2/page.tsx` 272-294行目)

---

#### 11. `/api/yumemaga-v2/planned-date`

**メソッド**: PUT

**ボディ**:
```tsx
{
  issue: string;      // 月号
  processNo: string;  // 工程番号
  plannedDate: string; // 予定日
}
```

**説明**: 工程の予定日を更新

**使用箇所** (`app/dashboard/yumemaga-v2/page.tsx` 296-318行目)

---

#### 12. `/api/yumemaga-v2/confirmation-status`

**メソッド**: PUT

**ボディ**:
```tsx
{
  issue: string;     // 月号
  processNo: string; // カテゴリID
  status: string;    // 確認ステータス
}
```

**説明**: 確認ステータスを更新

**使用箇所** (`app/dashboard/yumemaga-v2/page.tsx` 321-343行目)

---

#### 13. `/api/auth/status`

**メソッド**: GET

**説明**: OAuth認証状態をチェック

**使用箇所** (`app/dashboard/yumemaga-v2/page.tsx` 201-205行目):
```tsx
useEffect(() => {
  fetch('/api/auth/status')
    .then(res => res.json())
    .then(setAuthStatus);
}, []);
```

---

## 🔒 認証

### サービスアカウント認証

**実装** (`lib/google-sheets.ts` 26-51行目):
```tsx
export function getGoogleSheetsClient() {
  try {
    // 環境変数からサービスアカウント認証情報を取得
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!credentialsJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const credentials: ServiceAccountCredentials = JSON.parse(credentialsJson);

    // Google認証クライアントを作成
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Google Sheets APIクライアントを作成
    const sheets = google.sheets({ version: 'v4', auth });

    return sheets;
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error);
    throw error;
  }
}
```

**スコープ**: `https://www.googleapis.com/auth/spreadsheets`

---

## 📊 レスポンス形式

すべてのAPIエンドポイントは以下の形式でレスポンスを返します:

```tsx
{
  success: boolean;
  data?: T;        // 成功時のデータ
  error?: string;  // エラー時のメッセージ
}
```

---

**調査完了日**: 2025年10月11日
**調査者**: Claude Code
