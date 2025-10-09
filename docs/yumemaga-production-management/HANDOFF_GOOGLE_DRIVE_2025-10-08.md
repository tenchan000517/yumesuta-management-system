# Google Drive連携機能実装 - 引き継ぎドキュメント

**作成日**: 2025-10-08
**前任者**: Claude Code (調査・設計担当)
**次担当者**: 次世代Claude Code (実装担当)
**優先度**: 🔴 高（Phase 8）

---

## 📋 このドキュメントについて

このドキュメントは、**Google Drive連携機能（データ提出機能）の実装**を次世代Claude Codeに引き継ぐためのものです。

**あなたの役割**: 設計通りにGoogle Drive連携機能を実装してください。

---

## 🎯 実装目標

**ゆめマガ制作のデータ提出をシステム化する**

### 現在の課題

```
❌ スタッフがどこにデータを保存すればいいかわからない
❌ ファイル命名規則がバラバラ
❌ データ提出状況が可視化されていない
❌ 提出漏れに気づくのが遅い
```

### 実装後の姿

```
✅ ドラッグ&ドロップで直感的にアップロード
✅ ファイル選択でも効率的に追加可能
✅ Google Drive上で自動的に適切なフォルダに保存
✅ データ提出状況がリアルタイムで可視化
✅ 必須データの未提出が赤色アラートで表示
```

---

## 📚 必読ドキュメント

実装前に**必ず**以下のドキュメントを読んでください：

### 1. 要件定義書（最重要）

**ファイル**: `docs/yumemaga-production-management/DATA_SUBMISSION_REQUIREMENTS.md`

**内容**:
- 現在の実装状況（読み取り専用API完成）
- データ提出管理フロー
- Google Drive連携フロー
- 関連ファイル一覧

### 2. 設計書（最重要）

**ファイル**: `docs/yumemaga-production-management/DATA_SUBMISSION_DESIGN.md`

**内容**:
- Google Driveディレクトリ構造（完全仕様）
- カテゴリ別データ要件
- UI/UX設計
- API設計（エンドポイント・リクエスト・レスポンス）
- 実装優先度

### 3. 進捗報告書

**ファイル**: `docs/yumemaga-production-management/PROGRESS_REPORT.md`

**内容**:
- Phase 0-3完了状況
- Phase 8（データ提出同期）の位置づけ

---

## 🚀 実装フェーズ

### Phase 8.1: 読み取り専用実装（優先）

**工数**: 4-6時間

**目的**: まず安全に、既存のGoogle Driveフォルダからファイルを検出して表示する

#### タスクリスト

- [ ] **Step 1: スプレッドシート準備**
  - [ ] カテゴリマスターにDriveフォルダID列を追加
  - [ ] 各カテゴリのルートフォルダIDを調査・登録
  - [ ] テストフォルダでディレクトリ構造を作成

- [ ] **Step 2: データ提出状況取得API作成**
  - [ ] ファイル作成: `app/api/yumemaga-v2/data-submission/route.ts`
  - [ ] GET実装: `/api/yumemaga-v2/data-submission?issue=2025_11`
  - [ ] カテゴリマスターからDriveフォルダID取得
  - [ ] `listFilesInFolder()` でファイル一覧取得
  - [ ] ファイル種別判定（録音・写真・企画）
  - [ ] ステータス判定（submitted/pending/none）

- [ ] **Step 3: UI統合**
  - [ ] `app/dashboard/yumemaga-v2/page.tsx` 修正
  - [ ] `fetchAllData()` にデータ提出API呼び出し追加
  - [ ] `DataSubmissionSection` にデータ渡し

- [ ] **Step 4: テスト**
  - [ ] Driveフォルダ内のファイルが検出される
  - [ ] 提出ステータスが正しく表示される
  - [ ] 必須データの未提出がアラート表示される

#### 成功基準

- ✅ 既存のDriveフォルダからファイルを検出できる
- ✅ データ提出状況が可視化される
- ✅ 期限超過データが赤色アラートで表示される

