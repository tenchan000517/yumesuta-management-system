# Phase 8: データ提出進捗管理 統合実装計画書

**作成日**: 2025-10-09
**作成者**: Claude Code (現世代)
**次担当**: 次世代 Claude Code
**状態**: 計画確定、実装未着手

---

## 📋 このドキュメントの目的

データ提出進捗管理UIと既存システム（工程表、企業マスター）を統合し、以下の機能を実装します：

1. **全体進捗の月号対応**
2. **データ提出状況と工程表ステータスのリンク**
3. **企業情報との連動**
4. **情報シートの自動企業マスター反映**

**重要**: このドキュメントはユーザーとの詳細な議論を経て確定した設計です。**勝手な判断をせず、必ずユーザーに確認してください。**

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
| 情報シート | アップロードのみ | **企業マスターに自動反映** |

---

## 📊 Phase 8.1: 全体進捗の月号対応

### 背景

**現状の問題**:
- `DataSubmissionSection.tsx` 166-176行：全体進捗が `submissionData` から計算されている
- `submissionData` は月号に関係なく全データを含んでいる（モックデータ）

**目標**:
- 選択中の月号（`selectedIssue`）に対応したデータ提出状況を表示
- Google Driveのファイル存在チェックで提出状況を判定

### 実装内容

#### 1. データ提出状況取得API作成

**新規エンドポイント**: `GET /api/yumemaga-v2/data-submission/status?issue=2025年11月号`

**レスポンス例**:
```json
{
  "success": true,
  "issue": "2025年11月号",
  "categories": [
    {
      "categoryId": "A",
      "categoryName": "A: 表紙制作",
      "requiredData": [
        {
          "type": "recording",
          "name": "録音データ",
          "status": "submitted",  // submitted | pending | none
          "deadline": "9/28",
          "optional": false,
          "fileCount": 3,
          "folderId": "1aBcDeFgHi..."
        },
        {
          "type": "photo",
          "name": "写真データ",
          "status": "pending",
          "deadline": "9/28",
          "optional": false,
          "fileCount": 0,
          "folderId": "1xYz..."
        }
      ]
    }
  ],
  "summary": {
    "submitted": 15,
    "pending": 8,
    "none": 2,
    "total": 25,
    "progress": 60
  }
}
```

**実装ファイル**: `app/api/yumemaga-v2/data-submission/status/route.ts`

**処理フロー**:
1. カテゴリマスターから全カテゴリ取得
2. 各カテゴリの `requiredData`（E列）をパース
3. 各データ種別に対して Google Drive でファイル存在確認
   - パス: `カテゴリDriveID/データ種別/2025_11/`
   - ファイル数 > 0 → `submitted`
   - ファイル数 = 0 → `pending`
4. サマリー計算

#### 2. フロントエンド修正

**修正ファイル**: `components/data-submission/DataSubmissionSection.tsx`

**変更箇所**:
- 行66-88: `useEffect` で月号変更時にデータ提出状況APIを呼び出し
- 行166-176: 全体進捗計算をAPIレスポンスの `summary` から取得

**修正前**:
```typescript
// 暫定: 既存のカテゴリデータを使用
setSubmissionData(categories);
```

**修正後**:
```typescript
const response = await fetch(`/api/yumemaga-v2/data-submission/status?issue=${encodeURIComponent(selectedIssue)}`);
const result = await response.json();
if (result.success) {
  setSubmissionData(result.categories);
  // サマリーは result.summary から取得（別途 state 作成）
}
```

### ユーザー確認事項

- [ ] データ提出状況APIのレスポンス構造は上記で問題ないか？
- [ ] Google Driveのファイル存在チェックのロジックは正しいか？
- [ ] 全体進捗の計算方法（submitted/total）で良いか？

---

## 🔗 Phase 8.2: データ提出状況と工程表ステータスのリンク

### 背景

**現状の問題**:
- データ提出状況と工程表（ガントチャート）が独立している
- 工程「A-2: メインインタビューデータ提出・撮影」の完了状態と、カテゴリAの「録音データ」提出状況が連動していない

**目標**:
- データ提出完了時に対応する工程を自動完了
- 工程完了時にデータ提出状況も更新

### 前提知識

#### 工程マスターの構造（重要）

**スプレッドシート**: `YUMEMAGA_SPREADSHEET_ID` の「新工程マスター」シート

