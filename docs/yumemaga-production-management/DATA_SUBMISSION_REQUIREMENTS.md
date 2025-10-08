# データ提出・Google Drive連携 要件定義書

**作成日**: 2025-10-08
**ステータス**: 調査完了・実装準備中
**対象フェーズ**: Phase 2完了確認、Phase 8（データ提出同期）実装

---

## 📊 調査結果サマリー

### ✅ 実装済み機能

#### 1. Google Sheets読み書き機能（Phase 2完了）

**ファイル**: `lib/google-sheets.ts`

**実装済みメソッド**:
- `getSheetData(spreadsheetId, range)` - データ読み取り
- `updateSheetData(spreadsheetId, range, values)` - データ更新（上書き）
- `updateCell(spreadsheetId, sheetName, row, col, value)` - セル更新
- `updateCellExtended()` - 多文字列カラム対応セル更新（AA, AX等）
- `appendSheetData(spreadsheetId, sheetName, values)` - 行追加
- `insertColumns()` - 列挿入
- `deleteColumns()` - 列削除
- `deleteRows()` - 行削除

**認証スコープ**: `https://www.googleapis.com/auth/spreadsheets`（読み書き可能）

**結論**: ✅ **Phase 2（スプレッドシート書き込み）は完全実装済み**

---

#### 2. Google Drive API連携（読み取り専用）

**ファイル**: `lib/google-drive.ts`

**実装済みメソッド**:
- `getDriveClient()` - Drive APIクライアント取得
- `listFilesInFolder(folderId)` - フォルダ内ファイル一覧取得
- `getFileMetadata(fileId)` - ファイルメタデータ取得
- `folderExists(folderId)` - フォルダ存在確認

**認証スコープ**:
- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/drive.metadata.readonly`

**制限**: ✅ 読み取り専用（アップロード機能なし）

---

#### 3. Google Drive連携の参考実装

**ファイル**: `app/api/competitive-analysis/route.ts`

**実装内容**:
- スプレッドシートの「競合分析」シートからフォルダIDを取得
- 各競合企業のDriveフォルダから資料一覧を取得
- ファイルメタデータ（名前、URL、サイズ、更新日時、アイコン）を返却

**実装パターン**:
```typescript
// 1. スプレッドシートからフォルダID取得
const [companyName, category, linkName, url, notes, displayOrderStr, driveFolderId] = row;

// 2. フォルダ内ファイル取得
if (competitor.driveFolderId) {
  const files = await listFilesInFolder(competitor.driveFolderId);
  competitor.documents = files.map((file: any) => ({
    name: file.name || '',
    id: file.id || '',
    webViewLink: file.webViewLink || '',
    mimeType: file.mimeType || '',
    size: file.size ? parseInt(file.size, 10) : undefined,
    modifiedTime: file.modifiedTime,
  }));
}
```

**環境変数**: `COMPETITIVE_ANALYSIS_SPREADSHEET_ID`

---

#### 4. データ提出UI（バックエンド未接続）

**ファイル**:
- `app/dashboard/yumemaga-v2/page.tsx`
- `components/data-submission/DataSubmissionSection.tsx`

**実装済み機能**:
- カテゴリ別データ提出状況の表示UI
- ファイルアップロードエリア（D&D対応UI）
- 全体進捗バー
- 提出ステータス管理（submitted/pending/none）

**未実装機能**:
```typescript
// L436-441: ファイルアップロードハンドラー（アラートのみ）
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files) {
    alert(`${files.length}件のファイルをアップロードします（バックエンド未実装）`);
  }
};