---

### Phase 8.2: ファイルアップロード実装（オプション）

**工数**: 6-8時間

**⚠️ 注意**: Phase 8.1が完全に動作確認できてから着手すること

#### タスクリスト

- [ ] **Step 1: Google Drive書き込みスコープ追加**
  - [ ] `lib/google-drive.ts` のスコープ確認
  - [ ] 必要に応じてサービスアカウント権限更新

- [ ] **Step 2: アップロード関数実装**
  - [ ] `lib/google-drive.ts` に以下を追加:
    - `createFolder()` - フォルダ作成
    - `uploadFile()` - ファイルアップロード
    - `ensureDirectory()` - ディレクトリパス解決

- [ ] **Step 3: アップロードAPI作成**
  - [ ] ファイル作成: `app/api/yumemaga-v2/data-submission/upload/route.ts`
  - [ ] POST実装: multipart/form-data対応
  - [ ] ファイル種別自動判定
  - [ ] 適切なディレクトリに保存

- [ ] **Step 4: UI実装**
  - [ ] `DataSubmissionSection.tsx` 修正
  - [ ] `handleFileUpload()` 実装
  - [ ] ドラッグ&ドロップ対応
  - [ ] アップロード進捗表示

- [ ] **Step 5: テスト**
  - [ ] ドラッグ&ドロップでアップロード成功
  - [ ] ファイル選択でアップロード成功
  - [ ] 正しいディレクトリに保存される
  - [ ] アップロード後に提出状況が更新される

---

## 📁 関連ファイル一覧

### 既存ファイル（参考・修正対象）

**ライブラリ**:
- `lib/google-drive.ts` - Google Drive API（読み取り専用）
- `lib/google-sheets.ts` - Google Sheets API（読み書き完全実装）

**API（参考実装）**:
- `app/api/competitive-analysis/route.ts` - **Drive連携の参考実装**
- `app/api/yumemaga-v2/progress/route.ts` - 進捗データ取得
- `app/api/yumemaga-v2/categories/route.ts` - カテゴリマスター取得

**UI**:
- `app/dashboard/yumemaga-v2/page.tsx` - メインダッシュボード（修正対象）
- `components/data-submission/DataSubmissionSection.tsx` - データ提出セクション（修正対象）

### 新規作成ファイル

**API**:
- `app/api/yumemaga-v2/data-submission/route.ts` - **Phase 8.1で作成**
- `app/api/yumemaga-v2/data-submission/upload/route.ts` - **Phase 8.2で作成**

**型定義（必要に応じて）**:
- `types/data-submission.ts` - データ提出関連の型定義

---

## 🔧 実装ガイド

### 1. カテゴリマスターへのフォルダID追加

**スプレッドシート**: カテゴリマスター

**追加列**:
| 列 | 列名 | 説明 | 例 |
|----|------|------|-----|
| H | DriveフォルダID | カテゴリのルートフォルダID | `1a2b3c4d5e6f...` |

**取得方法**:
```
1. Google Driveでカテゴリフォルダを開く
2. URLから ID を取得: https://drive.google.com/drive/folders/[ここがID]
3. カテゴリマスターに手動入力
```

---

### 2. データ提出状況取得API実装例