**重要な列**:
- A列: 工程No（例: `A-2`）
- B列: 工程名（例: `メインインタビューデータ提出・撮影`）
- C列: カテゴリID（例: `A`）
- **TODO列**: データ提出種別（例: `録音データ,写真データ`）← **Phase 8で追加予定**

#### 進捗入力シートの構造

**スプレッドシート**: `YUMEMAGA_SPREADSHEET_ID` の「進捗入力シート」

**重要な列**:
- A列: 工程No
- B列: 2025年11月号_計画日
- C列: 2025年11月号_実績日
- D列: 2025年12月号_計画日
- E列: 2025年12月号_実績日
- ...（月号ごとに2列ずつ）

**実績日の入力 = 工程完了**

### 実装内容

#### 1. 工程マスターにデータ提出種別列を追加（手動作業）

**作業内容**:
1. Google Sheetsで「新工程マスター」を開く
2. 新しい列（例: F列）に「データ提出種別」を追加
3. データ提出が必要な工程にカンマ区切りで種別を入力

**例**:
| 工程No | 工程名 | カテゴリID | データ提出種別 |
|--------|--------|-----------|---------------|
| A-2 | メインインタビューデータ提出・撮影 | A | 録音データ,写真データ |
| D-2 | メインインタビューページ_データ提出 | D | 録音データ |
| K-2 | インタビュー②データ提出 | K | 録音データ,写真データ |

**ユーザー確認事項**:
- [ ] どの工程にどのデータ提出種別を紐付けるか決定
- [ ] 工程マスターへの追加作業を実施

#### 2. データ提出完了時に工程実績日を自動入力

**新規エンドポイント**: `PUT /api/yumemaga-v2/data-submission/complete`

**リクエストボディ**:
```json
{
  "issue": "2025年11月号",
  "categoryId": "A",
  "dataType": "recording"
}
```

**処理フロー**:
1. 工程マスターから `categoryId` に対応し、`dataType` を含む工程を検索
2. 該当工程の実績日を今日の日付で更新（進捗入力シート）
3. 工程完了通知を返す

**レスポンス**:
```json
{
  "success": true,
  "completedProcesses": ["A-2"],
  "message": "工程 A-2 を完了しました"
}
```

**呼び出しタイミング**:
- ファイルアップロード成功時（`DataSubmissionSection.tsx` handleFileUpload）
- アップロード後に自動呼び出し

#### 3. フロントエンド修正

**修正ファイル**: `components/data-submission/DataSubmissionSection.tsx`

**変更箇所**: `handleFileUpload` 関数（行194-249）

**修正後**:
```typescript
if (result.success) {
  alert(`アップロード成功: ${result.uploadedFiles.length}件のファイルがアップロードされました`);

  // 工程完了API呼び出し
  if (uploadMode === 'category') {
    const completeRes = await fetch('/api/yumemaga-v2/data-submission/complete', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue: selectedIssue,
        categoryId: selectedCategory,
        dataType: selectedDataType,
      }),
    });
    const completeData = await completeRes.json();
    if (completeData.success) {
      alert(`${completeData.message}\n工程が自動完了しました`);
    }
  }

  // データ提出状況を再取得
  fetchAllData();
}
```

### ユーザー確認事項

- [ ] 工程マスターへのデータ提出種別追加は手動で良いか？（自動化不要？）
- [ ] ファイルアップロード完了時に工程を自動完了して良いか？
- [ ] 複数ファイルが必要な場合の扱いは？（1件でも完了 or 全件揃うまで保留）

---

## 🏢 Phase 8.3: 企業情報との連動

### 背景

**現状の問題**:
- 企業マスター（51列のテキストデータ）と企業モードのファイルアップロードが独立
- どの企業が何のファイルをアップロード済みか一目で分からない

**目標**:
- 企業別工程管理セクション（`CompanyManagementSection.tsx`）にファイルアップロード状況を表示
- 企業マスターの列とファイルの対応を可視化

### 実装内容

#### 1. 企業別ファイルアップロード状況取得API

**既存エンドポイント拡張**: `GET /api/yumemaga-v2/company-processes?issue=2025年11月号`

