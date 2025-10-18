# 顧客管理システム完全設計書

**作成日**: 2025-10-18
**対象**: ゆめマガ企業マスター（51列）の管理システム
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

**ゆめマガ企業マスター（51列）のデータベース管理システム**
- 企業一覧の閲覧
- 検索・フィルター機能
- 企業詳細の表示・編集

### データソース

```
ゆめマガ進捗管理スプレッドシート
└─ 企業マスター（51列）
   ├─ A列: 企業ID
   ├─ B列: 企業名
   ├─ C〜AX列: 企業情報（業種、ロゴ、サービス、代表者情報等）
   └─ 用途: ゆめマガ掲載企業のデータベース
```

### 契約企業マスタとの違い

**契約企業マスタ**（契約業務フロー用）:
- 営業管理スプレッドシート内
- 25項目
- 契約業務フローで管理
- 完全独立した管理

**ゆめマガ企業マスタ**（顧客管理ダッシュボード用）:
- ゆめマガ進捗管理スプレッドシート内
- 51列
- データベースとしての役割
- 顧客管理ダッシュボードで管理

---

## 目的と背景

### 目的

1. ゆめマガ掲載企業の情報を一元管理
2. 企業情報の検索・フィルタリング
3. 企業情報の閲覧・編集

### 重要な前提

- **既存のCompanyManagementSectionのUI/UXをベース**
- **読み取り専用ではなく、編集機能も実装**
- **新規企業登録は不要**（既存の企業情報入力フォームで対応）
- **削除機能は不要**

---

## データ構造

### 3.1 既存データ: ゆめマガ企業マスター

**スプレッドシート**: ゆめマガ進捗管理スプレッドシート
**シート名**: `企業マスター`
**用途**: ゆめマガ掲載企業のデータベース

**列構成（51列）**:

```
A列: 企業ID（必須）
B列: 企業名（必須）
C列: 企業名(カナ)
D列: 業種
E列: 事業エリア
F列: 説明文(一覧用)
G列: ロゴ画像パス
H列: ヒーロー画像パス
I列: QRコード画像パス
J列: スローガン
K列: 代表者名
L列: 代表者名(英語)
M列: 代表者役職
N列: 代表者写真パス
O列: サービス1_画像パス
P列: サービス1_タイトル
Q列: サービス1_説明
R列: サービス2_画像パス
S列: サービス2_タイトル
T列: サービス2_説明
U列: サービス3_画像パス
V列: サービス3_タイトル
W列: サービス3_説明
X列: 社長メッセージ
Y列: 社員1_画像パス
Z列: 社員1_質問
AA列: 社員1_回答
AB列: 社員2_画像パス
AC列: 社員2_質問
AD列: 社員2_回答
AE列: 社員3_画像パス
AF列: 社員3_質問
AG列: 社員3_回答
AH列: 取り組み1_タイトル
AI列: 取り組み1_説明
AJ列: 取り組み2_タイトル
AK列: 取り組み2_説明
AL列: 取り組み3_タイトル
AM列: 取り組み3_説明
AN列: 住所
AO列: 電話番号
AP列: FAX番号
AQ列: ウェブサイト
AR列: 問い合わせメール
AS列: 設立年
AT列: 従業員数
AU列: 事業内容
AV列: 初掲載号
AW列: 最終更新号
AX列: ステータス（新規/変更/継続/アーカイブ）
AY列: 備考
```

### 3.2 型定義

**既存の型定義**: `/api/yumemaga-v2/company-processes/route.ts` 内の `COMPANY_FIELDS`

**新規作成**: `types/customer.ts`

