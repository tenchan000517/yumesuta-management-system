# データアップロード機能 引き継ぎドキュメント

**作成日**: 2025-10-09
**作成者**: Claude Code (前世代)
**次担当**: 次世代 Claude Code
**ステータス**: 🔴 トラブルシューティング中（Google Drive権限エラー）

---

## 📊 現在の状況

### ✅ 完了した作業

#### 1. UI改善
- ✅ データ提出進捗管理セクションに**独立した月号選択UI**を追加
- ✅ アップロード中のローディング表示（グルグル）を実装
- ✅ 月号ドロップダウンに `(新)` ラベルを表示（既存の月号と新規の月号を区別）

#### 2. 月号管理API
- ✅ `/api/yumemaga-v2/available-issues` - 利用可能な月号を動的に取得
  - Google Driveのカテゴリフォルダをスキャン
  - 存在する月号を検出
  - 向こう3ヶ月分を自動生成
  - 新規月号には `isNew: true` フラグを付与

#### 3. Google Drive API修正
- ✅ すべてのGoogle Drive API呼び出しに `supportsAllDrives: true` を追加
  - `uploadFile` - ファイルアップロード
  - `createFolder` - フォルダ作成
  - `listFilesInFolder` - ファイル一覧取得
  - `findFolderByName` - フォルダ検索
  - `getFileMetadata` - メタデータ取得
  - `folderExists` - フォルダ存在確認
  - `setup-drive-folders` API - フォルダ作成API

#### 4. ファイルアップロード修正
- ✅ `uploadFile`関数を修正してNode.js環境に対応
  - `File` → `ArrayBuffer` → `Buffer` → `Readable Stream` に変換
  - Google Drive APIに正しい形式で渡す

#### 5. Google Driveフォルダ構成
- ✅ 全16カテゴリのフォルダを作成（旧ルートフォルダ）
- ✅ カテゴリマスターのJ列にフォルダIDを自動登録

---

## 🔴 現在のエラー

### エラー内容
```
File not found: 1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY
```

### 原因
**新しいルートフォルダ** `1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY` にサービスアカウントがアクセスできない。

### 背景
1. 当初、サービスアカウントが作成したフォルダでアップロードすると、以下のエラーが発生：
   ```
   Service Accounts do not have storage quota.
   ```

2. これは、サービスアカウントが「所有」しているフォルダだと、サービスアカウント自身のストレージを使おうとするため。

3. **解決策**: ユーザー（`tenchan1341@gmail.com`）が作成したフォルダを使用
   - 新しいルートフォルダID: `1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY`
   - URL: https://drive.google.com/drive/folders/1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY
   - このフォルダにサービスアカウント `yumesuta-sheets-reader@fair-yew-446514-q5.iam.gserviceaccount.com` を「編集者」として追加済み

4. しかし、APIから `File not found` エラーが発生

---

## 🔍 次にやるべきこと

### 優先度: 🔴 最高

#### タスク1: Google Drive権限の詳細調査

**目的**: なぜサービスアカウントが新しいルートフォルダにアクセスできないのか原因を特定

**調査手順**:
1. **権限の確認**
   - Google Driveでフォルダ `1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY` を開く
   - 右クリック → 「共有」 → 共有ユーザーを確認
   - `yumesuta-sheets-reader@fair-yew-446514-q5.iam.gserviceaccount.com` が「編集者」として登録されているか？
   - 登録されていない場合: 追加して数分待つ（権限反映に時間がかかる）