**追加するレスポンスフィールド**:
```json
{
  "success": true,
  "companies": [
    {
      "companyId": "marutomo",
      "companyName": "マルトモ",
      "status": "new",
      "progress": {
        "masterSheet": {
          "total": 51,
          "filled": 50,
          "notFilled": 1,
          "progressRate": 98
        },
        "fileUpload": {
          "ロゴ": { "uploaded": true, "fileCount": 1 },
          "ヒーロー画像": { "uploaded": true, "fileCount": 1 },
          "QRコード": { "uploaded": false, "fileCount": 0 },
          "代表者写真": { "uploaded": true, "fileCount": 1 },
          "サービス画像": { "uploaded": true, "fileCount": 3 },
          "社員写真": { "uploaded": true, "fileCount": 2 },
          "情報シート": { "uploaded": false, "fileCount": 0 },
          "その他": { "uploaded": true, "fileCount": 5 }
        }
      }
    }
  ]
}
```

**実装ファイル**: `app/api/yumemaga-v2/company-processes/route.ts`

**追加処理**:
1. 各企業について、8つのフォルダのファイル数をカウント
2. パス: `カテゴリC_DriveID/企業名/フォルダ種別/`
3. `fileCount > 0` なら `uploaded: true`

#### 2. フロントエンド修正

**修正ファイル**: `components/company-management/CompanyManagementSection.tsx`

**追加UI**: 各企業カードにファイルアップロード状況を追加

**表示イメージ**:
```
┌─────────────────────────────────┐
│ マルトモ                    [新規]│
│ 企業マスター進捗: 50/51 (98%)   │
│                                 │
│ ファイルアップロード:            │
│ ✅ ロゴ (1)  ✅ ヒーロー (1)     │
│ ❌ QR (0)    ✅ 代表者 (1)       │
│ ✅ サービス (3/3) ✅ 社員 (2/3) │
│ ❌ 情報シート (0) ✅ その他 (5) │
└─────────────────────────────────┘
```

### ユーザー確認事項

- [ ] 企業別工程管理にファイルアップロード状況を表示する位置・デザインは上記で良いか？
- [ ] サービス画像・社員写真の「3枚まで」制限を表示するか？（例: `2/3`）

---

## 📄 Phase 8.4: 情報シートの自動企業マスター反映

### 背景

**現状の問題**:
- 企業が「情報シート」（Excelファイル）をアップロードしても、企業マスターに手動でコピペが必要
- 二度手間で非効率

**目標**:
- 情報シートアップロード時に企業マスターの該当行を自動更新

### 前提知識

#### 情報シートのフォーマット（要確認）

**ユーザー確認事項**:
- [ ] 情報シートは固定フォーマットか？（Excelテンプレート配布？）
- [ ] どの列が企業マスターのどの列に対応するか？
- [ ] 情報シートはExcelファイルか？Googleスプレッドシートか？

**想定フォーマット例**:
| 項目 | 値 |
|------|-----|
| 企業名 | マルトモ |
| 企業名(カナ) | マルトモ |
| 業種 | 水産加工業 |
| 事業エリア | 愛媛県 |
| ... | ... |

### 実装内容（情報シート仕様確定後）

#### 1. 情報シートパースAPI

**新規エンドポイント**: `POST /api/yumemaga-v2/data-submission/parse-info-sheet`

**リクエスト**: `multipart/form-data` でExcelファイル

**レスポンス**:
```json
{
  "success": true,
  "companyName": "マルトモ",
  "parsedData": {
    "企業名": "マルトモ",
    "企業名(カナ)": "マルトモ",
    "業種": "水産加工業",
    ...
  }
}
```

**処理フロー**:
1. Excelファイルを読み込み（`xlsx` ライブラリ使用）
2. 固定フォーマットに従ってセル値を抽出
3. 企業マスターの列に対応させる

#### 2. 企業マスター更新API

**新規エンドポイント**: `PUT /api/yumemaga-v2/company-master`

**リクエストボディ**:
```json
{
  "companyName": "マルトモ",
  "data": {
    "企業名(カナ)": "マルトモ",
    "業種": "水産加工業",
    "事業エリア": "愛媛県",
    ...
  }
}
```

**処理フロー**:
1. 企業マスターから `companyName` で該当行を検索
2. 該当行の各列を更新（`updateSheetRow` 使用）
3. 更新完了を返す

#### 3. フロントエンド修正

**修正ファイル**: `components/data-submission/DataSubmissionSection.tsx`

**変更箇所**: `handleFileUpload` 関数

