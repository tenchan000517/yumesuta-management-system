# データ提出進捗管理とカテゴリ別予実管理の連動実装 完全引き継ぎ書

**作成日**: 2025-10-10
**作成者**: Claude Code (第4世代)
**対象読者**: 次世代Claude Code（暗黙知ゼロで理解可能な実装指示書）
**想定実装時間**: 2時間

---

## 📋 目次

1. [背景と問題点](#1-背景と問題点)
2. [現状の仕様理解](#2-現状の仕様理解)
3. [実装する機能の全体像](#3-実装する機能の全体像)
4. [実装手順](#4-実装手順)
5. [テスト方法](#5-テスト方法)
6. [完了条件](#6-完了条件)

---

## 1. 背景と問題点

### 1.1 現状の問題

#### 問題1: データ提出進捗管理とカテゴリ別予実管理が連動していない

**状況**:
- ユーザーが「データ提出進捗管理」でファイルをアップロード
- しかし「カテゴリ別予実管理」のカードは「未完了」のまま

**具体例**:
```
【データ提出進捗管理】
├ カテゴリ別タブ選択
├ A: メインインタビュー選択
├ 録音データフォルダ選択
├ 2025年11月号選択
└ ファイル3件アップロード完了 ✅

【カテゴリ別予実管理】（別セクション）
├ カテゴリAカード表示
├ A-2: 録音 → ❌ 未提出（赤色）  ← おかしい！
└ 進捗: 0%
```

**原因**:
- カテゴリ別予実管理は「進捗入力シート（手動入力）」のみを参照
- Google Driveのファイル存在を**一切チェックしていない**

#### 問題2: 内容整理（原稿）の提出状況が見えない

**状況**:
- 内容整理（Googleドキュメント）を書いても、提出状況が表示されない
- データ提出進捗管理に「内容整理」フォルダがない

**必要な機能**:
- Googleドキュメントが保存されているか自動チェック
- 保存済み → 「提出済み」
- 保存なし → 「未提出」

---

## 2. 現状の仕様理解

### 2.1 関連セクションの理解

#### A. カテゴリ別予実管理（`CategoryManagementSection`）

**ファイル**: `components/category-management/CategoryManagementSection.tsx`

**役割**: ページ制作工程の予実管理

**表示内容**:
- カテゴリA, K, H, I, L, M のカード表示
- 各工程（例: A-2: 録音、A-3: 写真）の提出状況
- 全体進捗率

**データ取得元**:
- API: `/api/yumemaga-v2/progress?issue=2025年11月号`
- 参照先: **進捗入力シートのみ**（手動入力）

**重要な型定義**:
```typescript
interface RequiredData {
  type: string;        // 例: "recording", "photo", "planning"
  name: string;        // 例: "録音", "写真", "企画内容"
  status: string;      // "submitted" | "pending" | "none"
  deadline: string;    // 例: "10/15"
  optional?: boolean;
}

interface Category {
  id: string;          // 例: "A"
  name: string;        // 例: "メインインタビュー"
  requiredData: RequiredData[];
  deadline?: string;
}
```

#### B. データ提出進捗管理（`DataSubmissionSection`）

**ファイル**: `components/data-submission/DataSubmissionSection.tsx`

**役割**: データ提出のためのファイルアップロード機能

**モード**:
1. **カテゴリモード**: カテゴリA, K, H などのデータ提出
2. **企業モード**: 企業別の8フォルダへのファイルアップロード

**カテゴリモードのフォルダ構造**:
```
Google Drive: ゆめマガ制作 > データ提出 > カテゴリ別 > {月号} > {カテゴリID} > {データ種別}

例:
データ提出/
└ カテゴリ別/
    └ 2025_11/
        └ A/
            ├ 録音データ/
            │   ├ A_録音_村上萌.mp3
            │   └ A_録音_田中太郎.mp3
            ├ 写真データ/
            │   └ A_写真_村上萌.jpg
            └ 企画内容/
                └ A_企画_メモ.pdf
```

**重要な型定義**:
```typescript
type DataType = 'recording' | 'photo' | 'planning';

type UploadMode = 'category' | 'company';
```

### 2.2 データフロー

```
【現状】
進捗入力シート（手動入力）
    ↓
progress API
    ↓
カテゴリ別予実管理（表示のみ）

Google Drive（ファイルアップロード）
    ↓
データ提出進捗管理（アップロードのみ）
    ↓
（連動なし）

【問題】
- 2つのシステムが独立している
- Google Driveのファイル = 提出済みとして認識されない
```

---

## 3. 実装する機能の全体像

### 3.1 実装する機能

#### 機能1: カテゴリ別予実管理とGoogle Driveファイルの連動

**目的**: Google Driveにファイルがあれば「提出済み」として自動認識

**仕様**:
1. カテゴリ別予実管理が表示時、各工程のGoogle Driveファイルをチェック
2. ファイルあり → 「提出済み」（緑色）
3. ファイルなし → 進捗入力シートの値を使用

**優先順位**:
```
1. Google Driveファイルあり → 「提出済み」（優先）
2. 進捗入力シート「完了」 → 「提出済み」
3. それ以外 → 「未提出」
```

#### 機能2: 内容整理（原稿）フォルダの追加

**目的**: Googleドキュメントの内容整理を提出状況として管理

**仕様**:
1. データ種別に `content`（内容整理）を追加
2. フォルダ構造: `A/内容整理/2025_11/`
3. Googleドキュメント判定: mimeType = `application/vnd.google-apps.document`

**表示内容**:
- Googleドキュメントあり → 「提出済み」
- Googleドキュメントなし → 「未提出」

### 3.2 修正が必要なファイル

```
types/data-submission.ts              ← DataType型に'content'追加
api/yumemaga-v2/data-submission/
  ├ status/route.ts                   ← Google Driveファイルチェック追加
  └ list-files/route.ts               ← 内容整理フォルダ対応
components/data-submission/
  └ DataSubmissionSection.tsx         ← 内容整理フォルダUI追加
```

---

## 4. 実装手順

### Phase 1: 型定義の拡張（5分）

#### ファイル: `types/data-submission.ts`

**現在の型**:
```typescript
export type DataType = 'recording' | 'photo' | 'planning';
```

**変更後**:
```typescript
export type DataType = 'recording' | 'photo' | 'planning' | 'content';
```

---

### Phase 2: status API修正（30分）

#### ファイル: `app/api/yumemaga-v2/data-submission/status/route.ts`

**現在の処理フロー**:
```typescript
1. 進捗入力シートからデータ取得
2. カテゴリマスターと結合
3. レスポンス返却
```

**変更後の処理フロー**:
```typescript
1. 進捗入力シートからデータ取得
2. カテゴリマスターと結合
3. 【新規】Google Driveファイル存在チェック
4. 【新規】進捗データとファイル存在を統合
5. レスポンス返却
```

**実装コード**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, getBatchSheetData } from '@/lib/google-sheets';
import { drive_v3, google } from 'googleapis';

const SPREADSHEET_ID = process.env.YUMEMAGA_SPREADSHEET_ID!;
const DRIVE_FOLDER_ID = process.env.YUMEMAGA_DATA_SUBMISSION_FOLDER_ID!; // 環境変数に追加

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue') || '2025年11月号';

    // 1. 進捗入力シートとカテゴリマスターを取得（既存処理）
    const [progressData, categoryMasterData] = await getBatchSheetData(SPREADSHEET_ID, [
      '進捗入力シート!A:Z',
      'カテゴリマスター!A:Z',
    ]);

    // 2. カテゴリマスター解析（既存処理）
    const categoryMaster = parseCategoryMaster(categoryMasterData);

    // 3. 進捗データ解析（既存処理）
    const progressMap = parseProgressData(progressData, issue);

    // 4. 【新規】Google Driveファイル存在チェック
    const fileStatusMap = await checkGoogleDriveFiles(issue, categoryMaster);

    // 5. 【新規】統合処理
    const categories = categoryMaster.map((cat) => {
      const requiredData = cat.requiredData.map((rd) => {
        const progressStatus = progressMap[`${cat.id}-${rd.type}`] || 'none';
        const fileExists = fileStatusMap[`${cat.id}-${rd.type}`] || false;

        // 優先順位: ファイルあり > 進捗完了 > それ以外
        let finalStatus = progressStatus;
        if (fileExists) {
          finalStatus = 'submitted';
        }

        return {
          ...rd,
          status: finalStatus,
        };
      });

      return {
        ...cat,
        requiredData,
      };
    });

    // 6. 全体進捗計算（既存処理）
    const allData = categories.flatMap((c) => c.requiredData);
    const submitted = allData.filter((d) => d.status === 'submitted').length;
    const pending = allData.filter((d) => d.status === 'pending').length;
    const none = allData.filter((d) => d.status === 'none').length;
    const total = allData.length;
    const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      categories,
      summary: { submitted, pending, none, total, progress },
    });
  } catch (error: any) {
    console.error('Status API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 【新規】Google Driveファイル存在チェック関数
async function checkGoogleDriveFiles(
  issue: string,
  categoryMaster: any[]
): Promise<Record<string, boolean>> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 月号フォーマット変換: "2025年11月号" → "2025_11"
    const issueFormatted = issue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
      const paddedMonth = month.padStart(2, '0');
      return `${year}_${paddedMonth}`;
    });

    const fileStatusMap: Record<string, boolean> = {};

    // 各カテゴリ・データ種別のフォルダをチェック
    for (const cat of categoryMaster) {
      for (const rd of cat.requiredData) {
        const dataTypeFolder = getDataTypeFolderName(rd.type);
        const folderPath = `カテゴリ別/${issueFormatted}/${cat.id}/${dataTypeFolder}`;

        // フォルダ内のファイル数を取得
        const files = await listFilesInFolder(drive, DRIVE_FOLDER_ID, folderPath);
        const hasFiles = files.length > 0;

        fileStatusMap[`${cat.id}-${rd.type}`] = hasFiles;
      }
    }

    return fileStatusMap;
  } catch (error) {
    console.error('Google Drive file check error:', error);
    return {};
  }
}