```typescript
// types/customer.ts

export interface YumeMagaCompany {
  // 基本情報
  companyId: string;              // A列（必須）
  companyName: string;            // B列（必須）
  companyNameKana?: string;       // C列
  industry?: string;              // D列
  area?: string;                  // E列
  description?: string;           // F列

  // 画像パス
  logoPath?: string;              // G列
  heroPath?: string;              // H列
  qrPath?: string;                // I列

  // 企業情報
  slogan?: string;                // J列
  presidentName?: string;         // K列
  presidentNameEn?: string;       // L列
  presidentPosition?: string;     // M列
  presidentPhoto?: string;        // N列

  // サービス情報
  service1ImagePath?: string;     // O列
  service1Title?: string;         // P列
  service1Desc?: string;          // Q列
  service2ImagePath?: string;     // R列
  service2Title?: string;         // S列
  service2Desc?: string;          // T列
  service3ImagePath?: string;     // U列
  service3Title?: string;         // V列
  service3Desc?: string;          // W列

  // 社長・社員情報
  presidentMessage?: string;      // X列
  member1ImagePath?: string;      // Y列
  member1Question?: string;       // Z列
  member1Answer?: string;         // AA列
  member2ImagePath?: string;      // AB列
  member2Question?: string;       // AC列
  member2Answer?: string;         // AD列
  member3ImagePath?: string;      // AE列
  member3Question?: string;       // AF列
  member3Answer?: string;         // AG列

  // 取り組み
  initiative1Title?: string;      // AH列
  initiative1Desc?: string;       // AI列
  initiative2Title?: string;      // AJ列
  initiative2Desc?: string;       // AK列
  initiative3Title?: string;      // AL列
  initiative3Desc?: string;       // AM列

  // 連絡先情報
  address?: string;               // AN列
  phone?: string;                 // AO列
  fax?: string;                   // AP列
  website?: string;               // AQ列
  email?: string;                 // AR列

  // その他
  established?: string;           // AS列
  employees?: string;             // AT列
  business?: string;              // AU列
  firstIssue?: string;            // AV列
  lastIssue?: string;             // AW列
  status?: 'new' | 'updated' | 'existing' | 'archive';  // AX列
  notes?: string;                 // AY列
}

export interface CompanyField {
  index: number;
  name: string;
  key: keyof YumeMagaCompany;
  value: string;
  filled: boolean;
  required: boolean;
}

export interface CompanyProgress {
  total: number;
  filled: number;
  notFilled: number;
  progressRate: number;
}
```

---

## UI設計

### 4.1 顧客管理ダッシュボード

**画面パス**: `/dashboard/customers`

**レイアウト**:

```
┌────────────────────────────────────────────────┐
│ 顧客管理ダッシュボード                          │
├────────────────────────────────────────────────┤
│ [検索: 企業名・業種...]  [更新]                 │
│ フィルター:                                     │
│ [業種: すべて ▼] [エリア: すべて ▼]            │
│ [ステータス: すべて ▼]                         │
├────────────────────────────────────────────────┤
│ サマリー                                        │
│ ┌────────┬────────┬────────┬────────┐        │
│ │ 総企業  │ 新規    │ 変更    │ 継続    │        │
│ │ 120社   │ 15社    │ 30社    │ 75社    │        │
│ └────────┴────────┴────────┴────────┘        │
├────────────────────────────────────────────────┤
│ 企業一覧（カード形式）                          │
│ ┌──────────────┐ ┌──────────────┐           │
│ │ 株式会社A      │ │ 株式会社B      │           │
│ │ ─────────────│ │ ─────────────│           │
│ │ 業種: IT      │ │ 業種: 製造業   │           │
│ │ エリア: 東京  │ │ エリア: 大阪   │           │
│ │ ステータス: 新規│ │ ステータス: 継続│           │
│ │ 進捗: 78%     │ │ 進捗: 100%    │           │
│ │               │ │               │           │
│ │ [詳細を開く]   │ │ [詳細を開く]   │           │
│ └──────────────┘ └──────────────┘           │
│ ┌──────────────┐ ┌──────────────┐           │
│ │ ...            │ │ ...            │           │
│ └──────────────┘ └──────────────┘           │
└────────────────────────────────────────────────┘
```

