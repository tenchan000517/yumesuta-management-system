# Phase 8: データ提出進捗管理 統合実装計画書 v2.0

**作成日**: 2025-10-09
**作成者**: Claude Code
**バージョン**: 2.0（Webフォーム方式に変更）
**状態**: 計画確定、実装未着手

---

## 📋 このドキュメントの目的

データ提出進捗管理UIと既存システム（工程表、企業マスター）を統合し、以下の機能を実装します：

1. **全体進捗の月号対応**
2. **データ提出状況と工程表ステータスのリンク**
3. **企業情報との連動（ファイルアップロード状況表示）**
4. **企業情報入力Webフォーム作成**（Excel不要）

---

## 🎯 実装する機能の全体像

### 現状（Phase 7まで完了）

- ✅ カテゴリモードUI実装（フォルダアイコングリッド、ファイル一覧、プレビュー）
- ✅ 企業モードUI実装（8フォルダ、既存/新規企業対応）
- ✅ ファイルアップロード機能
- ✅ ファイル一覧取得機能

### Phase 8で実装する機能

| 機能 | 現状 | Phase 8完了後 |
|------|------|--------------|
| 全体進捗 | モックデータ（固定値） | **月号ごとの実データ** |
| データ提出状況 | カテゴリカード表示のみ | **工程表ステータスと連動** |
| 企業データ | 企業マスター（スプレッドシート）のみ | **ファイルアップロード状況も表示** |
| 企業情報入力 | 手動でスプレッドシート編集 | **Webフォームから直接入力** |

---

## 📊 Phase 8.1: 全体進捗の月号対応

### 目標

選択中の月号（`selectedIssue`）に対応したデータ提出状況を表示し、Google Driveのファイル存在チェックで提出状況を判定する。

### 実装内容

#### 1. データ提出状況取得API作成

**新規ファイル**: `app/api/yumemaga-v2/data-submission/status/route.ts`

**エンドポイント**: `GET /api/yumemaga-v2/data-submission/status?issue=2025年11月号`

**レスポンス構造**:
```typescript
{
  success: true,
  issue: "2025年11月号",
  categories: [
    {
      categoryId: "A",
      categoryName: "メインインタビュー",
      requiredData: [
        {
          type: "recording",
          name: "録音データ",
          status: "submitted",  // submitted | pending | none
          optional: false,
          fileCount: 3,
          folderId: "1aBcDeFgHi..."
        },
        {
          type: "photo",
          name: "写真データ",
          status: "pending",
          optional: false,
          fileCount: 0,
          folderId: "1xYz..."
        }
      ]
    }
  ],
  summary: {
    submitted: 15,
    pending: 8,
    none: 2,
    total: 25,
    progress: 60
  }
}
```

**処理フロー**:

1. カテゴリマスター（`カテゴリマスター!A2:J100`）から全カテゴリ取得
2. 各カテゴリのE列（`requiredData`）をカンマ区切りでパース
   - 例: `"録音データ,写真データ"` → `["録音データ", "写真データ"]`
3. データ種別名を型にマッピング
   ```typescript
   const DATA_TYPE_MAP: Record<string, DataType> = {
     '録音データ': 'recording',
     '写真データ': 'photo',
     '企画内容': 'planning',
   };
   ```
4. 各データ種別に対してGoogle Driveでファイル存在確認
   - パス構築: `カテゴリDriveID/データ種別名/月号フォルダ/`
   - 月号変換: `"2025年11月号"` → `"2025_11"`
   - ファイル数取得: `listFilesInFolderWithOAuth(folderId)`
   - ステータス判定:
     - `fileCount > 0` → `submitted`
     - `fileCount === 0` → `pending`
     - エラー発生 → `none`
5. サマリー計算
   ```typescript
   summary.progress = Math.round((summary.submitted / summary.total) * 100);
   ```

**重要な実装ポイント**:

- `ensureDirectoryWithOAuth` でフォルダを自動作成しながらIDを取得
- カテゴリマスターI列（ステータス）が `"active"` のものだけ処理
- エラー発生時もクラッシュせず `none` として継続