// 【新規】フォルダ内ファイル一覧取得
async function listFilesInFolder(
  drive: drive_v3.Drive,
  baseFolderId: string,
  folderPath: string
): Promise<any[]> {
  try {
    // フォルダパスを分解
    const pathParts = folderPath.split('/').filter((p) => p);

    let currentFolderId = baseFolderId;

    // パスを順にたどる
    for (const folderName of pathParts) {
      const response = await drive.files.list({
        q: `'${currentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (!response.data.files || response.data.files.length === 0) {
        return []; // フォルダが存在しない
      }

      currentFolderId = response.data.files[0].id!;
    }

    // 最終フォルダ内のファイル一覧を取得
    const response = await drive.files.list({
      q: `'${currentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
    });

    return response.data.files || [];
  } catch (error) {
    console.error(`Folder list error: ${folderPath}`, error);
    return [];
  }
}

// データ種別 → フォルダ名マッピング
function getDataTypeFolderName(type: string): string {
  const map: Record<string, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
    content: '内容整理', // 【新規】
  };
  return map[type] || type;
}

// 既存のヘルパー関数（省略）
function parseCategoryMaster(data: any[][]): any[] {
  // ... 既存実装のまま
}

function parseProgressData(data: any[][], issue: string): Record<string, string> {
  // ... 既存実装のまま
}
```

**環境変数追加**:

`.env.local` に以下を追加:
```bash
# Google Drive: ゆめマガ制作 > データ提出 フォルダのID
YUMEMAGA_DATA_SUBMISSION_FOLDER_ID=1abc...xyz
```

**フォルダIDの取得方法**:
1. Google Driveで「データ提出」フォルダを開く
2. URLからIDをコピー: `https://drive.google.com/drive/folders/【ここがID】`

