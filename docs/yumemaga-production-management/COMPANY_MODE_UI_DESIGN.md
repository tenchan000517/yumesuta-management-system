# 企業モードUI設計書 - 次世代Claude Code引き継ぎ

**作成日**: 2025-10-09
**作成者**: Claude Code (前世代)
**次担当**: 次世代 Claude Code
**状態**: 設計確定、実装未着手

---

## 📋 このドキュメントの目的

データ提出進捗管理UIの**企業モード**実装について、設計思想と実装要件を明確に定義します。

**重要**: このドキュメントはユーザーとの詳細な議論を経て確定した設計です。安易に変更せず、疑問があればユーザーに確認してください。

---

## 🎯 企業モードとは

### カテゴリモードとの違い

| 項目 | カテゴリモード | 企業モード |
|------|--------------|-----------|
| 対象 | A, D, K, L, M などのカテゴリ | **企業データ（全企業）** |
| 概念 | **制作工程の分類** | **企業という別軸** |
| 月号 | ✅ 必須 (`/カテゴリ/データ種別/2025_11/`) | ❌ なし (`/企業名/フォルダ種別/`) |
| 選択UI | カテゴリ選択 + 月号選択 | 既存/新規切り替え + 企業選択/入力 |
| 用途 | 月号ごとのコンテンツ収集 | 企業の恒久的な素材管理 |

### 重要な理解

1. **企業はカテゴリ（A, D, K...）の概念を超越している**
   - カテゴリは制作工程の分類
   - 企業データは独立した軸

2. **新規企業 vs 既存企業**
   - **既存企業**: 企業マスターから取得してドロップダウン表示
   - **新規企業**: ユーザーが企業名を手入力
   - 両方とも同じフォルダ構造を使用

3. **企業マスターとの連携**
   - 企業マスター: 51列の詳細データ（テキスト情報）
   - データ提出（企業モード）: 画像ファイルや情報シートのアップロード

---

## 🗂️ フォルダ構造（確定版）

### ❌ 旧設計（誤り）

```
📁 企業名/
  ├─ 📁 メイン/        ← 「メイン」「サブ」の区別が曖昧
  ├─ 📁 サブ/          ← ユーザーが迷う
  └─ 📁 情報シート/
```

**問題点**:
- 「メイン」と「サブ」の違いが不明確
- ファイル種別による自動振り分けが困難
- 企業マスターの51フィールドとの対応が不明

### ✅ 新設計（正しい）

```
📁 企業名/
  ├─ 📁 ロゴ/
  ├─ 📁 ヒーロー画像/
  ├─ 📁 QRコード/
  ├─ 📁 代表者写真/
  ├─ 📁 サービス画像/
  ├─ 📁 社員写真/
  ├─ 📁 情報シート/
  └─ 📁 その他/
```

**利点**:
- ファイル種別が明確
- 企業マスターの列と1:1対応
- ユーザーが迷わない

### 企業マスターとの対応表

| フォルダ | 企業マスター列名 | 列番号 | 複数ファイル |
|---------|----------------|-------|------------|
| ロゴ | ロゴ画像パス | 7 | ❌ |
| ヒーロー画像 | ヒーロー画像パス | 8 | ❌ |
| QRコード | QRコード画像パス | 9 | ❌ |
| 代表者写真 | 代表者写真パス | 14 | ❌ |
| サービス画像 | サービス1-3_画像パス | 15, 18, 21 | ✅ 3枚まで |
| 社員写真 | 社員1-3_画像パス | 25, 28, 31 | ✅ 3名分 |
| 情報シート | （スプレッドシート） | - | ❌ |
| その他 | （未分類素材） | - | ✅ |

---

## 🎨 UI設計（確定版）

### レイアウト全体像