**ファイル**: `app/api/yumemaga-v2/data-submission/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { listFilesInFolder } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue') || '2025_11';

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. カテゴリマスター取得
    const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:H100');

    const categories = [];

    for (const row of categoryData) {
      if (!row[0]) continue;

      const categoryId = row[0];
      const categoryName = row[1];
      const driveFolderId = row[7]; // H列: DriveフォルダID
      const requiredDataStr = row[4] || ''; // 必要データ

      // 2. 必要データをパース
      const requiredDataTypes = requiredDataStr.split(',').map(d => d.trim());

      const dataTypes = [];

      for (const dataType of requiredDataTypes) {
        let status: 'submitted' | 'pending' | 'none' = 'none';
        const files = [];

        // 3. Driveフォルダからファイル取得
        if (driveFolderId) {
          try {
            // フォルダパス: [categoryId]_[categoryName]/[dataType]/[issue]/
            const folderPath = `${categoryId}_${categoryName}/${dataType}/${issue}/`;
            const driveFiles = await listFilesInFolder(driveFolderId);

            // ファイル種別でフィルタリング
            const matchedFiles = driveFiles.filter(file =>
              matchesDataType(file.name, dataType)
            );

            if (matchedFiles.length > 0) {
              status = 'submitted';
              files.push(...matchedFiles.map(f => ({
                fileName: f.name,
                fileSize: f.size ? parseInt(f.size, 10) : undefined,
                uploadedAt: f.modifiedTime,
                driveFileId: f.id,
                driveUrl: f.webViewLink,
              })));
            } else {
              status = isRequired(dataType) ? 'pending' : 'none';
            }
          } catch (error) {
            console.error(`Failed to fetch files for ${categoryId}/${dataType}:`, error);
          }
        }

        dataTypes.push({
          dataType,
          dataTypeName: dataType,
          status,
          required: isRequired(dataType),
          files,
        });
      }

      categories.push({
        categoryId,
        categoryName,
        dataTypes,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        issue,
        categories,
      },
    });

  } catch (error: any) {
    console.error('Data submission API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ヘルパー関数
function matchesDataType(fileName: string, dataType: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  const lowerDataType = dataType.toLowerCase();

  // 録音データ
  if (lowerDataType.includes('録音')) {
    return /\.(mp3|wav|m4a|aac)$/i.test(fileName);
  }

  // 写真データ
  if (lowerDataType.includes('写真')) {
    return /\.(jpg|jpeg|png|gif|raw)$/i.test(fileName);
  }

  // 企画内容
  if (lowerDataType.includes('企画')) {
    return /\.(docx?|pdf|xlsx?)$/i.test(fileName);
  }

  return false;
}

function isRequired(dataType: string): boolean {
  // 録音データ・写真データは必須
  return dataType.includes('録音') || dataType.includes('写真');
}
```

---

### 3. UI統合実装例

**ファイル**: `app/dashboard/yumemaga-v2/page.tsx`

```typescript
// L41-131: fetchAllData() に追加

const fetchAllData = async () => {
  setLoading(true);
  setError(null);

  try {
    // ... 既存のAPI呼び出し ...

    // 🆕 データ提出状況取得
    const dataSubmissionRes = await fetch(
      `/api/yumemaga-v2/data-submission?issue=${encodeURIComponent(selectedIssue.replace('年', '_').replace('月号', ''))}`
    );
    const dataSubmissionData = await dataSubmissionRes.json();

    if (dataSubmissionData.success) {
      // categoriesにrequiredDataを統合
      const updatedCategories = categories.map(cat => {
        const submission = dataSubmissionData.data.categories.find(
          (c: any) => c.categoryId === cat.id
        );
        return {
          ...cat,
          requiredData: submission?.dataTypes || cat.requiredData,
        };
      });
      setCategories(updatedCategories);
    }

  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 🔍 テスト手順

### Phase 8.1のテスト

**事前準備**:
1. Google Driveでテストフォルダ構造を作成
2. カテゴリマスターにフォルダIDを登録
3. テストファイルをアップロード（手動）

**テスト項目**:
```bash
# 1. API単体テスト
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/data-submission?issue=2025_11" | python3 -m json.tool

# 期待結果: categories配列にファイル情報が含まれる
```

**UI確認**:
1. `npm run dev` でサーバー起動
2. `http://localhost:3000/dashboard/yumemaga-v2` を開く
3. データ提出セクションを確認
4. 提出済みファイルが表示されるか確認
5. 未提出データがアラート表示されるか確認

---

## ⚠️ 注意事項

### セキュリティ

