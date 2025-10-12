# Phase 1.6 確定要件: 複数契約対応設計

**作成日**: 2025年10月12日
**ステータス**: 確定
**目的**: 同一企業の複数契約に対応した自動検出と手動登録フローの設計

---

## 📋 要件サマリー

### 前提条件

1. **受注確定タイミング**: 契約企業の正式名称等の「情報収集」はまだできていない
2. **顧客マスタの役割**: 企業レベルの管理（S列「受注」は企業ステータス）
3. **契約・入金管理シートの役割**: 契約レベルの管理（1契約 = 1行）

### 課題

- 同じ企業が複数のサービスを受注する場合、どう管理するか？
- 重複ともれを防ぐには？

### 採用した方針

**選択肢A: 初回のみ自動作成**
- 1企業につき最初の1契約のみ自動作成
- 2件目以降は「既存企業追加契約」ボタンから手動作成

---

## 🔄 2つの契約作成フロー

### フロー1: 新規企業の初回契約（自動 + 手動）

```
1. 顧客マスタのS列が「受注」になる
   ↓
2. システムが自動検出（リマインダーカード表示時）
   - タイミング: リロード時/マウント時
   - 判定: 契約・入金管理シートにこの企業の契約が1件も存在しない
   ↓
3. 契約・入金管理シートにB列・C列のみ自動作成
   - B列: 企業ID（契約企業マスタから取得 or 新規作成）
   - C列: 企業名（顧客マスタから取得）
   - D列以降: 空欄
   ↓
4. リマインダーカードに「新規契約必要」として表示
   - カードタイプ: 'new-contract-required'
   - 優先度: high
   ↓
5. ユーザーが情報収集フォーマートを顧客に送信
   ↓
6. 情報収集フォーマート受領
   ↓
7. 「新規契約」ボタンから情報を入力（既存フロー）
   - 情報収集フォーマートをパース
   - 契約企業マスタに全情報を登録
   - 契約・入金管理シートのD列以降を更新
```

**特徴**: 企業情報がまだない状態からスタート

---

### フロー2: 既存企業の追加契約（手動のみ）

```
1. 既存顧客（例: 信藤建設）が2件目のサービスを受注
   - 顧客マスタのS列: 受注（既に）
   ↓
2. システムは自動作成しない
   - 理由: 契約・入金管理シートに既にこの企業の契約が存在する
   ↓
3. ユーザーが「既存企業追加契約」ボタンをクリック
   ↓
4. モーダルが開く
   - 企業選択（ドロップダウン + 検索）
   - 契約情報のみ入力
     * 契約サービス
     * 契約日
     * 契約金額
     * 入金方法
     * 入金予定日
     * 掲載開始号
     * 備考
   ↓
5. 契約・入金管理シートに新しい行を追加（append）
   - B列: 企業ID（選択した企業の企業ID）
   - C列: 企業名（契約企業マスタから取得）
   - D列以降: 契約情報
```

**特徴**: 企業情報は既にあるので、契約情報のみ入力

---

## 🎨 UI設計

### ヘッダーの変更

**現状**:
```
[リソースメニュー▼] [新規契約]
```

**変更後**:
```
[リソースメニュー▼] [新規契約] [既存企業追加契約]
```

---

### 「既存企業追加契約」モーダル

```
┌──────────────────────────────────────────┐
│  既存企業の追加契約                       │
├──────────────────────────────────────────┤
│                                          │
│  【企業選択】                             │
│  ┌────────────────────────────────────┐  │
│  │ 企業を検索...                      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  または                                   │
│                                          │
│  [▼ 既存企業から選択]                     │
│     - 信藤建設 (企業ID: 1)                │
│     - ABC株式会社 (企業ID: 2)             │
│     - XYZ商事 (企業ID: 3)                 │
│                                          │
│  選択中: 信藤建設 (企業ID: 1)             │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│  【契約情報】                             │
│  契約サービス: [ゆめマガ▼]               │
│  契約日: [2025/10/12]                    │
│  契約金額: [¥744,000]                    │
│  入金方法: [一括▼]                       │
│  入金予定日: [2025/11/30]                │
│  掲載開始号: [2025年12月号]              │
│  備考: [                              ]  │
│                                          │
│  [キャンセル]          [契約を作成]      │
└──────────────────────────────────────────┘
```

---

## 🔧 実装計画