### 4.2 企業詳細モーダル

**モーダル構成**:

```
┌────────────────────────────────────────────────┐
│ 企業詳細 - 株式会社A                  [編集] [×]│
├────────────────────────────────────────────────┤
│ タブ: [基本情報] [サービス] [社員] [連絡先]    │
├────────────────────────────────────────────────┤
│                                                │
│ ■ 基本情報タブ                                  │
│ ┌──────────────────────────────────────────┐  │
│ │ 企業ID: A-001                              │  │
│ │ 企業名: 株式会社A                          │  │
│ │ 企業名(カナ): カブシキガイシャエー          │  │
│ │ 業種: IT・情報通信                         │  │
│ │ 事業エリア: 東京都                         │  │
│ │ 説明文: 〜〜〜                             │  │
│ │                                            │  │
│ │ ロゴ画像: [プレビュー]  [変更]             │  │
│ │ ヒーロー画像: [プレビュー]  [変更]         │  │
│ │                                            │  │
│ │ スローガン: 〜〜〜                         │  │
│ │ 代表者名: 山田太郎                         │  │
│ │ 代表者役職: 代表取締役社長                 │  │
│ │ 代表者写真: [プレビュー]  [変更]           │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ■ サービスタブ                                  │
│ ┌──────────────────────────────────────────┐  │
│ │ サービス1                                  │  │
│ │ ├─ タイトル: 〜〜〜                        │  │
│ │ ├─ 説明: 〜〜〜                            │  │
│ │ └─ 画像: [プレビュー]  [変更]             │  │
│ │                                            │  │
│ │ サービス2                                  │  │
│ │ ├─ タイトル: 〜〜〜                        │  │
│ │ ├─ 説明: 〜〜〜                            │  │
│ │ └─ 画像: [プレビュー]  [変更]             │  │
│ │                                            │  │
│ │ サービス3                                  │  │
│ │ ├─ タイトル: 〜〜〜                        │  │
│ │ ├─ 説明: 〜〜〜                            │  │
│ │ └─ 画像: [プレビュー]  [変更]             │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ■ 社員タブ                                      │
│ ┌──────────────────────────────────────────┐  │
│ │ 社長メッセージ:                            │  │
│ │ [テキストエリア]                           │  │
│ │                                            │  │
│ │ 社員1                                      │  │
│ │ ├─ 質問: 〜〜〜                            │  │
│ │ ├─ 回答: 〜〜〜                            │  │
│ │ └─ 画像: [プレビュー]  [変更]             │  │
│ │                                            │  │
│ │ 社員2, 社員3 同様                          │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ■ 連絡先タブ                                    │
│ ┌──────────────────────────────────────────┐  │
│ │ 住所: 〒XXX-XXXX 東京都〜                  │  │
│ │ 電話番号: 03-XXXX-XXXX                     │  │
│ │ FAX番号: 03-XXXX-XXXX                      │  │
│ │ ウェブサイト: https://example.com          │  │
│ │ 問い合わせメール: info@example.com         │  │
│ │ 設立年: 2010年                             │  │
│ │ 従業員数: 50名                             │  │
│ │ 事業内容: 〜〜〜                           │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ [保存] [キャンセル]                             │
└────────────────────────────────────────────────┘
```

### 4.3 編集モード

**編集時の動作**:
1. [編集]ボタンをクリック
2. フィールドが入力可能になる
3. [保存]ボタンで更新API実行
4. スプレッドシートに書き込み
5. モーダルを閉じて一覧を再取得

**編集可能フィールド**: 51列すべて（企業IDは編集不可）

---

## 実装手順

### Phase 1: 型定義とAPI基礎（0.5週間）

#### タスク1: 型定義作成
- ファイル: `types/customer.ts`
- 内容: `YumeMagaCompany`, `CompanyField`, `CompanyProgress`型定義