1. **Google Drive API権限**
   - Phase 8.1: 読み取り専用スコープのみ使用
   - Phase 8.2: 書き込みスコープ追加時は慎重に

2. **ファイルアップロード制限**
   - ファイルサイズ上限: 50MB（設定推奨）
   - 許可する拡張子を明示的にチェック

3. **パス検証**
   - アップロード先パスを厳密に検証
   - ユーザー入力を直接パスに使用しない

### エラーハンドリング

1. **Drive APIエラー**
   - フォルダが存在しない
   - 権限がない
   - クォータ超過

2. **ファイルアップロードエラー**
   - ネットワークエラー
   - タイムアウト
   - ファイルサイズ超過

### パフォーマンス

1. **API呼び出しの最適化**
   - 並列処理でフォルダ一覧取得
   - キャッシュ活用（検討）

2. **大量ファイル対応**
   - ページネーション（将来的に）
   - 遅延読み込み

---

## 📊 完成条件

### Phase 8.1完成条件

- [ ] `/api/yumemaga-v2/data-submission` が正常に動作
- [ ] Driveフォルダ内のファイルが検出される
- [ ] 提出ステータスが正しく表示される
- [ ] 必須データの未提出が赤色アラート表示される
- [ ] 全カテゴリ（A, D, K, H, I, L, M）でテスト完了

### Phase 8.2完成条件（オプション）

- [ ] `/api/yumemaga-v2/data-submission/upload` が正常に動作
- [ ] ドラッグ&ドロップでアップロード成功
- [ ] ファイル選択でアップロード成功
- [ ] 正しいディレクトリに保存される
- [ ] アップロード後に提出状況が自動更新される

---

## 🆘 困ったときは

### ドキュメント参照順序

1. `DATA_SUBMISSION_DESIGN.md` - 完全仕様
2. `DATA_SUBMISSION_REQUIREMENTS.md` - 要件・調査結果
3. `PROGRESS_REPORT.md` - 進捗状況
4. `app/api/competitive-analysis/route.ts` - Drive連携の参考実装

### よくある問題

**Q: DriveフォルダIDがわからない**
```
A: Google Driveでフォルダを開き、URLから取得:
https://drive.google.com/drive/folders/[ここがID]
```

**Q: ファイルが検出されない**
```
A:
1. フォルダIDが正しいか確認
2. サービスアカウントに閲覧権限があるか確認
3. フォルダパスが設計書通りか確認
```

**Q: 権限エラーが出る**
```
A:
1. Google Driveでフォルダを共有
2. サービスアカウントのメールアドレスを「閲覧者」として追加
```

---

## ✅ 実装開始前のチェックリスト

実装を始める前に、以下を確認してください：

- [ ] `DATA_SUBMISSION_DESIGN.md` を読んだ
- [ ] `DATA_SUBMISSION_REQUIREMENTS.md` を読んだ
- [ ] `PROGRESS_REPORT.md` でPhase 0-3完了を確認した
- [ ] `lib/google-drive.ts` の既存実装を確認した
- [ ] `app/api/competitive-analysis/route.ts` の参考実装を確認した
- [ ] 開発サーバーが起動する（`npm run dev`）
- [ ] Google Drive APIの認証情報が設定されている
- [ ] テスト用のDriveフォルダを準備した

---

## 🎯 最終目標

**Phase 8.1完了時の状態**:
```
✅ データ提出状況がリアルタイムで可視化される
✅ 必須データの未提出が赤色アラートで表示される
✅ スタッフがどのデータを提出すべきか一目でわかる
✅ 期限超過データがすぐに発見できる
```

**Phase 8.2完了時の状態**:
```
✅ ドラッグ&ドロップで直感的にアップロード
✅ 自動的に適切なフォルダに保存される
✅ アップロード後に提出状況が即座に更新される
✅ データ提出フローが完全に自動化される
```

---

**前任者**: Claude Code
**作成日**: 2025-10-08
**次回更新**: Phase 8.1実装完了時

**引き継ぎ完了。実装を開始してください！**
