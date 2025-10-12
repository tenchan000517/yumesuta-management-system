# Phase 1.6 次世代Claude Code 引き継ぎドキュメント（完全版）

**作成日**: 2025年10月12日 06:00 JST
**対象**: 次世代Claude Code
**目的**: 暗黙知を一切残さず、Phase 1.6の実装を確実に継続できるように引き継ぐ

---

## 🚨 最重要事項

**このドキュメントは事実のみを記載しています。推測や仮説は含まれていません。**

次世代Claude Codeは、このドキュメントに記載された内容のみを信頼し、それ以外の情報（過去の会話や前世代の実装）は参考程度に留めてください。

---

## 📋 目次

1. [現在の状況](#現在の状況)
2. [確定した要件](#確定した要件)
3. [実装すべき内容](#実装すべき内容)
4. [実装順序](#実装順序)
5. [テスト方法](#テスト方法)
6. [注意事項](#注意事項)

---

## 現在の状況

### Phase 1.6の目的

**顧客正式情報マスタを作成し、企業情報の一元管理とID管理を実現する**

### 前世代が実施した内容

1. ✅ 契約企業マスタシート作成（GASスクリプトで実施済み）
2. ✅ 契約・入金管理シートの列構造を手動で変更
   - B列に「企業ID」を挿入（ヘッダーのみ、データは空）
   - C列以降を右シフト
3. ✅ 一部のAPIを実装（ただし要件との不一致あり）
4. ⚠️ 実装途中で停止（要件の不明確さにより）

### 調査で判明した事実

**参照ドキュメント**:
- `docs/workflow/Phase1.6_現状調査レポート_完全版.md` - 現状の詳細分析
- `docs/workflow/Phase1.6_確定要件_複数契約対応設計.md` - 確定した要件

**重要な発見**:
- 前世代の実装と当初の計画書に大きなギャップがある
- ユーザーとのディスカッションで要件を再定義した
- 複数契約対応、企業名表記ゆれ対応、契約ID管理など、重要な設計決定を行った

---

## 確定した要件

### 前提条件（業務フロー）

1. **受注確定タイミング**: 契約企業の正式名称等の「情報収集」はまだできていない
2. **顧客マスタの役割**: 企業レベルの管理（S列「受注」は企業ステータス）
3. **契約・入金管理シートの役割**: 契約レベルの管理（1契約 = 1行）
4. **1企業が複数契約を持つ場合がある**

### 採用した方針

#### 方針1: 初回のみ自動作成

- 1企業につき最初の1契約のみ自動作成
- 2件目以降は「既存企業追加契約」ボタンから手動作成

**理由**: 顧客マスタのS列「受注」だけでは、何件目の契約かを判別できないため

#### 方針2: 企業IDベースの紐付け

- 企業名ではなく、企業IDで紐付け
- 企業名は正規化して比較（表記ゆれ対応）

**理由**: 「株式会社A」「（株）A」などの表記ゆれに対応するため

#### 方針3: 契約IDはシステム管理

- A列の契約IDは数式ではなく、システムが直接書き込む
- 契約ID = 既存の最大ID + 1

**理由**: 数式に依存するとトラブルが発生しやすいため

#### 方針4: 自動作成はリマインダー取得時

- `/api/contract/reminders` 内で自動作成を実行
- リロード/マウント時に自動的に実行される

**理由**: APIの呼び出し元を明確にし、ユーザーの操作なしで実行するため

---

## 実装すべき内容

### 全体フロー

#### フロー1: 新規企業の初回契約（自動 + 手動）

```
1. 顧客マスタのS列が「受注」になる
   ↓
2. リマインダーカード取得時（/api/contract/reminders）
   - 契約企業マスタに企業が存在しない、または
   - 契約・入金管理シートにその企業IDの契約が存在しない
   ↓
3. 自動作成を実行
   a. 契約企業マスタに企業を登録（企業IDを新規採番）
   b. 契約・入金管理シートに行を追加（append）
      - A列: 契約ID（最大ID + 1）← システムで計算
      - B列: 企業ID
      - C列: 企業名
      - D列以降: 空欄
   ↓
4. リマインダーカードに「新規契約必要」として表示
   ↓
5. ユーザーが情報収集フォーマートを送信・受領
   ↓
6. 「新規契約」ボタンから情報を入力
   - 契約企業マスタの詳細情報を更新
   - 契約・入金管理シートのD列以降を更新（企業IDで検索）
```

#### フロー2: 既存企業の追加契約（手動のみ）

```
1. 既存顧客が2件目のサービスを受注
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
   ↓
5. /api/contract/create-for-existing を呼び出し
   - 契約・入金管理シートに新しい行を追加（append）
   - A列: 契約ID（最大ID + 1）
   - B列: 企業ID
   - C列: 企業名
   - D列以降: 契約情報
```

---

### 実装タスク一覧

#### タスク1: 企業名正規化関数

**新規ファイル**: `lib/normalize-company-name.ts`

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

---

#### タスク2: 契約ID生成関数

**新規ファイル**: `lib/generate-contract-id.ts`

```typescript
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

#### タスク3: 企業マスタ登録関数

**新規ファイル**: `lib/company-master-utils.ts`

```typescript
import { google } from 'googleapis';
import { normalizeCompanyName } from './normalize-company-name';

/**
 * 企業IDを取得（既存企業）または新規作成
 */
export async function getOrCreateCompanyId(
  sheets: any,
  spreadsheetId: string,
  companyName: string
): Promise<number> {
  const sheetName = '契約企業マスタ';

  // 既存の企業を確認（W列で検索、正規化名で比較）
  const existingData = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:W`
  });

  const normalizedInputName = normalizeCompanyName(companyName);

  if (existingData.data.values && existingData.data.values.length > 1) {
    const existingCompany = existingData.data.values
      .slice(1)
      .find((row: string[]) =>
        normalizeCompanyName(row[22]) === normalizedInputName // W列: 顧客マスタ企業名
      );

    if (existingCompany) {
      // 既存企業が見つかった場合、その企業IDを返す
      return parseInt(existingCompany[0]);
    }
  }

  // 新規企業として登録
  const maxId = existingData.data.values && existingData.data.values.length > 1
    ? Math.max(...existingData.data.values.slice(1).map((row: string[]) => parseInt(row[0]) || 0))
    : 0;

  const newCompanyId = maxId + 1;

  // 今日の日付（YYYY/MM/DD形式）
  const today = new Date();
  const formattedDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  // 最小限の情報で企業マスタに登録
  const newRow = [
    newCompanyId,                    // A: 企業ID
    companyName,                     // B: 企業正式名称（仮）
    '',                              // C: 企業略称
    '',                              // D: 代表者役職
    '',                              // E: 代表者名
    '',                              // F: 郵便番号
    '',                              // G: 住所
    '',                              // H: 電話番号
    '',                              // I: FAX番号
    '',                              // J: メールアドレス
    '',                              // K: HP URL
    '',                              // L: 担当者名
    '',                              // M: 担当者メールアドレス
    '',                              // N: 担当者電話番号
    '',                              // O: 業種
    '',                              // P: 従業員数
    '',                              // Q: 資本金
    '',                              // R: 設立年月日
    '',                              // S: 備考
    formattedDate,                   // T: 登録日
    formattedDate,                   // U: 最終更新日
    '顧客マスタ連動',                // V: データソース
    companyName,                     // W: 顧客マスタ企業名
    0,                               // X: 契約実績
    ''                               // Y: 最新契約ID
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Y`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [newRow]
    }
  });

  return newCompanyId;
}
```

---

#### タスク4: `/api/contract/reminders` の修正

**ファイル**: `app/api/contract/reminders/route.ts`

**修正内容**: 自動作成ロジックを統合

**重要**: このファイルは既に存在し、リマインダー取得機能が実装されています。以下の変更を加えてください。

**追加するインポート**:
```typescript
import { google } from 'googleapis';
import { normalizeCompanyName } from '@/lib/normalize-company-name';
import { generateNextContractId } from '@/lib/generate-contract-id';
import { getOrCreateCompanyId } from '@/lib/company-master-utils';
```

**修正箇所**: `// 3. 新規契約必要チェック` のセクション（約45行目〜58行目）

**修正前**:
```typescript
// 3. 新規契約必要チェック
for (const order of receivedOrders) {
  const existsInContract = contractSheet
    .slice(2)
    .some(row => row[2] === order.companyName); // C列（企業名）

  if (!existsInContract) {
    reminders.push({
      type: 'new-contract-required',
      companyName: order.companyName,
      priority: 'high'
    });
  }
}
```

**修正後**:
```typescript
// 3. 新規契約必要チェック（初回のみ、自動作成あり）
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

for (const order of receivedOrders) {
  // 企業マスタで企業IDを取得（または新規作成）
  const companyId = await getOrCreateCompanyId(sheets, spreadsheetId, order.companyName);

  // 契約・入金管理シートにこの企業IDの契約が存在するか
  const hasExistingContract = contractSheet
    .slice(2)
    .some(row => parseInt(row[1]) === companyId); // B列: 企業ID

  if (!hasExistingContract) {
    // 初回契約のみ自動作成
    const contractId = await generateNextContractId(spreadsheetId);

    const newRow = [
      contractId,                     // A: 契約ID
      companyId,                      // B: 企業ID
      order.companyName,              // C: 企業名
      '', '', '', '', '', '', '', '', '', '', '', '', '', // D〜Q列: 空欄
      '', '', '', '', '', '', '', '', '', '', '', '', ''  // R〜AD列: 空欄
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '契約・入金管理!A:AD',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    // リマインダーカードを表示
    reminders.push({
      type: 'new-contract-required',
      companyName: order.companyName,
      contractId,
      priority: 'high'
    });
  }

  // 既に契約が存在する場合は何もしない（2件目以降は手動登録）
}
```

---

#### タスク5: `/api/contract/create` の修正

**ファイル**: `app/api/contract/create/route.ts`

**修正内容**: 企業IDベースの検索に変更

**重要**: このファイルは既に存在し、情報収集フォーマート受領後の更新機能が実装されています。以下の変更を加えてください。

**追加するインポート**:
```typescript
import { normalizeCompanyName } from '@/lib/normalize-company-name';
```

**修正箇所1**: 企業IDを取得する処理を追加（約23行目あたり）

**追加する処理**:
```typescript
// 1. 契約企業マスタから企業IDを取得（正規化名で検索）
const companyMasterData = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: '契約企業マスタ!A:W'
});

const normalizedInputName = normalizeCompanyName(parsedData.companyName);
const companyInMaster = companyMasterData.data.values
  ?.slice(1)
  .find(row =>
    normalizeCompanyName(row[22]) === normalizedInputName // W列: 顧客マスタ企業名
  );

if (!companyInMaster) {
  return NextResponse.json(
    { success: false, error: '契約企業マスタに該当する企業が見つかりません' },
    { status: 404 }
  );
}

const companyId = parseInt(companyInMaster[0]); // A列: 企業ID
```

**修正箇所2**: `updateCompanyMaster` 関数の呼び出しを修正

**修正前**:
```typescript
await updateCompanyMaster(sheets, spreadsheetId, parsedData);
```

**修正後**:
```typescript
await updateCompanyMaster(sheets, spreadsheetId, parsedData, companyId);
```

**修正箇所3**: 契約シートの検索ロジックを修正（約34行目〜46行目）

**修正前**:
```typescript
// C列（企業名）で該当行を検索
let targetRowIndex = -1;
let contractId = -1;

for (let i = 2; i < rows.length; i++) {
  const row = rows[i];
  if (row && row[2] === parsedData.companyName) {
    targetRowIndex = i + 1;
    contractId = parseInt(row[0]) || (i - 1);
    break;
  }
}
```

**修正後**:
```typescript
// B列（企業ID）が一致し、D列が空欄の行を検索
let targetRowIndex = -1;
let contractId = -1;

for (let i = 2; i < rows.length; i++) {
  const row = rows[i];
  if (row && parseInt(row[1]) === companyId && !row[3]) { // B列=企業ID, D列=空欄
    targetRowIndex = i + 1;
    contractId = parseInt(row[0]) || (i - 1);
    break;
  }
}
```

**修正箇所4**: `updateCompanyMaster` 関数のシグネチャを修正（約100行目あたり）

**修正前**:
```typescript
async function updateCompanyMaster(
  sheets: any,
  spreadsheetId: string,
  parsedData: ParsedContractForm
): Promise<void> {
```

**修正後**:
```typescript
async function updateCompanyMaster(
  sheets: any,
  spreadsheetId: string,
  parsedData: ParsedContractForm,
  companyId: number
): Promise<void> {
```

**修正箇所5**: `updateCompanyMaster` 関数内の検索ロジックを修正（約115行目〜127行目）

**修正前**:
```typescript
// B列（企業正式名称）で検索
let targetRowIndex = -1;
for (let i = 1; i < existingData.data.values.length; i++) {
  const row = existingData.data.values[i];
  if (row[1] === parsedData.companyName) {
    targetRowIndex = i + 1;
    break;
  }
}
```

**修正後**:
```typescript
// A列（企業ID）で検索
let targetRowIndex = -1;
for (let i = 1; i < existingData.data.values.length; i++) {
  const row = existingData.data.values[i];
  if (parseInt(row[0]) === companyId) {
    targetRowIndex = i + 1;
    break;
  }
}
```

---

#### タスク6: `/api/company-master/list` の作成

**新規ファイル**: `app/api/company-master/list/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

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

#### タスク7: `/api/contract/create-for-existing` の作成

**新規ファイル**: `app/api/contract/create-for-existing/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSheetData } from '@/lib/google-sheets';
import { generateNextContractId } from '@/lib/generate-contract-id';

interface CreateContractForExistingRequest {
  companyId: number;
  contractService: string;
  contractDate: string;
  amount: number;
  paymentMethod: string;
  paymentDueDate: string;
  publicationIssue: string;
  notes?: string;
}

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

    // 2. 契約IDを生成
    const newContractId = await generateNextContractId(process.env.SALES_SPREADSHEET_ID!);

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

#### タスク8: `ExistingCompanyContractModal` コンポーネントの作成

**新規ファイル**: `components/workflow/ExistingCompanyContractModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface CompanyMasterData {
  companyId: number;
  officialName: string;
}

interface ExistingCompanyContractModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExistingCompanyContractModal({
  onClose,
  onSuccess
}: ExistingCompanyContractModalProps) {
  const [companies, setCompanies] = useState<CompanyMasterData[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [contractInfo, setContractInfo] = useState({
    contractService: 'ゆめマガ',
    contractDate: '',
    amount: '',
    paymentMethod: '一括',
    paymentDueDate: '',
    publicationIssue: '',
    notes: ''
  });

  // 企業リストを取得
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/company-master/list');
      const data = await response.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('企業リスト取得エラー:', error);
    }
  };

  // 検索フィルター
  const filteredCompanies = companies.filter(company =>
    company.officialName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.companyId === selectedCompanyId);

  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert('企業を選択してください');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contract/create-for-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          ...contractInfo,
          amount: parseFloat(contractInfo.amount.replace(/,/g, ''))
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('契約作成エラー:', error);
      alert('契約の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">既存企業の追加契約</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 企業選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              企業選択
            </label>

            {/* 検索ボックス */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="企業名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 企業リスト */}
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {filteredCompanies.map(company => (
                <button
                  key={company.companyId}
                  onClick={() => setSelectedCompanyId(company.companyId)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                    selectedCompanyId === company.companyId
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="font-medium">{company.officialName}</div>
                  <div className="text-sm text-gray-500">企業ID: {company.companyId}</div>
                </button>
              ))}
            </div>

            {selectedCompany && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                選択中: <strong>{selectedCompany.officialName}</strong>
                （企業ID: {selectedCompany.companyId}）
              </div>
            )}
          </div>

          <hr />

          {/* 契約情報 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">契約情報</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  契約サービス
                </label>
                <select
                  value={contractInfo.contractService}
                  onChange={(e) =>
                    setContractInfo({ ...contractInfo, contractService: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ゆめマガ">ゆめマガ</option>
                  <option value="HP制作">HP制作</option>
                  <option value="SNS運用">SNS運用</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    契約日
                  </label>
                  <input
                    type="date"
                    value={contractInfo.contractDate}
                    onChange={(e) =>
                      setContractInfo({ ...contractInfo, contractDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    契約金額
                  </label>
                  <input
                    type="text"
                    placeholder="例: 744000"
                    value={contractInfo.amount}
                    onChange={(e) =>
                      setContractInfo({ ...contractInfo, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    入金方法
                  </label>
                  <select
                    value={contractInfo.paymentMethod}
                    onChange={(e) =>
                      setContractInfo({ ...contractInfo, paymentMethod: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="一括">一括</option>
                    <option value="分割">分割</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    入金予定日
                  </label>
                  <input
                    type="date"
                    value={contractInfo.paymentDueDate}
                    onChange={(e) =>
                      setContractInfo({ ...contractInfo, paymentDueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  掲載開始号
                </label>
                <input
                  type="text"
                  placeholder="例: 2025年12月号"
                  value={contractInfo.publicationIssue}
                  onChange={(e) =>
                    setContractInfo({ ...contractInfo, publicationIssue: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={contractInfo.notes}
                  onChange={(e) =>
                    setContractInfo({ ...contractInfo, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedCompanyId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : '契約を作成'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

#### タスク9: メインページへの統合

**ファイル**: `app/dashboard/workflow/contract/page.tsx`

**修正内容**: 「既存企業追加契約」ボタンとモーダルを追加

**追加するインポート**:
```typescript
import ExistingCompanyContractModal from '@/components/workflow/ExistingCompanyContractModal';
```

**追加するstate**:
```typescript
const [showExistingCompanyModal, setShowExistingCompanyModal] = useState(false);
```

**ヘッダーにボタンを追加**（「新規契約」ボタンの隣）:
```typescript
<button
  onClick={() => setShowExistingCompanyModal(true)}
  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
>
  既存企業追加契約
</button>
```

**モーダルを追加**（return文の末尾）:
```typescript
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

#### タスク10: `/api/contract/auto-create` の削除

**削除対象**: `app/api/contract/auto-create/route.ts`

**理由**: `/api/contract/reminders` に統合したため不要

---

## 実装順序

**重要**: 以下の順序で実装してください。順序を守らないとエラーが発生します。

1. ✅ `lib/normalize-company-name.ts` - 企業名正規化関数
2. ✅ `lib/generate-contract-id.ts` - 契約ID生成関数
3. ✅ `lib/company-master-utils.ts` - 企業マスタ登録関数
4. ✅ `/api/contract/reminders/route.ts` - 自動作成ロジック統合
5. ✅ `/api/contract/create/route.ts` - 企業IDベースの検索に修正
6. ✅ `/api/company-master/list/route.ts` - 企業リスト取得API
7. ✅ `/api/contract/create-for-existing/route.ts` - 既存企業契約作成API
8. ✅ `components/workflow/ExistingCompanyContractModal.tsx` - モーダル作成
9. ✅ `app/dashboard/workflow/contract/page.tsx` - メインページ統合
10. ✅ `app/api/contract/auto-create/route.ts` - 削除

---

## テスト方法

### テスト1: 新規企業の初回契約（自動検出）

1. 顧客マスタで新規企業（例: テスト株式会社）のS列を「受注」に設定
2. ダッシュボード（http://localhost:3000/dashboard/workflow/contract）にアクセス
3. リマインダーカードが表示されることを確認 ✅
4. Google Sheetsを開いて以下を確認:
   - 契約企業マスタに新規企業が登録されている ✅
   - 契約・入金管理シートにA列・B列・C列のみ書き込まれている ✅
5. 情報収集フォーマートを準備（テストデータ）
6. 「新規契約」ボタンから情報を入力
7. Google Sheetsを開いて以下を確認:
   - 契約企業マスタの詳細情報が更新されている ✅
   - 契約・入金管理シートのD列以降が更新されている ✅

### テスト2: 既存企業の追加契約（手動登録）

1. 既に契約が存在する企業（例: 信藤建設）のS列が「受注」
2. ダッシュボードにアクセス
3. 「新規契約必要」カードが表示されないことを確認 ✅
4. 「既存企業追加契約」ボタンをクリック
5. モーダルが開くことを確認 ✅
6. 企業を検索・選択
7. 契約情報を入力
8. 「契約を作成」をクリック
9. Google Sheetsを開いて以下を確認:
   - 契約・入金管理シートに新しい行が追加されている ✅
   - A列に契約ID、B列に企業ID、C列に企業名、D列以降に契約情報が設定されている ✅

### テスト3: 企業名の表記ゆれ対応

1. 顧客マスタ: 「株式会社テスト」
2. 情報収集フォーマート: 「（株）テスト」
3. 「新規契約」ボタンから情報を入力
4. エラーが発生せず、正常に更新されることを確認 ✅
5. 契約企業マスタで企業IDが正しく取得されていることを確認 ✅

---

## 注意事項

### 重要な制約

1. **既存データ（信藤建設）について**
   - 契約・入金管理シートのRow 3のB列（企業ID）は現在空欄
   - 実装後、手動で企業ID「1」を追加する必要がある

2. **環境変数の確認**
   - `SALES_SPREADSHEET_ID`: 営業予実管理スプレッドシートのID
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: サービスアカウントのJSON

3. **Google Sheets APIの権限**
   - 読み取りと書き込みの両方が必要
   - スコープ: `https://www.googleapis.com/auth/spreadsheets`

### エラーハンドリング

1. **企業が見つからない場合**
   - 404エラーを返し、ユーザーに通知

2. **契約レコードが見つからない場合**
   - 404エラーを返し、ユーザーに通知

3. **Google Sheets APIエラー**
   - 500エラーを返し、エラーメッセージをログに出力

### パフォーマンスの考慮

1. **リマインダー取得時の処理時間**
   - 自動作成を含むため、通常より時間がかかる可能性がある
   - ローディング表示を維持する

2. **大量の企業が「受注」の場合**
   - 初回は複数の企業が一度に作成される可能性がある
   - Google Sheets APIのレート制限に注意

---

## 次世代Claude Codeへの指示

### 開始手順

1. **このドキュメントを熟読する**
   - 全てのセクションを理解する
   - 不明点があれば、参照ドキュメントを確認

2. **関連ドキュメントを確認する**（必要に応じて）
   - `docs/workflow/Phase1.6_現状調査レポート_完全版.md`
   - `docs/workflow/Phase1.6_確定要件_複数契約対応設計.md`

3. **実装タスク一覧を TodoWrite ツールに登録する**
   - 10個のタスクを登録
   - 進捗を可視化

4. **実装順序に従って、1つずつ実装する**
   - 各タスク完了後、TodoWrite で完了マークを付ける
   - 次のタスクに進む前に、前のタスクが正しく動作することを確認

5. **各タスク完了後、簡単な動作確認を行う**
   - TypeScriptエラーがないことを確認
   - サーバーが起動することを確認

6. **全タスク完了後、テスト方法に従ってテストを実施する**
   - テスト1, 2, 3を順番に実施
   - エラーが発生した場合は、デバッグして修正

### 判断を求められる場合の対処

このドキュメントに記載されていない判断が必要になった場合:

1. **まず、関連ドキュメントを確認する**
2. **それでも不明な場合は、ユーザーに確認する**
3. **決して推測で実装しない**

### 実装完了の報告

全てのタスクとテストが完了したら、以下の情報をユーザーに報告してください:

1. 実装したタスクの一覧
2. テスト結果（成功/失敗）
3. 発見した問題点（あれば）
4. 次のステップの提案（あれば）

---

## 📚 参照ドキュメント

- `docs/workflow/Phase1.6_現状調査レポート_完全版.md` - 現状の詳細分析
- `docs/workflow/Phase1.6_確定要件_複数契約対応設計.md` - 確定した要件
- `docs/workflow/Phase1.6_実装状況と課題_2025-10-12.md` - 前世代の引き継ぎ
- `docs/workflow/契約業務フロー統合_Phase1.6_完全実装計画書.md` - 当初の計画書

---

**作成日**: 2025年10月12日 06:00 JST
**作成者**: Claude Code（現世代）
**対象**: 次世代Claude Code
**ステータス**: 完成（実装開始可能）

---

**次世代Claude Codeへ**: このドキュメントを信頼し、記載された内容のみに基づいて実装を進めてください。成功を祈ります。
