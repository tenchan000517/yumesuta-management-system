# Google Drive詳細調査レポート

**作成日**: 2025年10月11日
**作成者**: Claude Code
**目的**: 契約業務フロー統合の実装に必要な、Google Driveの詳細仕様を調査・記録する

---

## 📋 調査対象

### エビデンス保存用Google Drive

**フォルダID**: `1blH8qUUd_TLW_nznN5wozwn-vXGFMZ3q`
**URL**: https://drive.google.com/drive/folders/1blH8qUUd_TLW_nznN5wozwn-vXGFMZ3q
**用途**: 契約書、請求書等のエビデンス保存
**現状**: 空フォルダ（システムに権限付与済み）

---

## 🏗️ フォルダ構造の詳細設計

### 階層構造

```
エビデンス保存用ドライブ（ルート）/
├── 信藤建設/
│   ├── 契約01_2025年12月号/
│   │   ├── 広告掲載基本契約書_信藤建設_20251009.pdf
│   │   ├── 広告掲載申込書_信藤建設_20251009.pdf
│   │   ├── 請求書_信藤建設_20251015.pdf
│   │   ├── メール送信記録_20251009.png
│   │   └── 契約書回収確認_20251025.png
│   └── 契約02_2026年6月号/
│       └── ...
├── 株式会社ABC/
│   └── 契約01_2025年11月号/
│       └── ...
└── 株式会社XYZ/
    └── ...
```

### 階層レベルの詳細

#### レベル1: 企業フォルダ

**目的**: 企業ごとにエビデンスを分類
**親フォルダ**: ルートフォルダ（`1blH8qUUd_TLW_nznN5wozwn-vXGFMZ3q`）

**命名規則**:
```
形式: {企業名}
例: 信藤建設
例: 株式会社ゆめスタ
例: 株式会社ABC
```

**作成タイミング**: 初回契約時（ステップ①完了時）

**Google Drive API操作**:
```typescript
// フォルダ作成
const metadata = {
  name: '信藤建設',
  mimeType: 'application/vnd.google-apps.folder',
  parents: ['1blH8qUUd_TLW_nznN5wozwn-vXGFMZ3q']
};
```

---

#### レベル2: 契約フォルダ

**目的**: 契約内容ごとにエビデンスを分類
**親フォルダ**: 企業フォルダ

**命名規則**:
```
形式: 契約{連番}_{掲載開始号}
例: 契約01_2025年12月号
例: 契約02_2026年6月号
例: 契約03_2026年1月号
```

**連番のルール**:
- 企業ごとに01から連番
- 再契約の場合も連番を増やす
- 連番は2桁（01, 02, 03...）

**作成タイミング**: 契約成立時（ステップ⑦完了時）

**Google Drive API操作**:
```typescript
// 契約フォルダ作成
const metadata = {
  name: '契約01_2025年12月号',
  mimeType: 'application/vnd.google-apps.folder',
  parents: [companyFolderId]  // 企業フォルダのID
};
```

---

#### レベル3: ファイル

**目的**: 各種エビデンスファイルの保存
**親フォルダ**: 契約フォルダ

---

## 📁 ファイル命名規則の詳細

### 1. 広告掲載基本契約書

**形式**: `広告掲載基本契約書_{企業名}_{契約日}.pdf`
**例**: `広告掲載基本契約書_信藤建設_20251009.pdf`
**作成タイミング**: ステップ③完了時
**保存先**: 契約フォルダ

**契約日フォーマット**:
- `YYYYMMDD`形式（例: `20251009`）
- スラッシュやハイフンなし

---

### 2. 広告掲載申込書兼個別契約書

**形式**: `広告掲載申込書_{企業名}_{契約日}.pdf`
**例**: `広告掲載申込書_信藤建設_20251009.pdf`
**作成タイミング**: ステップ⑤完了時
**保存先**: 契約フォルダ

---

### 3. 請求書

**形式**: `請求書_{企業名}_{発行日}.pdf`
**例**: `請求書_信藤建設_20251015.pdf`
**作成タイミング**: ステップ⑧完了時
**保存先**: 契約フォルダ

---

### 4. エビデンスファイル（スクリーンショット等）

**形式**: `{エビデンス種別}_{日付}.{拡張子}`

**エビデンス種別の例**:
- `メール送信記録`: ステップ③⑤のメール送信時
- `契約書回収確認`: ステップ⑦の契約完了時
- `入金確認`: ステップ⑨の入金確認時
- `原稿依頼メール`: ステップ⑪の原稿依頼時
- `校正完了`: ステップ⑫の校正完了時

**例**:
- `メール送信記録_20251009.png`
- `契約書回収確認_20251025.png`
- `入金確認_20251110.png`