// L443-445: Driveフォルダオープンハンドラー（アラートのみ）
const handleOpenDrive = (categoryId: string) => {
  alert(`Googleドライブ: /ゆめマガ/${selectedIssue}/カテゴリ${categoryId}/ を開きます（バックエンド未実装）`);
};
```

---

## 📋 要件定義（REQUIREMENTS.mdより）

### データ提出管理フロー

**必要データ**:
- 録音データ（必須）
- 文字起こし（任意）
- 写真画像（必須）

**ステータス**:
- `submitted`: 提出済み ✅
- `pending`: 未提出 ⚠️
- `none`: 任意データで未提出 －

**アラート条件**:
```
必須データ AND status === 'pending' = 期限超過アラート（赤表示）
```

---

### Google Drive連携フロー

**フォルダ構造** (REQUIREMENTS.md L213-225):
```
/ゆめマガ/
  └ 2025年11月号/
      ├ カテゴリA/
      │   ├ 録音データ/
      │   ├ 文字起こし/
      │   └ 写真画像/
      ├ カテゴリK/
      │   ├ 録音データ/
      │   ├ 文字起こし/
      │   └ 写真画像/
      └ ...
```

**アップロード手順**:
1. カテゴリ選択
2. ファイル選択 or D&D
3. Google Drive APIでアップロード
4. スプレッドシートのステータスを`submitted`に更新

---

## 🗂️ 関連ファイル一覧

### ライブラリ
- `lib/google-sheets.ts` - Google Sheets API（読み書き完全実装）
- `lib/google-drive.ts` - Google Drive API（読み取り専用）

### API
- `app/api/competitive-analysis/route.ts` - **参考実装**（Drive連携）
- `app/api/yumemaga-v2/progress/route.ts` - 進捗データ取得
- `app/api/yumemaga-v2/categories/route.ts` - カテゴリマスター取得
- ❌ `app/api/yumemaga-v2/data-submission/route.ts` - **未実装**

### UI
- `app/dashboard/yumemaga-v2/page.tsx` - メインダッシュボード
- `components/data-submission/DataSubmissionSection.tsx` - データ提出セクション

### 型定義
- `types/competitive-analysis.ts` - 競合分析型定義（Drive連携参考）

### ドキュメント
- `docs/yumemaga-production-management/REQUIREMENTS.md` - 要件定義書
- `docs/requirements/requirements-definition.md` - 統合要件定義書
- `docs/yumemaga-production-management/PROGRESS_REPORT.md` - 進捗報告

### スプレッドシート
- `カテゴリマスター` - カテゴリ基本情報（必要データ列含む）
- `新工程マスター` - 工程情報（必要データ列含む）
- `進捗入力シート` - 実績管理

---

## 🎯 実装すべき機能

### Phase 8: データ提出同期機能

#### 1. スプレッドシート設計

**カテゴリマスター拡張** または **新規シート「データ提出管理マスター」作成**:

| 列 | 列名 | 説明 | 例 |
|----|------|------|-----|
| A | カテゴリID | カテゴリID | `A` |
| B | カテゴリ名 | カテゴリ名 | `メインインタビュー` |
| C | 月号 | 対象月号 | `2025年11月号` |
| D | DriveフォルダID | Google DriveフォルダID | `1abc...xyz` |
| E | 録音データステータス | submitted/pending/none | `submitted` |
| F | 文字起こしステータス | submitted/pending/none | `none` |
| G | 写真画像ステータス | submitted/pending/none | `submitted` |
| H | 最終同期日時 | 最後に同期した日時 | `2025-10-08 14:30` |

**または、カテゴリマスターにフォルダID列のみ追加**:

| 既存列 | ... | 新規列H | 新規列I |
|--------|-----|---------|---------|
| ステータス | ... | DriveフォルダID | 月号別フォルダID（JSON） |

---

#### 2. API実装

**ファイル**: `app/api/yumemaga-v2/data-submission/route.ts`

**GET**: データ提出状況取得

**リクエスト**:
```
GET /api/yumemaga-v2/data-submission?issue=2025年11月号
```

**レスポンス**:
```typescript
{
  success: true,
  categories: [
    {
      id: "A",
      name: "メインインタビュー",
      driveFolderId: "1abc...xyz",
      requiredData: [
        {
          type: "audio",
          name: "録音データ",
          status: "submitted",
          deadline: "9/28",
          optional: false,
          files: [
            { name: "interview_20250920.mp3", url: "https://...", modifiedTime: "..." }
          ]
        },
        {
          type: "document",
          name: "文字起こし",
          status: "none",
          deadline: "9/29",
          optional: true,
          files: []
        },
        {
          type: "image",
          name: "写真画像",
          status: "submitted",
          deadline: "9/28",
          optional: false,
          files: [
            { name: "photo1.jpg", url: "https://...", modifiedTime: "..." }
          ]
        }
      ]
    },
    // ... 他のカテゴリ
  ]
}
```

**実装ロジック**:
1. カテゴリマスターから全カテゴリ + DriveフォルダIDを取得
2. 各カテゴリの「必要データ」を取得（カンマ区切り）
3. DriveフォルダIDが存在する場合:
   - `listFilesInFolder(folderId)` でファイル一覧取得
   - ファイル名から必要データ種別を判定
     - 録音データ: `.mp3`, `.wav`, `.m4a`
     - 文字起こし: `.txt`, `.docx`, `.pdf`（"文字起こし"含む）
     - 写真画像: `.jpg`, `.jpeg`, `.png`
4. ファイルが存在 → `submitted`、なし → `pending` or `none`
5. スプレッドシートにステータス書き込み（オプション）

---

#### 3. 環境変数設定

**追加が必要な環境変数**:
```bash
# 既存（確認済み）
YUMEMAGA_SPREADSHEET_ID=1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw

# 新規追加（必要に応じて）
YUMEMAGA_DRIVE_ROOT_FOLDER_ID=<ゆめマガルートフォルダのID>
```

**注**: カテゴリ別フォルダIDはスプレッドシートで管理する方が柔軟性が高い

---

#### 4. UI統合

**修正ファイル**: `app/dashboard/yumemaga-v2/page.tsx`

**変更内容**:
```typescript
// L41-131: fetchAllData() に追加
const dataSubmissionRes = await fetch(`/api/yumemaga-v2/data-submission?issue=${encodeURIComponent(selectedIssue)}`);
const dataSubmissionData = await dataSubmissionRes.json();
if (dataSubmissionData.success) {
  // categoriesに requiredData を統合
  const updatedCategories = categories.map(cat => {
    const submission = dataSubmissionData.categories.find((c: any) => c.id === cat.id);
    return {
      ...cat,
      requiredData: submission?.requiredData || cat.requiredData,
    };
  });
  setCategories(updatedCategories);
}
```

**handleFileUpload() の実装**:
- ファイルアップロード機能は Phase 9（オプション）
- Phase 8では読み取り専用（Drive内ファイルの自動検出のみ）

---

## 🚀 実装フェーズ

### Phase 8.1: 読み取り専用実装（優先）

**工数**: 4時間

**タスク**:
1. [ ] カテゴリマスターにDriveフォルダID列を追加（手動 or GAS）
2. [ ] `/api/yumemaga-v2/data-submission/route.ts` 作成
3. [ ] データ提出状況取得ロジック実装
4. [ ] UI統合（fetchAllData修正）
5. [ ] テスト・動作確認

**成功基準**:
- ✅ Driveフォルダ内のファイルが検出される
- ✅ 提出ステータスが正しく表示される
- ✅ 必須データの未提出がアラート表示される

---

### Phase 8.2: ファイルアップロード実装（オプション）

**工数**: 6時間

**前提条件**:
- Google Drive API の書き込みスコープ追加が必要
- `lib/google-drive.ts` に `uploadFile()` メソッド追加

**タスク**:
1. [ ] Drive API書き込みスコープ追加
2. [ ] `uploadFile()` メソッド実装
3. [ ] `/api/yumemaga-v2/file-upload/route.ts` 作成（POST）
4. [ ] `handleFileUpload()` 実装
5. [ ] アップロード後の自動同期
6. [ ] テスト・動作確認

**スコープ外（MVP）**:
- ❌ ファイルアップロード（Phase 8.2で実装予定）
- ❌ 自動ポーリング（Phase 2以降）
- ❌ アップロード進捗表示

---

## 📝 技術的考慮事項

### フォルダ構造の管理方法

**オプション1: 月号別ルートフォルダ**
```
/ゆめマガ/
  ├ 2025年10月号/
  │   ├ カテゴリA/
  │   └ カテゴリK/
  └ 2025年11月号/
      ├ カテゴリA/
      └ カテゴリK/