### 1. 自動検出ロジックの修正

**ファイル**: `app/api/contract/reminders/route.ts`

**変更内容**:

```typescript
// 顧客マスタから「受注」企業を取得
const receivedOrders = customerMaster
  .slice(2)
  .filter(row => row[18] === '受注')
  .map(row => ({
    companyName: row[1]
  }));

// 契約企業マスタを取得
const companyMaster = await getSheetData(
  process.env.SALES_SPREADSHEET_ID!,
  '契約企業マスタ!A:W'
);

// 新規契約必要チェック（初回のみ）
for (const order of receivedOrders) {
  // 1. 契約企業マスタで企業を検索（正規化名で比較）
  const normalizedOrderName = normalizeCompanyName(order.companyName);
  const companyInMaster = companyMaster
    .slice(1)
    .find(row =>
      normalizeCompanyName(row[22]) === normalizedOrderName // W列: 顧客マスタ企業名
    );

  if (!companyInMaster) {
    // 契約企業マスタに存在しない = 新規企業
    reminders.push({
      type: 'new-contract-required',
      companyName: order.companyName,
      priority: 'high'
    });
    continue;
  }

  const companyId = parseInt(companyInMaster[0]); // A列: 企業ID

  // 2. 契約・入金管理シートにこの企業IDの契約が存在するか
  const hasExistingContract = contractSheet
    .slice(2)
    .some(row => parseInt(row[1]) === companyId); // B列: 企業ID

  if (!hasExistingContract) {
    // 初回契約のみリマインダーカードを表示
    reminders.push({
      type: 'new-contract-required',
      companyName: order.companyName,
      priority: 'high'
    });
  }

  // 既に契約が存在する場合は何もしない（2件目以降は手動登録）
}
```

---

### 2. 企業名正規化関数の実装

**ファイル**: `lib/normalize-company-name.ts`（新規）

```typescript
/**
 * 企業名を正規化して比較用の文字列を返す
 *
 * 目的: 表記ゆれに対応した企業名の判別
 *
 * 例:
 * - "株式会社A" → "a"
 * - "（株）A" → "a"
 * - "A社" → "a社"
 * - "株式会社 ABC商事" → "abc商事"
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';

  return name
    // 法人格を削除
    .replace(/株式会社|（株）|\(株\)|有限会社|（有）|\(有\)|合同会社|合資会社|合名会社/g, '')
    // 空白を削除
    .replace(/\s+/g, '')
    // 小文字に変換
    .toLowerCase()
    // トリム
    .trim();
}
```

**使用箇所**:
- `/api/contract/reminders/route.ts`
- `/api/contract/auto-create/route.ts`
- その他、企業名で検索する全てのAPI

---

### 3. 「既存企業追加契約」モーダルの作成

**新規ファイル**: `components/workflow/ExistingCompanyContractModal.tsx`

**機能**:
- 契約企業マスタから既存企業のリストを取得
- ドロップダウンと検索機能で企業を選択
- 契約情報のみ入力
- `/api/contract/create-for-existing` を呼び出し

**主要なstate**:
```typescript
const [companies, setCompanies] = useState<CompanyMasterData[]>([]);
const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [contractInfo, setContractInfo] = useState({
  contractService: 'ゆめマガ',
  contractDate: '',
  amount: '',
  paymentMethod: '一括',
  paymentDueDate: '',
  publicationIssue: '',
  notes: ''
});
```

**API呼び出し**:
```typescript
const handleSubmit = async () => {
  const response = await fetch('/api/contract/create-for-existing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId: selectedCompanyId,
      ...contractInfo,
      amount: parseFloat(contractInfo.amount)
    })
  });

  if (response.ok) {
    onSuccess();
  }
};
```

---

### 4. 新規API作成

**新規ファイル**: `app/api/contract/create-for-existing/route.ts`

**目的**: 既存企業の追加契約を作成

**入力**:
```typescript
interface CreateContractForExistingRequest {
  companyId: number;           // 既存企業の企業ID
  contractService: string;     // 契約サービス（例: ゆめマガ）
  contractDate: string;        // 契約日（YYYY/MM/DD）
  amount: number;              // 契約金額（数値）
  paymentMethod: string;       // 入金方法（例: 一括）
  paymentDueDate: string;      // 入金予定日（YYYY/MM/DD）
  publicationIssue: string;    // 掲載開始号（例: 2025年12月号）
  notes?: string;              // 備考
}
```