**作成タイミング**: 各ステップ完了時
**保存先**: 契約フォルダ

**拡張子**:
- スクリーンショット: `.png`, `.jpg`
- PDF: `.pdf`

---

## 🔐 権限設定

### 現在の権限状態

**システムアカウント**: 読み取り・書き込み権限付与済み
**サービスアカウント**: Google Sheets APIと同じサービスアカウントを使用
**環境変数**: `GOOGLE_SERVICE_ACCOUNT_KEY`

### フォルダ・ファイルの権限

**デフォルト権限**:
- サービスアカウント: Owner（すべての権限）
- その他: 権限なし

**Phase 2以降の拡張**:
- 特定のユーザーに閲覧権限を付与する機能（オプション）

---

## 📊 Google Drive API の実装設計

### Phase 1（MVP）の方針

**Phase 1では実装なし**:
- Google Driveへのアップロード機能なし
- Google Driveファイル一覧の取得なし
- フォルダ作成機能なし

**Phase 1の表示**:
- 「Phase 2で実装予定」のメッセージのみ表示
- または、Google DriveセクションをPhase 1では非表示

---

### Phase 2以降の実装設計

#### 1. フォルダ作成API

**エンドポイント**: `/api/drive/create-folder`
**メソッド**: `POST`

**リクエストBody**:
```typescript
{
  folderName: string;     // フォルダ名
  parentFolderId: string; // 親フォルダID
}
```

**レスポンス**:
```typescript
{
  success: boolean;
  folderId?: string;      // 作成したフォルダのID
  error?: string;
}
```

**実装ロジック**:
```typescript
import { google } from 'googleapis';

async function createFolder(folderName: string, parentFolderId: string) {
  const drive = google.drive({ version: 'v3', auth });

  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId]
  };

  const response = await drive.files.create({
    requestBody: metadata,
    fields: 'id, name'
  });

  return response.data.id;
}
```

---

#### 2. ファイルアップロードAPI

**エンドポイント**: `/api/drive/upload`
**メソッド**: `POST`
**Content-Type**: `multipart/form-data`

**リクエストBody**:
```typescript
{
  file: File;             // アップロードするファイル
  fileName: string;       // ファイル名（命名規則に従う）
  parentFolderId: string; // 保存先フォルダID
  mimeType: string;       // MIMEタイプ（例: application/pdf）
}
```

**レスポンス**:
```typescript
{
  success: boolean;
  fileId?: string;        // アップロードしたファイルのID
  webViewLink?: string;   // ファイルのURL
  error?: string;
}
```

**実装ロジック**:
```typescript
import { google } from 'googleapis';
import fs from 'fs';

async function uploadFile(
  filePath: string,
  fileName: string,
  parentFolderId: string,
  mimeType: string
) {
  const drive = google.drive({ version: 'v3', auth });

  const metadata = {
    name: fileName,
    parents: [parentFolderId]
  };

  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath)
  };

  const response = await drive.files.create({
    requestBody: metadata,
    media: media,
    fields: 'id, name, webViewLink'
  });

  return response.data;
}
```

---

#### 3. ファイル一覧取得API

**エンドポイント**: `/api/drive/files`
**メソッド**: `GET`

**クエリパラメータ**:
```typescript
{
  folderId: string;  // 取得対象フォルダID
}
```

**レスポンス**:
```typescript
{
  success: boolean;
  files?: DriveFile[];
  error?: string;
}
```

**`DriveFile`型定義**:
```typescript
export interface DriveFile {
  id: string;             // ファイルID
  name: string;           // ファイル名
  mimeType: string;       // MIMEタイプ
  webViewLink: string;    // 閲覧用URL
  createdTime: string;    // 作成日時（ISO 8601形式）
}
```

**実装ロジック**:
```typescript
import { google } from 'googleapis';

async function listFiles(folderId: string) {
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, webViewLink, createdTime)',
    orderBy: 'createdTime desc'
  });

  return response.data.files;
}
```

---

## 🔄 契約業務フローとの連動

### 各ステップでのフォルダ・ファイル操作