---

### Phase 3: list-files API修正（15分）

#### ファイル: `app/api/yumemaga-v2/data-submission/list-files/route.ts`

**修正内容**: データ種別に `content` を追加

**既存コード**:
```typescript
// カテゴリモード
if (categoryId && dataType && issue) {
  const dataTypeFolder = getDataTypeFolderName(dataType);
  // ...
}
```

**変更なし**（`getDataTypeFolderName` に `content` を追加するだけ）:

```typescript
function getDataTypeFolderName(dataType: string): string {
  const map: Record<string, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
    content: '内容整理', // 【新規】
  };
  return map[dataType] || dataType;
}
```

---

### Phase 4: データ提出進捗管理UI修正（30分）

#### ファイル: `components/data-submission/DataSubmissionSection.tsx`

**修正箇所1: データ種別に内容整理を追加**

**既存コード（578-595行目付近）**:
```typescript
const availableDataTypes = category.requiredData.map(rd => {
  const name = (rd?.name || rd?.type || '').toString();
  if (name.includes('録音') || name.includes('音声')) return 'recording';
  if (name.includes('写真') || name.includes('画像')) return 'photo';
  if (name.includes('企画') || name.includes('資料')) return 'planning';
  return null;
}).filter((dt): dt is DataType => dt !== null);
```