**処理フロー**:
```typescript
export async function POST(request: Request) {
  try {
    const body: CreateContractForExistingRequest = await request.json();

    // 1. 契約企業マスタから企業情報を取得
    const companyMaster = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約企業マスタ!A:B'
    );

    const company = companyMaster
      .slice(1)
      .find(row => parseInt(row[0]) === body.companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, error: '企業が見つかりません' },
        { status: 404 }
      );
    }

    const companyName = company[1]; // B列: 企業正式名称

    // 2. 契約・入金管理シートの最大契約IDを取得
    const contractSheet = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約・入金管理!A:A'
    );

    const maxId = contractSheet.slice(2)
      .map(row => parseInt(row[0]) || 0)
      .reduce((max, id) => Math.max(max, id), 0);

    const newContractId = maxId + 1;

    // 3. 新しい行を作成
    const newRow = [
      newContractId,                                    // A: 契約ID
      body.companyId,                                   // B: 企業ID
      companyName,                                      // C: 企業名
      body.contractService,                             // D: 契約サービス
      body.contractDate,                                // E: 契約日
      `¥${body.amount.toLocaleString()}`,               // F: 契約金額
      body.paymentMethod,                               // G: 入金方法
      '',                                               // H: 契約書送付
      '',                                               // I: 契約書回収
      '',                                               // J: 申込書送付
      '',                                               // K: 申込書回収
      body.paymentDueDate,                              // L: 入金予定日
      '',                                               // M: 入金実績日
      '未入金',                                         // N: 入金ステータス
      '',                                               // O: 遅延日数
      body.publicationIssue,                            // P: 掲載開始号
      body.notes || '',                                 // Q: 備考
      // R〜AD列（進捗管理列）は空欄
      '', '', '', '', '', '', '', '', '', '', '', '', ''
    ];

    // 4. Google Sheets APIで追加
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SALES_SPREADSHEET_ID!,
      range: '契約・入金管理!A:AD',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    return NextResponse.json({
      success: true,
      contractId: newContractId,
      companyId: body.companyId
    });

  } catch (error) {
    console.error('既存企業契約作成エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
```

---

### 5. 企業リスト取得API

**新規ファイル**: `app/api/company-master/list/route.ts`

**目的**: 既存企業の一覧を取得

**処理**:
```typescript
export async function GET() {
  try {
    const companyMaster = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約企業マスタ!A:B'
    );

    const companies = companyMaster
      .slice(1) // ヘッダー行をスキップ
      .filter(row => row[0] && row[1]) // 空行を除外
      .map(row => ({
        companyId: parseInt(row[0]),  // A列
        officialName: row[1]          // B列
      }));

    return NextResponse.json({
      success: true,
      companies
    });

  } catch (error) {
    console.error('企業リスト取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
```

---

### 6. メインページへの統合

**ファイル**: `app/dashboard/workflow/contract/page.tsx`

**追加内容**:

```typescript
const [showExistingCompanyModal, setShowExistingCompanyModal] = useState(false);

// ヘッダーに「既存企業追加契約」ボタンを追加
<button
  onClick={() => setShowExistingCompanyModal(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
>
  既存企業追加契約
</button>

// モーダルを追加
{showExistingCompanyModal && (
  <ExistingCompanyContractModal
    onClose={() => setShowExistingCompanyModal(false)}
    onSuccess={() => {
      setShowExistingCompanyModal(false);
      fetchReminders(); // リマインダーを再取得
    }}
  />
)}
```

---

## 📝 実装順序

1. ✅ **企業名正規化関数**: `lib/normalize-company-name.ts`
2. ✅ **自動検出ロジック修正**: `/api/contract/reminders/route.ts`
3. ✅ **企業リスト取得API**: `/api/company-master/list/route.ts`
4. ✅ **既存企業契約作成API**: `/api/contract/create-for-existing/route.ts`
5. ✅ **既存企業追加契約モーダル**: `components/workflow/ExistingCompanyContractModal.tsx`
6. ✅ **メインページ統合**: `app/dashboard/workflow/contract/page.tsx`
7. ✅ **テスト**: 各機能の動作確認

---

## 🧪 テストシナリオ

### テスト1: 新規企業の初回契約（自動検出）