#### 2. フロントエンド修正

**修正ファイル**: `components/data-submission/DataSubmissionSection.tsx`

**変更箇所1**: useEffectでデータ提出状況API呼び出し（行66-88付近）

**変更前**:
```typescript
// 暫定: 既存のカテゴリデータを使用
setSubmissionData(categories);
```

**変更後**:
```typescript
// データ提出状況API呼び出し
const statusResponse = await fetch(
  `/api/yumemaga-v2/data-submission/status?issue=${encodeURIComponent(selectedIssue)}`
);
const statusResult = await statusResponse.json();

if (statusResult.success) {
  setSubmissionData(statusResult.categories);
  // 全体進捗を更新（新しいstate作成）
  setOverallProgress(statusResult.summary);
}
```

**変更箇所2**: 全体進捗表示部分（行166-176付近）

**新しいstate追加**:
```typescript
const [overallProgress, setOverallProgress] = useState<{
  submitted: number;
  pending: number;
  none: number;
  total: number;
  progress: number;
} | null>(null);
```

**表示ロジック変更**:
```typescript
{overallProgress && (
  <div className="text-sm text-gray-600">
    <span className="font-semibold">{overallProgress.progress}%</span> 完了
    （提出済み: {overallProgress.submitted} / 全体: {overallProgress.total}）
  </div>
)}
```

### 完了条件

- [ ] データ提出状況APIが正しく月号別データを返す
- [ ] 全体進捗が選択月号のデータで計算される
- [ ] カテゴリカードが月号別の提出状況を表示
- [ ] 月号を変更すると進捗が更新される

---

## 🔗 Phase 8.2: データ提出状況と工程表ステータスのリンク

### 目標

ファイルアップロード完了時に対応する工程を自動完了し、工程表（進捗入力シート）のG列（実績日）に今日の日付を自動入力する。

### 前提知識

#### スプレッドシート構造（実データ確認済み）

**新工程マスター**:
- A列: 工程No（例: `A-2`, `K-2`）
- B列: 工程名（例: `メインインタビューデータ提出・撮影`）
- **F列**: 必要データ（例: `録音データ`）← **Phase 8.2で使用**

**進捗入力シート**:
- A列: 工程No
- B列: 工程名
- **C列**: 必要データ（例: `録音データ`）← **検索に使用**
- D列: 月号
- E列: 逆算予定日
- F列: 入力予定日
- **G列**: 実績日 ← **Phase 8.2で更新対象**
- H列: 先方確認ステータス
- I列: ステータス

**重要**: 進捗入力シートは月号別に分かれていない。同じシート内で全月号を管理。

### 実装内容

#### 1. 工程完了API作成

**新規ファイル**: `app/api/yumemaga-v2/data-submission/complete-process/route.ts`

**エンドポイント**: `PUT /api/yumemaga-v2/data-submission/complete-process`

**リクエストボディ**:
```typescript
{
  issue: "2025年11月号",
  categoryId: "A",
  dataType: "recording"  // 'recording' | 'photo' | 'planning'
}
```

**処理フロー**:

1. データ種別を日本語名に変換
   ```typescript
   const DATA_TYPE_REVERSE_MAP: Record<DataType, string> = {
     recording: '録音データ',
     photo: '写真データ',
     planning: '企画内容',
   };
   const dataTypeName = DATA_TYPE_REVERSE_MAP[dataType];
   ```

2. 進捗入力シート（`進捗入力シート!A2:J200`）から該当工程を検索
   ```typescript
   const targetRow = progressData.find(row => {
     const processNo = row[0];           // A列: 工程No
     const requiredData = row[2] || '';  // C列: 必要データ
     const processIssue = row[3] || '';  // D列: 月号

     return processNo.startsWith(categoryId) &&
            requiredData.includes(dataTypeName) &&
            (processIssue === issue || processIssue === '');
   });
   ```