2. **APIテスト**
   - 簡易的なテストAPIを作成して、サービスアカウントがフォルダにアクセスできるか確認
   ```typescript
   // app/api/test-drive-access/route.ts
   import { NextResponse } from 'next/server';
   import { getDriveClient } from '@/lib/google-drive';

   export async function GET() {
     const drive = getDriveClient();
     const folderId = '1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY';

     try {
       const response = await drive.files.get({
         fileId: folderId,
         fields: 'id, name, owners, permissions',
         supportsAllDrives: true,
       });

       return NextResponse.json({
         success: true,
         folder: response.data,
       });
     } catch (error: any) {
       return NextResponse.json({
         success: false,
         error: error.message,
         details: error,
       }, { status: 500 });
     }
   }
   ```

   - ブラウザで `http://localhost:3000/api/test-drive-access` にアクセス
   - エラーメッセージを確認

3. **代替案の検討**
   - もしアクセスできない場合、以下を試す：
     - a) 共有ドライブ（Shared Drive）を使用
     - b) OAuth認証に切り替え
     - c) フォルダの所有権をサービスアカウントに移譲

#### タスク2: フォルダ構成の再構築

**前提**: タスク1で権限問題が解決した場合

**実行コマンド**:
```bash
curl -X POST "http://localhost:3000/api/setup-drive-folders" \
  -H "Content-Type: application/json" \
  -d '{"rootFolderId":"1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY"}'
```

または、ブラウザのコンソールで：
```javascript
fetch('/api/setup-drive-folders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rootFolderId: '1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY' })
}).then(r => r.json()).then(console.log)
```

**期待される結果**:
- 新しいルートフォルダ配下に全16カテゴリのフォルダが作成される
- カテゴリマスターのJ列に新しいフォルダIDが自動登録される
- 成功メッセージ: `✨ すべてのフォルダ処理が完了しました！`

#### タスク3: ファイルアップロードのテスト

**前提**: タスク2が完了した場合

**テスト手順**:
1. ダッシュボードにアクセス: http://localhost:3000/dashboard/yumemaga-v2
2. 「データ提出進捗管理」セクションまでスクロール
3. 月号を選択（例: 2025年11月号）
4. カテゴリモードで以下を選択：
   - カテゴリ: A (メインインタビュー)
   - データ種別: 録音データ
5. テストファイルをアップロード（.mp3 または .wav）
6. 成功メッセージが表示されることを確認
7. Google Driveでファイルが正しくアップロードされたか確認
   - パス: `ルートフォルダ/A_メインインタビュー/録音データ/2025_11/ファイル名`

---

## 📁 重要なファイル

### 新規作成・修正したファイル

1. **`app/api/yumemaga-v2/available-issues/route.ts`** ✅ 新規作成
   - 利用可能な月号を取得するAPI
   - カテゴリAの「録音データ」フォルダをスキャン
   - 向こう3ヶ月分の月号を生成

2. **`lib/google-drive.ts`** ✅ 修正
   - すべてのAPI呼び出しに `supportsAllDrives: true` を追加
   - `uploadFile`関数でFile → Stream変換を実装

3. **`components/data-submission/DataSubmissionSection.tsx`** ✅ 修正
   - 独立した月号選択UIを追加
   - ローディング表示（グルグル）を実装
   - `availableIssues` propsの型を `IssueOption[]` に変更

4. **`app/dashboard/yumemaga-v2/page.tsx`** ✅ 修正
   - `issues`ステートの型を `Array<{ issue: string; isNew: boolean }>` に変更
   - 月号取得APIを呼び出すuseEffectを追加
   - `DataSubmissionSection`に正しいpropsを渡す

5. **`app/api/setup-drive-folders/route.ts`** ✅ 修正
   - `drive.files.get`に `supportsAllDrives: true` を追加
   - 既存フォルダをスキップするロジックを追加

### 環境変数

- `GOOGLE_SERVICE_ACCOUNT_KEY` - サービスアカウントの認証情報（JSON）
- サービスアカウントメールアドレス: `yumesuta-sheets-reader@fair-yew-446514-q5.iam.gserviceaccount.com`

### Google Drive構成

#### 旧ルートフォルダ（サービスアカウント所有）
- **ID**: `1rCICl_DzYP_X6SvMV46iiHiv-pffy4Ls`
- **URL**: https://drive.google.com/drive/folders/1rCICl_DzYP_X6SvMV46iiHiv-pffy4Ls
- **問題**: ストレージ容量エラー
- **ステータス**: ❌ 使用不可