**変更後**:
```typescript
const availableDataTypes = category.requiredData.map(rd => {
  const name = (rd?.name || rd?.type || '').toString();
  if (name.includes('録音') || name.includes('音声')) return 'recording';
  if (name.includes('写真') || name.includes('画像')) return 'photo';
  if (name.includes('企画') || name.includes('資料')) return 'planning';
  if (name.includes('内容整理') || name.includes('原稿')) return 'content'; // 【新規】
  return null;
}).filter((dt): dt is DataType => dt !== null);
```

**修正箇所2: フォルダアイコン表示に内容整理を追加**

**既存コード（600-603行目付近）**:
```typescript
const folderName = getDataTypeFolderName(dataType);
const FolderIcon = dataType === 'recording' ? Music : dataType === 'photo' ? Image : FileText;
```

**変更後**:
```typescript
const folderName = getDataTypeFolderName(dataType);
const FolderIcon =
  dataType === 'recording' ? Music :
  dataType === 'photo' ? Image :
  dataType === 'content' ? FileText :  // 【新規】内容整理
  FileText;
```

**修正箇所3: ヘルパー関数に内容整理を追加**

**既存コード（末尾付近）**:
```typescript
function getDataTypeFolderName(dataType: DataType): string {
  const map: Record<DataType, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
  };
  return map[dataType];
}
```

**変更後**:
```typescript
function getDataTypeFolderName(dataType: DataType): string {
  const map: Record<DataType, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
    content: '内容整理', // 【新規】
  };
  return map[dataType];
}
```

---

### Phase 5: カテゴリ別予実管理の表示更新（15分）

#### ファイル: `components/category-management/CategoryManagementSection.tsx`

**修正内容**: 自動更新ボタンの追加（オプション）

**追加コード（updateProgress関数の後）**:
```typescript
// データ提出状況を再取得
const handleRefreshStatus = async () => {
  setLoadingProgress(true);
  try {
    const response = await fetch(
      `/api/yumemaga-v2/data-submission/status?issue=${encodeURIComponent(selectedIssue)}`
    );
    const result = await response.json();

    if (result.success) {
      // カテゴリデータを更新
      setCategories(result.categories);
    }
  } catch (error) {
    console.error('Status refresh error:', error);
  } finally {
    setLoadingProgress(false);
  }
};
```