| ステップ | タイトル | Drive操作 | 作成対象 |
|---------|---------|----------|---------|
| ① | 情報収集 | フォルダ作成 | 企業フォルダ（初回契約時のみ） |
| ② | 基本契約書作成 | - | - |
| ③ | 基本契約書の押印・送信 | ファイルアップロード | 基本契約書PDF、メール送信記録 |
| ④ | 申込書作成 | - | - |
| ⑤ | 申込書の押印・送信 | ファイルアップロード | 申込書PDF、メール送信記録 |
| ⑥ | 重要事項説明（任意） | - | - |
| ⑦ | 契約完了確認 | フォルダ作成、ファイルアップロード | 契約フォルダ、契約書回収確認 |
| ⑧ | 請求書作成・送付 | ファイルアップロード | 請求書PDF |
| ⑨ | 入金確認 | ファイルアップロード（オプション） | 入金確認スクリーンショット |
| ⑩ | 入金管理シート更新 | - | - |
| ⑪ | 入金確認連絡・原稿依頼 | ファイルアップロード（オプション） | 原稿依頼メール記録 |
| ⑫ | 制作・校正 | ファイルアップロード（オプション） | 校正完了確認 |
| ⑬ | 掲載 | - | - |

---

## 📋 実装時の注意事項

### フォルダ作成の順序

1. **企業フォルダ**: 初回契約時に作成
   - 既存チェック: 同名フォルダが存在しないか確認
   - 存在する場合はフォルダIDを取得して再利用

2. **契約フォルダ**: 契約成立時（ステップ⑦）に作成
   - 企業フォルダ内の既存契約フォルダ数を確認
   - 連番を決定（01, 02, 03...）
   - フォルダ名を生成（例: `契約01_2025年12月号`）

### ファイル名の生成

**実装例**:

```typescript
// 契約書ファイル名生成
function generateContractFileName(
  companyName: string,
  contractDate: string // YYYY/MM/DD形式
): string {
  const dateStr = contractDate.replace(/\//g, ''); // YYYYMMDDに変換
  return `広告掲載基本契約書_${companyName}_${dateStr}.pdf`;
}

// 申込書ファイル名生成
function generateApplicationFileName(
  companyName: string,
  contractDate: string
): string {
  const dateStr = contractDate.replace(/\//g, '');
  return `広告掲載申込書_${companyName}_${dateStr}.pdf`;
}

// 請求書ファイル名生成
function generateInvoiceFileName(
  companyName: string,
  issueDate: string
): string {
  const dateStr = issueDate.replace(/\//g, '');
  return `請求書_${companyName}_${dateStr}.pdf`;
}

// エビデンスファイル名生成
function generateEvidenceFileName(
  evidenceType: string,
  date: string
): string {
  const dateStr = date.replace(/\//g, '');
  return `${evidenceType}_${dateStr}.png`;
}
```

### エラーハンドリング

**考慮すべきエラー**:
- フォルダ作成失敗（権限エラー、親フォルダが存在しない等）
- ファイルアップロード失敗（ファイルサイズ制限、権限エラー等）
- ファイル一覧取得失敗（フォルダが存在しない等）

**実装方針**:
- すべてのエラーをキャッチし、ユーザーにわかりやすいエラーメッセージを表示
- エラー発生時も契約業務フローは継続可能（Google Drive連動は補助機能として扱う）

---

## 📚 参照ドキュメント

### 必読

1. **Google Drive構造調査レポート.md**（フェーズ2成果物）
   - フォルダ構造の概要
   - 命名規則の基本方針

2. **実装草案.md**（フェーズ3成果物）
   - UI/UX設計
   - Phase 1・Phase 2の実装範囲

3. **契約書作成_業務フローガイド.md**
   - 13ステップの詳細手順
   - エビデンス保存のタイミング

### 参考

- Google Drive API公式ドキュメント: https://developers.google.com/drive/api/v3/about-sdk

---

## ✅ 調査完了事項

- ✅ フォルダ階層構造の詳細設計を完了
- ✅ ファイル命名規則の詳細仕様を策定
- ✅ Google Drive API の実装設計を策定
- ✅ 契約業務フローとの連動方法を明確化
- ✅ Phase 1・Phase 2の実装範囲を明確化
- ✅ エラーハンドリング方針を策定

---

## 🎯 Phase 2実装時のチェックリスト

Phase 2でGoogle Drive連動を実装する際は、以下を確認してください:

- [ ] 企業フォルダ作成API（`/api/drive/create-folder`）を実装
- [ ] 契約フォルダ作成API（同上）を実装
- [ ] ファイルアップロードAPI（`/api/drive/upload`）を実装
- [ ] ファイル一覧取得API（`/api/drive/files`）を実装
- [ ] フォルダ作成の順序チェック（企業フォルダ→契約フォルダ）を実装
- [ ] 既存フォルダの重複チェックを実装
- [ ] ファイル名生成関数を実装
- [ ] エラーハンドリングを実装
- [ ] `DriveFilesList`コンポーネントを実装
- [ ] 各ステップからのDrive連動を実装

---

**調査完了日**: 2025年10月11日
**調査者**: Claude Code
**次の作業**: 開発フローの進捗状況を更新し、フェーズ4完了報告

以上