```
- メリット: 月号ごとにデータ分離
- デメリット: フォルダID管理が複雑（月号×カテゴリ）

**オプション2: カテゴリ別ルートフォルダ**
```
/ゆめマガ/
  ├ カテゴリA/
  │   ├ 2025年10月号/
  │   └ 2025年11月号/
  └ カテゴリK/
      ├ 2025年10月号/
      └ 2025年11月号/
```
- メリット: カテゴリ固定でフォルダID管理簡単
- デメリット: 月号跨ぎの管理が必要

**推奨**: オプション1（月号別ルート）
- 理由: ゆめマガは月号単位で作業が独立
- 実装: スプレッドシートに「月号」「カテゴリID」「フォルダID」を保存

---

### ファイル種別判定ロジック

**拡張子ベース判定**:
```typescript
function detectDataType(fileName: string): 'audio' | 'document' | 'image' | 'unknown' {
  const ext = fileName.toLowerCase().split('.').pop();

  if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) return 'audio';
  if (['txt', 'docx', 'pdf', 'doc'].includes(ext)) return 'document';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';

  return 'unknown';
}
```

**ファイル名パターン判定**:
```typescript
function matchRequiredData(fileName: string, requiredDataName: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  const lowerRequired = requiredDataName.toLowerCase();

  // 録音データ: "録音"または"audio"を含む
  if (lowerRequired.includes('録音') || lowerRequired.includes('audio')) {
    return lowerFileName.includes('録音') || lowerFileName.includes('audio') || lowerFileName.includes('interview');
  }

  // 文字起こし: "文字起こし"または"transcript"を含む
  if (lowerRequired.includes('文字起こし') || lowerRequired.includes('transcript')) {
    return lowerFileName.includes('文字起こし') || lowerFileName.includes('transcript');
  }

  // 写真画像: 画像拡張子のみ
  if (lowerRequired.includes('写真') || lowerRequired.includes('画像') || lowerRequired.includes('image')) {
    return detectDataType(fileName) === 'image';
  }

  return false;
}
```

---

## 🔒 セキュリティ・権限

### Google Drive API権限

**現在**:
- `https://www.googleapis.com/auth/drive.readonly` - 読み取り専用
- `https://www.googleapis.com/auth/drive.metadata.readonly` - メタデータ読み取り

**Phase 8.2で追加が必要**:
- `https://www.googleapis.com/auth/drive.file` - アップロードしたファイルのみ管理
- または `https://www.googleapis.com/auth/drive` - フルアクセス（非推奨）

### サービスアカウント権限

**必要な権限**:
- Driveフォルダへの「編集者」権限（アップロード時）
- または「閲覧者」権限（読み取りのみ）

**設定方法**:
1. Google Driveで対象フォルダを開く
2. 「共有」→ サービスアカウントのメールアドレスを追加
3. 権限: 「閲覧者」（Phase 8.1）または「編集者」（Phase 8.2）

---

## ✅ 次のアクション

### 実装開始前の確認事項

1. **フォルダ構造の決定**
   - [ ] ユーザーと相談してフォルダ構造を確定
   - [ ] ルートフォルダIDを取得

2. **スプレッドシート設計**
   - [ ] カテゴリマスターにフォルダID列を追加するか
   - [ ] 別シート「データ提出管理マスター」を作成するか

3. **実装スコープの確認**
   - [ ] Phase 8.1（読み取りのみ）から開始するか
   - [ ] Phase 8.2（アップロード）まで一気に実装するか

---

**最終更新**: 2025-10-08
**次のステップ**: ユーザーと要件確認後、Phase 8.1実装開始