```
┌──────────────────────────────────────────────────────────────┐
│ [カテゴリ別|企業別] ○既存 [マルトモ▼] ○新規 [企業名入力___] │
│  ↑タブ              ↑企業選択モード（同じ行に配置）          │
└──────────────────────────────────────────────────────────────┘
  ↓
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──────────┐
│ 📁🏢│ │ 📁🖼️│ │ 📁⬜│ │ 📁👤│ │ 📁💼│ │ 📁👥│ │ 📁📄│ │ 📁📦│ │ファイル  │
│ロゴ │ │ヒーロ│ │ QR  │ │代表者│ │サービ│ │社員 │ │情報 │ │その他│ │一覧      │
│     │ │画像 │ │コード│ │写真 │ │画像 │ │写真 │ │シート│ │     │ │logo.png  │
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │(1ファイル)│
   ↑選択                                                           └──────────┘
                                                                        ↓
                                                                   ┌──────────┐
                                                                   │プレビュー│
                                                                   │   🖼️    │
                                                                   │logo.png  │
                                                                   └──────────┘
```

### タブ行の比較

**カテゴリモード**:
```
[カテゴリ別|企業別] [A: 表紙制作 ▼] [2025年11月号 ▼]
```

**企業モード**:
```
[カテゴリ別|企業別] ○既存 [マルトモ▼] ○新規 [企業名入力___]
```

**設計原則**:
- タブと選択UIは**同じ行**に配置（スッキリしたUI）
- 既存のラジオボタン形式にとらわれない

---

## 🔧 実装要件

### 1. タブ切り替えUI

```tsx
<div className="flex items-center gap-4 mb-6">
  {/* モード選択タブ */}
  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
    <button onClick={() => setUploadMode('category')}>カテゴリ別</button>
    <button onClick={() => setUploadMode('company')}>企業別</button>
  </div>

  {/* カテゴリモードの場合 */}
  {uploadMode === 'category' && (
    <>
      <select>カテゴリ選択</select>
      <select>月号選択</select>
    </>
  )}

  {/* 企業モードの場合 */}
  {uploadMode === 'company' && (
    <>
      <label>
        <input type="radio" value="existing" checked={companyMode === 'existing'} />
        既存
      </label>

      {companyMode === 'existing' ? (
        <select>{/* 企業マスターから取得 */}</select>
      ) : (
        <input placeholder="企業名を入力" />
      )}

      <label>
        <input type="radio" value="new" checked={companyMode === 'new'} />
        新規
      </label>
    </>
  )}
</div>
```

### 2. フォルダアイコングリッド（企業モード）

```tsx
{uploadMode === 'company' && (
  <div className="grid grid-cols-9 gap-4"> {/* 8フォルダ + ファイル一覧 */}
    {/* 1. ロゴ */}
    <button onClick={() => setSelectedFolder('ロゴ')}>
      <Building2 className="w-16 h-16" />
      <span>ロゴ</span>
    </button>

    {/* 2. ヒーロー画像 */}
    <button onClick={() => setSelectedFolder('ヒーロー画像')}>
      <Image className="w-16 h-16" />
      <span>ヒーロー画像</span>
    </button>

    {/* 3. QRコード */}
    <button onClick={() => setSelectedFolder('QRコード')}>
      <QrCode className="w-16 h-16" />
      <span>QRコード</span>
    </button>

    {/* 4. 代表者写真 */}
    <button onClick={() => setSelectedFolder('代表者写真')}>
      <User className="w-16 h-16" />
      <span>代表者写真</span>
    </button>

    {/* 5. サービス画像 */}
    <button onClick={() => setSelectedFolder('サービス画像')}>
      <Briefcase className="w-16 h-16" />
      <span>サービス画像</span>
    </button>

    {/* 6. 社員写真 */}
    <button onClick={() => setSelectedFolder('社員写真')}>
      <Users className="w-16 h-16" />
      <span>社員写真</span>
    </button>

    {/* 7. 情報シート */}
    <button onClick={() => setSelectedFolder('情報シート')}>
      <FileText className="w-16 h-16" />
      <span>情報シート</span>
    </button>

    {/* 8. その他 */}
    <button onClick={() => setSelectedFolder('その他')}>
      <Package className="w-16 h-16" />
      <span>その他</span>
    </button>

    {/* 9. ファイル一覧 + プレビュー */}
    <div className="flex gap-3">
      {/* 左: ファイル一覧 */}
      <div className="flex-1">
        {folderFiles.map(file => (
          <button onClick={() => setSelectedFile(file)}>
            {file.name}
          </button>
        ))}
      </div>

      {/* 右: プレビュー */}
      {selectedFile && (
        <div className="w-40">
          <a href={selectedFile.webViewLink} target="_blank">
            <Icon className="w-12 h-12" />
            <div>{selectedFile.name}</div>
          </a>
        </div>
      )}
    </div>
  </div>
)}
```