3. 該当工程のG列（実績日）を今日の日付で更新
   ```typescript
   const today = new Date().toLocaleDateString('ja-JP'); // "2025/10/9"
   const rowIndex = progressData.indexOf(targetRow) + 2; // +2はヘッダー行とインデックス調整

   await updateSheetCell(
     spreadsheetId,
     '進捗入力シート',
     `G${rowIndex}`,
     today
   );
   ```

4. 完了通知を返す
   ```typescript
   return NextResponse.json({
     success: true,
     completedProcesses: [targetRow[0]], // 工程No
     processName: targetRow[1],           // 工程名
     message: `工程 ${targetRow[0]}: ${targetRow[1]} を完了しました`
   });
   ```

**エッジケース処理**:

- 該当工程が見つからない → `success: true, completedProcesses: []`（エラーにしない）
- 既に実績日が入力済み → 上書きせずスキップ
- 複数工程が該当 → 最初の1件のみ完了

**必要なヘルパー関数**:

```typescript
// lib/google-sheets.ts に追加
export async function updateSheetCell(
  spreadsheetId: string,
  sheetName: string,
  cellAddress: string,  // 例: "G5"
  value: string
): Promise<void> {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${cellAddress}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });
}
```

#### 2. フロントエンド修正

**修正ファイル**: `components/data-submission/DataSubmissionSection.tsx`

**変更箇所**: `handleFileUpload` 関数（行194-249付近）

**変更後**:
```typescript
if (result.success) {
  alert(`アップロード成功: ${result.uploadedFiles.length}件のファイルがアップロードされました`);

  // 工程完了API呼び出し（カテゴリモードのみ）
  if (uploadMode === 'category' && selectedCategory && selectedDataType) {
    try {
      const completeRes = await fetch('/api/yumemaga-v2/data-submission/complete-process', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: selectedIssue,
          categoryId: selectedCategory,
          dataType: selectedDataType,
        }),
      });
      const completeData = await completeRes.json();

      if (completeData.success && completeData.completedProcesses.length > 0) {
        alert(`✅ ${completeData.message}\n工程が自動完了しました`);
      }
    } catch (error) {
      console.error('工程完了API呼び出しエラー:', error);
      // エラーでもアップロード自体は成功しているのでアラート不要
    }
  }

  // データ提出状況を再取得
  fetchAllData();
}
```

### 完了条件

- [ ] ファイルアップロード時に対応工程が自動完了
- [ ] 進捗入力シートのG列（実績日）が更新される
- [ ] 既に実績日がある場合はスキップされる
- [ ] 該当工程がない場合もエラーにならない

---

## 🏢 Phase 8.3: 企業情報との連動

### 目標

企業別工程管理セクション（`CompanyManagementSection.tsx`）に、各企業のファイルアップロード状況（8フォルダ）を表示する。

### 実装内容

#### 1. 企業別工程管理API拡張

**修正ファイル**: `app/api/yumemaga-v2/company-processes/route.ts`

**追加するレスポンスフィールド**:
```typescript
{
  success: true,
  companies: [
    {
      companyId: "marutomo",
      companyName: "マルトモ",
      status: "new",
      progress: {
        masterSheet: {
          total: 51,
          filled: 50,
          notFilled: 1,
          progressRate: 98
        },
        fileUpload: {  // ← 新規追加
          "ロゴ": { uploaded: true, fileCount: 1 },
          "ヒーロー画像": { uploaded: true, fileCount: 1 },
          "QRコード": { uploaded: false, fileCount: 0 },
          "代表者写真": { uploaded: true, fileCount: 1 },
          "サービス画像": { uploaded: true, fileCount: 3 },
          "社員写真": { uploaded: true, fileCount: 2 },
          "情報シート": { uploaded: false, fileCount: 0 },
          "その他": { uploaded: true, fileCount: 5 }
        }
      }
    }
  ]
}
```

**追加処理**（既存のcompanies配列生成ループ内）:

```typescript
// カテゴリC（企業情報）のDriveフォルダID取得
const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:J100');
const categoryCRow = categoryData.find((row: any[]) => row[0] === 'C');
const categoryCDriveId = categoryCRow ? categoryCRow[9] : null;

if (!categoryCDriveId) {
  throw new Error('カテゴリCのDriveフォルダIDが見つかりません');
}

// 各企業のファイルアップロード状況をカウント
const COMPANY_FOLDER_TYPES: CompanyFolderType[] = [
  'ロゴ',
  'ヒーロー画像',
  'QRコード',
  '代表者写真',
  'サービス画像',
  '社員写真',
  '情報シート',
  'その他',
];

const fileUpload: Record<CompanyFolderType, { uploaded: boolean; fileCount: number }> = {} as any;

for (const folderType of COMPANY_FOLDER_TYPES) {
  try {
    // パス: カテゴリC_DriveID/企業名/フォルダ種別/
    const folderPath = await ensureDirectoryWithOAuth(categoryCDriveId, [companyName, folderType]);
    const files = await listFilesInFolderWithOAuth(folderPath.id);

    fileUpload[folderType] = {
      uploaded: files.length > 0,
      fileCount: files.length,
    };
  } catch (error) {
    console.error(`Error checking ${companyName}/${folderType}:`, error);
    fileUpload[folderType] = {
      uploaded: false,
      fileCount: 0,
    };
  }
}

// 既存のprogressオブジェクトに追加
companies.push({
  companyId,
  companyName,
  status,
  progress: {
    masterSheet: calculateCompanyMasterProgress(companyRow),
    fileUpload,  // ← 追加
  },
});
```

#### 2. フロントエンド修正

**修正ファイル**: `components/company-management/CompanyManagementSection.tsx`

**修正箇所**: 企業カード表示部分（企業一覧のmap内）

**追加UI**:
```typescript
{/* 既存の企業マスター進捗の下に追加 */}
<div className="mt-3 pt-3 border-t border-gray-200">
  <h4 className="text-xs font-semibold text-gray-700 mb-2">ファイルアップロード状況</h4>
  <div className="grid grid-cols-2 gap-1 text-xs">
    {Object.entries(company.progress.fileUpload).map(([folderType, status]) => (
      <div key={folderType} className="flex items-center gap-1">
        <span className={status.uploaded ? "text-green-600" : "text-gray-400"}>
          {status.uploaded ? "✅" : "⬜"}
        </span>
        <span className="text-gray-700">{folderType}</span>
        <span className="text-gray-500">({status.fileCount})</span>
      </div>
    ))}
  </div>
</div>
```

**サービス画像・社員写真の制限表示**（オプション）:
```typescript
{(folderType === 'サービス画像' || folderType === '社員写真') && (
  <span className="text-gray-400 text-xs">/ 3</span>
)}
```

### 完了条件

- [ ] 企業別工程管理にファイルアップロード状況が表示
- [ ] 8つのフォルダすべての状況が確認できる
- [ ] ファイル数がリアルタイムで取得される
- [ ] アップロード済みフォルダは✅、未提出は⬜で表示

---

## 📄 Phase 8.4: 企業情報入力Webフォーム作成

### 目標

**Excel不要**で企業マスター（51列）に直接データを入力できるWebフォームを作成する。

### なぜExcelではなくWebフォームなのか？

**Excelアップロード方式の問題点**:
- ❌ フォーマット不統一（企業ごとに異なるテンプレート）
- ❌ パースエラーの発生（セル結合、数式、空白）
- ❌ バリデーション不可（入力ミスを事前防止できない）
- ❌ 二度手間（Excel作成 → アップロード → パース → 反映）

**Webフォーム方式のメリット**:
- ✅ フォーム = 企業マスター列（1対1完全対応）
- ✅ リアルタイムバリデーション（入力ミス防止）
- ✅ 直接スプレッドシート書き込み（パース処理不要）
- ✅ プログレスバー表示（入力進捗が可視化）
- ✅ ドラフト保存機能（途中保存可能）

### 企業マスター51列の構造（実データ確認済み）