1. 顧客マスタで企業A（新規）のS列を「受注」に設定
2. ダッシュボードをリロード
3. 「新規契約必要」カードが表示される ✅
4. 契約・入金管理シートにB列・C列のみ自動作成される ✅
5. 情報収集フォーマートを受領
6. 「新規契約」ボタンから情報を入力
7. 契約企業マスタに全情報が登録される ✅
8. 契約・入金管理シートのD列以降が更新される ✅

---

### テスト2: 既存企業の追加契約（手動登録）

1. 既に契約が存在する企業B（例: 信藤建設）のS列が「受注」
2. ダッシュボードをリロード
3. 「新規契約必要」カードは表示されない ✅
4. 「既存企業追加契約」ボタンをクリック
5. モーダルが開く ✅
6. 企業Bを選択
7. 契約情報を入力
8. 「契約を作成」をクリック
9. 契約・入金管理シートに新しい行が追加される ✅
10. B列に企業ID、C列に企業名が設定される ✅

---

### テスト3: 企業名の表記ゆれ対応

1. 顧客マスタ: 「株式会社ABC」
2. 契約企業マスタ: 「（株）ABC」
3. 正規化後: 両方とも「abc」
4. 同一企業と判定される ✅
5. 重複登録されない ✅

---

## 🚨 注意事項

### 重複防止の条件

- 企業名の正規化による判別（法人格・空白を除去）
- 契約企業マスタのW列（顧客マスタ企業名）を基準に比較
- 契約・入金管理シートは企業ID（B列）で判別

### もれ防止の条件

- リマインダーカード表示時に必ず顧客マスタをスキャン
- 「受注」企業すべてをチェック
- 契約企業マスタに存在しない、または契約が存在しない企業をリマインダー表示

---

## 📚 関連ドキュメント

- `docs/workflow/Phase1.6_現状調査レポート_完全版.md` - 現状分析
- `docs/workflow/Phase1.6_実装状況と課題_2025-10-12.md` - 前世代の引き継ぎ
- `docs/workflow/契約業務フロー統合_Phase1.6_完全実装計画書.md` - 当初の計画書

---

---

## ✅ 追加確定事項（2025年10月12日 更新）

### 1. A列の契約IDはシステム側で管理

**従来の想定（数式依存）**:
- A列に数式 `=IF(B3="","",ROW()-2)` を設定
- B列が空でなければ、行番号-2を自動計算

**新しい設計（システム管理）** ✅:
- A列は数値として直接書き込む
- 契約ID = 既存の最大ID + 1
- システムが完全にコントロール

**共通化した関数**:
```typescript
// lib/generate-contract-id.ts
import { getSheetData } from '@/lib/google-sheets';

/**
 * 契約・入金管理シートの次の契約IDを生成
 */
export async function generateNextContractId(spreadsheetId: string): Promise<number> {
  const contractSheet = await getSheetData(
    spreadsheetId,
    '契約・入金管理!A:A'
  );

  const maxId = contractSheet
    .slice(2) // タイトル行とヘッダー行をスキップ
    .map(row => parseInt(row[0]) || 0)
    .reduce((max, id) => Math.max(max, id), 0);

  return maxId + 1;
}
```

---

### 2. 企業紐付けの方法: 企業IDベース ✅

**採用した方式**: B案（企業IDベース）

**理由**:
- 企業名の表記ゆれに完全対応
- より確実な紐付けが可能

**実装方法**:
```typescript
// 1. 契約企業マスタで企業IDを取得（W列を正規化して検索）
const normalizedInputName = normalizeCompanyName(parsedData.companyName);
const companyInMaster = companyMaster
  .slice(1)
  .find(row =>
    normalizeCompanyName(row[22]) === normalizedInputName // W列: 顧客マスタ企業名
  );

const companyId = parseInt(companyInMaster[0]); // A列: 企業ID

// 2. 契約・入金管理シートでB列（企業ID）が一致し、D列以降が空欄の行を検索
for (let i = 2; i < rows.length; i++) {
  const row = rows[i];
  if (parseInt(row[1]) === companyId && !row[3]) { // B列=企業ID, D列=空欄
    targetRowIndex = i + 1;
    break;
  }
}
```

**適用箇所**:
- `/api/contract/create` - 情報収集フォーマート受領後の更新

---

### 3. 自動作成のタイミング: リマインダー取得時 ✅

