# Google Driveデータアップロード機能 完全実装計画書

**作成日**: 2025-10-08
**対象**: 次世代Claude Code（実装担当者）
**前提知識**: ゼロ（このドキュメントですべて完結）
**完成目標**: ドラッグ&ドロップでGoogle Driveに自動アップロード

---

## 📋 このドキュメントについて

このドキュメントは**暗黙知を一切排除**した完全な実装計画書です。

**あなたがやること**:
1. このドキュメントを**上から順番に**読む
2. 各ステップを**順番通りに**実装する
3. 各ステップの**完了条件**をすべて満たす
4. **テスト**を実行して動作確認する

**前提条件**:
- ✅ Phase 0-3が完了済み（`PROGRESS_REPORT.md`参照）
- ✅ `lib/google-drive.ts`が存在（読み取り専用）
- ✅ `components/data-submission/DataSubmissionSection.tsx`が存在（UI実装済み）
- ✅ `app/dashboard/yumemaga-v2/page.tsx`が存在（メインダッシュボード）

---

## 🎯 実装目標

### 現在の状態

```
❌ handleFileUpload() は alert() のみ（L436-441 in page.tsx）
❌ Google Driveへの書き込み機能なし
❌ ファイルアップロードAPIなし
```

### 実装後の状態

```
✅ ファイルをドラッグ&ドロップまたは選択
✅ データ種別・月号・カテゴリ/企業を選択
✅ 自動的にGoogle Driveの適切なフォルダにアップロード
✅ アップロード後に「提出済み」ステータスに更新
```

---

## 📁 Google Driveディレクトリ構造（完全仕様）

### パターン1: カテゴリ系（A, D, K, L, M）

```
📁 [カテゴリID]_カテゴリ名/          ← ルートフォルダ（DriveフォルダIDで指定）
  ├─ 📁 録音データ/
  │   └─ 📁 [YYYY_MM]/              ← 月号（例: 2025_11）
  │       └─ 📄 ファイル.mp3
  ├─ 📁 写真データ/
  │   └─ 📁 [YYYY_MM]/
  │       └─ 📄 ファイル.jpg
  └─ 📁 企画内容/                    ← L, Mのみ
      └─ 📁 [YYYY_MM]/
          └─ 📄 ファイル.docx
```

**具体例（Dカテゴリ）**:
```
📁 D_メインインタビューページ/       ← DriveフォルダID: "1abc...xyz"
  └─ 📁 録音データ/
      └─ 📁 2025_11/
          └─ 📄 20251015_interview.mp3
```

---

### パターン2: 企業系（C）

```
📁 C_新規企業/                       ← ルートフォルダ（DriveフォルダIDで指定）
  └─ 📁 [企業名]/                    ← 企業名（選択または入力）
      ├─ 📁 メイン/                  ← ロゴ・ヒーロー・QR・代表者写真等
      ├─ 📁 サブ/                    ← その他素材
      └─ 📁 情報シート/
```

**具体例（マルトモ）**:
```
📁 C_新規企業/                       ← DriveフォルダID: "2bcd...yyy"
  └─ 📁 マルトモ/
      ├─ 📁 メイン/
      │   ├─ 📄 logo.png
      │   ├─ 📄 hero.jpg
      │   └─ 📄 qr_code.png
      ├─ 📁 サブ/
      └─ 📁 情報シート/
          └─ 📄 info_sheet.xlsx
```

---

## 🗂️ スプレッドシート準備

### Step 0: カテゴリマスターにDriveフォルダID列を追加

**スプレッドシート**: `YUMEMAGA_SPREADSHEET_ID`（環境変数）
**シート名**: `カテゴリマスター`

**追加する列**:
| 列 | 列名 | 説明 | 例 |
|----|------|------|-----|
| **H** | **DriveフォルダID** | カテゴリのルートフォルダID | `1abc...xyz` |

**既存の列**:
| A | B | C | D | E | F | G | **H** |
|---|---|---|---|---|---|---|-------|
| カテゴリID | カテゴリ名 | 確認必須 | 必要データ | 表示順 | アクティブ | ステータス | **DriveフォルダID** |

**追加方法**:
1. Google Sheetsで「カテゴリマスター」を開く
2. H列のヘッダーに「DriveフォルダID」と入力
3. 各カテゴリのルートフォルダIDを入力（次のステップで取得）

**完了条件**:
- [ ] H列「DriveフォルダID」が追加されている
- [ ] ヘッダー行（1行目）に列名が入力されている

---

### Step 0.1: Google Driveでルートフォルダを作成・ID取得

**カテゴリ系（A, D, K, L, M）の例**:

1. Google Driveで新しいフォルダを作成:
   - 名前: `D_メインインタビューページ`

2. フォルダを開いてURLからIDを取得:
   ```
   https://drive.google.com/drive/folders/1abc...xyz
                                         ↑
                                    これがフォルダID
   ```

3. カテゴリマスターのH列に貼り付け:
   | A | B | ... | H |
   |---|---|-----|---|
   | D | メインインタビューページ | ... | `1abc...xyz` |

**企業系（C）の例**:

1. Google Driveで新しいフォルダを作成:
   - 名前: `C_新規企業`

2. フォルダIDを取得して、カテゴリマスターのH列に貼り付け:
   | A | B | ... | H |
   |---|---|-----|---|
   | C | 新規企業 | ... | `2bcd...yyy` |

**完了条件**:
- [ ] 各カテゴリ（A, D, K, L, M, C）のルートフォルダがGoogle Driveに存在
- [ ] 各フォルダIDがカテゴリマスターのH列に登録されている
- [ ] サービスアカウントに各フォルダの「編集者」権限が付与されている

**サービスアカウント権限付与方法**:
1. Google Driveでフォルダを右クリック → 「共有」
2. サービスアカウントのメールアドレスを追加（`GOOGLE_SERVICE_ACCOUNT_KEY`のJSONから`client_email`を確認）
3. 権限: **編集者**
4. 送信

---

### Step 0.2: 企業マスターの確認

**スプレッドシート**: `YUMEMAGA_SPREADSHEET_ID`
**シート名**: `企業マスター`

**確認事項**:
- [ ] 企業マスターが存在する（Phase 0で作成済み）
- [ ] 6社のデータが入力されている（マルトモ、あーきぺんこ、テクノシンエイ、稲垣製作所、一榮工業、林工業所）
- [ ] A列に企業名が入力されている

**企業マスター構造**（参考）:
| A | B | C | ... |
|---|---|---|-----|
| 企業名 | 業種 | 地域 | ... |
| マルトモ | 食品製造業 | 愛知県 | ... |
| あーきぺんこ | デザイン業 | 愛知県 | ... |

**完了条件**:
- [ ] 企業マスターが存在し、企業名が取得できる

---

## 🔧 実装ステップ

### Step 1: Google Drive書き込みスコープを追加

**ファイル**: `lib/google-drive.ts`

**現在のコード**（L16-22）:
```typescript
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
  ],
});
```

**変更後のコード**:
```typescript
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.file', // アップロードしたファイルの管理
  ],
});
```

**完了条件**:
- [ ] `'https://www.googleapis.com/auth/drive.file'`が追加されている

---

### Step 2: Google Driveアップロード関数を実装

**ファイル**: `lib/google-drive.ts`

**追加する関数** （ファイルの最後に追加）:

```typescript
/**
 * フォルダを作成
 * @param parentFolderId 親フォルダID
 * @param folderName 作成するフォルダ名
 * @returns 作成されたフォルダID
 */
export async function createFolder(parentFolderId: string, folderName: string): Promise<string> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
    });

    return response.data.id!;
  } catch (error: any) {
    console.error('Google Drive API error (createFolder):', error);
    throw new Error(`Failed to create folder ${folderName}: ${error.message}`);
  }
}

/**
 * ファイルをアップロード
 * @param folderId アップロード先フォルダID
 * @param file アップロードするファイル（File or Blob）
 * @param fileName ファイル名（省略時はfile.nameを使用）
 * @returns アップロードされたファイル情報
 */
export async function uploadFile(
  folderId: string,
  file: File | Blob,
  fileName?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const drive = getDriveClient();

  try {
    // File型の場合はfile.nameを使用、Blob型の場合はfileNameが必須
    const name = fileName || (file instanceof File ? file.name : 'untitled');

    const response = await drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: file as any, // Node.js streamまたはブラウザのBlob
      },
      fields: 'id, name, webViewLink',
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      webViewLink: response.data.webViewLink!,
    };
  } catch (error: any) {
    console.error('Google Drive API error (uploadFile):', error);
    throw new Error(`Failed to upload file ${name}: ${error.message}`);
  }
}

/**
 * ディレクトリパスを解決（存在しなければ作成）
 * @param rootFolderId ルートフォルダID
 * @param pathSegments パスセグメント配列（例: ["録音データ", "2025_11"]）
 * @returns 最終フォルダID
 */
export async function ensureDirectory(
  rootFolderId: string,
  pathSegments: string[]
): Promise<string> {
  let currentFolderId = rootFolderId;

  for (const segment of pathSegments) {
    // 現在のフォルダ内にセグメント名のフォルダが存在するか確認
    const existingFolder = await findFolderByName(currentFolderId, segment);

    if (existingFolder) {
      // 存在する場合はそのIDを使用
      currentFolderId = existingFolder.id;
    } else {
      // 存在しない場合は作成
      currentFolderId = await createFolder(currentFolderId, segment);
    }
  }

  return currentFolderId;
}

/**
 * 指定フォルダ内で名前からフォルダを検索
 * @param parentFolderId 親フォルダID
 * @param folderName 検索するフォルダ名
 * @returns フォルダ情報（見つからない場合はnull）
 */
async function findFolderByName(
  parentFolderId: string,
  folderName: string
): Promise<{ id: string; name: string } | null> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.list({
      q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
    });

    const files = response.data.files || [];
    return files.length > 0 ? { id: files[0].id!, name: files[0].name! } : null;
  } catch (error: any) {
    console.error('Google Drive API error (findFolderByName):', error);
    return null;
  }
}
```