**基本情報**（1-10列）:
- A列: 企業ID
- B列: 企業名
- C列: 企業名（カナ）
- D列: 業種
- E列: 事業エリア
- F列: 設立年
- ...（残り詳細は `docs/yumemaga-production-management/COMPANY_MASTER_SCHEMA.md` 参照）

**画像パス**（7-31列）:
- 7列: ロゴ画像パス
- 8列: ヒーロー画像パス
- 9列: QRコード画像パス
- 14列: 代表者写真パス
- 15, 18, 21列: サービス1-3画像パス
- 25, 28, 31列: 社員1-3画像パス

**その他情報**（32-51列）:
- 企業紹介文、代表者コメント、事業内容、強み、採用情報など

**ステータス**（50列）:
- 50列: ステータス（`新規` | `変更` | `継続` | `アーカイブ`）

### 実装内容

#### 1. 企業情報入力フォームページ作成

**新規ファイル**: `app/dashboard/yumemaga-v2/company-form/page.tsx`

**ページ構成**:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Building2, Save, Upload, CheckCircle } from 'lucide-react';

export default function CompanyFormPage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [companyMode, setCompanyMode] = useState<'new' | 'existing'>('new');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);

  // フォームフィールド定義（企業マスター51列に対応）
  const formFields = [
    { key: 'companyId', label: '企業ID', type: 'text', required: true, column: 'A' },
    { key: 'companyName', label: '企業名', type: 'text', required: true, column: 'B' },
    { key: 'companyNameKana', label: '企業名（カナ）', type: 'text', required: true, column: 'C' },
    { key: 'industry', label: '業種', type: 'text', required: true, column: 'D' },
    { key: 'businessArea', label: '事業エリア', type: 'text', required: false, column: 'E' },
    { key: 'foundedYear', label: '設立年', type: 'number', required: false, column: 'F' },
    // ... 全51列分のフィールド定義
  ];

  // 進捗率計算
  useEffect(() => {
    const requiredFields = formFields.filter(f => f.required);
    const filledRequired = requiredFields.filter(f => formData[f.key]?.trim()).length;
    const calculatedProgress = Math.round((filledRequired / requiredFields.length) * 100);
    setProgress(calculatedProgress);
  }, [formData]);

  // 既存企業一覧取得
  const fetchCompanies = async () => {
    const res = await fetch('/api/yumemaga-v2/companies');
    const data = await res.json();
    if (data.success) {
      setCompanies(data.companies.map((c: any) => c.companyName));
    }
  };

  // 既存企業データ読み込み
  const loadCompanyData = async (companyName: string) => {
    const res = await fetch(`/api/yumemaga-v2/companies/${encodeURIComponent(companyName)}`);
    const data = await res.json();
    if (data.success) {
      setFormData(data.company);
    }
  };

  // フォーム送信
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/yumemaga-v2/companies/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: companyMode,
          companyName: companyMode === 'existing' ? selectedCompany : formData.companyName,
          data: formData,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert('✅ 企業情報を保存しました');
      } else {
        alert(`❌ エラー: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ 送信エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ヘッダー */}
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          企業情報入力フォーム
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          企業マスターに登録する情報を入力してください
        </p>
      </div>

      {/* 進捗バー */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">入力進捗</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* モード選択 */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          企業登録モード
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setCompanyMode('new')}
            className={`px-4 py-2 rounded ${
              companyMode === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            新規企業
          </button>
          <button
            onClick={() => {
              setCompanyMode('existing');
              fetchCompanies();
            }}
            className={`px-4 py-2 rounded ${
              companyMode === 'existing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            既存企業を編集
          </button>
        </div>

        {companyMode === 'existing' && (
          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              loadCompanyData(e.target.value);
            }}
            className="mt-3 w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="">企業を選択...</option>
            {companies.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {/* フォームフィールド */}
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formFields.map((field) => (
            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={4}
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>

        {/* 送信ボタン */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || progress < 100}
            className={`flex-1 px-6 py-3 rounded font-semibold flex items-center justify-center gap-2 ${
              loading || progress < 100
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save className="w-5 h-5" />
            {loading ? '送信中...' : '企業マスターに保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**重要な実装ポイント**:

1. **フォームフィールド定義**（`formFields`配列）:
   - 企業マスター51列すべてを定義
   - `column` プロパティでスプレッドシート列を明示（例: `'A'`, `'B'`）
   - 必須項目は `required: true`

2. **進捗バー**:
   - 必須項目の入力率を計算
   - 100%未満では送信ボタンを無効化

3. **新規/既存モード**:
   - 新規: 空フォームから入力
   - 既存: 企業を選択して既存データを編集

4. **画像パスフィールド**:
   - テキスト入力（手動でGoogle Driveのパスをコピペ）
   - Phase 8.3のファイルアップロード機能で先にアップロード → パスをコピー

#### 2. 企業情報保存API作成

**新規ファイル**: `app/api/yumemaga-v2/companies/upsert/route.ts`

**エンドポイント**: `POST /api/yumemaga-v2/companies/upsert`

**リクエストボディ**:
```typescript
{
  mode: "new" | "existing",
  companyName: "マルトモ",
  data: {
    companyId: "marutomo",
    companyName: "マルトモ",
    companyNameKana: "マルトモ",
    industry: "水産加工業",
    // ... 全51列分のデータ
  }
}
```

**処理フロー**:

1. 企業マスターから対象企業を検索（既存モードの場合）
   ```typescript
   const companyData = await getSheetData(spreadsheetId, '企業マスター!A2:AY200');
   const existingRowIndex = companyData.findIndex((row: any[]) => row[1] === companyName);
   ```

2. データを配列形式に変換（列順序に従う）
   ```typescript
   const rowData = [
     data.companyId,        // A列
     data.companyName,      // B列
     data.companyNameKana,  // C列
     data.industry,         // D列
     // ... 全51列分
   ];
   ```

3. スプレッドシートに書き込み
   ```typescript
   if (mode === 'new') {
     // 新規行追加
     await appendSheetRow(spreadsheetId, '企業マスター', rowData);
   } else {
     // 既存行更新
     const targetRow = existingRowIndex + 2; // +2はヘッダー行とインデックス調整
     await updateSheetRow(spreadsheetId, '企業マスター', targetRow, rowData);
   }
   ```

4. 成功レスポンス
   ```typescript
   return NextResponse.json({
     success: true,
     message: `企業情報を${mode === 'new' ? '登録' : '更新'}しました`,
     companyName: data.companyName,
   });
   ```

**必要なヘルパー関数**:

```typescript
// lib/google-sheets.ts に追加

export async function appendSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowData: any[]
): Promise<void> {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:AY`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowData],
    },
  });
}

export async function updateSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  rowData: any[]
): Promise<void> {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${rowNumber}:AY${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowData],
    },
  });
}
```

#### 3. ナビゲーション追加

**修正ファイル**: `app/dashboard/yumemaga-v2/page.tsx`

**追加ボタン**:
```typescript
<Link href="/dashboard/yumemaga-v2/company-form">
  <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
    <Building2 className="w-5 h-5" />
    企業情報入力フォーム
  </button>