### 3. ファイル一覧取得API

**既存APIの拡張** or **新規エンドポイント作成**

```
GET /api/yumemaga-v2/data-submission/list-files?companyName=マルトモ&folderType=ロゴ
```

**パラメータ**:
- `companyName`: 企業名（既存 or 新規）
- `folderType`: フォルダ種別（ロゴ, ヒーロー画像, QRコード, ...）

**レスポンス**:
```json
{
  "success": true,
  "folderId": "1aBcDeFgHi...",
  "files": [
    {
      "id": "file123",
      "name": "logo.png",
      "mimeType": "image/png",
      "size": 102400,
      "modifiedTime": "2025-10-09T10:30:00Z",
      "webViewLink": "https://drive.google.com/..."
    }
  ],
  "count": 1
}
```

**フォルダパス解決**:
```typescript
// カテゴリモード
const path = ['D_メインインタビューページ', '録音データ', '2025_11'];

// 企業モード
const path = ['企業素材', 'マルトモ', 'ロゴ'];
```

---

## 🚧 実装の注意点

### 1. 企業マスターからの企業一覧取得

```typescript
// 既存APIを活用
const response = await fetch('/api/yumemaga-v2/categories');
const data = await response.json();

// 企業マスターから全企業を取得（新規・変更・継続すべて）
const companies = data.companies || [];
```

### 2. フォルダ種別の型定義

```typescript
type CompanyFolderType =
  | 'ロゴ'
  | 'ヒーロー画像'
  | 'QRコード'
  | '代表者写真'
  | 'サービス画像'
  | '社員写真'
  | '情報シート'
  | 'その他';
```

### 3. ファイル数制限の実装

| フォルダ | 最大ファイル数 | 制限理由 |
|---------|--------------|---------|
| ロゴ | 1 | 企業マスター1列 |
| ヒーロー画像 | 1 | 企業マスター1列 |
| QRコード | 1 | 企業マスター1列 |
| 代表者写真 | 1 | 企業マスター1列 |
| サービス画像 | 3 | 企業マスター3列 |
| 社員写真 | 3 | 企業マスター3列 |
| 情報シート | 1 | Excel1ファイル |
| その他 | 無制限 | - |

**アップロード時のバリデーション**:
```typescript
if (folderType === 'ロゴ' && existingFiles.length >= 1) {
  alert('ロゴは1枚のみアップロード可能です');
  return;
}

if (folderType === 'サービス画像' && existingFiles.length >= 3) {
  alert('サービス画像は3枚までアップロード可能です');
  return;
}
```

### 4. Google Driveフォルダパス

**ルートフォルダ**: `企業素材/`（カテゴリCやEは使わない）

```
📁 企業素材/
  ├─ 📁 マルトモ/
  │   ├─ 📁 ロゴ/
  │   ├─ 📁 ヒーロー画像/
  │   └─ ...
  │
  └─ 📁 あーきぺんこ/
      ├─ 📁 ロゴ/
      └─ ...
```

**フォルダ作成ロジック**:
```typescript
import { ensureDirectoryWithOAuth } from '@/lib/google-drive';

const folderPath = `企業素材/${companyName}/${folderType}`;
const folderId = await ensureDirectoryWithOAuth(folderPath);
```

---

## ✅ 実装チェックリスト

