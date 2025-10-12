# 契約業務フロー統合 - Phase 1.6 完全実装計画書

**作成日**: 2025年10月12日
**作成者**: Claude Code
**目的**: 顧客正式情報マスタを作成し、企業情報の一元管理とID管理を実現する
**バージョン**: v1.0

---

## 📋 目次

1. [Phase 1.5までの現状](#phase-15までの現状)
2. [Phase 1.6の背景と目的](#phase-16の背景と目的)
3. [データ構造設計](#データ構造設計)
4. [マイグレーション計画](#マイグレーション計画)
5. [API設計](#api設計)
6. [UI/UX設計](#uiux設計)
7. [実装スケジュール](#実装スケジュール)
8. [テスト計画](#テスト計画)
9. [Phase 2への移行](#phase-2への移行)

---

## Phase 1.5までの現状

### 実装済みの機能

**Phase 1（MVP）**:
- 13ステップカードグリッド表示
- プログレスバー（主要5ステップ）
- サイドパネル（Notion風）
- チェックリスト機能（LocalStorage）
- メール例文モーダル
- 契約・入金管理シート連動（読み取りのみ）

**Phase 1.5（実運用化）**:
- リマインダーカード表示（6種類のカードタイプ）
- 新規契約作成機能（情報収集フォーマットのパース）
- 契約選択機能（リマインダーカードから13ステップ表示）
- リソースメニュー（ヘッダー常時表示）
- フィルタ機能（進行中のみ/すべて表示）
- 進捗管理列（Q〜AC列）の追加

### 現在のデータ構造

#### 契約・入金管理シート（A〜AC列）

| 列 | 項目名 | データ型 |
|----|--------|---------|
| A | ID | 数値 |
| B | 企業名 | 文字列 |
| C | 契約サービス | 文字列 |
| D | 契約日 | 日付 |
| E | 契約金額 | 金額 |
| F | 入金方法 | 文字列 |
| G | 契約書送付 | 日付 |
| H | 契約書回収 | 日付 |
| I | 申込書送付 | 日付 |
| J | 申込書回収 | 日付 |
| K | 入金予定日 | 日付 |
| L | 入金実績日 | 日付 |
| M | 入金ステータス | 文字列 |
| N | 遅延日数 | 数値 |
| O | 掲載開始号 | 文字列 |
| P | 備考 | 文字列 |
| Q〜AC | ステップ1〜13完了日 | 日付 |

#### 情報収集フォーマットの内容

**基本情報**:
- 企業名・団体名
- 代表者役職
- 代表者名
- 住所
- 電話番号
- メールアドレス
- 送信先担当者名
- 送信先メールアドレス
- 契約締結日

**掲載プラン**:
- 契約料金（税別）
- 自動更新後の月額料金（税別）

**掲載期間**:
- 掲載開始
- 掲載終了

**広告仕様**:
- 掲載サイズ
- 掲載位置
- デザイン形式

**送付設定**:
- 基本契約書の送付（有/無）
- 申込書の送付（有/無）

**請求書情報**:
- 支払期限

---

## Phase 1.6の背景と目的

### 問題点の整理

#### 問題1: 情報の重複と不一致リスク

**事実**:
- 情報収集フォーマットには企業の詳細情報（代表者、住所、電話番号等）が含まれる
- 契約・入金管理シートには契約に直接関係する情報のみ（企業名、契約金額等）
- 情報収集フォーマットの詳細情報が活用されていない

**結果**:
- 企業の詳細情報を確認するために情報収集フォーマットを探す必要がある
- 企業情報の更新時に複数箇所を更新する必要がある（情報の不一致リスク）

#### 問題2: 企業名の表記ゆれ

**事実**:
- 契約・入金管理シートのB列は「企業名」（文字列）
- 顧客マスタのB列も「企業名」（文字列）
- 新規契約作成時に情報収集フォーマットから企業名を抽出して書き込む

**結果**:
- 企業名の表記ゆれ（例: 「株式会社A」「（株）A」「A社」）が発生する可能性
- 顧客マスタと契約・入金管理シートの企業名が一致しないと、リマインダー機能が正しく動作しない

#### 問題3: ステップ①「情報収集」カードの役割が不明確

**事実**:
- 新規契約作成時: 情報収集フォーマットを顧客に送信 → 返信内容をパース → 契約開始
- 既存契約のステップ①: 情報収集カードに外部リンク（情報収集フォーマット）があるが、既に契約シートにデータあり

**結果**:
- ステップ①カードの役割が新規契約と既存契約で異なる
- 既存契約でステップ①を開いたときに、情報収集フォーマットの情報と契約シートの情報を照合・更新する手段がない

### Phase 1.6の目的

**顧客正式情報マスタを作成し、以下を実現する**:

1. **企業情報の一元管理**: 情報収集フォーマットの全項目を1箇所で管理
2. **企業IDによる管理**: 表記ゆれに影響されない確実な企業特定
3. **情報の活用**: 必要な時に必要な企業情報を取得可能
4. **ステップ①の明確化**: 新規契約も既存契約も同じ情報源を参照

---

## データ構造設計

### 顧客正式情報マスタの設計

#### 新規シート: 顧客正式情報マスタ

**シート名**: `顧客正式情報マスタ`
**配置**: 営業予実管理スプレッドシート（`SALES_SPREADSHEET_ID`）
**目的**: 企業の正式情報を一元管理

#### 列構造（全25列）

| 列 | 項目名 | データ型 | 必須 | 説明 |
|----|--------|---------|------|------|
| A | 企業ID | 数値 | ✅ | 自動採番（連番） |
| B | 企業正式名称 | 文字列 | ✅ | 正式な企業名 |
| C | 企業略称 | 文字列 | ⬜ | 通称・略称 |
| D | 代表者役職 | 文字列 | ✅ | 例: 代表取締役 |
| E | 代表者名 | 文字列 | ✅ | 例: 山田太郎 |
| F | 郵便番号 | 文字列 | ✅ | 例: 123-4567 |
| G | 住所 | 文字列 | ✅ | 都道府県から番地まで |
| H | 電話番号 | 文字列 | ✅ | 例: 03-1234-5678 |
| I | FAX番号 | 文字列 | ⬜ | 例: 03-1234-5679 |
| J | メールアドレス | 文字列 | ✅ | 代表メールアドレス |
| K | HP URL | 文字列 | ⬜ | 企業ホームページURL |
| L | 担当者名 | 文字列 | ✅ | 窓口担当者名 |
| M | 担当者メールアドレス | 文字列 | ✅ | 窓口担当者メール |
| N | 担当者電話番号 | 文字列 | ⬜ | 窓口担当者電話 |
| O | 業種 | 文字列 | ⬜ | 例: 建設業 |
| P | 従業員数 | 数値 | ⬜ | 例: 50 |
| Q | 資本金 | 金額 | ⬜ | 例: ¥10,000,000 |
| R | 設立年月日 | 日付 | ⬜ | 例: 2000/04/01 |
| S | 備考 | 文字列 | ⬜ | その他メモ |
| T | 登録日 | 日付 | ✅ | 初回登録日 |
| U | 最終更新日 | 日付 | ✅ | 最後に編集した日 |
| V | データソース | 文字列 | ✅ | 情報収集フォーマット / 手動入力 / 顧客マスタ |
| W | 顧客マスタ企業名 | 文字列 | ⬜ | 顧客マスタで使用されている企業名（参照用） |
| X | 契約実績 | 数値 | ✅ | 契約回数（自動計算） |
| Y | 最新契約ID | 数値 | ⬜ | 最新の契約ID（参照用） |

---

### 契約・入金管理シートの修正

#### 修正内容

**B列を「企業名」から「企業ID」に変更**:

| 列 | 修正前 | 修正後 | データ型 |
|----|--------|--------|---------|
| A | ID | ID | 数値 |
| **B** | **企業名** | **企業ID** | **数値** |
| C | 契約サービス | 契約サービス | 文字列 |
| ... | ... | ... | ... |

**新規列を追加**:

| 列 | 項目名 | データ型 | 説明 |
|----|--------|---------|------|
| AD | 企業名（参照用） | 文字列 | 顧客正式情報マスタから自動取得（数式） |

**数式（AD列）**:
```
=VLOOKUP(B2, 顧客正式情報マスタ!A:B, 2, FALSE)
```

---

### 型定義の追加・修正

#### `/types/workflow.ts` への追加

```typescript
// 顧客正式情報マスタの型定義
export interface CompanyMasterData {
  companyId: number;              // A列
  officialName: string;           // B列
  shortName?: string;             // C列
  representativeTitle: string;    // D列
  representativeName: string;     // E列
  postalCode: string;             // F列
  address: string;                // G列
  phone: string;                  // H列
  fax?: string;                   // I列
  email: string;                  // J列
  websiteUrl?: string;            // K列
  contactPerson: string;          // L列
  contactEmail: string;           // M列
  contactPhone?: string;          // N列
  industry?: string;              // O列
  employeeCount?: number;         // P列
  capital?: string;               // Q列
  establishedDate?: string;       // R列
  notes?: string;                 // S列
  registeredDate: string;         // T列
  lastUpdatedDate: string;        // U列
  dataSource: string;             // V列
  customerMasterName?: string;    // W列
  contractCount: number;          // X列
  latestContractId?: number;      // Y列
}

// 契約データの型定義（修正）
export interface ContractData {
  id: number;                      // A列
  companyId: number;               // B列（修正: 企業名 → 企業ID）
  contractService: string;         // C列
  contractDate: string;            // D列
  amount: string;                  // E列
  paymentMethod: string;           // F列
  contractSentDate?: string;       // G列
  contractReceivedDate?: string;   // H列
  applicationSentDate?: string;    // I列
  applicationReceivedDate?: string;// J列
  paymentDueDate: string;          // K列
  paymentActualDate?: string;      // L列
  paymentStatus: string;           // M列
  delayDays?: number;              // N列
  publicationIssue: string;        // O列
  notes?: string;                  // P列
  step1CompletedAt?: string;       // Q列
  step2CompletedAt?: string;       // R列
  step3CompletedAt?: string;       // S列
  step4CompletedAt?: string;       // T列
  step5CompletedAt?: string;       // U列
  step6CompletedAt?: string;       // V列
  step7CompletedAt?: string;       // W列
  step8CompletedAt?: string;       // X列
  step9CompletedAt?: string;       // Y列
  step10CompletedAt?: string;      // Z列
  step11CompletedAt?: string;      // AA列
  step12CompletedAt?: string;      // AB列
  step13CompletedAt?: string;      // AC列
  companyName?: string;            // AD列（参照用、VLOOKUP）
}
```

---

## マイグレーション計画

### フェーズ1.6-M: データマイグレーション

#### M-1: 顧客正式情報マスタの作成

**手順**:
1. 営業予実管理スプレッドシートに新規シート「顧客正式情報マスタ」を追加
2. ヘッダー行を作成（A1〜Y1）
3. 初期データを投入（任意）

**実行方法**:
- 手動でGoogle Sheetsにシートを作成
- または、Google Sheets APIで自動作成（`sheets.spreadsheets.batchUpdate`）

#### M-2: 既存契約データのマイグレーション

**目的**: 契約・入金管理シートのB列「企業名」を「企業ID」に変換

**手順**:

1. **現在の契約・入金管理シートをバックアップ**
   - シート名: 「契約・入金管理_backup_YYYYMMDD」

2. **既存の企業名をリストアップ**
   - 契約・入金管理シートのB列から重複を除いたユニークな企業名を取得

3. **顧客正式情報マスタに企業データを登録**
   - 各企業に企業IDを採番
   - 企業正式名称 = 契約シートのB列の値
   - その他の項目は空欄（後で情報収集フォーマットから補完）

4. **契約・入金管理シートのB列を企業IDに置換**
   - VLOOKUP で企業名 → 企業ID に変換
   - 変換完了後、値として貼り付け

5. **AD列に企業名（参照用）の数式を追加**
   - `=VLOOKUP(B2, 顧客正式情報マスタ!A:B, 2, FALSE)`

**マイグレーションスクリプト**:

```typescript
// scripts/migrate-company-master.ts

import { getSheetData, updateSheetCell } from '@/lib/google-sheets';
import { google } from 'googleapis';

async function migrateCompanyMaster() {
  console.log('マイグレーション開始...');

  // 1. 既存の契約データを取得
  const contractData = await getSheetData(
    process.env.SALES_SPREADSHEET_ID!,
    '契約・入金管理!A:P'
  );

  // 2. ユニークな企業名を抽出
  const companyNames = new Set<string>();
  for (let i = 1; i < contractData.length; i++) {
    const companyName = contractData[i][1]; // B列
    if (companyName && companyName !== '') {
      companyNames.add(companyName);
    }
  }

  console.log(`ユニークな企業数: ${companyNames.size}`);

  // 3. 顧客正式情報マスタにデータを投入
  const companyMasterData = [];
  let companyId = 1;

  for (const companyName of companyNames) {
    companyMasterData.push([
      companyId,                    // A: 企業ID
      companyName,                  // B: 企業正式名称
      '',                           // C: 企業略称
      '',                           // D: 代表者役職
      '',                           // E: 代表者名
      '',                           // F: 郵便番号
      '',                           // G: 住所
      '',                           // H: 電話番号
      '',                           // I: FAX番号
      '',                           // J: メールアドレス
      '',                           // K: HP URL
      '',                           // L: 担当者名
      '',                           // M: 担当者メールアドレス
      '',                           // N: 担当者電話番号
      '',                           // O: 業種
      '',                           // P: 従業員数
      '',                           // Q: 資本金
      '',                           // R: 設立年月日
      '',                           // S: 備考
      new Date().toISOString().split('T')[0], // T: 登録日
      new Date().toISOString().split('T')[0], // U: 最終更新日
      'マイグレーション',           // V: データソース
      companyName,                  // W: 顧客マスタ企業名
      0,                            // X: 契約実績
      ''                            // Y: 最新契約ID
    ]);
    companyId++;
  }

  // Google Sheets API で書き込み
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SALES_SPREADSHEET_ID!,
    range: '顧客正式情報マスタ!A:Y',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: companyMasterData
    }
  });

  console.log('顧客正式情報マスタへのデータ投入完了');

  // 4. 契約・入金管理シートのB列を企業IDに置換
  // （この部分は手動で実施することを推奨）
  console.log('次のステップ: 契約・入金管理シートのB列を企業IDに置換してください');
  console.log('1. 新しい列を追加（例: AE列）');
  console.log('2. AE列に数式を入力: =VLOOKUP(B2, 顧客正式情報マスタ!B:A, 2, FALSE)');
  console.log('3. AE列をコピー → B列に値として貼り付け');
  console.log('4. AE列を削除');
}

migrateCompanyMaster();
```

**重要**: マイグレーションは本番環境で実行する前に、テスト環境で十分にテストしてください。

---

## API設計

### 1. `/api/company-master/list` - 企業一覧取得API

**メソッド**: `GET`

**機能**: 顧客正式情報マスタから全企業を取得

**レスポンス形式**:
```typescript
{
  success: boolean;
  companies: CompanyMasterData[];
}
```

---

### 2. `/api/company-master/[id]` - 企業詳細取得API

**メソッド**: `GET`

**機能**: 指定された企業IDの詳細情報を取得

**レスポンス形式**:
```typescript
{
  success: boolean;
  company: CompanyMasterData;
}
```

---

### 3. `/api/company-master/create` - 企業情報作成API

**メソッド**: `POST`

**機能**: 新しい企業情報を顧客正式情報マスタに追加

**リクエスト形式**:
```typescript
{
  parsedData: ParsedContractForm;
}
```

**レスポンス形式**:
```typescript
{
  success: boolean;
  companyId: number;
}
```

---

### 4. `/api/company-master/update/[id]` - 企業情報更新API

**メソッド**: `PUT`

**機能**: 既存の企業情報を更新

**リクエスト形式**:
```typescript
{
  updates: Partial<CompanyMasterData>;
}
```

**レスポンス形式**:
```typescript
{
  success: boolean;
}
```

---

### 5. `/api/contract/create` - 新規契約作成API（修正）

**修正内容**: 企業名ではなく企業IDを契約シートに書き込む

**実装ロジック（修正版）**:

```typescript
export async function POST(request: Request) {
  try {
    const { parsedData } = await request.json();

    // 1. 顧客正式情報マスタに企業情報を作成（または既存企業を取得）
    const companyRes = await fetch('/api/company-master/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parsedData })
    });

    const companyData = await companyRes.json();

    if (!companyData.success) {
      return NextResponse.json(
        { success: false, error: '企業情報の作成に失敗しました' },
        { status: 500 }
      );
    }

    const companyId = companyData.companyId;

    // 2. 契約・入金管理シートに新しい行を追加
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const sheetName = '契約・入金管理';

    // 現在の最大契約IDを取得
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    });

    const maxId = existingData.data.values
      ? Math.max(...existingData.data.values.slice(1).map(row => parseInt(row[0]) || 0))
      : 0;

    const newContractId = maxId + 1;

    // 新しい行を作成
    const newRow = [
      newContractId,                                    // A: 契約ID
      companyId,                                        // B: 企業ID（修正）
      '契約サービス名',                                  // C: 契約サービス
      parsedData.contractDate,                          // D: 契約日
      `¥${parsedData.annualFee.toLocaleString()}`,      // E: 契約金額
      '一括',                                           // F: 入金方法
      '',                                               // G: 契約書送付
      '',                                               // H: 契約書回収
      '',                                               // I: 申込書送付
      '',                                               // J: 申込書回収
      parsedData.paymentDeadline,                       // K: 入金予定日
      '',                                               // L: 入金実績日
      '未入金',                                         // M: 入金ステータス
      '',                                               // N: 遅延日数
      parsedData.publicationStart,                      // O: 掲載開始号
      '',                                               // P: 備考
      // Q〜AC列（進捗管理列）は空欄
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      // AD列（企業名参照用）は数式で自動取得されるため空欄
      ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:AD`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    return NextResponse.json({
      success: true,
      contractId: newContractId,
      companyId
    });

  } catch (error) {
    console.error('契約作成エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
```

---

## UI/UX設計

### ステップ①サイドパネルの強化

#### 既存の表示内容

**ステップ①: 情報収集**のサイドパネル:
- 概要文
- やることリスト
- ガイドリンク（情報収集フォーマットへの外部リンク）
- チェックリスト

#### 修正後の表示内容

**新規追加: 企業情報セクション**

```
┌─────────────────────────────────────────────┐
│ ステップ① 情報収集                          │
│                                             │
│ 【企業情報】                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ 📋 企業正式名称: 株式会社サンプル       │ │
│ │ 📍 住所: 東京都渋谷区...                │ │
│ │ ☎ 電話番号: 03-1234-5678               │ │
│ │ ✉ メールアドレス: info@example.com     │ │
│ │ 👤 担当者: 山田太郎 (yamada@...)       │ │
│ │                                         │ │
│ │ [詳細を表示] [編集]                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 【やることリスト】                           │
│ ✅ 情報収集フォーマットを顧客に送信          │
│ ⬜ 顧客から返信を受け取る                   │
│ ⬜ 情報に誤りがないか確認                   │
│                                             │
│ 【ガイド】                                   │
│ 📋 情報収集フォーマット（外部リンク）         │
│                                             │
└─────────────────────────────────────────────┘
```

**「詳細を表示」ボタンをクリック**:
- モーダルが開き、顧客正式情報マスタの全項目を表示
- 各項目は編集可能

**「編集」ボタンをクリック**:
- インライン編集モードに切り替え
- 保存ボタンで `/api/company-master/update/[id]` を呼び出し

---

### 新規契約モーダルの修正

#### 修正内容

**パース確認後に企業情報を表示**:

```
┌───────────────────────────────────────────────┐
│ パース成功 ✅                                 │
├───────────────────────────────────────────────┤
│ 【企業基本情報】                               │
│ 企業名: 株式会社サンプル                       │
│ 代表者: 代表取締役 山田太郎                    │
│ 住所: 〒123-4567 東京都渋谷区...              │
│ 電話: 03-1234-5678                            │
│ メール: info@example.com                      │
│                                               │
│ 【契約情報】                                   │
│ 契約金額: ¥744,000                            │
│ 掲載開始: 2025年12月号                        │
│ 契約締結日: 2025/10/12                        │
│ 支払期限: 2025/11/30                          │
│                                               │
│ ⚠ この企業は既に顧客正式情報マスタに登録済み   │
│   です。既存情報を更新しますか？               │
│   [ ] 既存情報を上書き更新する                │
│   [✓] 既存情報を保持する                      │
└───────────────────────────────────────────────┘
```

---

## 実装スケジュール

### Phase 1.6-1: データマイグレーション（1日目）

**作業内容**:
1. 顧客正式情報マスタシートの作成
2. マイグレーションスクリプトの作成
3. テスト環境でマイグレーション実行
4. 動作確認

**完了条件**:
- 顧客正式情報マスタシートが作成されている
- 既存の企業名が企業IDに変換されている
- AD列に企業名（参照用）の数式が入っている

---

### Phase 1.6-2: API実装（2日目）

**作業内容**:
1. `/api/company-master/list` API作成
2. `/api/company-master/[id]` API作成
3. `/api/company-master/create` API作成
4. `/api/company-master/update/[id]` API作成
5. `/api/contract/create` APIの修正
6. 動作確認

**完了条件**:
- 全APIが正しく動作する
- 企業情報の取得・作成・更新ができる
- 新規契約作成時に企業IDが正しく書き込まれる

---

### Phase 1.6-3: UI実装（3日目）

**作業内容**:
1. ステップ①サイドパネルに企業情報セクションを追加
2. 企業情報詳細モーダルの作成
3. インライン編集機能の実装
4. 新規契約モーダルの修正
5. 動作確認

**完了条件**:
- ステップ①サイドパネルに企業情報が表示される
- 詳細表示・編集ができる
- 新規契約作成時に企業情報が正しく処理される

---

### Phase 1.6-4: 既存機能の修正（4日目）

**作業内容**:
1. リマインダーAPIの修正（企業名を企業IDから取得）
2. 契約一覧表示の修正（企業名をVLOOKUPで取得）
3. 契約詳細取得APIの修正
4. 動作確認

**完了条件**:
- リマインダーカードに正しい企業名が表示される
- 契約一覧に正しい企業名が表示される
- 既存機能が正常に動作する

---

### Phase 1.6-5: 統合テスト・デバッグ（5日目）

**作業内容**:
1. 全機能の統合テスト
2. エラーハンドリングの確認
3. データ整合性の確認
4. デバッグ

**完了条件**:
- すべての機能が正しく動作する
- データの整合性が保たれている
- エラーが適切に処理される

---

## テスト計画

### 基本動作テスト

1. **企業情報の表示**
   - ステップ①サイドパネルを開く
   - 企業情報セクションに正しい情報が表示される

2. **企業情報の編集**
   - 「編集」ボタンをクリック
   - インライン編集モードに切り替わる
   - 情報を変更して「保存」をクリック
   - 顧客正式情報マスタに変更が反映される

3. **新規契約作成**
   - 新規契約モーダルを開く
   - 情報収集フォーマットを貼り付け
   - パース確認をクリック
   - 企業情報が正しく表示される
   - 契約開始をクリック
   - 顧客正式情報マスタに企業情報が作成される
   - 契約・入金管理シートに契約が作成される（企業IDが書き込まれる）

4. **リマインダーカードの表示**
   - リマインダーカードに正しい企業名が表示される

---

## Phase 2への移行

Phase 1.6の完了後、Phase 2でさらに以下の機能を追加します:

1. **スプレッドシートへの書き込み**
   - ステップ完了時に進捗列（Q〜AC列）に日付を自動記録

2. **Google Driveファイルアップロード**
   - 契約書・申込書のPDFをGoogle Driveに保存
   - フォルダ構造: 企業フォルダ → 契約フォルダ → ファイル

3. **入力フォームからのスプレッドシート更新**
   - サイドパネル内で直接スプレッドシートの値を編集可能

4. **自動リマインダー機能**
   - 入金予定日の3日前に自動通知
   - ステップ完了予定日の通知

5. **複数契約の同時管理**
   - タブ切り替えで複数契約を並行管理

---

## 完了条件

Phase 1.6が完了したと判断する条件:

- [ ] 顧客正式情報マスタシートが作成されている
- [ ] 既存契約データのマイグレーションが完了している
- [ ] 企業情報の取得・作成・更新APIが正しく動作する
- [ ] ステップ①サイドパネルに企業情報が表示される
- [ ] 企業情報の編集ができる
- [ ] 新規契約作成時に企業IDが正しく書き込まれる
- [ ] リマインダーカードに正しい企業名が表示される
- [ ] すべての機能が統合され、正しく動作する

---

**作成日**: 2025年10月12日
**作成者**: Claude Code
**バージョン**: v1.0
**次のステップ**: Phase 1.6-1（データマイグレーション）の実装を開始

以上