</Link>
```

### 完了条件

- [ ] 企業情報入力フォームが表示される
- [ ] 51列すべてのフィールドが入力可能
- [ ] 新規企業登録が成功する
- [ ] 既存企業の編集が成功する
- [ ] 進捗バーが正しく動作する
- [ ] 企業マスターに正しくデータが反映される

---

## 🗂️ 実装順序と依存関係

```
Phase 8.1: 全体進捗の月号対応
  ↓（独立して実装可能）
Phase 8.3: 企業情報との連動
  ↓（Phase 8.1完了後に実装推奨）
Phase 8.2: 工程表ステータスリンク
  ↓（独立して実装可能）
Phase 8.4: 企業情報入力フォーム
  ↓
完了
```

**推奨実装順序**:
1. **Phase 8.1**（30分）: 全体進捗の月号対応
2. **Phase 8.3**（20分）: 企業情報との連動
3. **Phase 8.2**（30分）: 工程表ステータスリンク
4. **Phase 8.4**（60分）: 企業情報入力フォーム

**合計想定時間**: 2時間20分

---

## ✅ 各Phase完了時のチェックリスト

### Phase 8.1完了時

- [ ] `app/api/yumemaga-v2/data-submission/status/route.ts` 作成完了
- [ ] データ提出状況APIが正しく月号別データを返す
- [ ] 全体進捗が選択月号のデータで計算される
- [ ] カテゴリカードが月号別の提出状況を表示
- [ ] `DataSubmissionSection.tsx` 修正完了

### Phase 8.2完了時

- [ ] `app/api/yumemaga-v2/data-submission/complete-process/route.ts` 作成完了
- [ ] `lib/google-sheets.ts` に `updateSheetCell` 追加完了
- [ ] ファイルアップロード時に対応工程が自動完了
- [ ] 進捗入力シートのG列（実績日）が更新される
- [ ] 既に実績日がある場合はスキップされる

### Phase 8.3完了時

- [ ] `app/api/yumemaga-v2/company-processes/route.ts` 修正完了
- [ ] 企業別工程管理にファイルアップロード状況が表示
- [ ] 8つのフォルダすべての状況が確認できる
- [ ] `CompanyManagementSection.tsx` 修正完了

### Phase 8.4完了時

- [ ] `app/dashboard/yumemaga-v2/company-form/page.tsx` 作成完了
- [ ] `app/api/yumemaga-v2/companies/upsert/route.ts` 作成完了
- [ ] `lib/google-sheets.ts` に `appendSheetRow`, `updateSheetRow` 追加完了
- [ ] 新規企業登録が成功する
- [ ] 既存企業の編集が成功する
- [ ] 企業マスターに正しくデータが反映される

---

## 🚨 次世代Claude Codeへの重要指示

### 必ず守ること

1. **実装順序を厳守**
   - Phase 8.1 → 8.3 → 8.2 → 8.4の順で実装
   - 前のPhaseが完了してから次に進む

2. **エラーハンドリングを徹底**
   - Google Drive API呼び出しは `try-catch` で囲む
   - エラー発生時もクラッシュせず `none` や空配列で継続
   - スプレッドシート更新は権限エラーの可能性を考慮

3. **既存コードを壊さない**
   - 既存のファイルを修正する場合は Read → Edit パターン
   - 新規ファイル作成は Write のみ

4. **テスト方法**
   - 各Phase完了後に開発サーバーで動作確認
   - curl でAPIをテスト
   - ブラウザでUIを確認

### トラブルシューティング

**Google Drive APIが遅い場合**:
- タイムアウトを60秒に設定済み
- バッチ処理は不要（各カテゴリ・企業で並列処理）

**企業マスター更新が失敗する場合**:
- サービスアカウントに書き込み権限があるか確認
- スプレッドシートIDが正しいか確認（`.env.local` の `YUMEMAGA_SPREADSHEET_ID`）

**フォームの進捗が100%にならない場合**:
- 必須項目（`required: true`）の定義を確認
- 空白文字のトリム処理を確認

---

## 📚 関連ドキュメント

- `docs/yumemaga-production-management/PHASE_8_PROGRESS_REPORT.md` - 進捗報告書
- `docs/yumemaga-production-management/PHASE_8_START_PROMPT.md` - スタートプロンプト
- `docs/yumemaga-production-management/DATA_SUBMISSION_UI_HANDOFF.md` - カテゴリモードUI
- `docs/yumemaga-production-management/COMPANY_MODE_UI_DESIGN.md` - 企業モードUI
- `docs/yumemaga-production-management/COMPANY_MASTER_SCHEMA.md` - 企業マスター構造

---

**最終更新**: 2025-10-09
**作成者**: Claude Code
**バージョン**: 2.0

このドキュメントに従って実装を進めてください。不明点があれば `PHASE_8_START_PROMPT.md` を参照してください。