### Phase 1: UI実装

- [ ] タブ切り替え（カテゴリ別/企業別）を同じ行に配置
- [ ] 企業モード選択UI（既存/新規ラジオボタン）
- [ ] 既存企業ドロップダウン（企業マスターから取得）
- [ ] 新規企業入力フィールド
- [ ] 8つのフォルダアイコングリッド
- [ ] フォルダ選択機能（クリックでハイライト）
- [ ] ファイル一覧表示（9カラム目）
- [ ] ファイルプレビュー機能

### Phase 2: API実装

- [ ] 企業一覧取得（企業マスターから）
- [ ] ファイル一覧取得API（企業モード対応）
  - [ ] `companyName`パラメータ追加
  - [ ] `folderType`パラメータ追加
  - [ ] フォルダパス解決: `企業素材/{企業名}/{フォルダ種別}/`
- [ ] ファイルアップロードAPI（企業モード対応）
  - [ ] ファイル数制限バリデーション
  - [ ] フォルダ自動作成

### Phase 3: テスト

- [ ] 既存企業選択 → フォルダ一覧表示
- [ ] 新規企業入力 → フォルダ自動作成
- [ ] 各フォルダのファイル一覧取得
- [ ] ファイル数制限の動作確認
- [ ] プレビュー機能の動作確認

---

## 📝 既知の課題

### 1. 既存実装との互換性

現在の`DataSubmissionSection.tsx`は以下の構造：
```tsx
{uploadMode === 'company' && (
  <>
    <div>企業選択モード（ラジオボタン）</div>
    <div>フォルダ種別（ラジオボタン）</div> {/* ← メイン/サブ/情報シート */}
    <div>ドラッグ&ドロップエリア</div>
  </>
)}
```

**新設計では**:
- ラジオボタンのフォルダ種別を削除
- フォルダアイコングリッドに置き換え
- 行520-610を全面的に書き換え

### 2. データ移行

**旧フォルダ構造から新フォルダ構造への移行**:
- Google Drive上に既に`メイン/サブ/情報シート`フォルダが存在する可能性
- 移行スクリプトを作成するか、手動で移行するか要検討

---

## 🔗 関連ドキュメント

- `docs/yumemaga-production-management/DATA_SUBMISSION_UI_HANDOFF.md` - カテゴリモードUI実装（完成済み）
- `docs/yumemaga-production-management/COMPANY_MASTER_SCHEMA.md` - 企業マスター51列定義
- `docs/yumemaga-production-management/DATA_SUBMISSION_DESIGN.md` - データ提出機能全体設計（旧版、要更新）
- `components/data-submission/DataSubmissionSection.tsx` - 実装対象ファイル

---

## 🚀 次世代Claude Codeへ

### このドキュメントを読んだら

1. **理解度チェック**
   - [ ] カテゴリモードと企業モードの違いを理解した
   - [ ] 旧設計（メイン/サブ）の問題点を理解した
   - [ ] 新設計（8フォルダ）の利点を理解した
   - [ ] タブ行のレイアウト（同じ行に配置）を理解した

2. **実装前の確認**
   - [ ] 既存のカテゴリモードUIを確認（参考にする）
   - [ ] 企業マスターAPIの動作確認
   - [ ] Google Driveフォルダパスの確認

3. **実装開始**
   - [ ] TodoWriteでタスク管理開始
   - [ ] UIから実装（バックエンドは後回しでOK）
   - [ ] ユーザーに進捗報告

### 質問がある場合

- **このドキュメントに書いてあること**: 信頼してそのまま実装
- **このドキュメントに書いていないこと**: ユーザーに確認
- **設計変更したい場合**: 必ずユーザーに確認（勝手に変更しない）

---

**最終更新**: 2025-10-09
**作成者**: Claude Code (前世代)
**次担当**: 次世代 Claude Code

**重要**: この設計はユーザーとの長時間の議論を経て確定したものです。安易に変更せず、疑問があれば必ずユーザーに確認してください。