**完了条件**:
- [ ] `createFolder()` 関数が追加されている
- [ ] `uploadFile()` 関数が追加されている
- [ ] `ensureDirectory()` 関数が追加されている
- [ ] `findFolderByName()` 関数が追加されている
- [ ] TypeScriptエラーがない

---

### Step 3: 型定義を作成

**ファイル**: `types/data-submission.ts`（新規作成）

```typescript
/**
 * データ種別
 */
export type DataType = 'recording' | 'photo' | 'planning';

/**
 * アップロードモード
 */
export type UploadMode = 'category' | 'company';

/**
 * 企業選択モード
 */
export type CompanyMode = 'existing' | 'new';

/**
 * 企業フォルダ種別
 */
export type CompanyFolderType = 'メイン' | 'サブ' | '情報シート';

/**
 * ファイルアップロードリクエスト
 */
export interface FileUploadRequest {
  mode: UploadMode;

  // カテゴリモード用
  categoryId?: string;
  dataType?: DataType;
  issue?: string; // "2025_11" 形式

  // 企業モード用
  companyMode?: CompanyMode;
  companyName?: string;
  companyFolder?: CompanyFolderType;
}

/**
 * ファイルアップロードレスポンス
 */
export interface FileUploadResponse {
  success: boolean;
  uploadedFiles?: {
    fileName: string;
    driveFileId: string;
    driveUrl: string;
  }[];
  error?: string;
}

/**
 * データ種別情報
 */
export interface DataTypeInfo {
  type: DataType;
  name: string;
  folderName: string;
  extensions: string[];
}
```

**完了条件**:
- [ ] `types/data-submission.ts`が作成されている
- [ ] すべての型がエクスポートされている
- [ ] TypeScriptエラーがない

---

### Step 4: ファイルアップロードAPIを作成

**ディレクトリ**: `app/api/yumemaga-v2/data-submission/upload/`（新規作成）
**ファイル**: `route.ts`（新規作成）

**完全なコード**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { uploadFile, ensureDirectory } from '@/lib/google-drive';
import type {
  FileUploadRequest,
  FileUploadResponse,
  DataType,
  CompanyFolderType,
} from '@/types/data-submission';

/**
 * ファイルアップロードAPI
 * POST /api/yumemaga-v2/data-submission/upload
 */
export async function POST(request: NextRequest) {
  try {
    // multipart/form-dataをパース
    const formData = await request.formData();

    // パラメータ取得
    const mode = formData.get('mode') as 'category' | 'company';

    if (!mode) {
      return NextResponse.json(
        { success: false, error: 'mode is required' } as FileUploadResponse,
        { status: 400 }
      );
    }

    // ファイル取得
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' } as FileUploadResponse,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    if (mode === 'category') {
      // カテゴリモード
      return await handleCategoryUpload(formData, files, spreadsheetId);
    } else {
      // 企業モード
      return await handleCompanyUpload(formData, files, spreadsheetId);
    }

  } catch (error: any) {
    console.error('File upload API error:', error);
    return NextResponse.json(
      { success: false, error: error.message } as FileUploadResponse,
      { status: 500 }
    );
  }
}

/**
 * カテゴリモードのアップロード処理
 */
