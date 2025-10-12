# 契約業務フロー統合 - Phase 2.2 完全実装計画書（Google Drive連動）

**作成日**: 2025年10月12日
**作成者**: Claude Code
**対象読者**: 次世代Claude Code（前提知識ゼロ）
**目的**: Phase 2.2（Google Drive連動）の完全な実装
**バージョン**: v2.0（暗黙知排除版）

---

## 📋 目次

1. [Phase 2.2の背景と目的](#phase-22の背景と目的)
2. [ゆめマガUIとの対応関係](#ゆめマガuiとの対応関係)
3. [データ構造・ディレクトリ構造](#データ構造ディレクトリ構造)
4. [環境変数設定](#環境変数設定)
5. [API設計](#api設計)
6. [UI設計](#ui設計)
7. [コンポーネント設計](#コンポーネント設計)
8. [実装手順](#実装手順)
9. [テスト計画](#テスト計画)
10. [重要な注意事項](#重要な注意事項)

---

## Phase 2.2の背景と目的

### 背景

**Phase 2.1完了状態**:
- ✅ ステップ完了時にスプレッドシートへ日付を書き込み可能
- ❌ ファイル（契約書PDF、請求書PDF等）を保存する場所がない

### 目的

契約に関連するエビデンスファイル（PDF、画像等）をGoogle Driveに保存し、ダッシュボードから管理できるようにする。

**実現する機能**:
1. ファイルアップロード機能
2. アップロード済みファイルの一覧表示
3. ファイルのプレビュー・Google Driveで開く機能
4. 企業フォルダの自動作成・AE列への記録

---

## ゆめマガUIとの対応関係

### ゆめマガの構造（参考）

**ゆめマガダッシュボード**（`app/dashboard/yumemaga-v2/page.tsx`）:
```jsx
<DataSubmissionSection
  categories={categories}
  companies={companies}
  availableIssues={issues}
  defaultIssue={selectedIssue}
/>
```

**DataSubmissionSectionの構成**（`components/data-submission/DataSubmissionSection.tsx`）:
1. **全体進捗バー**（常に表示）
2. **アップロードモード選択**（カテゴリ別 or 企業別）
3. **フォルダアイコングリッド**（4カラム）
4. **ファイル一覧＋プレビュー**（右側に配置）
5. **ドラッグ&ドロップエリア**
6. **カテゴリ詳細カード**（折りたたみ可能）

### 契約業務フローでの対応

| ゆめマガ | 契約業務フロー | 備考 |
|---------|---------------|------|
| DataSubmissionSection | ContractFilesSection | メインページの新規セクション |
| カテゴリ選択 | 契約選択 | selectedContractで判定 |
| フォルダアイコングリッド | なし（契約01フォルダ直下） | 契約ごとに1つのフォルダのみ |
| ファイル一覧＋プレビュー | 同じUI | 左右分割レイアウト |
| ドラッグ&ドロップ | 同じUI | 完全に踏襲 |
| サイドパネル | SidePanelにエビデンス保存セクション追加 | 簡易版（最大5件表示） |

---

## データ構造・ディレクトリ構造

### Google Drive階層構造

```
エビデンス保存用Drive/ (ルートフォルダID: 環境変数で管理)
├── 株式会社A/ (企業フォルダID: 契約企業マスタのAE列に保存)
│   ├── 契約01/ (契約フォルダ: 動的作成)
│   │   ├── 契約書.pdf
│   │   ├── 請求書.pdf
│   │   └── その他.jpg
│   ├── 契約02/
│   │   └── ...
├── 株式会社B/ (企業フォルダID: 契約企業マスタのAE列に保存)
│   ├── 契約01/
│   │   └── ...
```

### スプレッドシート構造

**契約企業マスタシート**:
| A列（企業ID） | B列（企業正式名称） | ... | AE列（企業DriveフォルダID） |
|--------------|-------------------|-----|---------------------------|
| 1 | 株式会社A | ... | 1abc123def... |
| 2 | 株式会社B | ... | 2ghi456jkl... |
| 3 | 株式会社C | ... | (空 → 初回作成時に記録) |

**重要**: AE列が空の場合、API側で企業フォルダを自動作成し、そのIDをAE列に書き込む。

---

## 環境変数設定

### `.env.local`に追加

```bash
# Phase 2.2: Google Drive連動用
GOOGLE_DRIVE_ROOT_FOLDER_ID=1blH8qUUd_TLW_nznN5wozwn-vXGFMZ3q
```

**説明**:
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`: エビデンス保存用Driveのルートフォルダ ID
- このフォルダ内に各企業のフォルダが作成される

---

## API設計

### 1. `/api/contract/drive/upload` - ファイルアップロードAPI

**ファイル**: `app/api/contract/drive/upload/route.ts`

**メソッド**: `POST`

**リクエスト形式**: `multipart/form-data`

**パラメータ**:
```typescript
{
  file: File;              // アップロードするファイル
  contractId: number;      // 契約ID（例: 1）
  companyId: number;       // 企業ID（例: 1）
}
```

**レスポンス形式**:
```typescript
{
  success: boolean;
  file?: {
    id: string;            // Google DriveファイルID
    name: string;          // ファイル名
    webViewLink: string;   // Google Driveで開くURL
  };
  error?: string;
}
```

**実装コード**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileWithOAuth, ensureDirectoryWithOAuth, createFolderWithOAuth } from '@/lib/google-drive';
import { getSheetData, updateSheetCell } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    // 1. FormDataをパース
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contractId = parseInt(formData.get('contractId') as string);
    const companyId = parseInt(formData.get('companyId') as string);

    // バリデーション
    if (!file || !contractId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'file, contractId, companyId are required' },
        { status: 400 }
      );
    }

    // 2. 環境変数からルートフォルダIDを取得
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootFolderId) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_DRIVE_ROOT_FOLDER_ID is not set' },
        { status: 500 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // 3. 契約企業マスタから企業情報を取得（A:AE列）
    const companyData = await getSheetData(spreadsheetId, '契約企業マスタ!A3:AE');
    const companyRow = companyData.find((row: any[]) => parseInt(row[0]) === companyId);

    if (!companyRow) {
      return NextResponse.json(
        { success: false, error: `企業ID ${companyId} が見つかりません` },
        { status: 404 }
      );
    }

    const companyName = companyRow[1]; // B列: 企業正式名称
    let companyFolderId = companyRow[30]; // AE列: 企業DriveフォルダID（インデックス30）

    // 4. AE列が空の場合、企業フォルダを作成
    if (!companyFolderId) {
      console.log(`企業フォルダを作成: ${companyName}`);
      companyFolderId = await createFolderWithOAuth(rootFolderId, companyName);

      // AE列に企業フォルダIDを書き込み（行番号 = companyRowのインデックス + 3）
      const rowIndex = companyData.findIndex((row: any[]) => parseInt(row[0]) === companyId);
      const actualRowNumber = rowIndex + 3; // ヘッダー2行 + データ開始行3行目
      await updateSheetCell(spreadsheetId, '契約企業マスタ', `AE${actualRowNumber}`, companyFolderId);

      console.log(`企業フォルダIDをAE${actualRowNumber}に記録: ${companyFolderId}`);
    }

    // 5. 契約フォルダを作成・取得（ensureDirectoryWithOAuthが自動判定）
    const contractName = `契約${String(contractId).padStart(2, '0')}`;
    const pathSegments = [contractName]; // 企業フォルダ直下に契約フォルダ
    const targetFolderId = await ensureDirectoryWithOAuth(companyFolderId, pathSegments);

    // 6. ファイルをアップロード
    const result = await uploadFileWithOAuth(targetFolderId, file);

    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        name: result.name,
        webViewLink: result.webViewLink,
      },
    });

  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

**重要なポイント**:
- `uploadFileWithOAuth`、`ensureDirectoryWithOAuth`、`createFolderWithOAuth`を使用（OAuth認証版）
- AE列のインデックスは30（A=0, B=1, ..., AE=30）
- 行番号は「データ行のインデックス + 3」（ヘッダー2行分を考慮）

---

### 2. `/api/contract/drive/list` - ファイル一覧取得API

**ファイル**: `app/api/contract/drive/list/route.ts`

**メソッド**: `GET`

**クエリパラメータ**:
```typescript
{
  contractId: number;      // 契約ID
  companyId: number;       // 企業ID
}
```

**レスポンス形式**:
```typescript
{
  success: boolean;
  files?: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
    modifiedTime: string;
    webViewLink: string;
  }>;
  driveFolderUrl?: string; // Google Driveでフォルダを開くURL
  error?: string;
}
```

**実装コード**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { listFilesInFolderWithOAuth, ensureDirectoryWithOAuth, createFolderWithOAuth } from '@/lib/google-drive';
import { getSheetData, updateSheetCell } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    // 1. クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const contractId = parseInt(searchParams.get('contractId') || '');
    const companyId = parseInt(searchParams.get('companyId') || '');

    // バリデーション
    if (!contractId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'contractId and companyId are required' },
        { status: 400 }
      );
    }

    // 2. 環境変数からルートフォルダIDを取得
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootFolderId) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_DRIVE_ROOT_FOLDER_ID is not set' },
        { status: 500 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // 3. 契約企業マスタから企業情報を取得
    const companyData = await getSheetData(spreadsheetId, '契約企業マスタ!A3:AE');
    const companyRow = companyData.find((row: any[]) => parseInt(row[0]) === companyId);

    if (!companyRow) {
      return NextResponse.json(
        { success: false, error: `企業ID ${companyId} が見つかりません` },
        { status: 404 }
      );
    }

    const companyName = companyRow[1];
    let companyFolderId = companyRow[30]; // AE列

    // 4. AE列が空の場合、企業フォルダを作成（アップロード前にリスト取得する場合に備えて）
    if (!companyFolderId) {
      console.log(`企業フォルダを作成: ${companyName}`);
      companyFolderId = await createFolderWithOAuth(rootFolderId, companyName);

      const rowIndex = companyData.findIndex((row: any[]) => parseInt(row[0]) === companyId);
      const actualRowNumber = rowIndex + 3;
      await updateSheetCell(spreadsheetId, '契約企業マスタ', `AE${actualRowNumber}`, companyFolderId);
    }

    // 5. 契約フォルダを取得
    const contractName = `契約${String(contractId).padStart(2, '0')}`;
    const pathSegments = [contractName];
    const targetFolderId = await ensureDirectoryWithOAuth(companyFolderId, pathSegments);

    // 6. ファイル一覧を取得
    const files = await listFilesInFolderWithOAuth(targetFolderId);

    // 7. Google Driveでフォルダを開くURL
    const driveFolderUrl = `https://drive.google.com/drive/folders/${targetFolderId}`;

    // 8. レスポンスを整形
    const fileList = files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size) : 0,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
    }));

    return NextResponse.json({
      success: true,
      files: fileList,
      driveFolderUrl,
    });

  } catch (error: any) {
    console.error('List files error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## UI設計

### 1. メインページに「エビデンスファイル管理」セクション追加

**配置場所**: `app/dashboard/workflow/contract/page.tsx`
**配置位置**: 13ステップカードグリッドの**下部**（契約選択時のみ表示）

**UI構成**（ゆめマガの`DataSubmissionSection`を完全踏襲）:

```
┌──────────────────────────────────────────────────────────────┐
│ エビデンスファイル管理                                        │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┬───────────────────────────┐  │
│ │ ファイル一覧（左側）        │ プレビュー（右側）        │  │
│ │                            │                           │  │
│ │ 契約書.pdf  ◀クリック      │   📄                      │  │
│ │ 請求書.pdf                 │   契約書.pdf              │  │
│ │ その他.jpg                 │   クリックで開く          │  │
│ │                            │                           │  │
│ │ （6件以下: そのまま表示）   │ （選択されたファイルを   │  │
│ │ （7件以上: 折りたたみ）     │  大きなアイコンで表示）  │  │
│ └────────────────────────────┴───────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │  📁 ファイルを選択 または ドラッグ&ドロップ          │    │
│ │  選択中: 株式会社A / 契約01                          │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ [ 📁 Google Driveでフォルダを開く ]                         │
└──────────────────────────────────────────────────────────────┘
```

**アイコン使用ルール**:
- ❌ 絵文字禁止（📁、📄等は使わない）
- ✅ lucide-reactのみ使用
  - `Folder`: フォルダアイコン
  - `FileText`: PDFファイル
  - `Image`: 画像ファイル
  - `Music`: 音声ファイル
  - `Upload`: アップロードアイコン
  - `ExternalLink`: 外部リンクアイコン
  - `ChevronDown`: 折りたたみアイコン

---

### 2. サイドパネルに「エビデンス保存」セクション追加

**配置場所**: `components/workflow/SidePanel.tsx`
**配置位置**: 「ガイド」セクションの**下部**（全ステップ共通で表示）

**UI構成**（簡易版）:

```
┌─────────────────────────────────────────┐
│ ステップ③ 基本契約書の押印・送付        │
│                                         │
│ 【概要】...                             │
│ 【やることリスト】...                   │
│ 【ガイド】...                           │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ エビデンス保存                      │   │ ← 新規追加
│ │                                     │   │
│ │ [ファイルを選択]                    │   │
│ │                                     │   │
│ │ 保存済みファイル（最大5件）:         │   │
│ │ • 契約書.pdf                        │   │
│ │ • 請求書.pdf                        │   │
│ │ ...                                 │   │
│ │                                     │   │
│ │ [ 📁 Google Driveで開く ]          │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**表示条件**:
- `selectedContract`が存在する場合のみ表示
- ファイルは最大5件まで表示（6件以上ある場合は「他○件」と表示）

---

## コンポーネント設計

### 1. ContractFilesSection（新規作成）

**ファイル**: `components/workflow/ContractFilesSection.tsx`

**Props**:
```typescript
interface ContractFilesSectionProps {
  contractId: number;      // 契約ID
  companyId: number;       // 企業ID
  companyName: string;     // 企業名（表示用）
}
```

**責務**:
- ファイル一覧の取得・表示
- ファイルアップロード
- ファイルプレビュー
- Google Driveリンク

**実装の要点**:
1. ゆめマガの`DataSubmissionSection.tsx`（598-728行目）を参考にする
2. 左右分割レイアウト（flex gap-4）
3. ファイルが6件以下: そのまま表示
4. ファイルが7件以上: 折りたたみ表示（`ChevronDown`アイコン + `filesExpanded`ステート）
5. ドラッグ&ドロップ対応（`dragActive`ステート）

**状態管理**:
```typescript
const [files, setFiles] = useState<any[]>([]);
const [selectedFile, setSelectedFile] = useState<any | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [dragActive, setDragActive] = useState(false);
const [filesExpanded, setFilesExpanded] = useState(false);
const [driveFolderUrl, setDriveFolderUrl] = useState<string>('');
const fileInputRef = useRef<HTMLInputElement>(null);
```

**useEffect（ファイル一覧取得）**:
```typescript
useEffect(() => {
  const loadFiles = async () => {
    if (!contractId || !companyId) return;

    try {
      const res = await fetch(
        `/api/contract/drive/list?contractId=${contractId}&companyId=${companyId}`
      );
      const data = await res.json();

      if (data.success) {
        setFiles(data.files || []);
        setDriveFolderUrl(data.driveFolderUrl || '');
      }
    } catch (error) {
      console.error('ファイル一覧取得エラー:', error);
    }
  };

  loadFiles();
}, [contractId, companyId]);
```

**ファイルアップロード処理**:
```typescript
const handleFileUpload = async (selectedFiles: FileList | null) => {
  if (!selectedFiles || selectedFiles.length === 0) return;

  setIsUploading(true);

  try {
    const file = selectedFiles[0]; // 1ファイルずつアップロード
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contractId', contractId.toString());
    formData.append('companyId', companyId.toString());

    const res = await fetch('/api/contract/drive/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      alert(`アップロード成功: ${data.file.name}`);
      // ファイル一覧を再取得
      // ... loadFiles() を再実行
    } else {
      alert(`アップロード失敗: ${data.error}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('アップロードエラーが発生しました');
  } finally {
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};
```

**JSX構造**（ゆめマガ完全踏襲）:
```tsx
<div className="bg-white rounded-xl shadow-md p-6">
  <div className="flex items-center gap-3 mb-6">
    <Upload className="w-6 h-6 text-blue-600" />
    <h2 className="text-xl font-bold text-gray-900">エビデンスファイル管理</h2>
  </div>

  {/* ファイル一覧 + プレビュー */}
  <div className="flex gap-4 mb-6">
    {/* 左側: ファイル一覧 */}
    <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50">
      {files.length === 0 ? (
        <p className="text-sm text-gray-500 text-center">ファイルなし</p>
      ) : files.length <= 6 ? (
        <div className="space-y-1.5">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className={`block w-full text-left text-sm truncate px-2 py-1 rounded transition-colors ${
                selectedFile?.id === file.id
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
              }`}
              title={file.name}
            >
              {file.name}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setFilesExpanded(!filesExpanded)}
            className="w-full text-left text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${filesExpanded ? 'rotate-180' : ''}`} />
            {files.length}ファイル
          </button>

          {filesExpanded && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`block w-full text-left text-sm truncate px-2 py-1 rounded transition-colors ${
                    selectedFile?.id === file.id
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                  title={file.name}
                >
                  {file.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    {/* 右側: プレビュー */}
    {selectedFile && (
      <div className="w-80 border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center">
        <a
          href={selectedFile.webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors group"
          title="Google Driveで開く"
        >
          {selectedFile.mimeType?.startsWith('image/') ? (
            <Image className="w-12 h-12 text-blue-500 group-hover:text-blue-600" />
          ) : selectedFile.mimeType?.startsWith('audio/') ? (
            <Music className="w-12 h-12 text-green-500 group-hover:text-green-600" />
          ) : selectedFile.mimeType === 'application/pdf' ? (
            <FileText className="w-12 h-12 text-red-500 group-hover:text-red-600" />
          ) : (
            <FileText className="w-12 h-12 text-gray-500 group-hover:text-gray-600" />
          )}

          <div className="text-xs text-center text-gray-600 group-hover:text-blue-600 break-all">
            {selectedFile.name}
          </div>

          <div className="text-xs text-gray-400 group-hover:text-blue-500">
            クリックで開く
          </div>
        </a>
      </div>
    )}
  </div>

  {/* ドラッグ&ドロップエリア */}
  <div
    className={`bg-blue-50 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
      dragActive ? 'border-blue-500 bg-blue-100' : 'border-blue-300'
    } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
    onDragEnter={isUploading ? undefined : handleDrag}
    onDragLeave={isUploading ? undefined : handleDrag}
    onDragOver={isUploading ? undefined : handleDrag}
    onDrop={isUploading ? undefined : handleDrop}
  >
    {isUploading ? (
      <>
        <div className="w-12 h-12 mx-auto mb-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-blue-700 font-semibold mb-2">アップロード中...</p>
      </>
    ) : (
      <>
        <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <p className="text-gray-700 mb-2">
          <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold">
            ファイルを選択
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          {' '}または ドラッグ&ドロップ
        </p>
        <p className="text-sm text-gray-500">
          選択中: {companyName} / 契約{String(contractId).padStart(2, '0')}
        </p>
      </>
    )}
  </div>

  {/* Google Driveで開くボタン */}
  {driveFolderUrl && (
    <div className="mt-4">
      <a
        href={driveFolderUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Google Driveでフォルダを開く
      </a>
    </div>
  )}
</div>
```

---

### 2. SidePanelの修正

**ファイル**: `components/workflow/SidePanel.tsx`

**追加するProps**:
```typescript
interface SidePanelProps {
  // 既存のprops...
  contractId?: number;     // 追加
  companyId?: number;      // 追加
  companyName?: string;    // 追加
}
```

**追加するセクション**（「ガイド」の下部）:

```tsx
{/* エビデンス保存セクション */}
{contractId && companyId && (
  <section className="mt-6 pt-6 border-t border-gray-200">
    <h3 className="text-lg font-bold text-gray-900 mb-3">エビデンス保存</h3>

    {/* ファイルアップロード */}
    <div className="mb-4">
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
      >
        <Upload className="w-4 h-4" />
        {isUploading ? 'アップロード中...' : 'ファイルを選択'}
      </button>
    </div>

    {/* 保存済みファイル（最大5件） */}
    <div>
      <h4 className="text-sm font-bold text-gray-700 mb-2">保存済みファイル</h4>
      {files.length === 0 ? (
        <p className="text-sm text-gray-500">ファイルはありません</p>
      ) : (
        <div className="space-y-2">
          {files.slice(0, 5).map((file) => (
            <a
              key={file.id}
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <FileText className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
              <span className="text-sm text-gray-700 group-hover:text-blue-600 truncate">
                {file.name}
              </span>
            </a>
          ))}
          {files.length > 5 && (
            <p className="text-xs text-gray-500">他{files.length - 5}件</p>
          )}
        </div>
      )}
    </div>

    {/* Google Driveリンク */}
    {driveFolderUrl && (
      <div className="mt-4">
        <a
          href={driveFolderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <ExternalLink className="w-4 h-4" />
          Google Driveで開く
        </a>
      </div>
    )}
  </section>
)}
```

**状態管理の追加**:
```typescript
const [files, setFiles] = useState<any[]>([]);
const [isUploading, setIsUploading] = useState(false);
const [driveFolderUrl, setDriveFolderUrl] = useState<string>('');
const fileInputRef = useRef<HTMLInputElement>(null);
```

**useEffect（ファイル一覧取得）**:
```typescript
useEffect(() => {
  const loadFiles = async () => {
    if (!contractId || !companyId) {
      setFiles([]);
      setDriveFolderUrl('');
      return;
    }

    try {
      const res = await fetch(
        `/api/contract/drive/list?contractId=${contractId}&companyId=${companyId}`
      );
      const data = await res.json();

      if (data.success) {
        setFiles(data.files || []);
        setDriveFolderUrl(data.driveFolderUrl || '');
      }
    } catch (error) {
      console.error('ファイル一覧取得エラー:', error);
    }
  };

  loadFiles();
}, [contractId, companyId]);
```

**ファイルアップロード処理**:
```typescript
const handleFileUpload = async (selectedFiles: FileList | null) => {
  if (!selectedFiles || selectedFiles.length === 0 || !contractId || !companyId) return;

  setIsUploading(true);

  try {
    const file = selectedFiles[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contractId', contractId.toString());
    formData.append('companyId', companyId.toString());

    const res = await fetch('/api/contract/drive/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      alert(`アップロード成功: ${data.file.name}`);
      // ファイル一覧を再取得
      // ... loadFiles() 再実行
    } else {
      alert(`アップロード失敗: ${data.error}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('アップロードエラーが発生しました');
  } finally {
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};
```

---

### 3. メインページの修正

**ファイル**: `app/dashboard/workflow/contract/page.tsx`

**ContractFilesSectionの追加**（13ステップカードグリッドの下）:

```tsx
{/* 13ステップカードグリッド */}
{selectedContract && (
  <div className="grid grid-cols-5 gap-4 mb-8">
    {/* 既存のステップカード... */}
  </div>
)}

{/* エビデンスファイル管理セクション */}
{selectedContract && selectedContract.companyId && (
  <ContractFilesSection
    contractId={selectedContract.id}
    companyId={selectedContract.companyId}
    companyName={companyInfo?.officialName || ''}
  />
)}
```

**SidePanelへのprops追加**:

```tsx
<SidePanel
  step={selectedStep}
  isOpen={!!selectedStep}
  onClose={() => setSelectedStep(null)}
  contractId={selectedContract?.id}           // 追加
  companyId={selectedContract?.companyId}     // 追加
  companyName={companyInfo?.officialName}     // 追加
  // 既存のprops...
/>
```

---

## 実装手順

### Step 1: 環境変数設定

`.env.local`に以下を追加:
```bash
GOOGLE_DRIVE_ROOT_FOLDER_ID=1blH8qUUd_TLW_nznN5wozwn-vXGFMZ3q
```

**確認**:
```bash
echo $GOOGLE_DRIVE_ROOT_FOLDER_ID
# または .env.local を直接確認
```

---

### Step 2: APIルート作成

**ファイル作成**:
1. `app/api/contract/drive/upload/route.ts`
2. `app/api/contract/drive/list/route.ts`

**実装内容**: 上記「API設計」セクションのコードをそのままコピー

**重要な確認事項**:
- `import { uploadFileWithOAuth, ensureDirectoryWithOAuth, createFolderWithOAuth } from '@/lib/google-drive';`が正しくインポートされているか
- `import { getSheetData, updateSheetCell } from '@/lib/google-sheets';`が正しくインポートされているか
- AE列のインデックスが30であることを確認
- 行番号の計算が正しいか（`rowIndex + 3`）

---

### Step 3: ContractFilesSectionコンポーネント作成

**ファイル作成**: `components/workflow/ContractFilesSection.tsx`

**実装内容**: 上記「コンポーネント設計 - 1. ContractFilesSection」のコードを参考に実装

**チェックリスト**:
- [ ] lucide-reactのアイコンのみ使用（絵文字NG）
- [ ] ゆめマガの`DataSubmissionSection.tsx`と同じレイアウト
- [ ] ファイル一覧が6件以下: そのまま表示
- [ ] ファイル一覧が7件以上: 折りたたみ表示
- [ ] ドラッグ&ドロップ対応
- [ ] Google Driveリンクボタン

---

### Step 4: SidePanelの修正

**ファイル**: `components/workflow/SidePanel.tsx`

**修正内容**:
1. propsに`contractId`, `companyId`, `companyName`を追加
2. 状態管理を追加（files, isUploading, driveFolderUrl）
3. useEffectでファイル一覧取得
4. ファイルアップロード処理を追加
5. JSXに「エビデンス保存」セクションを追加

**配置位置**: 「ガイド」セクションの下、`<section className="mt-6 pt-6 border-t border-gray-200">`

---

### Step 5: メインページの修正

**ファイル**: `app/dashboard/workflow/contract/page.tsx`

**修正内容**:
1. `ContractFilesSection`をインポート
2. 13ステップカードグリッドの下に`<ContractFilesSection />`を追加
3. `<SidePanel />`に`contractId`, `companyId`, `companyName`を渡す

**表示条件**:
- `selectedContract`が存在する場合のみ表示
- `selectedContract.companyId`が存在する場合のみ表示

---

### Step 6: テスト

**テストケース1: 新規企業フォルダの作成**
1. 契約企業マスタのAE列が空の企業を選択
2. ファイルをアップロード
3. AE列に企業フォルダIDが記録されているか確認
4. Google Driveで企業フォルダが作成されているか確認

**テストケース2: ファイルアップロード**
1. リマインダーカードから契約を選択
2. メインページの「エビデンスファイル管理」セクションが表示される
3. ファイルを選択してアップロード
4. ファイル一覧に表示される
5. Google Driveで確認

**テストケース3: ファイル一覧表示**
1. 契約を選択
2. ファイル一覧が表示される
3. ファイルをクリックして選択
4. プレビューが右側に表示される
5. プレビューをクリックしてGoogle Driveで開く

**テストケース4: サイドパネル**
1. ステップカードをクリック
2. サイドパネルの「エビデンス保存」セクションが表示される
3. ファイルをアップロード
4. 保存済みファイルが表示される（最大5件）

**テストケース5: 7件以上のファイル**
1. 7件以上ファイルをアップロード
2. 折りたたみ表示になる
3. ChevronDownアイコンをクリックして展開

---

## 重要な注意事項

### ❌ やってはいけないこと

1. **絵文字を使用しない**
   - ❌ 📁、📄、🔗等
   - ✅ lucide-reactのアイコンのみ

2. **サービスアカウント版の関数を使わない**
   - ❌ `uploadFile`, `createFolder`, `listFilesInFolder`
   - ✅ `uploadFileWithOAuth`, `createFolderWithOAuth`, `listFilesInFolderWithOAuth`

3. **AE列のインデックスを間違えない**
   - ❌ インデックス29や31
   - ✅ インデックス30（A=0, B=1, ..., AE=30）

4. **行番号の計算を間違えない**
   - ❌ `rowIndex + 1`（ヘッダー1行のみ考慮）
   - ✅ `rowIndex + 3`（ヘッダー2行 + データ開始行3行目）

### ✅ やるべきこと

1. **ゆめマガのUIを完全に踏襲する**
   - `components/data-submission/DataSubmissionSection.tsx`を参考にする
   - レイアウト、アイコン、色、スタイルを同じにする

2. **OAuth認証版の関数を使用する**
   - `lib/google-drive.ts`から`*WithOAuth`関数をインポート

3. **エラーハンドリングを適切に実装する**
   - try-catchでラップ
   - エラーメッセージをアラート表示

4. **コンソールログを残す**
   - デバッグ用に`console.log`を追加
   - 特に企業フォルダ作成時とAE列書き込み時

---

## 完了条件

Phase 2.2が完了したと判断する条件:

- [ ] `/api/contract/drive/upload`が正しく動作する
- [ ] `/api/contract/drive/list`が正しく動作する
- [ ] AE列が空の場合、企業フォルダが自動作成される
- [ ] 作成された企業フォルダIDがAE列に記録される
- [ ] メインページに「エビデンスファイル管理」セクションが表示される
- [ ] ファイル一覧が左右分割レイアウトで表示される
- [ ] ファイルをクリックすると右側にプレビューが表示される
- [ ] ドラッグ&ドロップでファイルをアップロードできる
- [ ] ファイルが7件以上の場合、折りたたみ表示になる
- [ ] サイドパネルに「エビデンス保存」セクションが表示される
- [ ] サイドパネルから簡易的にファイルをアップロードできる
- [ ] Google Driveでフォルダを開くボタンが動作する
- [ ] lucide-reactのアイコンのみ使用（絵文字NG）

---

## 参照ドキュメント

1. **Phase 2完全実装計画書**: `docs/workflow/契約業務フロー統合_Phase2_完全実装計画書.md`
2. **開発フロー**: `docs/workflow/契約業務フロー統合_開発フロー.md`
3. **ゆめマガの実装**:
   - `app/api/yumemaga-v2/data-submission/upload/route.ts`
   - `app/api/yumemaga-v2/data-submission/list-files/route.ts`
   - `components/data-submission/DataSubmissionSection.tsx`
4. **Google Drive lib**: `lib/google-drive.ts`
5. **Google Sheets lib**: `lib/google-sheets.ts`

---

**作成日**: 2025年10月12日
**作成者**: Claude Code
**バージョン**: v2.0（暗黙知排除版）
**次のステップ**: Phase 2.2の実装を開始

以上