**採用した方式**: A案（リマインダー取得時に自動作成）

**理由**:
- APIの呼び出し元が明確
- リマインダー取得と同時に自動作成
- ユーザーの操作なしで自動的に実行

**実装方法**:
- `/api/contract/reminders` 内で自動作成を実行
- `/api/contract/auto-create` は削除または統合

**処理フロー**:
```typescript
// /api/contract/reminders/route.ts 内

// 新規契約必要チェック（初回のみ）
for (const order of receivedOrders) {
  // 企業マスタで企業を検索
  const companyInMaster = findCompanyInMaster(order.companyName);

  if (!companyInMaster) {
    // 契約企業マスタに存在しない = 新規企業
    // 1. 契約企業マスタに企業を登録
    const companyId = await createCompanyMaster(order.companyName);

    // 2. 契約・入金管理シートに行を追加
    await createContractRecord(companyId, order.companyName);

    // 3. リマインダーカードを表示
    reminders.push({
      type: 'new-contract-required',
      companyName: order.companyName,
      priority: 'high'
    });
    continue;
  }

  const companyId = parseInt(companyInMaster[0]);
  const hasExistingContract = contractSheet
    .slice(2)
    .some(row => parseInt(row[1]) === companyId);

  if (!hasExistingContract) {
    // 初回契約のみ自動作成
    await createContractRecord(companyId, order.companyName);

    reminders.push({
      type: 'new-contract-required',
      companyName: order.companyName,
      priority: 'high'
    });
  }
}
```

---

### 4. `/api/contract/create` の修正内容

**修正ポイント**:
1. 企業名ではなく、企業IDで検索（表記ゆれ対応）
2. 契約企業マスタのW列（顧客マスタ企業名）を正規化して企業IDを取得
3. B列（企業ID）とD列が空欄の行を検索

**修正後のロジック**:
```typescript
// 1. 契約企業マスタから企業IDを取得（正規化名で検索）
const normalizedInputName = normalizeCompanyName(parsedData.companyName);
const companyInMaster = companyMaster
  .slice(1)
  .find(row =>
    normalizeCompanyName(row[22]) === normalizedInputName // W列
  );

if (!companyInMaster) {
  return NextResponse.json(
    { success: false, error: '契約企業マスタに該当する企業が見つかりません' },
    { status: 404 }
  );
}

const companyId = parseInt(companyInMaster[0]); // A列

// 2. 契約企業マスタの詳細情報を更新
await updateCompanyMaster(sheets, spreadsheetId, parsedData, companyId);

// 3. 契約・入金管理シートで該当行を検索（企業IDとD列が空欄）
for (let i = 2; i < rows.length; i++) {
  const row = rows[i];
  if (parseInt(row[1]) === companyId && !row[3]) { // B列=企業ID, D列=空欄
    targetRowIndex = i + 1;
    contractId = parseInt(row[0]);
    break;
  }
}

// 4. 契約詳細を更新（D列以降）
await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: `契約・入金管理!D${targetRowIndex}:Q${targetRowIndex}`,
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: [updateValues] }
});
```

---

## 📌 実装の優先順位（更新）

### 必須実装（Phase 1.6-A）

1. ✅ **企業名正規化関数**: `lib/normalize-company-name.ts`
2. ✅ **契約ID生成関数**: `lib/generate-contract-id.ts`
3. ✅ **自動作成ロジック統合**: `/api/contract/reminders/route.ts`に統合
   - 企業マスタ登録機能
   - 契約レコード作成機能
4. ✅ **契約作成API修正**: `/api/contract/create/route.ts`
   - 企業IDベースの検索に変更
5. ✅ **企業リスト取得API**: `/api/company-master/list/route.ts`
6. ✅ **既存企業契約作成API**: `/api/contract/create-for-existing/route.ts`
7. ✅ **既存企業追加契約モーダル**: `components/workflow/ExistingCompanyContractModal.tsx`
8. ✅ **メインページ統合**: `app/dashboard/workflow/contract/page.tsx`

### 削除対象

- ❌ `/api/contract/auto-create/route.ts` - `/api/contract/reminders`に統合するため削除

---

**作成日**: 2025年10月12日
**最終更新**: 2025年10月12日（追加確定事項を反映）
**ステータス**: 確定（実装開始可能）
**次のステップ**: 実装開始