async function handleCategoryUpload(
  formData: FormData,
  files: File[],
  spreadsheetId: string
): Promise<NextResponse<FileUploadResponse>> {
  // パラメータ取得
  const categoryId = formData.get('categoryId') as string;
  const dataType = formData.get('dataType') as DataType;
  const issue = formData.get('issue') as string; // "2025_11"

  // バリデーション
  if (!categoryId || !dataType || !issue) {
    return NextResponse.json(
      { success: false, error: 'categoryId, dataType, and issue are required' },
      { status: 400 }
    );
  }

  // カテゴリマスターからDriveフォルダIDを取得
  const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:H100');
  const categoryRow = categoryData.find((row: any[]) => row[0] === categoryId);

  if (!categoryRow) {
    return NextResponse.json(
      { success: false, error: `Category ${categoryId} not found` },
      { status: 404 }
    );
  }

  const driveFolderId = categoryRow[7]; // H列: DriveフォルダID

  if (!driveFolderId) {
    return NextResponse.json(
      { success: false, error: `DriveフォルダID not set for category ${categoryId}` },
      { status: 400 }
    );
  }

  // データ種別名を取得
  const dataTypeName = getDataTypeFolderName(dataType);

  // ディレクトリパス: ["録音データ", "2025_11"]
  const pathSegments = [dataTypeName, issue];

  // フォルダIDを解決（存在しなければ作成）
  const targetFolderId = await ensureDirectory(driveFolderId, pathSegments);

  // ファイルアップロード
  const uploadedFiles = [];

  for (const file of files) {
    // ファイル種別の整合性チェック
    const detectedType = detectFileDataType(file.name);
    if (detectedType !== dataType) {
      return NextResponse.json(
        {
          success: false,
          error: `ファイル ${file.name} は ${dataType} ではありません（検出: ${detectedType}）`,
        },
        { status: 400 }
      );
    }

    const result = await uploadFile(targetFolderId, file);
    uploadedFiles.push({
      fileName: result.name,
      driveFileId: result.id,
      driveUrl: result.webViewLink,
    });
  }

  return NextResponse.json({
    success: true,
    uploadedFiles,
  });
}

/**
 * 企業モードのアップロード処理
 */
async function handleCompanyUpload(
  formData: FormData,
  files: File[],
  spreadsheetId: string
): Promise<NextResponse<FileUploadResponse>> {
  // パラメータ取得
  const companyMode = formData.get('companyMode') as 'existing' | 'new';
  const companyName = formData.get('companyName') as string;
  const companyFolder = formData.get('companyFolder') as CompanyFolderType;

  // バリデーション
  if (!companyMode || !companyName || !companyFolder) {
    return NextResponse.json(
      { success: false, error: 'companyMode, companyName, and companyFolder are required' },
      { status: 400 }
    );
  }

  // 新規企業の場合、企業マスターに存在しないことを確認
  if (companyMode === 'new') {
    const companyData = await getSheetData(spreadsheetId, '企業マスター!A2:A100');
    const existingCompany = companyData.find((row: any[]) => row[0] === companyName);

    if (existingCompany) {
      return NextResponse.json(
        { success: false, error: `企業 ${companyName} は既に存在します` },
        { status: 400 }
      );
    }

    // TODO: 新規企業を企業マスターに追加（Phase 7で実装予定）
  }

  // カテゴリマスターからCカテゴリのDriveフォルダIDを取得
  const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:H100');
  const categoryRow = categoryData.find((row: any[]) => row[0] === 'C');

  if (!categoryRow) {
    return NextResponse.json(
      { success: false, error: 'Category C not found' },
      { status: 404 }
    );
  }

  const driveFolderId = categoryRow[7]; // H列: DriveフォルダID

  if (!driveFolderId) {
    return NextResponse.json(
      { success: false, error: 'DriveフォルダID not set for category C' },
      { status: 400 }
    );
  }

  // ディレクトリパス: ["企業名", "メイン|サブ|情報シート"]
  const pathSegments = [companyName, companyFolder];

  // フォルダIDを解決（存在しなければ作成）
  const targetFolderId = await ensureDirectory(driveFolderId, pathSegments);

  // ファイルアップロード
  const uploadedFiles = [];

  for (const file of files) {
    const result = await uploadFile(targetFolderId, file);
    uploadedFiles.push({
      fileName: result.name,
      driveFileId: result.id,
      driveUrl: result.webViewLink,
    });
  }

  return NextResponse.json({
    success: true,
    uploadedFiles,
  });
}

/**
 * データ種別からフォルダ名を取得
 */
function getDataTypeFolderName(dataType: DataType): string {
  const map: Record<DataType, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
  };
  return map[dataType];
}

/**
 * ファイル名から データ種別を検出
 */