#### 新ルートフォルダ（ユーザー所有）
- **ID**: `1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY`
- **URL**: https://drive.google.com/drive/folders/1kxpgg_NCL8RQdNRN7z0FrFrABE8sSyiY
- **所有者**: `tenchan1341@gmail.com`
- **共有**: サービスアカウントに「編集者」権限付与済み（のはず）
- **ステータス**: ⏳ アクセスエラー調査中

#### カテゴリマスター
- **スプレッドシートID**: `1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw`
- **シート名**: `カテゴリマスター`
- **J列**: DriveフォルダID（現在は旧フォルダIDが登録されている）

---

## 🎯 最終目標

### Phase 8.2: ファイルアップロード機能（完了待ち）

**完了条件**:
- ✅ UIからファイルをアップロードできる
- ✅ Google Drive上に正しいディレクトリ構造でファイルが保存される
- ✅ カテゴリモード・企業モードの両方が動作する
- ✅ 複数ファイルの同時アップロードが可能
- ✅ ローディング表示が正しく動作する
- ⏳ **権限エラーが解決されている** ← 現在ここ

### Phase 8.3: データ提出状況の可視化（次のフェーズ）

**タスク**:
1. `GET /api/yumemaga-v2/data-submission?issue=2025_11` 実装
2. Google Driveから既存ファイルを検出
3. データ提出状況を判定（submitted/pending/none）
4. UIに反映（カテゴリカードに提出済みファイル一覧を表示）

---

## 💡 トラブルシューティングのヒント

### 権限エラーが解決しない場合

**オプション1: 共有ドライブを使用**
- Google Workspace（有料）が必要
- 共有ドライブを作成してサービスアカウントをメンバーに追加
- ストレージ容量の問題が完全に解決

**オプション2: OAuth認証に切り替え**
- サービスアカウントではなく、ユーザー認証を使用
- より複雑だが、権限問題が発生しにくい
- 参考: https://developers.google.com/drive/api/guides/about-auth

**オプション3: フォルダの所有権を移譲**
- Google Drive APIで所有権を変更できる可能性あり
- ただし、個人アカウント間では制限がある

### デバッグ方法

**Google Drive APIのレスポンスを詳細に確認**:
```typescript
try {
  const response = await drive.files.get({
    fileId: folderId,
    fields: '*', // すべてのフィールドを取得
    supportsAllDrives: true,
  });
  console.log('Full response:', JSON.stringify(response.data, null, 2));
} catch (error: any) {
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    errors: error.errors,
    response: error.response?.data,
  });
}
```

---

## 📝 参考ドキュメント

- `docs/yumemaga-production-management/DATA_UPLOAD_IMPLEMENTATION_PLAN.md` - 完全実装計画書
- `docs/yumemaga-production-management/DATA_UPLOAD_IMPLEMENTATION_STATUS.md` - 実装完了報告書（Phase 8.2）
- Google Drive API: https://developers.google.com/drive/api/guides/about-sdk
- Shared Drives: https://developers.google.com/workspace/drive/api/guides/about-shareddrives

---

## 🚀 次世代Claude Codeへのメッセージ

権限エラーの調査から始めてください。タスク1の手順に従って、以下を確認してください：

1. Google Driveで共有設定を確認
2. テストAPIを作成して詳細なエラー情報を取得
3. エラーメッセージに基づいて解決策を実施
4. フォルダ構成を再構築
5. ファイルアップロードをテスト

権限問題が解決すれば、残りの実装はすべて完了しています！

**頑張ってください！** 🎉

---

**最終更新**: 2025-10-09 15:30
**実装者**: Claude Code (前世代)
**次担当**: 次世代 Claude Code
**ステータス**: 🔴 権限エラー調査中