**UI追加（進捗更新ボタンの横）**:
```tsx
<button
  onClick={handleRefreshStatus}
  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
  disabled={loadingProgress}
>
  {loadingProgress ? '更新中...' : 'データ提出状況を反映'}
</button>
```

---

### Phase 6: Google Driveフォルダ作成（10分）

**手動作業**: Google Driveで以下のフォルダ構造を作成

```
ゆめマガ制作/
└ データ提出/
    └ カテゴリ別/
        └ 2025_11/
            ├ A/
            │   ├ 録音データ/
            │   ├ 写真データ/
            │   ├ 企画内容/
            │   └ 内容整理/  ← 【新規作成】
            ├ K/
            │   ├ 録音データ/
            │   ├ 写真データ/
            │   ├ 企画内容/
            │   └ 内容整理/  ← 【新規作成】
            ├ H/
            │   └ 内容整理/  ← 【新規作成】
            ├ I/
            │   └ 内容整理/  ← 【新規作成】
            ├ L/
            │   └ 内容整理/  ← 【新規作成】
            └ M/
                └ 内容整理/  ← 【新規作成】
```

---

## 5. テスト方法

### 5.1 テストケース1: Google Driveファイル連動

**前提条件**:
- 進捗入力シートで「A-2: 録音」が「未完了」
- Google Driveの `A/録音データ/2025_11/` にファイルが存在

**テスト手順**:
```bash
# 1. status APIを直接呼び出し
curl "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/status?issue=2025年11月号" | python3 -m json.tool

# 2. レスポンス確認
{
  "categories": [
    {
      "id": "A",
      "requiredData": [
        {
          "type": "recording",
          "name": "録音",
          "status": "submitted",  ← Google Driveファイルありで "submitted"
          "deadline": "10/15"
        }
      ]
    }
  ]
}
```

**期待結果**:
- カテゴリAカードの「録音」が緑色「提出済み」表示

### 5.2 テストケース2: 内容整理フォルダ

**前提条件**:
- Google Driveの `A/内容整理/2025_11/` にGoogleドキュメント「A_内容整理_村上萌.docx」を作成

**テスト手順**:
```bash
# 1. ブラウザでデータ提出進捗管理を開く
# 2. カテゴリ別タブ選択
# 3. A: メインインタビュー選択
# 4. 「内容整理」フォルダが表示されることを確認
# 5. 「内容整理」フォルダをクリック
# 6. ファイル一覧に「A_内容整理_村上萌.docx」が表示されることを確認
```

**期待結果**:
- 内容整理フォルダアイコンが表示される
- Googleドキュメントが一覧表示される
- カテゴリAカードの「内容整理」が緑色「提出済み」表示

### 5.3 テストケース3: 優先順位確認

**前提条件**:
- 進捗入力シート: 「K-2: 録音」が「完了」
- Google Drive: `K/録音データ/2025_11/` にファイルなし

**テスト手順**:
```bash
curl "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/status?issue=2025年11月号" | python3 -m json.tool
```

**期待結果**:
- カテゴリKの「録音」が「提出済み」（進捗入力シートの値を使用）

---

## 6. 完了条件

### 6.1 機能要件

- [ ] カテゴリ別予実管理がGoogle Driveファイルを自動認識
- [ ] ファイルあり → 「提出済み」（緑色）表示
- [ ] 内容整理フォルダが追加され、Googleドキュメントをアップロード可能
- [ ] 内容整理の提出状況が正しく表示される

### 6.2 技術要件

- [ ] TypeScript型エラーなし
- [ ] ビルドエラーなし
- [ ] 環境変数 `YUMEMAGA_DATA_SUBMISSION_FOLDER_ID` が設定済み
- [ ] Google Driveにフォルダ構造が作成済み