function detectFileDataType(fileName: string): DataType | 'unknown' {
  const ext = fileName.toLowerCase().split('.').pop();

  if (['mp3', 'wav', 'm4a', 'aac'].includes(ext || '')) return 'recording';
  if (['jpg', 'jpeg', 'png', 'gif', 'raw', 'webp'].includes(ext || '')) return 'photo';
  if (['docx', 'doc', 'pdf', 'xlsx', 'xls'].includes(ext || '')) return 'planning';

  return 'unknown';
}
```

**完了条件**:
- [ ] `app/api/yumemaga-v2/data-submission/upload/route.ts`が作成されている
- [ ] `POST`メソッドが実装されている
- [ ] カテゴリモードとフォルダモードの両方に対応している
- [ ] TypeScriptエラーがない

---

### Step 5: DataSubmissionSectionのUI改修

**ファイル**: `components/data-submission/DataSubmissionSection.tsx`

**現在の問題**:
- データ種別を選択するUIがない
- 企業選択UIがない
- ドラッグ&ドロップ機能がない

**完全な新しいコード**（全体を置き換え）:

```typescript
'use client';

import { useState, useMemo, useRef } from 'react';
import { Upload, ChevronDown, ChevronUp, Music, FileText, Image, Building2 } from 'lucide-react';
import type { DataType, UploadMode, CompanyMode, CompanyFolderType } from '@/types/data-submission';

interface RequiredData {
  type: string;
  name: string;
  status: string;
  deadline: string;
  optional?: boolean;
}

interface Category {
  id: string;
  name: string;
  requiredData: RequiredData[];
  deadline?: string;
}

interface Company {
  name: string;
}

interface DataSubmissionSectionProps {
  categories: Category[];
  companies: Company[];
  selectedIssue: string; // "2025年11月号"
}