**追加処理**:
```typescript
if (uploadMode === 'company' && selectedCompanyFolder === '情報シート') {
  // 情報シートをパース
  const parseRes = await fetch('/api/yumemaga-v2/data-submission/parse-info-sheet', {
    method: 'POST',
    body: formData, // Excelファイル
  });
  const parseData = await parseRes.json();

  if (parseData.success) {
    // 企業マスター更新
    const updateRes = await fetch('/api/yumemaga-v2/company-master', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: companyMode === 'existing' ? selectedCompany : newCompanyName,
        data: parseData.parsedData,
      }),
    });
    const updateData = await updateRes.json();

    if (updateData.success) {
      alert('企業マスターに自動反映しました');
    }
  }
}
```

### ユーザー確認事項（最重要）

- [ ] 情報シートの正確なフォーマットを提供してください
- [ ] 情報シートはExcelファイルか？Googleスプレッドシートか？
- [ ] どの項目を企業マスターのどの列に反映するか？（マッピング表が必要）
- [ ] 情報シート内の企業名と企業マスターの企業名が一致しない場合の扱いは？

---

## 🗂️ 実装順序と依存関係

```
Phase 8.1: 全体進捗の月号対応
  ↓（独立して実装可能）
Phase 8.2: 工程表ステータスリンク
  ↓（Phase 8.1完了後に実装推奨）
Phase 8.3: 企業情報との連動
  ↓（独立して実装可能）
Phase 8.4: 情報シート自動反映
  ↓（Phase 8.3完了後に実装推奨）
完了
```

**推奨実装順序**:
1. Phase 8.1（全体進捗）← データ提出状況の基盤
2. Phase 8.3（企業情報連動）← 企業モードの完成
3. Phase 8.2（工程表リンク）← 工程マスター修正が必要
4. Phase 8.4（情報シート反映）← 仕様確認が必要

---

## ✅ 各Phase完了時のチェックリスト

### Phase 8.1完了時

- [ ] データ提出状況APIが正しく月号別データを返す
- [ ] 全体進捗が選択月号のデータで計算される
- [ ] カテゴリカードが月号別の提出状況を表示

### Phase 8.2完了時

- [ ] 工程マスターにデータ提出種別列を追加済み
- [ ] ファイルアップロード時に対応工程が自動完了
- [ ] 工程表のステータスが更新される

### Phase 8.3完了時

- [ ] 企業別工程管理にファイルアップロード状況が表示
- [ ] 8つのフォルダすべての状況が確認できる

### Phase 8.4完了時

- [ ] 情報シートアップロード時に企業マスターが自動更新
- [ ] 更新内容が正確（手動確認）

---

## 🚨 次世代Claude Codeへの重要指示

### 必ず守ること

1. **ユーザーに確認せずに勝手に実装しない**
   - このドキュメントの「ユーザー確認事項」すべてにチェックが入るまで実装開始しない
   - 不明点があれば必ず質問する

2. **仕様変更は必ずユーザーと合意してから**
   - APIレスポンス構造の変更
   - データベース構造の変更
   - UI配置の変更

3. **実装前に計画を報告**
   - どのファイルを修正するか
   - どの関数を追加/変更するか
   - テスト方法

4. **エラーハンドリングを忘れない**
   - Google Drive API呼び出しは失敗する可能性がある
   - スプレッドシート更新は権限エラーの可能性がある
   - ファイルパースは失敗する可能性がある

### トラブルシューティング

**Google Drive APIが遅い場合**:
- タイムアウトを60秒に設定
- バッチ処理を検討（複数ファイルを一度に確認）

**企業マスター更新が失敗する場合**:
- サービスアカウントに書き込み権限があるか確認
- スプレッドシートIDが正しいか確認

---

## 📚 関連ドキュメント

- `docs/yumemaga-production-management/DATA_SUBMISSION_UI_HANDOFF.md` - カテゴリモードUI
- `docs/yumemaga-production-management/COMPANY_MODE_UI_DESIGN.md` - 企業モードUI
- `docs/yumemaga-production-management/COMPANY_MASTER_SCHEMA.md` - 企業マスター構造

---

**最終更新**: 2025-10-09
**作成者**: Claude Code (現世代)
**次担当**: 次世代 Claude Code

このドキュメントを読んだ次世代Claude Codeは、まず「ユーザー確認事項」をすべてユーザーに確認してから実装を開始してください。