### 6.3 テスト要件

- [ ] テストケース1: Google Driveファイル連動 ✅
- [ ] テストケース2: 内容整理フォルダ ✅
- [ ] テストケース3: 優先順位確認 ✅

---

## 7. トラブルシューティング

### 問題1: Google Drive APIエラー

**エラー内容**:
```
Error: The caller does not have permission
```

**原因**: サービスアカウントがフォルダにアクセスできない

**解決策**:
1. Google Driveで「データ提出」フォルダを右クリック
2. 「共有」をクリック
3. サービスアカウントのメールアドレスを追加（閲覧者権限）
4. サービスアカウントメールアドレスの確認:
   ```bash
   echo $GOOGLE_SERVICE_ACCOUNT_KEY | jq -r .client_email
   ```

### 問題2: フォルダが見つからない

**エラー内容**:
```
fileStatusMap[`${cat.id}-${rd.type}`] = false (常にfalse)
```

**原因**: フォルダパスが間違っている

**解決策**:
1. Google Driveで実際のフォルダ構造を確認
2. `folderPath` のログを出力:
   ```typescript
   console.log('Checking folder path:', folderPath);
   ```
3. パス区切りが `/` であることを確認

### 問題3: 内容整理フォルダが表示されない

**原因**: カテゴリマスターに内容整理の定義がない

**解決策**:
1. スプレッドシート「カテゴリマスター」を開く
2. 各カテゴリに「内容整理」行を追加:
   ```
   カテゴリID | 工程ID | 工程名     | データ種別 | 締切
   A          | A-5    | 内容整理   | content    | 10/20
   K          | K-5    | 内容整理   | content    | 10/20
   ```

---

## 8. 実装チェックリスト

### Phase 1: 型定義 ✅
- [ ] `types/data-submission.ts` に `content` 追加

### Phase 2: status API ✅
- [ ] `status/route.ts` にGoogle Driveチェック追加
- [ ] `checkGoogleDriveFiles` 関数実装
- [ ] `listFilesInFolder` 関数実装
- [ ] 環境変数 `YUMEMAGA_DATA_SUBMISSION_FOLDER_ID` 追加

### Phase 3: list-files API ✅
- [ ] `getDataTypeFolderName` に `content` 追加

### Phase 4: データ提出進捗管理UI ✅
- [ ] `availableDataTypes` に内容整理の判定追加
- [ ] フォルダアイコン表示に内容整理追加
- [ ] ヘルパー関数に内容整理追加

### Phase 5: カテゴリ別予実管理UI ✅
- [ ] データ提出状況反映ボタン追加（オプション）

### Phase 6: Google Driveフォルダ作成 ✅
- [ ] 全カテゴリに「内容整理」フォルダ作成

### テスト ✅
- [ ] テストケース1: ファイル連動
- [ ] テストケース2: 内容整理
- [ ] テストケース3: 優先順位

---

## 9. 次世代Claude Codeへのメッセージ

この実装により、以下が実現されます：

1. **自動化**: Google Driveにファイルがあれば自動的に「提出済み」認識
2. **可視化**: 内容整理（原稿）の提出状況が一目で分かる
3. **連動**: データ提出進捗管理とカテゴリ別予実管理が完全連動

**重要な注意点**:
- Google Drive API呼び出しは時間がかかる（1フォルダ0.5秒程度）
- 6カテゴリ × 4種別 = 24回のAPI呼び出し → 約12秒
- 必要に応じてキャッシュ機構を検討

**実装の優先順位**:
1. Phase 1-4 を優先実装（コア機能）
2. Phase 5 は余裕があれば実装（UX改善）
3. Phase 6 は手動作業で対応可能

**この引き継ぎ書の使い方**:
1. 上から順番に実装
2. 各Phaseごとにテスト
3. 完了条件を確認
4. 問題があればトラブルシューティングを参照

成功を祈ります！🚀
