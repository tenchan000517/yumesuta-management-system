# 契約業務フロー統合 - Phase 2 完全実装計画書

**作成日**: 2025年10月12日
**作成者**: Claude Code
**目的**: Phase 2（スプレッドシート書き込み・Google Drive連動）の完全な実装計画
**バージョン**: v1.0

---

## 📋 目次

1. [Phase 1.6までの現状](#phase-16までの現状)
2. [Phase 2の背景と目的](#phase-2の背景と目的)
3. [Phase 2の実装範囲](#phase-2の実装範囲)
4. [API設計](#api設計)
5. [UI/UX設計](#uiux設計)
6. [コンポーネント設計](#コンポーネント設計)
7. [実装スケジュール](#実装スケジュール)
8. [テスト計画](#テスト計画)
9. [Phase 2.2への移行](#phase-22への移行)

---

## Phase 1.6までの現状

### 実装済みの機能

**Phase 1（MVP）**:
- 13ステップカードグリッド表示
- プログレスバー（主要5ステップ）
- サイドパネル（Notion風）
- チェックリスト機能（LocalStorage）
- メール例文モーダル
- 契約・入金管理シート連動（**読み取りのみ**）

**Phase 1.5（実運用化）**:
- リマインダーカード表示（6種類）
- 新規契約作成機能
- 契約選択機能
- リソースメニュー（ヘッダー常時表示）
- フィルタ機能
- 進捗管理列（Q〜AC列）の追加（**読み取りのみ**）

**Phase 1.6（企業情報一元管理）**:
- 契約企業マスタシート作成
- 企業IDによる管理
- 企業情報の閲覧（**編集不可**）
- 企業名の正規化

### 現在の制限事項

#### 制限1: スプレッドシートへの書き込みができない

**現状**:
- ステップを完了しても、進捗列（Q〜AC列）に日付が記録されない
- チェックリストはLocalStorageのみで、他ユーザーと共有不可
- 契約書回収日（H列）、申込書回収日（J列）等も記録できない

**結果**:
- ページをリロードすると進捗が反映されない
- 他のユーザーが進捗を確認できない
- スプレッドシートを手動で更新する必要がある

#### 制限2: エビデンス保存ができない

**現状**:
- 契約書PDF、請求書PDF、その他エビデンスを保存する場所がない
- Google Driveフォルダが整理されていない

**結果**:
- ファイルがバラバラに保存される
- 後から探すのが困難

---

## Phase 2の背景と目的

### Phase 2の目的

**「読み取りのみ」から「書き込み可能」へ進化し、完全な業務フロー管理を実現する**

1. **ステップ完了の自動記録**: ダッシュボードでステップを完了すると、自動的にスプレッドシートに日付が記録される
2. **エビデンス保存の自動化**: Google Driveに契約ごとのフォルダを自動作成し、ファイルを一元管理
3. **他ユーザーとの情報共有**: 進捗状況がリアルタイムでスプレッドシートに反映され、全員が最新情報を確認可能

---

## Phase 2の実装範囲

### Phase 2-1: ステップ完了時のスプレッドシート書き込み

#### 実装する機能

1. **各ステップのサイドパネルに「完了」ボタンを追加**

2. **ステップ完了時の処理**:
   - 該当する列に今日の日付を書き込み
   - ステップ完了日列を更新
   - カードのステータスを「✅ 完了」に更新
   - リマインダーカードを自動更新

3. **対応するステップと列の関係**:

| ステップ | タイトル | 更新する列 | 書き込む内容 |
|---------|---------|----------|------------|
| ① | 情報収集 | Q列（ステップ1完了日） | 今日の日付 |
| ② | 基本契約書作成 | G列（契約書送付）<br>R列（ステップ2完了日） | 今日の日付<br>今日の日付 |
| ③ | 基本契約書の押印・送付 | H列（契約書回収）<br>S列（ステップ3完了日） | 今日の日付<br>今日の日付 |
| ④ | 申込書作成 | I列（申込書送付）<br>T列（ステップ4完了日） | 今日の日付<br>今日の日付 |
| ⑤ | 申込書の押印・送信 | J列（申込書回収）<br>U列（ステップ5完了日） | 今日の日付<br>今日の日付 |
| ⑥ | 重要事項説明 | V列（ステップ6完了日） | 今日の日付 |
| ⑦ | 契約完了確認 | W列（ステップ7完了日） | 今日の日付 |
| ⑧ | 請求書作成・送付 | X列（ステップ8完了日） | 今日の日付 |
| ⑨ | 入金確認 | L列（入金実績日）<br>M列（入金ステータス）<br>Y列（ステップ9完了日） | 今日の日付<br>「入金済」<br>今日の日付 |
| ⑩ | 入金管理シート更新 | Z列（ステップ10完了日） | 今日の日付 |
| ⑪ | 入金確認連絡・原稿依頼 | AA列（ステップ11完了日） | 今日の日付 |
| ⑫ | 制作・校正 | AB列（ステップ12完了日） | 今日の日付 |
| ⑬ | 掲載 | AC列（ステップ13完了日） | 今日の日付 |

4. **リソースメニューへの追加**:
   - 「📊 契約・入金管理シート」のリンクを追加
   - クリックでGoogle Sheetsを直接開く

---

### Phase 2-2: Google Drive連動（詳細実装計画）

#### 🔍 調査結果と実装方針

**ゆめマガダッシュボードの実装を参考にする**

Phase 2.2の初回実装でエラーが発生しましたが、原因を調査した結果：

- ✅ **既存システム（ゆめマガ）が正常に動作している**
- ✅ **`lib/google-oauth.ts`の`fs`モジュールは問題ない**（サーバーサイドで実行されるため）
- ✅ **OAuth認証を使用する方法が確立されている**

**結論**: ゆめマガと全く同じ方法で実装すれば成功する。

---

#### 実装する機能

1. **フォルダ自動作成**:
   ```
   エビデンス保存用Drive/
   ├── 株式会社A/
   │   ├── 契約01_2025年12月号/
   │   │   ├── 広告掲載基本契約書_株式会社A_20251009.pdf
   │   │   ├── 広告掲載申込書_株式会社A_20251009.pdf
   │   │   ├── 請求書_株式会社A_20251015.pdf
   │   │   └── その他エビデンス/
   ```

2. **ファイルアップロード**:
   - サイドパネルから直接アップロード
   - ドラッグ&ドロップ対応

3. **ファイル一覧表示**:
   - サイドパネルで保存済みファイルを確認
   - クリックでファイルを開く

---

#### API設計（OAuth認証版）

##### 1. `/api/contract/drive/upload` - ファイルアップロードAPI

**参考**: `app/api/yumemaga-v2/data-submission/upload/route.ts`

**メソッド**: `POST`

**リクエスト形式**: `multipart/form-data`
```typescript
{
  file: File;              // アップロードするファイル
  contractId: number;      // 契約ID
  companyName: string;     // 企業名
}
```

**実装例**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileWithOAuth, ensureDirectoryWithOAuth } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contractId = formData.get('contractId') as string;
    const companyName = formData.get('companyName') as string;

    // 環境変数からルートフォルダIDを取得
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

    // ディレクトリパス: ["企業名", "契約ID"]
    const contractName = `契約${String(contractId).padStart(2, '0')}`;
    const pathSegments = [companyName, contractName];

    // フォルダIDを解決（存在しなければ作成）
    const targetFolderId = await ensureDirectoryWithOAuth(rootFolderId, pathSegments);

    // ファイルアップロード
    const result = await uploadFileWithOAuth(targetFolderId, file);

    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        name: result.name,
        webViewLink: result.webViewLink
      }
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

**重要**: `uploadFileWithOAuth`と`ensureDirectoryWithOAuth`を使用（OAuth認証版）

---

##### 2. `/api/contract/drive/list` - ファイル一覧取得API

**参考**: `app/api/yumemaga-v2/data-submission/list-files/route.ts`

**メソッド**: `GET`

**クエリパラメータ**:
```typescript
{
  contractId: number;
  companyName: string;
}
```

**実装例**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { listFilesInFolderWithOAuth, ensureDirectoryWithOAuth } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const companyName = searchParams.get('companyName');

    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    const contractName = `契約${String(contractId).padStart(2, '0')}`;
    const pathSegments = [companyName, contractName];

    // フォルダIDを解決
    const targetFolderId = await ensureDirectoryWithOAuth(rootFolderId, pathSegments);

    // ファイル一覧を取得
    const files = await listFilesInFolderWithOAuth(targetFolderId);

    return NextResponse.json({
      success: true,
      files
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

#### UI実装（SidePanel.tsx）

**追加する機能**:

1. **ファイルアップロードセクション**

```typescript
// 状態管理
const [files, setFiles] = useState<any[]>([]);
const [isUploading, setIsUploading] = useState(false);
const [uploadError, setUploadError] = useState<string | null>(null);
const [isDragging, setIsDragging] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);

// ファイル一覧を取得
useEffect(() => {
  if (contractId && companyInfo) {
    loadFiles();
  }
}, [contractId, companyInfo]);

const loadFiles = async () => {
  try {
    const res = await fetch(
      `/api/contract/drive/list?contractId=${contractId}&companyName=${encodeURIComponent(companyInfo.officialName)}`
    );
    const data = await res.json();
    if (data.success) {
      setFiles(data.files);
    }
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
  }
};

// ファイルアップロード
const handleFileUpload = async (selectedFiles: FileList | null) => {
  if (!selectedFiles || selectedFiles.length === 0) return;

  setIsUploading(true);
  setUploadError(null);

  try {
    const file = selectedFiles[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contractId', contractId.toString());
    formData.append('companyName', companyInfo.officialName);

    const res = await fetch('/api/contract/drive/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      await loadFiles(); // 再取得
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setUploadError(data.error);
    }
  } catch (error) {
    setUploadError('アップロードに失敗しました');
  } finally {
    setIsUploading(false);
  }
};
```

2. **UIコンポーネント**

```tsx
<section>
  <h3 className="text-lg font-bold text-gray-900 mb-3">エビデンス保存</h3>

  {/* アップロードエリア */}
  <div
    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
    onDrop={(e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    }}
    className={`border-2 border-dashed rounded-lg p-6 ${
      isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
    }`}
  >
    <input
      ref={fileInputRef}
      type="file"
      onChange={(e) => handleFileUpload(e.target.files)}
      className="hidden"
    />
    <button
      onClick={() => fileInputRef.current?.click()}
      disabled={isUploading}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      {isUploading ? 'アップロード中...' : 'ファイルを選択'}
    </button>
  </div>

  {/* ファイル一覧 */}
  <div className="mt-4">
    <h4 className="text-sm font-bold mb-2">保存済みファイル</h4>
    {files.length === 0 ? (
      <p className="text-sm text-gray-500">ファイルはありません</p>
    ) : (
      <div className="space-y-2">
        {files.map((file) => (
          <a
            key={file.id}
            href={file.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
          >
            <FileIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">{file.name}</span>
          </a>
        ))}
      </div>
    )}
  </div>
</section>
```

---

#### 実装手順

##### Step 1: 環境変数設定

`.env.local`に追加:
```bash
GOOGLE_DRIVE_FOLDER_ID=<エビデンス保存用ドライブのフォルダID>
```

##### Step 2: APIルート作成

1. `/app/api/contract/drive/upload/route.ts` - ファイルアップロード
2. `/app/api/contract/drive/list/route.ts` - ファイル一覧取得

**重要**: `lib/google-drive.ts`から以下をインポート:
- `uploadFileWithOAuth`
- `ensureDirectoryWithOAuth`
- `listFilesInFolderWithOAuth`

##### Step 3: SidePanel.tsx修正

1. ファイルアップロード機能を追加
2. ファイル一覧表示機能を追加
3. ドラッグ&ドロップ対応

##### Step 4: テスト

1. ファイルアップロードが成功するか確認
2. フォルダが自動作成されるか確認
3. ファイル一覧が表示されるか確認

---

#### 重要な注意事項

**✅ やるべきこと**:
- ゆめマガの実装（`app/api/yumemaga-v2/data-submission/upload/route.ts`）を参考にする
- OAuth認証版の関数（`*WithOAuth`）を使用する
- `lib/google-oauth.ts`は修正しない（既に動作しているため）

**❌ やってはいけないこと**:
- サービスアカウント版の関数（`uploadFile`, `createFolder`等）は使わない
- `lib/google-oauth.ts`の`fs`モジュールを修正しない（不要）
- 新しいGoogle Drive APIクライアントを作成しない

---

#### OAuth認証の確認

Phase 2.2実装前に、OAuth認証が完了しているか確認:

```bash
# 認証状態を確認
curl http://127.0.0.1:3000/api/auth/status

# 認証が未完了の場合、ブラウザで以下にアクセス
http://localhost:3000/api/auth/google
```

**注**: ゆめマガダッシュボードで既にOAuth認証が完了している場合、そのまま使用可能。

---

### Phase 2-3: ステップ完了処理の詳細（Phase 2-1に含まれる）

**Phase 2-3は独立した機能ではなく、Phase 2-1の一部として実装されます**

特に重要なステップ：

#### ステップ③「基本契約書の押印・送付」
- H列（契約書回収）に今日の日付
- S列（ステップ3完了日）に今日の日付

#### ステップ⑤「申込書の押印・送信」
- J列（申込書回収）に今日の日付
- U列（ステップ5完了日）に今日の日付

---

## API設計

### 1. `/api/contract/complete-step` - ステップ完了API

**メソッド**: `POST`

**機能**: 指定されたステップを完了し、スプレッドシートを更新

**リクエスト形式**:
```typescript
{
  contractId: number;
  stepNumber: number;
}
```

**レスポンス形式**:
```typescript
{
  success: boolean;
  updatedFields?: {
    [columnLetter: string]: string;  // 例: { "H": "2025/10/12", "S": "2025/10/12" }
  };
  error?: string;
}
```

**実装ロジック**:

```typescript
// /app/api/contract/complete-step/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { contractId, stepNumber } = await request.json();

    // 今日の日付（YYYY/MM/DD形式）
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    // ステップ番号に応じて更新する列を決定
    const updates = getColumnsToUpdate(stepNumber, dateStr);

    // Google Sheets API初期化
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const sheetName = '契約・入金管理';

    // 契約IDから行番号を取得
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    });

    const rowIndex = existingData.data.values?.findIndex(
      (row, index) => index > 0 && parseInt(row[0]) === contractId
    );

    if (rowIndex === undefined || rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: '契約が見つかりません' },
        { status: 404 }
      );
    }

    const actualRowNumber = rowIndex + 1; // 1-indexed

    // 各列を更新
    const batchUpdateData = Object.entries(updates).map(([column, value]) => ({
      range: `${sheetName}!${column}${actualRowNumber}`,
      values: [[value]]
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: batchUpdateData
      }
    });

    return NextResponse.json({
      success: true,
      updatedFields: updates
    });

  } catch (error) {
    console.error('ステップ完了エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

// ステップ番号に応じて更新する列を決定する関数
function getColumnsToUpdate(stepNumber: number, dateStr: string): Record<string, string> {
  const stepCompletionColumn = String.fromCharCode(80 + stepNumber); // Q=81(ステップ1), R=82(ステップ2), ...

  const mapping: Record<number, Record<string, string>> = {
    1: { Q: dateStr },  // ステップ1: Q列のみ
    2: { G: dateStr, R: dateStr },  // ステップ2: G列 + R列
    3: { H: dateStr, S: dateStr },  // ステップ3: H列 + S列
    4: { I: dateStr, T: dateStr },  // ステップ4: I列 + T列
    5: { J: dateStr, U: dateStr },  // ステップ5: J列 + U列
    6: { V: dateStr },  // ステップ6: V列のみ
    7: { W: dateStr },  // ステップ7: W列のみ
    8: { X: dateStr },  // ステップ8: X列のみ
    9: { L: dateStr, M: '入金済', Y: dateStr },  // ステップ9: L列 + M列 + Y列
    10: { Z: dateStr },  // ステップ10: Z列のみ
    11: { AA: dateStr },  // ステップ11: AA列のみ
    12: { AB: dateStr },  // ステップ12: AB列のみ
    13: { AC: dateStr }   // ステップ13: AC列のみ
  };

  return mapping[stepNumber] || {};
}
```

---

### 2. `/api/contract/[id]` - 契約詳細取得API（修正）

**既存のAPIを修正して、完了状況を正しく反映**

**変更点**:
- ステップ完了後、再取得時に最新の進捗を反映
- キャッシュを無効化

---

## UI/UX設計

### 1. サイドパネルへの「完了」ボタン追加

#### 現在のサイドパネル構成

```
┌─────────────────────────────────────────┐
│ ステップ③ 基本契約書の押印・送付        │
│                                         │
│ 【概要】                                 │
│ マネーフォワードで基本契約書を送信し... │
│                                         │
│ 【やることリスト】                       │
│ ✅ マネーフォワードで基本契約書を送信    │
│ ⬜ 顧客から押印済み契約書を回収          │
│                                         │
│ 【ガイド】                               │
│ 🔗 マネーフォワード                     │
│                                         │
│ [閉じる]                                │
└─────────────────────────────────────────┘
```

#### 修正後のサイドパネル

```
┌─────────────────────────────────────────┐
│ ステップ③ 基本契約書の押印・送付        │
│                                         │
│ 【概要】                                 │
│ マネーフォワードで基本契約書を送信し... │
│                                         │
│ 【やることリスト】                       │
│ ✅ マネーフォワードで基本契約書を送信    │
│ ✅ 顧客から押印済み契約書を回収          │
│                                         │
│ 【ガイド】                               │
│ 🔗 マネーフォワード                     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ このステップを完了にする          │ │ ← 新規追加
│ │                                     │ │
│ │ 完了すると以下の情報が記録されます:  │ │
│ │ • 契約書回収日（H列）: 2025/10/12   │ │
│ │ • ステップ3完了日（S列）: 2025/10/12│ │
│ │                                     │ │
│ │ [キャンセル] [完了する]             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [閉じる]                                │
└─────────────────────────────────────────┘
```

#### 完了ボタンの挙動

1. **ボタンをクリック**:
   - 確認モーダルが表示される（上記の囲み部分）

2. **「完了する」ボタンをクリック**:
   - `/api/contract/complete-step` API呼び出し
   - ローディング状態表示

3. **成功時**:
   - トースト通知「✅ ステップ③が完了しました」
   - カードのステータスが「✅ 完了」に更新
   - サイドパネルを閉じる
   - リマインダーカードを再取得

4. **エラー時**:
   - エラーメッセージ表示
   - リトライボタン表示

---

### 2. リソースメニューへの追加

#### 現在のリソースメニュー

```
📋 情報収集フォーマット
📄 基本契約書（原本）
📄 申込書（原本）
🔗 マネーフォワード
```

#### 修正後のリソースメニュー

```
📋 情報収集フォーマット
📄 基本契約書（原本）
📄 申込書（原本）
🔗 マネーフォワード
📊 契約・入金管理シート  ← 新規追加
```

**リンク先**: 営業予実管理スプレッドシートの「契約・入金管理」シート

---

## コンポーネント設計

### 1. SidePanel.tsx の修正

**ファイル**: `components/workflow/SidePanel.tsx`

**追加する機能**:

1. **完了ボタンコンポーネント**

```typescript
// 完了ボタンの状態管理
const [isCompleting, setIsCompleting] = useState(false);
const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

// 完了ボタンの表示条件
const canComplete = () => {
  // 既に完了している場合は表示しない
  if (step.status === 'completed') return false;

  // 契約が選択されている場合のみ表示
  return selectedContract !== null;
};

// 完了処理
const handleComplete = async () => {
  setIsCompleting(true);

  try {
    const res = await fetch('/api/contract/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId: selectedContract.id,
        stepNumber: step.stepNumber
      })
    });

    const data = await res.json();

    if (data.success) {
      // 成功時の処理
      toast.success(`✅ ステップ${step.stepNumber}が完了しました`);
      onStepCompleted(step.stepNumber);  // 親コンポーネントに通知
      onClose();
    } else {
      toast.error(`エラー: ${data.error}`);
    }
  } catch (error) {
    toast.error('通信エラーが発生しました');
  } finally {
    setIsCompleting(false);
    setShowCompleteConfirm(false);
  }
};
```

2. **完了ボタンのUI**

```typescript
{canComplete() && (
  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    {!showCompleteConfirm ? (
      <button
        onClick={() => setShowCompleteConfirm(true)}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-5 h-5" />
        このステップを完了にする
      </button>
    ) : (
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-2">完了確認</h4>
        <p className="text-xs text-gray-600 mb-3">
          完了すると以下の情報が契約・入金管理シートに記録されます:
        </p>
        <ul className="text-xs text-gray-700 mb-4 space-y-1">
          {getUpdateInfo(step.stepNumber).map((info, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>{info}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCompleteConfirm(false)}
            disabled={isCompleting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold"
          >
            キャンセル
          </button>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:bg-gray-300"
          >
            {isCompleting ? '処理中...' : '完了する'}
          </button>
        </div>
      </div>
    )}
  </div>
)}
```

3. **更新情報を取得する関数**

```typescript
function getUpdateInfo(stepNumber: number): string[] {
  const mapping: Record<number, string[]> = {
    1: ['ステップ1完了日（Q列）'],
    2: ['契約書送付日（G列）', 'ステップ2完了日（R列）'],
    3: ['契約書回収日（H列）', 'ステップ3完了日（S列）'],
    4: ['申込書送付日（I列）', 'ステップ4完了日（T列）'],
    5: ['申込書回収日（J列）', 'ステップ5完了日（U列）'],
    6: ['ステップ6完了日（V列）'],
    7: ['ステップ7完了日（W列）'],
    8: ['ステップ8完了日（X列）'],
    9: ['入金実績日（L列）', '入金ステータス（M列）: 入金済', 'ステップ9完了日（Y列）'],
    10: ['ステップ10完了日（Z列）'],
    11: ['ステップ11完了日（AA列）'],
    12: ['ステップ12完了日（AB列）'],
    13: ['ステップ13完了日（AC列）']
  };

  return mapping[stepNumber] || [];
}
```

---

### 2. ResourceMenu.tsx の修正

**ファイル**: `components/workflow/ResourceMenu.tsx`

**追加するリソース**:

```typescript
const resources = [
  // 既存のリソース...
  {
    id: 'contract-sheet',
    label: '📊 契約・入金管理シート',
    url: `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SALES_SPREADSHEET_ID}/edit#gid=791125447`,
    description: '契約データを直接確認・編集'
  }
];
```

**注意**: `NEXT_PUBLIC_SALES_SPREADSHEET_ID` を環境変数に追加する必要があります。

---

### 3. メインページの修正

**ファイル**: `app/dashboard/workflow/contract/page.tsx`

**追加する機能**:

1. **ステップ完了時のコールバック**

```typescript
const handleStepCompleted = async (stepNumber: number) => {
  // 契約データを再取得
  if (selectedContract) {
    const res = await fetch(`/api/contract/${selectedContract.id}`);
    const data = await res.json();

    if (data.success) {
      setSelectedContract(data.contract);
    }
  }

  // リマインダーカードを再取得
  await handleRefreshReminders();
};
```

2. **SidePanelにコールバックを渡す**

```typescript
<SidePanel
  step={selectedStep}
  isOpen={!!selectedStep}
  onClose={() => setSelectedStep(null)}
  onStepCompleted={handleStepCompleted}  // 追加
  // その他のprops...
/>
```

---

## 実装スケジュール

### Phase 2-1: ステップ完了機能実装（3日間）

#### Day 1: API実装

**作業内容**:
1. `/api/contract/complete-step` API作成
2. `getColumnsToUpdate` 関数実装
3. 全13ステップの列マッピング確認
4. APIテスト（curl または Postman）

**完了条件**:
- APIが正しく動作する
- すべてのステップで正しい列が更新される
- エラーハンドリングが適切

---

#### Day 2: UI実装

**作業内容**:
1. SidePanel.tsx に完了ボタン追加
2. 完了確認モーダル実装
3. トースト通知実装（react-hot-toast または sonner）
4. ResourceMenu.tsx に契約・入金管理シートのリンク追加
5. 環境変数設定（`NEXT_PUBLIC_SALES_SPREADSHEET_ID`）

**完了条件**:
- 完了ボタンが表示される
- クリックで確認モーダルが開く
- APIが正しく呼び出される
- トースト通知が表示される
- リソースメニューにリンクが表示される

---

#### Day 3: 統合テスト・デバッグ

**作業内容**:
1. 全13ステップの完了処理をテスト
2. エラーケースのテスト（通信エラー、権限エラー等）
3. リマインダーカードの自動更新確認
4. レスポンシブデザイン確認
5. デバッグ・微調整

**完了条件**:
- すべてのステップで完了処理が正しく動作する
- エラーが適切に処理される
- 完了後にリマインダーカードが更新される
- モバイル・タブレットで正しく表示される

---

### Phase 2-2: Google Drive連動（次のセッションで実施）

**予定作業**:
- フォルダ作成API実装
- ファイルアップロードAPI実装
- ファイル一覧取得API実装
- UIコンポーネント実装

**注**: コンテキストリフレッシュ後に実施します

---

## テスト計画

### 基本動作テスト

#### 1. ステップ完了処理

**テストケース1: ステップ③完了**
1. リマインダーカードから契約を選択
2. ステップ③カードをクリック
3. サイドパネルで「このステップを完了にする」ボタンをクリック
4. 確認モーダルが表示される
5. 「完了する」ボタンをクリック
6. トースト通知「✅ ステップ③が完了しました」が表示される
7. カードが「✅ 完了」になる
8. Google Sheetsを開いてH列とS列に日付が記録されているか確認

**期待結果**:
- H列に今日の日付が記録される
- S列に今日の日付が記録される
- カードのステータスが「完了」になる

---

**テストケース2: ステップ⑤完了**
1. リマインダーカードから契約を選択
2. ステップ⑤カードをクリック
3. サイドパネルで「このステップを完了にする」ボタンをクリック
4. 確認モーダルが表示される
5. 「完了する」ボタンをクリック
6. トースト通知が表示される
7. Google Sheetsを開いてJ列とU列に日付が記録されているか確認

**期待結果**:
- J列に今日の日付が記録される
- U列に今日の日付が記録される
- カードのステータスが「完了」になる

---

**テストケース3: ステップ⑨完了（入金確認）**
1. リマインダーカードから契約を選択
2. ステップ⑨カードをクリック
3. サイドパネルで「このステップを完了にする」ボタンをクリック
4. 確認モーダルで以下の情報を確認:
   - 入金実績日（L列）
   - 入金ステータス（M列）: 入金済
   - ステップ9完了日（Y列）
5. 「完了する」ボタンをクリック
6. Google Sheetsを開いて確認

**期待結果**:
- L列に今日の日付が記録される
- M列が「入金済」に更新される
- Y列に今日の日付が記録される
- リマインダーカードが「入金待ち」→「進行中」または「完了」に変わる

---

#### 2. リソースメニュー

**テストケース4: 契約・入金管理シートへのアクセス**
1. ヘッダーの「リソース」ボタンをクリック
2. ドロップダウンメニューが表示される
3. 「📊 契約・入金管理シート」をクリック
4. 新しいタブでGoogle Sheetsが開く

**期待結果**:
- 正しいスプレッドシートが開く
- 「契約・入金管理」シートが表示される

---

#### 3. エラーハンドリング

**テストケース5: 通信エラー**
1. ネットワークをオフラインにする
2. ステップ完了を試みる
3. エラーメッセージが表示される

**期待結果**:
- 「通信エラーが発生しました」というメッセージが表示される
- リトライボタンが表示される

---

**テストケース6: 既に完了済みのステップ**
1. 既に完了しているステップのカードをクリック
2. サイドパネルが開く

**期待結果**:
- 「完了」ボタンが表示されない（既に完了しているため）

---

### 統合テスト

#### テストケース7: 全ステップ完了フロー

1. 新規契約を作成
2. ステップ①〜⑬を順番に完了していく
3. 各ステップ完了後、Google Sheetsを確認
4. 最終的にすべてのステップが完了状態になる
5. リマインダーカードが「完了」になる

**期待結果**:
- すべてのステップが正しく完了する
- Q〜AC列のすべてに日付が記録される
- リマインダーカードが「🟢 完了」になる

---

### レスポンシブテスト

**PC（1920×1080）**:
- 完了ボタンが適切なサイズで表示される
- 確認モーダルが中央に表示される

**タブレット（768×1024）**:
- サイドパネルが適切な幅で表示される
- 完了ボタンが押しやすいサイズ

**モバイル（375×667）**:
- サイドパネルが全幅で表示される
- 完了ボタンが押しやすいサイズ

---

## Phase 2.2への移行

### Phase 2-1完了後の状態

#### 実装済み機能
- ✅ ステップ完了時のスプレッドシート書き込み
- ✅ 全13ステップの自動記録
- ✅ リマインダーカードの自動更新
- ✅ リソースメニューへの契約・入金管理シートリンク追加

#### 未実装機能（Phase 2-2で実装）
- Google Driveフォルダ作成
- ファイルアップロード
- ファイル一覧表示

### Phase 2-2への準備

**必要な環境変数**:
```bash
GOOGLE_DRIVE_FOLDER_ID=<エビデンス保存用ドライブのフォルダID>
```

**必要なGoogle APIスコープ**:
```
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.readonly
```

**サービスアカウント権限**:
- エビデンス保存用ドライブフォルダに対する「編集者」権限

---

## 完了条件

Phase 2-1が完了したと判断する条件:

- [ ] `/api/contract/complete-step` APIが正しく動作する
- [ ] 全13ステップで完了ボタンが表示される
- [ ] 完了ボタンをクリックすると確認モーダルが表示される
- [ ] 完了処理が正しく実行され、スプレッドシートが更新される
- [ ] トースト通知が表示される
- [ ] カードのステータスが「✅ 完了」に更新される
- [ ] リマインダーカードが自動更新される
- [ ] リソースメニューに契約・入金管理シートのリンクが表示される
- [ ] エラーが適切に処理される
- [ ] モバイル・タブレットで正しく表示される

---

## 付録

### A. 列マッピング一覧表

| 列 | 項目名 | 対応するステップ |
|----|--------|-----------------|
| G | 契約書送付 | ステップ② |
| H | 契約書回収 | ステップ③ |
| I | 申込書送付 | ステップ④ |
| J | 申込書回収 | ステップ⑤ |
| L | 入金実績日 | ステップ⑨ |
| M | 入金ステータス | ステップ⑨ |
| Q | ステップ1完了日 | ステップ① |
| R | ステップ2完了日 | ステップ② |
| S | ステップ3完了日 | ステップ③ |
| T | ステップ4完了日 | ステップ④ |
| U | ステップ5完了日 | ステップ⑤ |
| V | ステップ6完了日 | ステップ⑥ |
| W | ステップ7完了日 | ステップ⑦ |
| X | ステップ8完了日 | ステップ⑧ |
| Y | ステップ9完了日 | ステップ⑨ |
| Z | ステップ10完了日 | ステップ⑩ |
| AA | ステップ11完了日 | ステップ⑪ |
| AB | ステップ12完了日 | ステップ⑫ |
| AC | ステップ13完了日 | ステップ⑬ |

---

### B. 環境変数設定

**`.env.local` に追加**:
```bash
# Phase 2-1用
NEXT_PUBLIC_SALES_SPREADSHEET_ID=13PzSnGekGxDWX7B1_TwczNibR6j_JxDb3UuquPX1GyQ

# Phase 2-2用（次のセッション）
GOOGLE_DRIVE_FOLDER_ID=<エビデンス保存用ドライブのフォルダID>
```

---

### C. 参照ドキュメント

1. **Phase 1完全実装計画書**:
   - `docs/workflow/契約業務フロー統合_完全実装計画書.md`

2. **Phase 1.5完全実装計画書**:
   - `docs/workflow/契約業務フロー統合_Phase1.5_完全実装計画書.md`

3. **Phase 1.6完全実装計画書**:
   - `docs/workflow/契約業務フロー統合_Phase1.6_完全実装計画書.md`

4. **開発フロー**:
   - `docs/workflow/契約業務フロー統合_開発フロー.md`

---

**作成日**: 2025年10月12日
**作成者**: Claude Code
**バージョン**: v1.0
**次のステップ**: Phase 2-1の実装を開始

以上
