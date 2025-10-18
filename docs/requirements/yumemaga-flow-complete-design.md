# ゆめマガ制作フロー完全設計書

**作成日**: 2025-10-18
**対象**: ゆめマガ制作フローの工程詳細管理システム
**ステータス**: 設計確定

---

## 📋 目次

1. [システム概要](#システム概要)
2. [目的と背景](#目的と背景)
3. [データ構造](#データ構造)
4. [UI設計](#ui設計)
5. [実装手順](#実装手順)
6. [API設計](#api設計)
7. [注意事項](#注意事項)

---

## システム概要

### 何を作るか

**ゆめマガ制作フローの工程詳細管理システム**
- 各工程にサイドパネルUI実装（契約業務フローと同じUI/UX）
- カテゴリ別予実管理の各工程
- 次月準備の各工程
- チェックリスト管理
- 必要データ管理
- 成果物管理
- 工程完了機能

### 対象工程

```
カテゴリ別予実管理（例: 2025年11月号）
├─ カテゴリA: メイン記事（工程A-1〜A-N）
├─ カテゴリB: 〜（工程B-1〜B-N）
├─ カテゴリC: 企業情報（工程C-1〜C-N）
├─ ...
└─ カテゴリZ: 全体進捗

次月準備（例: 2025年12月号準備）
├─ 工程1: 〜
├─ 工程2: 〜
└─ ...
```

### UI/UXのベース

**契約業務フローのSidePanel** (`components/workflow/SidePanel.tsx`)
- 工程概要表示
- チェックリスト（API連携）
- ガイド・リンク
- エビデンス保存（ファイルアップロード）
- 工程完了ボタン

---

## 目的と背景

### 目的

1. 各工程の詳細管理を強化
2. 契約業務フローと同じUI/UXで統一
3. チェックリスト・必要データ・成果物を一元管理

### 重要な前提

- **契約業務フローのサイドパネルと基本的に同じ**
- **カテゴリ別予実管理と次月準備の両方に適用**
- **97工程すべてに対応**
- **チェックリストはスプレッドシートで管理**

---

## データ構造

### 3.1 既存データ: 進捗入力シート

**スプレッドシート**: ゆめマガ進捗管理スプレッドシート
**シート名**: `進捗入力シート`
**用途**: 工程の予定日・実績日・ステータス管理

**列構成**:
```
A列: 工程番号（例: A-1, B-2, C-3）
B列: 工程名
C列: カテゴリID
D列: 月号（例: 2025年11月号）
E列: 予定日（YYYY/MM/DD形式）
F列: （未使用）
G列: 実績日（YYYY/MM/DD形式）
H列: （未使用）
I列: ステータス（completed/in_progress/delayed/not_started）
J列: 備考
```

---

### 3.2 新規作成: 工程チェックリスト管理

**スプレッドシート**: ゆめマガ進捗管理スプレッドシート（新規シート）
**シート名**: `工程チェックリスト管理`
**用途**: 各工程のチェックリスト状態を保存

**列構成**:
```
A列: 月号（例: 2025年11月号）
B列: 工程番号（例: A-2）
C列: チェック項目ID（例: A-2-c1）
D列: チェック項目内容
E列: チェック状態（TRUE/FALSE）
F列: 最終更新日時
```

**データ例**:
```
月号          | 工程番号 | チェック項目ID | チェック項目内容               | チェック状態 | 最終更新日時
2025年11月号 | A-2      | A-2-c1         | インタビュー日程調整完了       | TRUE        | 2025/10/01 10:00
2025年11月号 | A-2      | A-2-c2         | 質問項目作成完了               | TRUE        | 2025/10/01 11:00
2025年11月号 | A-2      | A-2-c3         | 撮影準備完了                   | FALSE       | -
```

---

### 3.3 新規作成: 工程マスター（チェックリスト定義）

**スプレッドシート**: ゆめマガ進捗管理スプレッドシート（新規シート）
**シート名**: `工程マスター`
**用途**: 各工程のチェックリスト項目を定義

**列構成**:
```
A列: 工程番号（例: A-2）
B列: 工程名
C列: 概要説明
D列: チェックリスト項目（カンマ区切り）
E列: 必要データ（カンマ区切り）
F列: 成果物（カンマ区切り）
G列: ガイドリンク（JSON形式）
```

**データ例**:
```
工程番号 | 工程名                       | 概要説明                             | チェックリスト項目
A-2      | メインインタビューデータ提出 | メイン記事のインタビューを実施します | インタビュー日程調整完了,質問項目作成完了,撮影準備完了,インタビュー実施,データ提出
```

---

### 3.4 型定義

**新規作成**: `types/yumemaga-process.ts`

```typescript
// types/yumemaga-process.ts

export interface ProcessDetail {
  // 基本情報
  processNo: string;              // 工程番号（例: "A-2"）
  processName: string;            // 工程名
  categoryId: string;             // カテゴリID（例: "A"）
  categoryName: string;           // カテゴリ名（例: "メイン記事"）
  issue: string;                  // 対象月号（例: "2025年11月号"）

  // 概要
  overview?: string;              // 工程の概要説明

  // 日程管理
  plannedDate: string;            // 予定日
  actualDate?: string;            // 実績日
  status: ProcessStatus;          // ステータス
  delayDays?: number;             // 遅延日数

  // チェックリスト
  checklist: ChecklistItem[];     // チェックリスト

  // 必要データ・成果物
  requiredData?: RequiredDataItem[];   // 必要なデータ（録音、写真等）
  deliverables?: DeliverableItem[];    // 成果物（文字起こし、原稿等）

  // リンク・ガイド
  guides?: GuideLink[];           // 作業ガイドへのリンク
  canvaUrl?: string;              // Canvaデザインリンク
  driveFolder?: string;           // Google Driveフォルダリンク
  relatedProcesses?: string[];    // 関連工程（前工程・後工程）

  // メモ
  notes?: string;                 // メモ
}

export type ProcessStatus = 'completed' | 'in_progress' | 'delayed' | 'not_started';

export interface ChecklistItem {
  id: string;                     // チェック項目ID（例: "A-2-c1"）
  text: string;                   // チェック項目内容
  checked: boolean;               // チェック状態
}

export interface RequiredDataItem {
  id: string;
  type: 'audio' | 'document' | 'image' | 'video' | 'other';
  name: string;                   // データ名
  deadline?: string;              // 提出期限
  status: 'submitted' | 'pending' | 'none';
  driveUrl?: string;              // アップロード先URL
  optional: boolean;              // 任意フラグ
}

export interface DeliverableItem {
  id: string;
  name: string;                   // 成果物名
  type: 'text' | 'design' | 'pdf' | 'other';
  status: 'completed' | 'in_progress' | 'not_started';
  driveUrl?: string;
  updatedAt?: string;
}

export interface GuideLink {
  id: string;
  label: string;                  // リンクラベル
  type: 'internal' | 'external' | 'modal';
  url?: string;
  icon?: string;
}
```

---

## UI設計

### 4.1 既存UI改修: カテゴリ別予実管理

**ファイル**: `app/dashboard/yumemaga-v2/page.tsx`
**コンポーネント**: `CategoryManagementSection`

**改修点**:
1. 工程一覧の各工程に「詳細」ボタン追加
2. 工程クリック → `ProcessSidePanel`を開く
3. サイドパネル内で実績日入力・チェックリスト管理

**現在**:
```
カテゴリA: メイン記事
├─ 工程A-2: メインインタビューデータ提出
│  予定日: 9/28 | 実績日: [入力] | ステータス: 遅延
```

**改修後**:
```
カテゴリA: メイン記事
├─ 工程A-2: メインインタビューデータ提出
│  予定日: 9/28 | 実績日: [入力] | ステータス: 遅延 | [詳細を開く]
```

---

### 4.2 新規作成: 工程詳細サイドパネル

**コンポーネント**: `components/yumemaga/ProcessSidePanel.tsx`

**UIレイアウト**（契約業務フローのSidePanelと同じ構成）:

```
┌─────────────────────────────────────────┐
│ 【サイドパネル】                         │
│ カテゴリA: メイン記事                    │
│ 工程A-2: メインインタビューデータ提出    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ ステータス: [未着手] [進行中] [完了]     │
│                                         │
│ 📅 日程管理                              │
│ ┌─────────────────────────────────┐   │
│ │ 予定日: 2025/09/28                │   │
│ │ 実績日: [日付選択]                │   │
│ │ ステータス: ⚠️ 遅延（3日）        │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 📖 概要                                  │
│ ┌─────────────────────────────────┐   │
│ │ メイン記事のインタビューを実施し、  │   │
│ │ 録音データと写真を提出します。      │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ✅ チェックリスト（3/5完了）             │
│ ┌─────────────────────────────────┐   │
│ │ ☑ インタビュー日程調整完了        │   │
│ │ ☑ 質問項目作成完了                │   │
│ │ ☑ 撮影準備完了                    │   │
│ │ ☐ インタビュー実施                │   │
│ │ ☐ データ提出                      │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 📎 必要データ                            │
│ ┌─────────────────────────────────┐   │
│ │ 🎙️ 録音データ                     │   │
│ │   期限: 9/28 | ⚠️ 未提出          │   │
│ │   [アップロード]                  │   │
│ │                                   │   │
│ │ 📷 写真画像                       │   │
│ │   期限: 9/28 | ✅ 提出済み        │   │
│ │   [Drive] → drive.google.com/... │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 📦 成果物                                │
│ ┌─────────────────────────────────┐   │
│ │ 📝 文字起こしテキスト              │   │
│ │   ステータス: 🔵 進行中           │   │
│ │   更新: 2025/09/29 10:30         │   │
│ │   [Drive]                         │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 🔗 リンク・ガイド                        │
│ ┌─────────────────────────────────┐   │
│ │ 📖 インタビュー作業マニュアル     │   │
│ │ 🎨 Canvaデザイン → canva.com/... │   │
│ │ 📁 Driveフォルダ → drive.google...│   │
│ └─────────────────────────────────┘   │
│                                         │
│ 🔄 関連工程                              │
│ ┌─────────────────────────────────┐   │
│ │ ← 前工程: A-1 メイン取材準備      │   │
│ │ → 後工程: A-3 メイン文字起こし    │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 📝 メモ                                  │
│ ┌─────────────────────────────────┐   │
│ │ [テキストエリア]                  │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ✅ 工程完了ボタン                        │
│ ┌─────────────────────────────────┐   │
│ │ [この工程を完了にする]            │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [閉じる]                                 │
└─────────────────────────────────────────┘
```

**契約業務フローのSidePanelとの違い**:
- 企業情報表示なし（ゆめマガは工程中心）
- 必要データ管理（録音、写真等のアップロード）
- 成果物管理（文字起こし、原稿等のステータス）
- 関連工程表示（前工程・後工程）

---

### 4.3 次月準備への適用

**ファイル**: `components/next-month/NextMonthPrepSection.tsx`

**改修点**:
1. 次月準備の各工程に「詳細」ボタン追加
2. 工程クリック → `ProcessSidePanel`を開く
3. 次月準備用のチェックリスト・必要データを表示

---

## 実装手順

### Phase 1: 工程マスター・チェックリスト管理シート作成（1週間）

#### タスク1: スプレッドシート設計書作成
- ファイル: `docs/requirements/investigations/yumemaga-process-sheets-design.md`
- 内容: 工程マスター、工程チェックリスト管理の詳細設計

#### タスク2: GASスクリプト作成
- ファイル: `scripts/create-yumemaga-process-sheets.gs`
- 内容: 工程マスター、工程チェックリスト管理シートを自動生成

#### タスク3: スプレッドシート作成
- GASスクリプトを実行してシート作成
- サービスアカウントに編集権限付与

#### タスク4: 工程マスターデータ初期投入
- 97工程分のチェックリスト項目を定義
- 必要データ、成果物、ガイドリンクを設定

#### タスク5: 型定義作成
- ファイル: `types/yumemaga-process.ts`
- 内容: `ProcessDetail`, `ChecklistItem`, `RequiredDataItem`, `DeliverableItem`型定義

---

### Phase 2: 工程詳細取得API実装（1週間）

#### タスク6: 工程詳細取得API
- ファイル: `/api/yumemaga-v2/process-detail/route.ts`
- 機能: 工程番号 + 月号から工程詳細を取得

```typescript
GET /api/yumemaga-v2/process-detail?issue=2025年11月号&processNo=A-2
```

**レスポンス**:
```json
{
  "success": true,
  "process": {
    "processNo": "A-2",
    "processName": "メインインタビューデータ提出",
    "categoryId": "A",
    "categoryName": "メイン記事",
    "issue": "2025年11月号",
    "overview": "メイン記事のインタビューを実施します",
    "plannedDate": "2025/09/28",
    "actualDate": null,
    "status": "delayed",
    "delayDays": 3,
    "checklist": [
      {
        "id": "A-2-c1",
        "text": "インタビュー日程調整完了",
        "checked": true
      },
      {
        "id": "A-2-c2",
        "text": "質問項目作成完了",
        "checked": true
      },
      {
        "id": "A-2-c3",
        "text": "撮影準備完了",
        "checked": false
      }
    ],
    "requiredData": [...],
    "deliverables": [...],
    "guides": [...]
  }
}
```

#### タスク7: チェックリスト更新API
- ファイル: `/api/yumemaga-v2/process-checklist/route.ts`
- 機能: チェックリスト状態の更新

```typescript
PUT /api/yumemaga-v2/process-checklist
Body: {
  "issue": "2025年11月号",
  "processNo": "A-2",
  "checkId": "A-2-c1",
  "checked": true
}
```

#### タスク8: 工程完了API
- ファイル: `/api/yumemaga-v2/complete-process/route.ts`
- 機能: 工程を完了にする（実績日を今日の日付に設定）

```typescript
POST /api/yumemaga-v2/complete-process
Body: {
  "issue": "2025年11月号",
  "processNo": "A-2"
}
```

---

### Phase 3: 工程詳細サイドパネル実装（1.5週間）

#### タスク9: ProcessSidePanelコンポーネント作成
- ファイル: `components/yumemaga/ProcessSidePanel.tsx`
- 内容: 契約業務フローのSidePanelをベースに、ゆめマガ用に調整
  - 企業情報表示を削除
  - 必要データ管理を追加
  - 成果物管理を追加
  - 関連工程表示を追加

**主要機能**:
- 工程概要表示
- 日程管理（予定日、実績日、遅延日数）
- チェックリスト（API連携）
- 必要データ管理（アップロード状況、ファイル一覧）
- 成果物管理（ステータス表示、Driveリンク）
- ガイド・リンク（Canva、Drive、マニュアル）
- 関連工程表示（前工程・後工程へのリンク）
- メモ欄
- 工程完了ボタン

#### タスク10: 既存UIの改修（カテゴリ別予実管理）
- ファイル: `app/dashboard/yumemaga-v2/page.tsx`
- ファイル: `components/category-management/CategoryManagementSection.tsx`
- 改修内容:
  - 工程一覧に「詳細を開く」ボタン追加
  - 工程クリック → ProcessSidePanelを開く
  - サイドパネルの状態管理（開閉、選択工程）

#### タスク11: 既存UIの改修（次月準備）
- ファイル: `components/next-month/NextMonthPrepSection.tsx`
- 改修内容:
  - 次月準備の各工程に「詳細を開く」ボタン追加
  - 工程クリック → ProcessSidePanelを開く

---

### Phase 4: 必要データ・成果物管理強化（1週間）

#### タスク12: 必要データアップロード機能
- Google Drive連動（既存のOAuth認証を利用）
- カテゴリ別Driveフォルダ自動作成
- 必要データのアップロード機能
- アップロード済みデータの一覧表示
- 提出ステータスの自動更新

#### タスク13: 成果物管理機能
- 成果物のステータス表示（完了/進行中/未着手）
- 成果物のDriveリンク表示
- 成果物の更新日時表示

---

### Phase 5: テスト・最適化（0.5週間）

#### タスク14: 動作確認
- 工程詳細サイドパネルの表示テスト
- チェックリスト更新のテスト
- 工程完了のテスト
- 必要データアップロードのテスト

#### タスク15: ドキュメント更新
- `docs/development/development-progress.md`更新

---

## API設計

### 6.1 工程詳細取得API

#### GET /api/yumemaga-v2/process-detail

**クエリパラメータ**:
- `issue`: 月号（例: 2025年11月号）
- `processNo`: 工程番号（例: A-2）

**レスポンス**:
```json
{
  "success": true,
  "process": {
    "processNo": "A-2",
    "processName": "メインインタビューデータ提出",
    "categoryId": "A",
    "categoryName": "メイン記事",
    "issue": "2025年11月号",
    "overview": "メイン記事のインタビューを実施し、録音データと写真を提出します。",
    "plannedDate": "2025/09/28",
    "actualDate": null,
    "status": "delayed",
    "delayDays": 3,
    "checklist": [
      {
        "id": "A-2-c1",
        "text": "インタビュー日程調整完了",
        "checked": true
      },
      {
        "id": "A-2-c2",
        "text": "質問項目作成完了",
        "checked": true
      },
      {
        "id": "A-2-c3",
        "text": "撮影準備完了",
        "checked": true
      },
      {
        "id": "A-2-c4",
        "text": "インタビュー実施",
        "checked": false
      },
      {
        "id": "A-2-c5",
        "text": "データ提出",
        "checked": false
      }
    ],
    "requiredData": [
      {
        "id": "A-2-d1",
        "type": "audio",
        "name": "録音データ",
        "deadline": "2025/09/28",
        "status": "pending",
        "driveUrl": null,
        "optional": false
      },
      {
        "id": "A-2-d2",
        "type": "image",
        "name": "写真画像",
        "deadline": "2025/09/28",
        "status": "submitted",
        "driveUrl": "https://drive.google.com/...",
        "optional": false
      },
      {
        "id": "A-2-d3",
        "type": "document",
        "name": "文字起こし",
        "deadline": "2025/09/29",
        "status": "none",
        "driveUrl": null,
        "optional": true
      }
    ],
    "deliverables": [
      {
        "id": "A-2-del1",
        "name": "文字起こしテキスト",
        "type": "text",
        "status": "in_progress",
        "driveUrl": "https://drive.google.com/...",
        "updatedAt": "2025/09/29 10:30"
      }
    ],
    "guides": [
      {
        "id": "A-2-g1",
        "label": "インタビュー作業マニュアル",
        "type": "external",
        "url": "https://...",
        "icon": "📖"
      },
      {
        "id": "A-2-g2",
        "label": "Canvaデザイン",
        "type": "external",
        "url": "https://canva.com/...",
        "icon": "🎨"
      },
      {
        "id": "A-2-g3",
        "label": "Driveフォルダ",
        "type": "external",
        "url": "https://drive.google.com/...",
        "icon": "📁"
      }
    ],
    "relatedProcesses": ["A-1", "A-3"],
    "notes": "インタビュー対象者に事前確認済み"
  }
}
```

---

### 6.2 チェックリスト更新API

#### PUT /api/yumemaga-v2/process-checklist

**リクエスト**:
```json
{
  "issue": "2025年11月号",
  "processNo": "A-2",
  "checkId": "A-2-c4",
  "checked": true
}
```

**レスポンス**:
```json
{
  "success": true,
  "message": "チェックリストを更新しました"
}
```

---

### 6.3 工程完了API

#### POST /api/yumemaga-v2/complete-process

**リクエスト**:
```json
{
  "issue": "2025年11月号",
  "processNo": "A-2"
}
```

**処理内容**:
- 進捗入力シートのG列（実績日）に今日の日付を設定
- I列（ステータス）を「completed」に更新

**レスポンス**:
```json
{
  "success": true,
  "message": "工程を完了にしました",
  "actualDate": "2025/10/01"
}
```

---

## 注意事項

### 7.1 実装時の絶対的なルール

1. **契約業務フローのSidePanelと基本的に同じUI/UX**
   - レイアウト、色、フォント等を統一
   - ユーザー体験を一貫させる

2. **チェックリストはスプレッドシートで管理**
   - 工程チェックリスト管理シートに保存
   - API連携で即座に保存・読み込み

3. **97工程すべてに対応**
   - カテゴリ別予実管理の各工程
   - 次月準備の各工程
   - 工程マスターで一元管理

4. **必要データ管理の強化**
   - Google Drive連動
   - アップロード状況の可視化
   - 提出期限の管理

---

### 7.2 既存実装との連携

**既存のコンポーネント**:
- `components/workflow/SidePanel.tsx` - 契約業務フローのサイドパネル（参考）
- `components/category-management/CategoryManagementSection.tsx` - カテゴリ別予実管理
- `components/next-month/NextMonthPrepSection.tsx` - 次月準備

**新規コンポーネント**:
- `components/yumemaga/ProcessSidePanel.tsx` - 工程詳細サイドパネル

**既存のAPI**:
- `/api/yumemaga-v2/processes` - 工程一覧取得
- `/api/yumemaga-v2/actual-date` - 実績日更新
- `/api/yumemaga-v2/planned-date` - 予定日更新

**新規API**:
- `/api/yumemaga-v2/process-detail` - 工程詳細取得
- `/api/yumemaga-v2/process-checklist` - チェックリスト更新
- `/api/yumemaga-v2/complete-process` - 工程完了

---

### 7.3 データの整合性

**スプレッドシート書き込み時の注意**:
- 工程番号は変更不可（一意キー）
- 実績日は「YYYY/MM/DD」形式で統一
- ステータスは「completed/in_progress/delayed/not_started」のいずれか
- チェックリスト状態は「TRUE/FALSE」で保存

---

### 7.4 工程マスターのメンテナンス

**工程マスターの更新方法**:
1. 新しい工程を追加する場合
   - 工程マスターシートに新しい行を追加
   - 工程番号、工程名、チェックリスト項目を設定

2. 既存工程のチェックリスト項目を変更する場合
   - 工程マスターシートの該当行を編集
   - 変更後、工程チェックリスト管理シートに反映

3. 工程を削除する場合
   - 工程マスターシートの該当行を削除
   - 進捗入力シートの該当工程も削除

---

## 補足資料

### 参考ファイル

- 契約業務フローのサイドパネル: `components/workflow/SidePanel.tsx`
- ゆめマガv2ダッシュボード: `app/dashboard/yumemaga-v2/page.tsx`
- カテゴリ管理セクション: `components/category-management/CategoryManagementSection.tsx`
- Google Sheets API連携: `lib/google-sheets.ts`
- Google Drive API連携: `lib/google-drive.ts`

### スプレッドシートID

**.env.local**:
```
YUMEMAGA_SPREADSHEET_ID=<ゆめマガ進捗管理スプレッドシートID>
```

**シート名**:
- 既存: `進捗入力シート`
- 新規: `工程マスター`
- 新規: `工程チェックリスト管理`

---

**作成者**: Claude Code
**承認者**: ゆめスタ 管理者
**次回更新**: Phase 1完了時