#### タスク2: 既存APIの確認
- `/api/yumemaga-v2/companies/route.ts` - 企業一覧取得
- `/api/yumemaga-v2/company-processes/route.ts` - 企業詳細取得

---

### Phase 2: 顧客管理API実装（1週間）

#### タスク3: 企業一覧取得API拡張
- ファイル: `/api/customers/list/route.ts`
- 機能:
  - ゆめマガ企業マスター（51列）を取得
  - クエリパラメータでフィルタリング対応
    - `industry`: 業種フィルター
    - `area`: エリアフィルター
    - `status`: ステータスフィルター（new/updated/existing/archive）
    - `search`: 企業名・業種での検索

```typescript
GET /api/customers/list?industry=IT&area=東京&search=株式会社A
```

#### タスク4: 企業詳細取得API
- ファイル: `/api/customers/[id]/route.ts`
- 機能: 企業IDから51列すべてを取得

```typescript
GET /api/customers/[companyId]
```

#### タスク5: 企業情報更新API
- ファイル: `/api/customers/[id]/route.ts` (PUT)
- 機能: 企業情報の更新（スプレッドシート書き込み）

```typescript
PUT /api/customers/[companyId]
Body: {
  companyName: "株式会社A",
  industry: "IT",
  // ... 更新したいフィールド
}
```

---

### Phase 3: 顧客管理ダッシュボード画面実装（1.5週間）

#### タスク6: 顧客管理ダッシュボード画面作成
- ファイル: `app/dashboard/customers/page.tsx`
- コンポーネント:
  - サマリーカード（総企業数、新規、変更、継続）
  - 検索バー
  - フィルタードロップダウン（業種、エリア、ステータス）
  - 企業カードグリッド

#### タスク7: 企業カードコンポーネント
- ファイル: `components/customers/CompanyCard.tsx`
- 内容:
  - 企業名、業種、エリア、ステータスバッジ
  - 進捗率（51列の入力状況）
  - [詳細を開く]ボタン

#### タスク8: 企業詳細モーダルコンポーネント
- ファイル: `components/customers/CompanyDetailModal.tsx`
- 内容:
  - タブ構成（基本情報、サービス、社員、連絡先）
  - 各タブの表示・編集フォーム
  - 保存・キャンセルボタン

#### タスク9: 検索・フィルター機能実装
- 検索: 企業名・業種でのインクリメンタルサーチ
- フィルター: 業種、エリア、ステータスのドロップダウン
- 複数条件の組み合わせ対応

---

### Phase 4: 統合・テスト（0.5週間）

#### タスク10: トップページへの導線追加
- `app/page.tsx`のサイドメニューに「顧客管理」リンク追加

#### タスク11: 動作確認
- 企業一覧表示のテスト
- 検索・フィルターのテスト
- 企業詳細表示のテスト
- 編集・保存のテスト

#### タスク12: ドキュメント更新
- `docs/development/development-progress.md`更新

---

## API設計

### 6.1 企業一覧取得API

#### GET /api/customers/list

**クエリパラメータ**:
- `industry`: 業種フィルター（optional）
- `area`: エリアフィルター（optional）
- `status`: ステータスフィルター（optional）
- `search`: 検索ワード（optional）

**レスポンス**:
```json
{
  "success": true,
  "companies": [
    {
      "companyId": "A-001",
      "companyName": "株式会社A",
      "companyNameKana": "カブシキガイシャエー",
      "industry": "IT・情報通信",
      "area": "東京都",
      "description": "〜〜〜",
      "logoPath": "path/to/logo.png",
      "status": "new",
      "progress": {
        "total": 51,
        "filled": 40,
        "notFilled": 11,
        "progressRate": 78
      }
    },
    ...
  ],
  "total": 120,
  "summary": {
    "total": 120,
    "new": 15,
    "updated": 30,
    "existing": 75,
    "archive": 0
  }
}
```

---

### 6.2 企業詳細取得API

#### GET /api/customers/[id]

