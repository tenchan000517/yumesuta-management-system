# 契約業務フロー統合 - Phase 1.5 完全実装計画書

**作成日**: 2025年10月12日
**作成者**: Claude Code
**目的**: Phase 1実装後に判明した要件不足を解消し、実運用可能な契約業務フローを実装する
**バージョン**: v1.0

---

## 📋 目次

1. [Phase 1で判明した問題点](#phase-1で判明した問題点)
2. [Phase 1.5の目的](#phase-15の目的)
3. [要件定義](#要件定義)
4. [データ構造設計](#データ構造設計)
5. [API設計](#api設計)
6. [UI/UX設計](#uiux設計)
7. [コンポーネント設計](#コンポーネント設計)
8. [実装スケジュール](#実装スケジュール)
9. [テスト計画](#テスト計画)

---

## Phase 1で判明した問題点

### 問題1: 「どの企業の」契約を管理しているのか不明確

**事実**:
- Phase 1の実装では、13ステップカードが表示されるが、どの企業の契約を進めているのか明示されていない
- 契約・入金管理シートには複数企業のデータが入っているが、特定の1契約を選択する仕組みがない

**結果**:
- 実運用では使用不可能

---

### 問題2: 新規契約の開始方法が未実装

**事実**:
- Phase 1では、契約・入金管理シートにデータが既に存在する前提で実装されている
- 新規契約をダッシュボードから開始する機能がない

**結果**:
- 契約開始のたびにスプレッドシートを直接編集する必要がある

---

### 問題3: 進捗管理列が存在しない

**事実**:
- 契約・入金管理シートには16列（A〜P列）しかない
- 13ステップの進捗状況を記録する列が存在しない

**結果**:
- ダッシュボードで進捗を表示できない
- LocalStorageのみで管理しており、他のユーザーと共有できない

---

### 問題4: リソースへのアクセス導線がない

**事実**:
- 情報収集フォーマットは、ステップ①カードに存在する
- しかし、契約未選択状態ではステップカードが表示されない
- 新規契約作成時に情報収集フォーマットにアクセスできない

**結果**:
- 新規契約を開始できない（詰み）

---

## Phase 1.5の目的

Phase 1の実装を実運用可能な状態にするため、以下の機能を追加実装する:

1. **契約選択機能**: 複数契約から特定の契約を選択し、その契約専用の13ステップを表示
2. **新規契約作成機能**: 情報収集フォーマットの内容を貼り付けて新規契約を開始
3. **進捗管理機能**: 契約・入金管理シートに進捗列を追加し、ステップ完了状況を記録・表示
4. **リマインダー機能**: 受注済み企業の契約開始漏れや入金遅延を自動検知して通知
5. **リソースメニュー**: 情報収集フォーマット等のリソースに常時アクセス可能にする

---

## 要件定義

### ユーザーの要件（事実のみ）

以下は、ユーザーから2025年10月12日に直接指示された内容です。

#### 要件1: 新規契約作成フロー

**ユーザーの指示**:
> 「新規作成ボタンの設置。そこで情報収集した内容をフィールドに貼り付け、開始をクリックしたら契約・入金管理シートに該当箇所が書き込まれる」

**実装すべき内容**:
1. 「新規契約」ボタンを設置
2. ボタンをクリックするとモーダルが開く
3. モーダル内に大きなテキストエリアを配置
4. ユーザーが情報収集フォーマットの内容（顧客から返信されたもの）を貼り付ける
5. 「パース確認」ボタンでテキストを解析し、結果を表示
6. 「契約開始」ボタンで契約・入金管理シートに新しい行を追加

---

#### 要件2: 契約選択機能

**ユーザーの指示**:
> 「『どの』はこの入金管理シートから取得している。セクションを選択したらその該当する企業の進捗管理がダッシュボードに表示されるようにする」

**実装すべき内容**:
1. 契約一覧（リマインダーカード）を表示
2. カードをクリックすると、その契約が選択される
3. 選択された契約の13ステップカードグリッドが画面下部に表示される
4. 13ステップの進捗は、契約・入金管理シートの該当行から取得

---

#### 要件3: 進捗管理

**ユーザーの指示**:
> 「該当企業の進捗管理については、契約入金管理シートにもし進捗更新用の列が必要であればそこに追記して都度進捗が更新されたら書き込んでそこで進捗管理し、ダッシュボードはそれを読みこんで進捗管理する」

**実装すべき内容**:
1. 契約・入金管理シートに進捗管理列を追加（Q〜AC列: ステップ1〜13完了日）
2. ステップ完了時に該当列に日付を書き込む（Phase 2で実装）
3. ダッシュボードは進捗列を読み込んで表示（Phase 1.5で実装）

---

#### 要件4: リマインダー機能

**ユーザーの指示**:
> 「顧客マスタのS列が『受注』ステータスになってる企業を自動的に取得し、契約・入金管理のB列のその企業がなければ新規契約業務を開始するようにリマインダーが表示されるようにしましょう」
>
> 「ヘッダーリソースメニューの下に、各企業の未完了の存在するもの（入金ステータス含む）のカードが出てくるようにし、これで進捗管理しましょうか。そうすれば抜けもれも無くなると思う。これは他のダッシュボード同様、カードの色で視覚的に状況がわかるようにしたいね」

**実装すべき内容**:
1. 顧客マスタのS列（ステータス）が「受注」の企業を取得
2. その企業が契約・入金管理シートのB列に存在しないなら、新規契約必要リマインダーを表示
3. 既存契約の進捗状況を判定し、適切なリマインダーカードを表示
   - 🔴 新規契約必要: 受注済みだが契約未開始
   - 🟠 入金遅延: 入金予定日を過ぎている
   - 🟡 入金待ち: 入金予定日前
   - 🔵 進行中: 入金済みだがステップ未完了
   - 🟢 完了: 全ステップ完了
4. カードの色で視覚的に状況を表示

---

#### 要件5: フィルタ機能

**ユーザーの指示**:
> 「完了カードは一旦非表示でいいんだけど、フィルタ機能ですべて（デフォルトは完了非表示）にしたら出てくるように」
>
> 「契約満了日の2か月前に契約満了が近いということでデフォルトで出現するようにしようか」

**実装すべき内容**:
1. フィルタドロップダウンを設置
   - デフォルト: 「進行中のみ」（完了カード非表示）
   - 「すべて表示」（完了カードも表示）
2. 完了カードの表示条件:
   - フィルタが「すべて表示」の場合
   - または、契約満了日の60日前になった場合（自動表示）
3. 契約満了日の60日前の完了カードは、「契約満了近い」として🟣紫色で表示

---

#### 要件6: リソースメニュー

**ユーザーの指示**:
> 「情報収集カードは今のままでいいのでね。ここを消そうとかはしなくていいですが、新規作成ボタンにも情報収集フォーマットリンクを表示するか、どこか常に表示されるいい感じの場所にこれがないと開けないのでここは利便性が重要ですね。各種フォーマット・リンクのリッチメニューがヘッダーにあってもいいかもですね」
>
> 「※なぜなら今の既存のカードは企業選択しないと出てこなくなる仕様になるはずだから新規作成前には情報収集カードは存在しないという想定」

**実装すべき内容**:
1. ヘッダーに「リソース」ドロップダウンメニューを追加
2. 常時表示（契約選択状態に関係なく）
3. メニュー内容:
   - 📋 情報収集フォーマット
   - 📄 基本契約書（原本）
   - 📄 申込書（原本）
   - 🔗 マネーフォワード
   - 📧 メール例文一覧
4. 各リンクは外部リンクで新しいタブで開く

---

#### 要件7: カードクリック時の挙動

**ユーザーの指示**:
> 「各カードをクリックしたら、今の既存のステップバイステップカードグリッドが該当する企業の情報を取得している状態で出現する感じであればいい感じじゃない？」

**実装すべき内容**:
1. リマインダーカードをクリック
2. 該当契約のデータを取得
3. 画面下部に13ステップカードグリッドをスムーズスクロール表示
4. 各ステップの進捗状況を反映
   - ✅ 完了（日付あり）
   - 🔵 進行中（次に進めるステップ）
   - ⬜ 未着手

---

## データ構造設計

### 契約・入金管理シートの拡張

#### 既存の列構造（A〜P列）

| 列 | 項目名 | データ型 | 説明 |
|----|--------|---------|------|
| A | ID | 数値 | 契約ID（連番） |
| B | 企業名 | 文字列 | 契約企業名 |
| C | 契約サービス | 文字列 | サービス名（例: ゆめマガ） |
| D | 契約日 | 日付 | 契約成立日（YYYY/MM/DD形式） |
| E | 契約金額 | 金額 | 契約金額（税込、¥表記あり） |
| F | 入金方法 | 文字列 | 一括 / 分割 |
| G | 契約書送付 | 日付 | 基本契約書送付日 |
| H | 契約書回収 | 日付 | 基本契約書回収日 |
| I | 申込書送付 | 日付 | 申込書送付日 |
| J | 申込書回収 | 日付 | 申込書回収日 |
| K | 入金予定日 | 日付 | 入金予定日 |
| L | 入金実績日 | 日付 | 実際の入金日 |
| M | 入金ステータス | 文字列 | 未入金 / 入金済 |
| N | 遅延日数 | 数値 | 入金遅延日数（自動計算） |
| O | 掲載開始号 | 文字列 | 掲載開始号（例: 2025年12月号） |
| P | 備考 | 文字列 | 備考欄 |

---

#### 新規追加: 進捗管理列（Q〜AC列）

**Phase 1.5で追加する列**:

| 列 | 項目名 | データ型 | 説明 |
|----|--------|---------|------|
| Q | ステップ1完了日 | 日付 | 情報収集完了日 |
| R | ステップ2完了日 | 日付 | 基本契約書作成完了日 |
| S | ステップ3完了日 | 日付 | 基本契約書の押印・送信完了日 |
| T | ステップ4完了日 | 日付 | 申込書作成完了日 |
| U | ステップ5完了日 | 日付 | 申込書の押印・送信完了日 |
| V | ステップ6完了日 | 日付 | 重要事項説明完了日 |
| W | ステップ7完了日 | 日付 | 契約完了確認完了日 |
| X | ステップ8完了日 | 日付 | 請求書作成・送付完了日 |
| Y | ステップ9完了日 | 日付 | 入金確認完了日 |
| Z | ステップ10完了日 | 日付 | 入金管理シート更新完了日 |
| AA | ステップ11完了日 | 日付 | 入金確認連絡・原稿依頼完了日 |
| AB | ステップ12完了日 | 日付 | 制作・校正完了日 |
| AC | ステップ13完了日 | 日付 | 掲載完了日 |

**データ形式**: `YYYY/MM/DD`（例: `2025/10/12`）
**空欄の扱い**: 空文字列（`""`）= 未完了

---

### 情報収集フォーマットのデータ構造

#### 情報収集フォーマットの形式

**ユーザーから提供されたフォーマット**:

```
【◎基本情報】(※すべて必須入力)

企業名・団体名:
代表者役職:
代表者名:
住所:〒
電話番号:
メールアドレス:

送信先担当者名:
送信先メールアドレス:

契約締結日: 令和　年　月　日

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎掲載プラン】

契約料金（税別）:             円/年
自動更新後の月額料金（税別）:             円/月

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎掲載期間】

掲載開始: 令和　年　月号
掲載終了: 令和　年　月号（12ヶ月間）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎広告仕様】

掲載サイズ:
掲載位置:
デザイン形式:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎送付設定】

基本契約書の送付: □ 有  □ 無
申込書の送付:     □ 有  □ 無

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎請求書情報】(※後で請求書作成時に使用)

支払期限: 令和　年　月　日
```

---

#### パース処理で抽出するフィールド

```typescript
interface ParsedContractForm {
  // 基本情報
  companyName: string;           // 企業名・団体名
  representativeTitle: string;   // 代表者役職
  representativeName: string;    // 代表者名
  address: string;               // 住所
  phone: string;                 // 電話番号
  email: string;                 // メールアドレス
  contactPerson: string;         // 送信先担当者名
  contactEmail: string;          // 送信先メールアドレス
  contractDate: string;          // 契約締結日（YYYY/MM/DD形式に変換）

  // 掲載プラン
  annualFee: number;             // 契約料金（税別）
  monthlyFee: number;            // 自動更新後の月額料金（税別）

  // 掲載期間
  publicationStart: string;      // 掲載開始（例: 2025年12月号）
  publicationEnd: string;        // 掲載終了（例: 2026年11月号）

  // 広告仕様
  adSize: string;                // 掲載サイズ
  adPosition: string;            // 掲載位置
  designFormat: string;          // デザイン形式

  // 送付設定
  sendBasicContract: boolean;    // 基本契約書の送付（有/無）
  sendApplication: boolean;      // 申込書の送付（有/無）

  // 請求書情報
  paymentDeadline: string;       // 支払期限（YYYY/MM/DD形式に変換）
}
```

---

### 型定義の追加

#### `/types/workflow.ts` への追加

```typescript
// 既存の型定義に追加

export interface ContractData {
  // 既存フィールド（A〜P列）
  id: number;
  companyName: string;
  contractService: string;
  contractDate: string;
  amount: string;
  paymentMethod: string;
  contractSentDate?: string;
  contractReceivedDate?: string;
  applicationSentDate?: string;
  applicationReceivedDate?: string;
  paymentDueDate: string;
  paymentActualDate?: string;
  paymentStatus: string;
  delayDays?: number;
  publicationIssue: string;
  notes?: string;

  // 新規追加: 進捗管理フィールド（Q〜AC列）
  step1CompletedAt?: string;  // Q列
  step2CompletedAt?: string;  // R列
  step3CompletedAt?: string;  // S列
  step4CompletedAt?: string;  // T列
  step5CompletedAt?: string;  // U列
  step6CompletedAt?: string;  // V列
  step7CompletedAt?: string;  // W列
  step8CompletedAt?: string;  // X列
  step9CompletedAt?: string;  // Y列
  step10CompletedAt?: string; // Z列
  step11CompletedAt?: string; // AA列
  step12CompletedAt?: string; // AB列
  step13CompletedAt?: string; // AC列
}

export interface ReminderCard {
  type: 'new-contract-required' | 'payment-overdue' | 'payment-pending' | 'in-progress' | 'completed' | 'contract-expiry-near';
  companyName: string;
  contractId?: number;
  priority: 'high' | 'medium' | 'low';

  // 入金関連
  paymentDueDate?: string;
  delayDays?: number;

  // 進捗関連
  completedSteps?: number;
  totalSteps?: number;

  // 契約満了関連
  contractEndDate?: string;
  daysUntilExpiry?: number;
}

export interface ParsedContractForm {
  companyName: string;
  representativeTitle: string;
  representativeName: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  contactEmail: string;
  contractDate: string;
  annualFee: number;
  monthlyFee: number;
  publicationStart: string;
  publicationEnd: string;
  adSize: string;
  adPosition: string;
  designFormat: string;
  sendBasicContract: boolean;
  sendApplication: boolean;
  paymentDeadline: string;
}
```

---

## API設計

### 1. `/api/contract/reminders` - リマインダー取得API

**メソッド**: `GET`

**機能**:
- 顧客マスタから「受注」ステータスの企業を取得
- 契約・入金管理シートと照合
- リマインダーカードを生成

**レスポンス形式**:
```typescript
{
  success: boolean;
  reminders: ReminderCard[];
}
```

**実装ロジック**:

```typescript
export async function GET() {
  // 1. 顧客マスタから「受注」ステータスの企業を取得
  const customerMaster = await getSheetData(
    process.env.SALES_SPREADSHEET_ID!,
    '顧客マスタ!A:S'
  );

  const receivedOrders = customerMaster
    .slice(1) // ヘッダー行をスキップ
    .filter(row => row[18] === '受注') // S列（インデックス18）
    .map(row => ({
      companyName: row[1] // B列（インデックス1）
    }));

  // 2. 契約・入金管理シートから全契約を取得
  const contractSheet = await getSheetData(
    process.env.SALES_SPREADSHEET_ID!,
    '契約・入金管理!A:AC'
  );

  const reminders: ReminderCard[] = [];

  // 3. 新規契約必要チェック
  for (const order of receivedOrders) {
    const existsInContract = contractSheet
      .slice(1)
      .some(row => row[1] === order.companyName);

    if (!existsInContract) {
      reminders.push({
        type: 'new-contract-required',
        companyName: order.companyName,
        priority: 'high'
      });
    }
  }

  // 4. 既存契約の進捗チェック
  for (let i = 1; i < contractSheet.length; i++) {
    const row = contractSheet[i];

    // 空行をスキップ
    if (!row[0] || !row[1]) continue;

    const contractId = parseInt(row[0]);
    const companyName = row[1];
    const paymentStatus = row[12]; // M列
    const paymentDueDate = row[10]; // K列
    const publicationIssue = row[14]; // O列

    // 進捗列（Q〜AC列 = インデックス16〜28）
    const stepCompletions = row.slice(16, 29);
    const completedSteps = stepCompletions.filter(d => d && d !== '').length;

    // 4-1. 入金遅延チェック
    if (paymentStatus === '未入金' && paymentDueDate) {
      const dueDate = new Date(paymentDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        const delayDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        reminders.push({
          type: 'payment-overdue',
          companyName,
          contractId,
          paymentDueDate,
          delayDays,
          priority: 'high'
        });
        continue;
      }
    }

    // 4-2. 入金待ちチェック
    if (paymentStatus === '未入金') {
      reminders.push({
        type: 'payment-pending',
        companyName,
        contractId,
        paymentDueDate,
        priority: 'medium'
      });
      continue;
    }

    // 4-3. 進行中チェック
    if (completedSteps < 13) {
      reminders.push({
        type: 'in-progress',
        companyName,
        contractId,
        completedSteps,
        totalSteps: 13,
        priority: 'low'
      });
      continue;
    }

    // 4-4. 完了チェック
    if (completedSteps === 13 && paymentStatus === '入金済') {
      // 契約満了日を計算（掲載開始 + 12ヶ月）
      const contractEndDate = calculateContractEndDate(publicationIssue);
      const daysUntilExpiry = calculateDaysUntil(contractEndDate);

      // 60日以内なら「契約満了近い」
      if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
        reminders.push({
          type: 'contract-expiry-near',
          companyName,
          contractId,
          contractEndDate,
          daysUntilExpiry,
          priority: 'medium'
        });
      } else {
        // それ以外は完了カード（フィルタで非表示）
        reminders.push({
          type: 'completed',
          companyName,
          contractId,
          contractEndDate,
          priority: 'low'
        });
      }
    }
  }

  // 優先度順にソート
  reminders.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return NextResponse.json({
    success: true,
    reminders
  });
}

// ヘルパー関数
function calculateContractEndDate(publicationStart: string): string {
  // 例: "2025年12月号" → "2026/11/30"
  const match = publicationStart.match(/(\d{4})年(\d{1,2})月号/);
  if (!match) return '';

  const year = parseInt(match[1]);
  const month = parseInt(match[2]);

  // 12ヶ月後の月末
  const endDate = new Date(year, month + 11, 0);
  return endDate.toISOString().split('T')[0].replace(/-/g, '/');
}

function calculateDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  return Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
```

---

### 2. `/api/contract/create` - 新規契約作成API

**メソッド**: `POST`

**機能**:
- 情報収集フォーマットのテキストをパース
- 契約・入金管理シートに新しい行を追加

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
  contractId?: number;
  error?: string;
}
```

**実装ロジック**:

```typescript
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { parsedData } = await request.json();

    // Google Sheets API クライアント初期化
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const sheetName = '契約・入金管理';

    // 1. 現在の最大IDを取得
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    });

    const maxId = existingData.data.values
      ? Math.max(...existingData.data.values.slice(1).map(row => parseInt(row[0]) || 0))
      : 0;

    const newId = maxId + 1;

    // 2. 新しい行を作成
    const newRow = [
      newId,                                    // A: ID
      parsedData.companyName,                   // B: 企業名
      '契約サービス名（デフォルト値）',          // C: 契約サービス
      parsedData.contractDate,                  // D: 契約日
      `¥${parsedData.annualFee.toLocaleString()}`, // E: 契約金額
      '一括',                                   // F: 入金方法
      '',                                       // G: 契約書送付
      '',                                       // H: 契約書回収
      '',                                       // I: 申込書送付
      '',                                       // J: 申込書回収
      parsedData.paymentDeadline,               // K: 入金予定日
      '',                                       // L: 入金実績日
      '未入金',                                 // M: 入金ステータス
      '',                                       // N: 遅延日数
      parsedData.publicationStart,              // O: 掲載開始号
      '',                                       // P: 備考
      // Q〜AC列（進捗管理列）は空欄
      '', '', '', '', '', '', '', '', '', '', '', '', ''
    ];

    // 3. シートに追加
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:AC`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    return NextResponse.json({
      success: true,
      contractId: newId
    });

  } catch (error) {
    console.error('契約作成エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}
```

---

### 3. `/api/contract/[id]` - 契約詳細取得API

**メソッド**: `GET`

**機能**:
- 指定されたIDの契約データを取得
- 進捗状況を含む

**レスポンス形式**:
```typescript
{
  success: boolean;
  contract: ContractData;
}
```

**実装ロジック**:

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = parseInt(params.id);

    // 契約・入金管理シートから全データ取得
    const contractSheet = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約・入金管理!A:AC'
    );

    // 該当行を検索
    const row = contractSheet.slice(1).find(r => parseInt(r[0]) === contractId);

    if (!row) {
      return NextResponse.json(
        { success: false, error: '契約が見つかりません' },
        { status: 404 }
      );
    }

    // ContractData 型に変換
    const contract: ContractData = {
      id: parseInt(row[0]),
      companyName: row[1],
      contractService: row[2],
      contractDate: row[3],
      amount: row[4],
      paymentMethod: row[5],
      contractSentDate: row[6] || undefined,
      contractReceivedDate: row[7] || undefined,
      applicationSentDate: row[8] || undefined,
      applicationReceivedDate: row[9] || undefined,
      paymentDueDate: row[10],
      paymentActualDate: row[11] || undefined,
      paymentStatus: row[12],
      delayDays: parseInt(row[13]) || undefined,
      publicationIssue: row[14],
      notes: row[15] || undefined,
      // 進捗管理列
      step1CompletedAt: row[16] || undefined,
      step2CompletedAt: row[17] || undefined,
      step3CompletedAt: row[18] || undefined,
      step4CompletedAt: row[19] || undefined,
      step5CompletedAt: row[20] || undefined,
      step6CompletedAt: row[21] || undefined,
      step7CompletedAt: row[22] || undefined,
      step8CompletedAt: row[23] || undefined,
      step9CompletedAt: row[24] || undefined,
      step10CompletedAt: row[25] || undefined,
      step11CompletedAt: row[26] || undefined,
      step12CompletedAt: row[27] || undefined,
      step13CompletedAt: row[28] || undefined
    };

    return NextResponse.json({
      success: true,
      contract
    });

  } catch (error) {
    console.error('契約取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
```

---

### 4. `/api/contract/parse` - フォーマットパースAPI

**メソッド**: `POST`

**機能**:
- 情報収集フォーマットのテキストをパースして構造化データに変換

**リクエスト形式**:
```typescript
{
  rawText: string;
}
```

**レスポンス形式**:
```typescript
{
  success: boolean;
  parsed: ParsedContractForm;
  errors?: string[];
}
```

**実装ロジック**:

```typescript
export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();

    const errors: string[] = [];

    // 正規表現で各フィールドを抽出
    const parsed: ParsedContractForm = {
      companyName: extractField(rawText, /企業名・団体名:\s*(.+)/, errors, '企業名'),
      representativeTitle: extractField(rawText, /代表者役職:\s*(.+)/, errors, '代表者役職'),
      representativeName: extractField(rawText, /代表者名:\s*(.+)/, errors, '代表者名'),
      address: extractField(rawText, /住所:〒?\s*(.+)/, errors, '住所'),
      phone: extractField(rawText, /電話番号:\s*(.+)/, errors, '電話番号'),
      email: extractField(rawText, /メールアドレス:\s*(.+)/, errors, 'メールアドレス'),
      contactPerson: extractField(rawText, /送信先担当者名:\s*(.+)/, errors, '送信先担当者名'),
      contactEmail: extractField(rawText, /送信先メールアドレス:\s*(.+)/, errors, '送信先メールアドレス'),
      contractDate: parseWarekiDate(rawText, /契約締結日:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/, errors, '契約締結日'),
      annualFee: parseNumber(rawText, /契約料金（税別）:\s*([0-9,]+)\s*円\/年/, errors, '契約料金'),
      monthlyFee: parseNumber(rawText, /自動更新後の月額料金（税別）:\s*([0-9,]+)\s*円\/月/, errors, '月額料金'),
      publicationStart: extractField(rawText, /掲載開始:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月号/, errors, '掲載開始', (match) => {
        const reiwaYear = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = 2018 + reiwaYear; // 令和元年 = 2019年
        return `${year}年${month}月号`;
      }),
      publicationEnd: extractField(rawText, /掲載終了:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月号/, errors, '掲載終了', (match) => {
        const reiwaYear = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = 2018 + reiwaYear;
        return `${year}年${month}月号`;
      }),
      adSize: extractField(rawText, /掲載サイズ:\s*(.+)/, errors, '掲載サイズ'),
      adPosition: extractField(rawText, /掲載位置:\s*(.+)/, errors, '掲載位置'),
      designFormat: extractField(rawText, /デザイン形式:\s*(.+)/, errors, 'デザイン形式'),
      sendBasicContract: /基本契約書の送付:.*?☑?\s*有/.test(rawText),
      sendApplication: /申込書の送付:.*?☑?\s*有/.test(rawText),
      paymentDeadline: parseWarekiDate(rawText, /支払期限:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/, errors, '支払期限')
    };

    return NextResponse.json({
      success: errors.length === 0,
      parsed,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

// ヘルパー関数
function extractField(
  text: string,
  pattern: RegExp,
  errors: string[],
  fieldName: string,
  transform?: (match: RegExpMatchArray) => string
): string {
  const match = text.match(pattern);
  if (!match) {
    errors.push(`${fieldName}が見つかりません`);
    return '';
  }
  return transform ? transform(match) : match[1].trim();
}

function parseNumber(
  text: string,
  pattern: RegExp,
  errors: string[],
  fieldName: string
): number {
  const match = text.match(pattern);
  if (!match) {
    errors.push(`${fieldName}が見つかりません`);
    return 0;
  }
  return parseInt(match[1].replace(/,/g, ''));
}

function parseWarekiDate(
  text: string,
  pattern: RegExp,
  errors: string[],
  fieldName: string
): string {
  const match = text.match(pattern);
  if (!match) {
    errors.push(`${fieldName}が見つかりません`);
    return '';
  }

  const reiwaYear = parseInt(match[1]);
  const month = parseInt(match[2]);
  const day = parseInt(match[3]);
  const year = 2018 + reiwaYear; // 令和元年 = 2019年

  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}
```

---

## UI/UX設計

### 画面構成

```
┌──────────────────────────────────────────────────────────┐
│ ヘッダー                                                  │
│ 契約業務フロー          [リソース▼] [新規契約] [更新]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ フィルタエリア                                            │
│ 📊 進行中の契約（5件） [フィルタ: 進行中のみ▼]          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ リマインダーカードグリッド（3カラム）                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│ │🔴 新規必要│ │🟡 入金待ち│ │🔵 進行中 │                │
│ │株式会社A  │ │株式会社B  │ │信藤建設  │                │
│ │[契約開始] │ │[確認]    │ │[続き]   │                │
│ └──────────┘ └──────────┘ └──────────┘                │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 13ステップカードグリッド（選択時のみ表示）                │
│ 選択中: 信藤建設                          [×閉じる]     │
│                                                          │
│ プログレスバー（固定）                                    │
│ ●━━━●━━━●━━━○━━━○                                      │
│                                                          │
│ カードグリッド（5カラム）                                 │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                      │
│ │✅ │ │✅ │ │✅ │ │🔵│ │⬜│                      │
│ │ ① │ │ ② │ │ ③ │ │ ④│ │ ⑤│                      │
│ └───┘ └───┘ └───┘ └───┘ └───┘                      │
│ ...                                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## コンポーネント設計

### 1. ResourceMenu.tsx

**配置**: `components/workflow/ResourceMenu.tsx`

**機能**: ヘッダーに常時表示されるリソースドロップダウンメニュー

**実装**:

```typescript
'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ExternalLink } from 'lucide-react';

const resources = [
  {
    id: 'info-form',
    label: '📋 情報収集フォーマット',
    url: 'https://docs.google.com/document/d/[ID]/edit',
    description: '新規契約時に顧客に送信するフォーマット'
  },
  {
    id: 'basic-contract',
    label: '📄 基本契約書（原本）',
    url: 'https://docs.google.com/document/d/1B_GK3cknmtgGgpKVjKUerOOgQ7RgQcwwdLMBy12gBDo/edit',
    description: 'ステップ②で使用'
  },
  {
    id: 'application-form',
    label: '📄 申込書（原本）',
    url: 'https://docs.google.com/document/d/[ID]/edit',
    description: 'ステップ④で使用'
  },
  {
    id: 'moneyforward',
    label: '🔗 マネーフォワード',
    url: 'https://biz.moneyforward.com/',
    description: '契約書押印・請求書作成で使用'
  }
];

export function ResourceMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm font-semibold">リソース</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            <div className="p-2">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="text-2xl">{resource.label.split(' ')[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {resource.label.split(' ').slice(1).join(' ')}
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {resource.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

### 2. FilterDropdown.tsx

**配置**: `components/workflow/FilterDropdown.tsx`

**機能**: リマインダーカードのフィルタリング

**実装**:

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

interface FilterDropdownProps {
  value: 'in-progress' | 'all';
  onChange: (value: 'in-progress' | 'all') => void;
}

export function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'in-progress', label: '進行中のみ', description: '完了した契約は非表示' },
    { value: 'all', label: 'すべて表示', description: '完了した契約も含む' }
  ];

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
      >
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="font-semibold text-gray-700">{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            <div className="p-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value as any);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    value === option.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      value === option.value ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {value === option.value && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-6">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

### 3. ReminderCard.tsx

**配置**: `components/workflow/ReminderCard.tsx`

**機能**: リマインダーカードの表示

**実装**:

```typescript
'use client';

import { AlertCircle, Clock, CheckCircle2, PlayCircle } from 'lucide-react';
import type { ReminderCard as ReminderCardType } from '@/types/workflow';

interface ReminderCardProps extends ReminderCardType {
  onAction: () => void;
}

export function ReminderCard({
  type,
  companyName,
  contractId,
  paymentDueDate,
  delayDays,
  completedSteps,
  totalSteps,
  contractEndDate,
  daysUntilExpiry,
  onAction
}: ReminderCardProps) {
  const styles = {
    'new-contract-required': {
      bg: 'bg-red-50',
      border: 'border-red-300',
      badge: 'bg-red-100 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      label: '新規契約必要',
      actionLabel: '契約開始'
    },
    'payment-overdue': {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      badge: 'bg-orange-100 text-orange-800',
      icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
      label: '入金遅延',
      actionLabel: '至急確認'
    },
    'payment-pending': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      badge: 'bg-yellow-100 text-yellow-800',
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      label: '入金待ち',
      actionLabel: '確認する'
    },
    'in-progress': {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      badge: 'bg-blue-100 text-blue-800',
      icon: <PlayCircle className="w-5 h-5 text-blue-600" />,
      label: '進行中',
      actionLabel: '続きを見る'
    },
    'completed': {
      bg: 'bg-green-50',
      border: 'border-green-300',
      badge: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      label: '完了',
      actionLabel: '詳細を見る'
    },
    'contract-expiry-near': {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      badge: 'bg-purple-100 text-purple-800',
      icon: <AlertCircle className="w-5 h-5 text-purple-600" />,
      label: '契約満了近い',
      actionLabel: '更新検討'
    }
  };

  const style = styles[type];

  return (
    <div className={`rounded-lg border-2 ${style.border} ${style.bg} p-4 hover:shadow-lg transition-all cursor-pointer`}>
      <div className="flex items-start gap-3">
        {style.icon}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${style.badge}`}>
              {style.label}
            </span>
          </div>

          <h4 className="text-sm font-bold text-gray-900 mb-1">{companyName}</h4>

          {/* 新規契約必要 */}
          {type === 'new-contract-required' && (
            <p className="text-xs text-gray-600 mb-3">
              顧客マスタで「受注」になっていますが、契約業務が開始されていません
            </p>
          )}

          {/* 入金待ち */}
          {type === 'payment-pending' && (
            <p className="text-xs text-gray-600 mb-3">
              入金予定日: {paymentDueDate}
            </p>
          )}

          {/* 入金遅延 */}
          {type === 'payment-overdue' && (
            <p className="text-xs text-red-600 font-semibold mb-3">
              入金予定日超過: {delayDays}日遅延
            </p>
          )}

          {/* 進行中 */}
          {type === 'in-progress' && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">
                進捗: {completedSteps}/{totalSteps} ステップ完了
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(completedSteps! / totalSteps!) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 契約満了近い */}
          {type === 'contract-expiry-near' && (
            <div>
              <p className="text-xs text-purple-700 font-semibold mb-1">
                契約満了日: {contractEndDate}
              </p>
              <p className="text-xs text-gray-600 mb-3">
                残り{daysUntilExpiry}日 - 更新手続きをご検討ください
              </p>
            </div>
          )}

          <button
            onClick={onAction}
            className="w-full text-xs font-semibold py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {style.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. NewContractModal.tsx

**配置**: `components/workflow/NewContractModal.tsx`

**機能**: 新規契約作成モーダル

**実装**:

```typescript
'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import type { ParsedContractForm } from '@/types/workflow';

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contractId: number) => void;
}

export function NewContractModal({ isOpen, onClose, onSuccess }: NewContractModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedContractForm | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleParse = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/contract/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });

      const data = await res.json();

      if (data.success) {
        setParsedData(data.parsed);
        setParseErrors([]);
      } else {
        setParsedData(null);
        setParseErrors(data.errors || ['パースに失敗しました']);
      }
    } catch (error) {
      setParseErrors(['通信エラーが発生しました']);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!parsedData) return;

    setLoading(true);

    try {
      const res = await fetch('/api/contract/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedData })
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(data.contractId);
        onClose();
        // リセット
        setRawText('');
        setParsedData(null);
        setParseErrors([]);
      } else {
        setParseErrors([data.error || '契約作成に失敗しました']);
      }
    } catch (error) {
      setParseErrors(['通信エラーが発生しました']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">新規契約作成</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 情報収集フォーマットへの案内 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  情報収集フォーマットを顧客に送信済みですか？
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  まだの場合は、先に情報収集フォーマットを顧客に送信し、記入してもらってください。
                </p>
                <a
                  href="https://docs.google.com/document/d/[ID]/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  📋 情報収集フォーマットを開く
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* テキストエリア */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              情報収集フォーマットの内容を貼り付けてください
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="【◎基本情報】&#10;企業名・団体名: &#10;代表者役職: &#10;..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* パース確認ボタン */}
          <button
            onClick={handleParse}
            disabled={!rawText.trim() || loading}
            className="w-full mb-4 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'パース中...' : 'パース確認'}
          </button>

          {/* パース結果 */}
          {parsedData && (
            <div className="border border-green-300 bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-bold text-green-900">パース成功</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-semibold text-gray-700">企業名:</span>
                  <span className="ml-2 text-gray-900">{parsedData.companyName}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">代表者:</span>
                  <span className="ml-2 text-gray-900">{parsedData.representativeTitle} {parsedData.representativeName}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">契約金額:</span>
                  <span className="ml-2 text-gray-900">¥{parsedData.annualFee.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">掲載開始:</span>
                  <span className="ml-2 text-gray-900">{parsedData.publicationStart}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">契約締結日:</span>
                  <span className="ml-2 text-gray-900">{parsedData.contractDate}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">支払期限:</span>
                  <span className="ml-2 text-gray-900">{parsedData.paymentDeadline}</span>
                </div>
              </div>
            </div>
          )}

          {/* パースエラー */}
          {parseErrors.length > 0 && (
            <div className="border border-red-300 bg-red-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-bold text-red-900">パースエラー</h4>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                {parseErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!parsedData || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? '作成中...' : '契約開始'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 実装スケジュール

### Phase 1.5-1: リソースメニュー・フィルタ機能（1日目）

**作業内容**:
1. `ResourceMenu.tsx` コンポーネント作成
2. `FilterDropdown.tsx` コンポーネント作成
3. ヘッダーに統合
4. 動作確認

**完了条件**:
- リソースメニューがヘッダーに表示される
- ドロップダウンメニューが正しく動作する
- フィルタドロップダウンが正しく動作する

---

### Phase 1.5-2: リマインダーAPI・カード表示（2日目）

**作業内容**:
1. `/api/contract/reminders` API作成
2. `ReminderCard.tsx` コンポーネント作成
3. ページに統合
4. フィルタリング機能実装
5. 動作確認

**完了条件**:
- リマインダーAPIが正しく動作する
- リマインダーカードが表示される
- フィルタが正しく動作する
- カードの色分けが正しい

---

### Phase 1.5-3: 新規契約作成機能（3日目）

**作業内容**:
1. `/api/contract/parse` API作成
2. `/api/contract/create` API作成
3. `NewContractModal.tsx` コンポーネント作成
4. パース処理の実装
5. 動作確認

**完了条件**:
- 新規契約ボタンからモーダルが開く
- テキストを貼り付けてパースできる
- パース結果が正しく表示される
- 契約開始ボタンで契約・入金管理シートに書き込まれる

---

### Phase 1.5-4: 契約選択・13ステップ表示（4日目）

**作業内容**:
1. `/api/contract/[id]` API作成
2. 契約選択機能実装
3. 13ステップカードグリッドの表示・非表示切替
4. スムーズスクロール実装
5. 進捗状況の反映
6. 動作確認

**完了条件**:
- リマインダーカードをクリックすると13ステップカードグリッドが表示される
- 選択中の契約名が表示される
- 進捗状況が正しく反映される
- スムーズにスクロールする

---

### Phase 1.5-5: 統合テスト・デバッグ（5日目）

**作業内容**:
1. 全機能の統合テスト
2. エラーハンドリングの確認
3. レスポンシブデザインの確認
4. パフォーマンスの確認
5. デバッグ

**完了条件**:
- すべての機能が正しく動作する
- エラーが適切に処理される
- モバイル・タブレットで正しく表示される

---

## テスト計画

### 基本動作テスト

1. **リソースメニュー**
   - ヘッダーの「リソース」ボタンをクリック
   - ドロップダウンメニューが表示される
   - 各リンクをクリックすると新しいタブで開く

2. **リマインダーカード表示**
   - ページを開くとリマインダーカードが表示される
   - カードの色が正しい
   - フィルタを「すべて表示」に変更すると完了カードも表示される

3. **新規契約作成**
   - 「新規契約」ボタンをクリック
   - モーダルが開く
   - 情報収集フォーマットの内容を貼り付け
   - 「パース確認」ボタンをクリック
   - パース結果が表示される
   - 「契約開始」ボタンをクリック
   - 契約・入金管理シートに新しい行が追加される

4. **契約選択・13ステップ表示**
   - リマインダーカードをクリック
   - 13ステップカードグリッドがスムーズにスクロール表示される
   - 選択中の契約名が表示される
   - 進捗状況が正しく反映される

---

## 完了条件

Phase 1.5が完了したと判断する条件:

- [ ] リソースメニューがヘッダーに表示され、正しく動作する
- [ ] リマインダーカードが表示され、カードの色分けが正しい
- [ ] フィルタ機能が正しく動作する
- [ ] 新規契約ボタンからモーダルが開く
- [ ] 情報収集フォーマットをパースして契約を作成できる
- [ ] リマインダーカードをクリックすると13ステップカードグリッドが表示される
- [ ] 進捗状況が契約・入金管理シートから正しく読み込まれる
- [ ] すべての機能が統合され、正しく動作する

---

**作成日**: 2025年10月12日
**作成者**: Claude Code
**バージョン**: v1.0
**次のステップ**: 開発フローにPhase 1.5を追加し、実装を開始

以上