export function DataSubmissionSection({
  categories,
  companies,
  selectedIssue,
}: DataSubmissionSectionProps) {
  const [showCards, setShowCards] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('category');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'A');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('recording');
  const [companyMode, setCompanyMode] = useState<CompanyMode>('existing');
  const [selectedCompany, setSelectedCompany] = useState(companies[0]?.name || '');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companyFolder, setCompanyFolder] = useState<CompanyFolderType>('メイン');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 全体進捗を計算
  const overallProgress = useMemo(() => {
    const allData = categories.flatMap(c => c.requiredData);
    const submitted = allData.filter(d => d.status === 'submitted').length;
    const pending = allData.filter(d => d.status === 'pending').length;
    const none = allData.filter(d => d.status === 'none').length;
    const total = allData.length;
    const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return { progress, submitted, pending, none, total };
  }, [categories]);

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'audio':
      case 'recording':
        return <Music className="w-4 h-4" />;
      case 'document':
      case 'planning':
        return <FileText className="w-4 h-4" />;
      case 'image':
      case 'photo':
        return <Image className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // ファイルアップロード処理
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('mode', uploadMode);

      // ファイル追加
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      if (uploadMode === 'category') {
        // カテゴリモード
        formData.append('categoryId', selectedCategory);
        formData.append('dataType', selectedDataType);

        // 月号を "2025_11" 形式に変換
        const issue = selectedIssue.replace('年', '_').replace('月号', '');
        formData.append('issue', issue);

      } else {
        // 企業モード
        formData.append('companyMode', companyMode);
        formData.append('companyName', companyMode === 'existing' ? selectedCompany : newCompanyName);
        formData.append('companyFolder', companyFolder);
      }

      // API呼び出し
      const response = await fetch('/api/yumemaga-v2/data-submission/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`アップロード成功: ${result.uploadedFiles.length}件のファイルがアップロードされました`);
        // TODO: データ提出状況を再取得してUIを更新
      } else {
        alert(`アップロード失敗: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`アップロードエラー: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ファイル選択ハンドラー
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  // ドラッグ&ドロップハンドラー
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">データ提出進捗管理</h2>
      </div>

      {/* 全体進捗（常に表示） */}
      <div className="mb-6">
        {/* プログレスバー */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress.progress}%` }}
            />
          </div>
          <span className="font-bold text-lg whitespace-nowrap">
            {overallProgress.submitted}/{overallProgress.total} ({overallProgress.progress}%)
          </span>
        </div>

        {/* 内訳 */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">
              提出済み: <span className="font-semibold text-gray-900">{overallProgress.submitted}件</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">
              未提出: <span className="font-semibold text-gray-900">{overallProgress.pending}件</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-gray-600">
              任意未提出: <span className="font-semibold text-gray-900">{overallProgress.none}件</span>
            </span>
          </div>
        </div>
      </div>

      {/* アップロードモード選択 */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            アップロードモード
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMode"
                value="category"
                checked={uploadMode === 'category'}
                onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">カテゴリ系（録音・写真・企画）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMode"
                value="company"
                checked={uploadMode === 'company'}
                onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">企業系（ロゴ・写真等）</span>
            </label>
          </div>
        </div>

        {/* カテゴリモード */}
        {uploadMode === 'category' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                カテゴリを選択
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}: {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                データ種別を選択
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dataType"
                    value="recording"
                    checked={selectedDataType === 'recording'}
                    onChange={(e) => setSelectedDataType(e.target.value as DataType)}
                    className="w-4 h-4"
                  />
                  <Music className="w-4 h-4" />
                  <span className="text-gray-700">録音データ (.mp3, .wav等)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dataType"
                    value="photo"
                    checked={selectedDataType === 'photo'}
                    onChange={(e) => setSelectedDataType(e.target.value as DataType)}
                    className="w-4 h-4"
                  />
                  <Image className="w-4 h-4" />
                  <span className="text-gray-700">写真データ (.jpg, .png等)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dataType"
                    value="planning"
                    checked={selectedDataType === 'planning'}
                    onChange={(e) => setSelectedDataType(e.target.value as DataType)}
                    className="w-4 h-4"
                  />
                  <FileText className="w-4 h-4" />
                  <span className="text-gray-700">企画内容 (.docx, .pdf等)</span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* 企業モード */}
        {uploadMode === 'company' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                企業選択
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyMode"
                    value="existing"
                    checked={companyMode === 'existing'}
                    onChange={(e) => setCompanyMode(e.target.value as CompanyMode)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">既存企業から選択</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyMode"
                    value="new"
                    checked={companyMode === 'new'}
                    onChange={(e) => setCompanyMode(e.target.value as CompanyMode)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">新規企業を追加</span>
                </label>
              </div>

              {companyMode === 'existing' ? (
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {companies.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="新規企業名を入力"
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                保存先フォルダ
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyFolder"
                    value="メイン"
                    checked={companyFolder === 'メイン'}
                    onChange={(e) => setCompanyFolder(e.target.value as CompanyFolderType)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">メイン（ロゴ・ヒーロー・QR等）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyFolder"
                    value="サブ"
                    checked={companyFolder === 'サブ'}
                    onChange={(e) => setCompanyFolder(e.target.value as CompanyFolderType)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">サブ（その他素材）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyFolder"
                    value="情報シート"
                    checked={companyFolder === '情報シート'}
                    onChange={(e) => setCompanyFolder(e.target.value as CompanyFolderType)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">情報シート</span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* ドラッグ&ドロップエリア */}
        <div
          className={`bg-blue-50 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-100' : 'border-blue-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-gray-700 mb-2">
            <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold">
              ファイルを選択
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {' '}または ドラッグ&ドロップ
          </p>
          <p className="text-sm text-gray-500">
            {uploadMode === 'category'
              ? `${selectedIssue} / ${categories.find(c => c.id === selectedCategory)?.name} / ${getDataTypeFolderName(selectedDataType)}`
              : `企業: ${companyMode === 'existing' ? selectedCompany : newCompanyName || '（未入力）'} / ${companyFolder}`
            }
          </p>
          {uploading && (
            <p className="text-sm text-blue-600 mt-2 font-semibold">アップロード中...</p>
          )}
        </div>
      </div>

      {/* 折りたたみボタン */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowCards(!showCards)}
          className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
        >
          {showCards ? (
            <>
              <ChevronUp className="w-5 h-5" />
              カテゴリ詳細を閉じる
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              カテゴリ詳細を開く
            </>
          )}
        </button>
      </div>

      {/* カテゴリ別データ提出状況（折りたたみ可能） */}
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.filter(c => c.requiredData.length > 0).map((category) => {
            const hasDeadlinePassed = category.requiredData.some(
              (data) => data.status === 'pending' && !data.optional
            );
            const allSubmitted = category.requiredData.every(
              (data) => data.status === 'submitted' || data.optional
            );

            return (
              <div
                key={category.id}
                className={`border rounded-lg overflow-hidden ${
                  hasDeadlinePassed
                    ? 'border-red-300 bg-red-50'
                    : allSubmitted
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* カテゴリヘッダー */}
                <div
                  className={`p-4 border-b ${
                    hasDeadlinePassed
                      ? 'bg-red-100 border-red-200'
                      : allSubmitted
                      ? 'bg-green-100 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <h3 className="font-bold text-gray-900">
                    {category.name}
                  </h3>
                  {category.deadline && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      締切: {category.deadline}
                    </p>
                  )}
                  <p
                    className={`text-sm mt-1 ${
                      hasDeadlinePassed
                        ? 'text-red-700 font-semibold'
                        : allSubmitted
                        ? 'text-green-700 font-semibold'
                        : 'text-gray-600'
                    }`}
                  >
                    {hasDeadlinePassed ? '期限超過あり' : allSubmitted ? '完了' : '進行中'}
                  </p>
                </div>

                {/* データ一覧 */}
                <div className="p-4 space-y-2">
                  {category.requiredData.map((data, index) => {
                    return (
                      <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getDataTypeIcon(data.type)}
                            <p className="font-semibold text-sm text-gray-900">{data.name}</p>
                          </div>
                          <p className="text-xs text-gray-500">〆切: {data.deadline}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {data.status === 'submitted' ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                              提出済み
                            </span>
                          ) : data.status === 'pending' ? (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-semibold">
                              未提出
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                              －
                            </span>
                          )}
                          {data.optional && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                              任意
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ヘルパー関数
function getDataTypeFolderName(dataType: DataType): string {
  const map: Record<DataType, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
  };
  return map[dataType];
}
```

**完了条件**:
- [ ] アップロードモード選択（カテゴリ/企業）が実装されている
- [ ] カテゴリモードで「カテゴリ」「データ種別」「月号」を選択できる
- [ ] 企業モードで「既存企業選択/新規企業入力」「保存先フォルダ」を選択できる
- [ ] ドラッグ&ドロップエリアが実装されている
- [ ] ファイル選択ボタンが実装されている
- [ ] TypeScriptエラーがない

---

### Step 6: メインページでの統合

**ファイル**: `app/dashboard/yumemaga-v2/page.tsx`

**変更箇所1: handleFileUploadの削除** (L436-441)

**削除するコード**:
```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files) {
    alert(`${files.length}件のファイルをアップロードします（バックエンド未実装）`);
  }
};
```

**変更箇所2: DataSubmissionSectionのprops追加** (L632付近)

**変更前**:
```typescript
<DataSubmissionSection
  categories={categories}
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  onFileUpload={handleFileUpload}
/>
```

**変更後**:
```typescript
<DataSubmissionSection
  categories={categories}
  companies={companies}
  selectedIssue={selectedIssue}
/>
```

**完了条件**:
- [ ] `handleFileUpload`が削除されている
- [ ] `DataSubmissionSection`に`companies`と`selectedIssue`を渡している
- [ ] TypeScriptエラーがない

---

## 🧪 テスト手順

### テスト準備

1. **開発サーバー起動**:
```bash
npm run dev
```

2. **ブラウザで開く**:
```
http://localhost:3000/dashboard/yumemaga-v2
```

---

### テスト1: カテゴリモードでのアップロード

**手順**:
1. アップロードモード: 「カテゴリ系」を選択
2. カテゴリ: 「D: メインインタビューページ」を選択
3. データ種別: 「録音データ」を選択
4. テストファイル `test.mp3` を作成（空ファイルでOK）
5. ドラッグ&ドロップエリアにファイルをドロップ

**期待される結果**:
- [ ] アップロード中のメッセージが表示される
- [ ] 成功メッセージ「アップロード成功: 1件のファイルがアップロードされました」が表示される
- [ ] Google Driveで以下のパスにファイルが存在:
  ```
  D_メインインタビューページ/録音データ/2025_11/test.mp3
  ```

---

### テスト2: 企業モード（既存企業）でのアップロード

**手順**:
1. アップロードモード: 「企業系」を選択
2. 企業選択: 「既存企業から選択」を選択
3. 企業名: 「マルトモ」を選択
4. 保存先: 「メイン」を選択
5. テストファイル `logo.png` を作成（空ファイルでOK）
6. ファイルを選択ボタンからアップロード

**期待される結果**:
- [ ] アップロード成功メッセージが表示される
- [ ] Google Driveで以下のパスにファイルが存在:
  ```
  C_新規企業/マルトモ/メイン/logo.png
  ```

---

### テスト3: 企業モード（新規企業）でのアップロード

**手順**:
1. アップロードモード: 「企業系」を選択
2. 企業選択: 「新規企業を追加」を選択
3. 企業名: 「テスト企業株式会社」と入力
4. 保存先: 「メイン」を選択
5. テストファイル `test.jpg` をアップロード

**期待される結果**:
- [ ] アップロード成功メッセージが表示される
- [ ] Google Driveで以下のパスにファイルが存在:
  ```
  C_新規企業/テスト企業株式会社/メイン/test.jpg
  ```

---

### テスト4: ファイル種別の整合性チェック

**手順**:
1. アップロードモード: 「カテゴリ系」
2. カテゴリ: 「D: メインインタビューページ」
3. データ種別: 「録音データ」を選択
4. テストファイル `test.jpg`（画像ファイル）をアップロード

**期待される結果**:
- [ ] エラーメッセージ「ファイル test.jpg は recording ではありません（検出: photo）」が表示される
- [ ] アップロードが中断される

---

### テスト5: 複数ファイルの同時アップロード

**手順**:
1. アップロードモード: 「カテゴリ系」
2. カテゴリ: 「D: メインインタビューページ」
3. データ種別: 「写真データ」を選択
4. 複数の画像ファイル（`photo1.jpg`, `photo2.jpg`, `photo3.jpg`）をドラッグ&ドロップ

**期待される結果**:
- [ ] アップロード成功メッセージ「3件のファイルがアップロードされました」が表示される
- [ ] Google Driveで3つのファイルがすべて存在:
  ```
  D_メインインタビューページ/写真データ/2025_11/photo1.jpg
  D_メインインタビューページ/写真データ/2025_11/photo2.jpg
  D_メインインタビューページ/写真データ/2025_11/photo3.jpg
  ```

---

## ✅ 完成条件

すべての項目にチェックが入れば、実装完了です。

### 実装完了条件

- [ ] Step 0: カテゴリマスターにDriveフォルダID列が追加されている
- [ ] Step 0.1: Google Driveルートフォルダが作成され、IDが登録されている
- [ ] Step 0.2: 企業マスターが確認できている
- [ ] Step 1: Google Drive書き込みスコープが追加されている
- [ ] Step 2: Google Driveアップロード関数が実装されている
- [ ] Step 3: 型定義ファイルが作成されている
- [ ] Step 4: ファイルアップロードAPIが作成されている
- [ ] Step 5: DataSubmissionSectionのUI改修が完了している
- [ ] Step 6: メインページでの統合が完了している

### テスト完了条件

- [ ] テスト1: カテゴリモードでのアップロードが成功
- [ ] テスト2: 企業モード（既存企業）でのアップロードが成功
- [ ] テスト3: 企業モード（新規企業）でのアップロードが成功
- [ ] テスト4: ファイル種別の整合性チェックが動作
- [ ] テスト5: 複数ファイルの同時アップロードが成功

---

## 🚨 トラブルシューティング

### 問題1: 「DriveフォルダID not set」エラー

**原因**: カテゴリマスターにDriveフォルダIDが登録されていない

**解決方法**:
1. Google Sheetsで「カテゴリマスター」を開く
2. H列に該当カテゴリのフォルダIDが入力されているか確認
3. 入力されていない場合、Step 0.1を実施

---

### 問題2: 「Permission denied」エラー

**原因**: サービスアカウントにフォルダの編集権限がない

**解決方法**:
1. Google Driveで対象フォルダを開く
2. 右クリック → 「共有」
3. サービスアカウントのメールアドレス（`.env.local`のJSONから`client_email`を確認）を追加
4. 権限: **編集者**
5. 送信

---

### 問題3: アップロードが「Uploading...」のまま止まる

**原因**: APIエラーまたはネットワークエラー

**解決方法**:
1. ブラウザの開発者ツール（F12）を開く
2. Consoleタブでエラーメッセージを確認
3. Networkタブで`/api/yumemaga-v2/data-submission/upload`のレスポンスを確認
4. エラーメッセージに従って対処

---

### 問題4: 「企業 XXX は既に存在します」エラー

**原因**: 新規企業モードで既存企業名を入力した

**解決方法**:
1. 企業選択モードを「既存企業から選択」に変更
2. ドロップダウンから該当企業を選択
3. または、別の企業名を入力

---

## 📚 参考情報

### 関連ドキュメント

- `DATA_SUBMISSION_DESIGN.md` - 詳細設計書
- `DATA_SUBMISSION_REQUIREMENTS.md` - 要件定義書
- `PROGRESS_REPORT.md` - 進捗状況
- `COMPANY_MASTER_SCHEMA.md` - 企業マスター構造

### 環境変数

`.env.local`:
```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
YUMEMAGA_SPREADSHEET_ID=1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw
```

### Google Drive API ドキュメント

- [Files: create](https://developers.google.com/drive/api/v3/reference/files/create)
- [Files: list](https://developers.google.com/drive/api/v3/reference/files/list)

---

## 🎉 完成後の動作

**ユーザーの操作**:
1. ダッシュボードで月号・カテゴリを選択
2. データ種別を選択
3. ファイルをドラッグ&ドロップ

**システムの動作**:
1. ファイル種別を自動検証
2. Google Driveの適切なフォルダを自動作成
3. ファイルをアップロード
4. 成功メッセージを表示

**結果**:
```
📁 D_メインインタビューページ/
  └─ 📁 録音データ/
      └─ 📁 2025_11/
          └─ 📄 interview.mp3  ✅ アップロード完了
```

---

**作成者**: Claude Code
**作成日**: 2025-10-08
**対象**: 次世代Claude Code
**完成目標**: Google Driveデータアップロード機能の完全実装

**これで完璧です。このドキュメントだけで実装を完成させてください！** 🚀