**レスポンス**:
```json
{
  "success": true,
  "company": {
    "companyId": "A-001",
    "companyName": "株式会社A",
    "companyNameKana": "カブシキガイシャエー",
    "industry": "IT・情報通信",
    "area": "東京都",
    "description": "〜〜〜",
    "logoPath": "path/to/logo.png",
    "heroPath": "path/to/hero.jpg",
    "qrPath": "path/to/qr.png",
    "slogan": "〜〜〜",
    "presidentName": "山田太郎",
    "presidentNameEn": "Taro Yamada",
    "presidentPosition": "代表取締役社長",
    "presidentPhoto": "path/to/president.jpg",
    // ... 51列すべて
    "status": "new",
    "notes": "備考",
    "progress": {
      "total": 51,
      "filled": 40,
      "notFilled": 11,
      "progressRate": 78
    },
    "fields": [
      {
        "index": 0,
        "name": "企業ID",
        "key": "companyId",
        "value": "A-001",
        "filled": true,
        "required": true
      },
      // ... 全フィールド
    ]
  }
}
```

---

### 6.3 企業情報更新API

#### PUT /api/customers/[id]

**リクエスト**:
```json
{
  "companyName": "株式会社A（更新後）",
  "industry": "IT・情報通信",
  "description": "新しい説明文",
  // ... 更新したいフィールド
}
```

**レスポンス**:
```json
{
  "success": true,
  "company": {
    // 更新後の企業情報
  }
}
```

---

## 注意事項

### 7.1 実装時の絶対的なルール

1. **新規企業登録は不要**
   - 既存の企業情報入力フォーム（`/dashboard/yumemaga-v2/company-form`）で対応
   - 顧客管理ダッシュボードは編集・閲覧のみ

2. **削除機能は不要**
   - ステータスを「アーカイブ」に変更することで対応

3. **契約企業マスタとの違いを明確に**
   - 契約企業マスタ: 契約業務フロー用（25項目、営業管理スプレッドシート）
   - ゆめマガ企業マスタ: データベース用（51列、ゆめマガ進捗管理スプレッドシート）

4. **UI/UXは既存のCompanyManagementSectionをベース**
   - カード形式
   - 展開式
   - いい感じのデザイン

---

### 7.2 既存実装との連携

**既存のAPI**:
- `/api/yumemaga-v2/companies/route.ts` - 企業一覧（企業ID、企業名のみ）
- `/api/yumemaga-v2/company-processes/route.ts` - 企業詳細（51列すべて + 工程進捗）

**新規API**:
- `/api/customers/list/route.ts` - 企業一覧（51列すべて + フィルタリング）
- `/api/customers/[id]/route.ts` - 企業詳細取得・更新

**既存のコンポーネント**:
- `components/company-management/CompanyManagementSection.tsx` - 企業管理セクション
- `components/company-management/CompanyCard.tsx` - 企業カード

**新規コンポーネント**:
- `app/dashboard/customers/page.tsx` - 顧客管理ダッシュボード
- `components/customers/CompanyDetailModal.tsx` - 企業詳細モーダル

---

### 7.3 データの整合性

**スプレッドシート書き込み時の注意**:
- 企業IDは変更不可（一意キー）
- 必須フィールド（企業ID、企業名）は空にしない
- ステータスは「新規/変更/継続/アーカイブ」のいずれか

---

## 補足資料

### 参考ファイル

- 既存の企業管理API: `/api/yumemaga-v2/company-processes/route.ts`
- 既存の企業管理コンポーネント: `components/company-management/CompanyManagementSection.tsx`
- Google Sheets API連携: `lib/google-sheets.ts`

### スプレッドシートID

**.env.local**:
```
YUMEMAGA_SPREADSHEET_ID=<ゆめマガ進捗管理スプレッドシートID>
```

**シート名**:
- `企業マスター`

---

**作成者**: Claude Code
**承認者**: ゆめスタ 管理者
**次回更新**: 実装完了時
