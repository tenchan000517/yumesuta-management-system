# 企業マスター スキーマ定義

**作成日**: 2025-10-08
**最終更新**: 2025-10-08（実データ確認により62列→51列に修正）
**対象**: Phase 7実装担当者
**目的**: 企業マスターの51列構造を明確に定義し、実装時のミスを防ぐ

---

## 📋 全51列の構造（A～AY列）

**実際のヘッダー行**:
```
企業ID, 企業名, 企業名(カナ), 業種, 事業エリア, 説明文(一覧用), ロゴ画像パス, ヒーロー画像パス, QRコード画像パス, スローガン, 代表者名, 代表者名(英語), 代表者役職, 代表者写真パス, サービス1_画像パス, サービス1_タイトル, サービス1_説明, サービス2_画像パス, サービス2_タイトル, サービス2_説明, サービス3_画像パス, サービス3_タイトル, サービス3_説明, 社長メッセージ, 社員1_画像パス, 社員1_質問, 社員1_回答, 社員2_画像パス, 社員2_質問, 社員2_回答, 社員3_画像パス, 社員3_質問, 社員3_回答, 取り組み1_タイトル, 取り組み1_説明, 取り組み2_タイトル, 取り組み2_説明, 取り組み3_タイトル, 取り組み3_説明, 住所, 電話番号, FAX番号, ウェブサイト, 問い合わせメール, 設立年, 従業員数, 事業内容, 初掲載号, 最終更新号, ステータス, 備考
```

### 基本情報（1-14列）

| 列番号 | 列名 | データ型 | 説明 | 例 |
|--------|------|---------|------|-----|
| 1 | 企業ID | string | 企業の一意識別子 | `marutomo` |
| 2 | 企業名 | string | 正式な企業名 | `株式会社マルトモ` |
| 3 | 企業名（カナ） | string | カタカナ表記 | `カブシキガイシャマルトモ` |
| 4 | 業種 | string | 業種分類 | `製造` |
| 5 | 事業エリア | string | 所在地エリア | `名古屋市港区` |
| 6 | 説明文（一覧用） | string | 企業の概要（100-150文字） | `1946年から現在に渡り鋳造技術を磨き続ける...` |
| 7 | ロゴ画像パス | string | ロゴ画像のパス | `/img/company/marutomo/logo.png` |
| 8 | ヒーロー画像パス | string | ヒーロー画像のパス | `/img/company/marutomo/hero.png` |
| 9 | QRコード画像パス | string | QRコードのパス | `/img/qr/marutomo.png` |
| 10 | スローガン | string | 企業スローガン | `社員一人一人がモノづくりの誇りを持ち...` |
| 11 | 代表者名 | string | 代表者の氏名 | `錦見 裕介` |
| 12 | 代表者名（英語） | string | 代表者名の英語表記 | `yusuke-nishikimi` |
| 13 | 代表者役職 | string | 代表者の役職 | `代表取締役` |
| 14 | 代表者写真パス | string | 代表者写真のパス | `/img/company/marutomo/president.png` |

### サービス情報（15-23列）

| 列番号 | 列名 | データ型 | 説明 | 例 |
|--------|------|---------|------|-----|
| 15 | サービス1_画像パス | string | サービス1の画像パス | `/img/company/marutomo/service-01.png` |
| 16 | サービス1_タイトル | string | サービス1のタイトル | `工作機械用途製品` |
| 17 | サービス1_説明 | string | サービス1の説明（100-200文字） | `工作機械分野における高品質な鋳造製品...` |
| 18 | サービス2_画像パス | string | サービス2の画像パス | `/img/company/marutomo/service-02.png` |
| 19 | サービス2_タイトル | string | サービス2のタイトル | `産業機械用途製品` |
| 20 | サービス2_説明 | string | サービス2の説明 | `産業機械分野での様々なニーズに...` |
| 21 | サービス3_画像パス | string | サービス3の画像パス | `/img/company/marutomo/service-03.png` |
| 22 | サービス3_タイトル | string | サービス3のタイトル | `ダイキャスト金型` |
| 23 | サービス3_説明 | string | サービス3の説明 | `ダイキャスト金型の製造において...` |

### 社長メッセージ（24列）

| 列番号 | 列名 | データ型 | 説明 | 例 |
|--------|------|---------|------|-----|
| 24 | 社長メッセージ | string | 社長からのメッセージ（長文、300-500文字） | `私たちマルトモは1946年から現在に渡り...` |

### 社員の声（25-33列）

| 列番号 | 列名 | データ型 | 説明 | 例 |
|--------|------|---------|------|-----|
| 25 | 社員1_画像パス | string | 社員1の写真パス | `/img/company/marutomo/member-01.png` |
| 26 | 社員1_質問 | string | 社員1への質問 | `入社の決め手はなんでしたか？` |
| 27 | 社員1_回答 | string | 社員1の回答（100-200文字） | `鹿児島から出て、自分の知らない土地で...` |
| 28 | 社員2_画像パス | string | 社員2の写真パス | `/img/company/marutomo/member-02.png` |
| 29 | 社員2_質問 | string | 社員2への質問 | `会社の魅力はどんなところですか？` |
| 30 | 社員2_回答 | string | 社員2の回答 | `従業員一人ひとりが安心して働ける...` |
| 31 | 社員3_画像パス | string | 社員3の写真パス | `/img/company/marutomo/member-03.png` |
| 32 | 社員3_質問 | string | 社員3への質問 | `会社の強みはなんですか？` |
| 33 | 社員3_回答 | string | 社員3の回答 | `鋳造技術を駆使する「IMONO」の...` |

### 企業の取り組み（34-39列）

| 列番号 | 列名 | データ型 | 説明 | 例 |
|--------|------|---------|------|-----|
| 34 | 取り組み1_タイトル | string | 取り組み1のタイトル | `『嬉しい☆楽しい』福利厚生` |
| 35 | 取り組み1_説明 | string | 取り組み1の説明（100-200文字） | `HAPPY BIRTHDAY休暇、おしゃれ制度...` |
| 36 | 取り組み2_タイトル | string | 取り組み2のタイトル | `社内イベント活動` |
| 37 | 取り組み2_説明 | string | 取り組み2の説明 | `ボウリング大会や慰安旅行、BBQに...` |
| 38 | 取り組み3_タイトル | string | 取り組み3のタイトル | `技術継承と革新` |
| 39 | 取り組み3_説明 | string | 取り組み3の説明 | `1946年から続く歴史ある鋳造技術を...` |

### 企業情報（40-47列）

| 列番号 | 列名 | データ型 | 説明 | 例 |
|--------|------|---------|------|-----|
| 40 | 住所 | string | 郵便番号込みの住所 | `〒455-0831 愛知県名古屋市港区十一屋1-11` |
| 41 | 電話番号 | string | 電話番号 | `052-381-5177` |
| 42 | FAX番号 | string | FAX番号 | `052-381-5277` |
| 43 | ウェブサイト | string | ウェブサイトURL | `marutomo-imono.com` |
| 44 | 問い合わせメール | string | 問い合わせメールアドレス | `info@marutomo-imono.com` |
| 45 | 設立年 | string | 設立年 | `1946年(昭和21年)` |
| 46 | 従業員数 | string | 従業員数 | `55名 海外研修生(インドネシア)10名` |
| 47 | 事業内容 | string | 事業内容 | `自硬性鋳造(フラン造型法)` |

### メタ情報（48-51列）

| 列番号 | 列名 | データ型 | 説明 | 例 |
|--------|------|---------|------|-----|
| 48 | 初掲載号 | string | 初めて掲載された号 | `2024年10月号` |
| 49 | 最終更新号 | string | 最後に更新された号 | `2025年11月号` |
| 50 | ステータス | string | 企業のステータス | `active` |
| 51 | 備考 | string | 備考・メモ | `✅ 実データ反映済み` |

---

## 🔢 列番号インデックス（0始まり）

実装時に配列アクセスする際のインデックス（JavaScript/TypeScript）:

```typescript
// 基本情報
const COMPANY_ID = 0;
const COMPANY_NAME = 1;
const COMPANY_NAME_KANA = 2;
const INDUSTRY = 3;
const AREA = 4;
const DESCRIPTION = 5;
const LOGO_PATH = 6;
const HERO_PATH = 7;
const QR_PATH = 8;
const SLOGAN = 9;
const PRESIDENT_NAME = 10;
const PRESIDENT_NAME_EN = 11;
const PRESIDENT_POSITION = 12;
const PRESIDENT_PHOTO = 13;

// サービス
const SERVICE1_IMAGE = 14;
const SERVICE1_TITLE = 15;
const SERVICE1_DESC = 16;
const SERVICE2_IMAGE = 17;
const SERVICE2_TITLE = 18;
const SERVICE2_DESC = 19;
const SERVICE3_IMAGE = 20;
const SERVICE3_TITLE = 21;
const SERVICE3_DESC = 22;

// 社長メッセージ
const PRESIDENT_MESSAGE = 23;

// 社員の声
const MEMBER1_IMAGE = 24;
const MEMBER1_QUESTION = 25;
const MEMBER1_ANSWER = 26;
const MEMBER2_IMAGE = 27;
const MEMBER2_QUESTION = 28;
const MEMBER2_ANSWER = 29;
const MEMBER3_IMAGE = 30;
const MEMBER3_QUESTION = 31;
const MEMBER3_ANSWER = 32;

// 企業の取り組み
const INITIATIVE1_TITLE = 33;
const INITIATIVE1_DESC = 34;
const INITIATIVE2_TITLE = 35;
const INITIATIVE2_DESC = 36;
const INITIATIVE3_TITLE = 37;
const INITIATIVE3_DESC = 38;

// 企業情報
const ADDRESS = 39;
const PHONE = 40;
const FAX = 41;
const WEBSITE = 42;
const EMAIL = 43;
const ESTABLISHED = 44;
const EMPLOYEES = 45;
const BUSINESS = 46;

// メタ情報
const FIRST_ISSUE = 47;
const LAST_ISSUE = 48;
const STATUS = 49;
const NOTES = 50;
```

---

## 📦 TypeScript型定義（Phase 7実装用）

```typescript
/**
 * 企業マスターの型定義
 */
export interface Company {
  // 基本情報
  companyId: string;
  companyName: string;
  companyNameKana: string;
  industry: string;
  area: string;
  description: string;
  logoPath: string;
  heroPath: string;
  qrPath: string;
  slogan: string;
  presidentName: string;
  presidentNameEn: string;
  presidentPosition: string;
  presidentPhoto: string;

  // サービス
  services: {
    imagePath: string;
    title: string;
    description: string;
  }[];

  // 社長メッセージ
  presidentMessage: string;

  // 社員の声
  members: {
    imagePath: string;
    question: string;
    answer: string;
  }[];

  // 企業の取り組み
  initiatives: {
    title: string;
    description: string;
  }[];

  // 企業情報
  contactInfo: {
    address: string;
    phone: string;
    fax: string;
    website: string;
    email: string;
  };
  established: string;
  employees: string;
  business: string;

  // メタ情報
  firstIssue: string;
  lastIssue: string;
  status: string;
  notes: string;
}
```

---

## 🛠️ パース関数（Phase 7実装用）

```typescript
/**
 * Google Sheetsの生データ（any[][]）を Company[] に変換
 */
function parseCompanyData(rawData: any[][]): Company[] {
  // ヘッダー行をスキップ
  const dataRows = rawData.slice(1);

  return dataRows.map(row => ({
    // 基本情報
    companyId: row[0] || '',
    companyName: row[1] || '',
    companyNameKana: row[2] || '',
    industry: row[3] || '',
    area: row[4] || '',
    description: row[5] || '',
    logoPath: row[6] || '',
    heroPath: row[7] || '',
    qrPath: row[8] || '',
    slogan: row[9] || '',
    presidentName: row[10] || '',
    presidentNameEn: row[11] || '',
    presidentPosition: row[12] || '',
    presidentPhoto: row[13] || '',

    // サービス（3つ）
    services: [
      {
        imagePath: row[14] || '',
        title: row[15] || '',
        description: row[16] || '',
      },
      {
        imagePath: row[17] || '',
        title: row[18] || '',
        description: row[19] || '',
      },
      {
        imagePath: row[20] || '',
        title: row[21] || '',
        description: row[22] || '',
      },
    ],

    // 社長メッセージ
    presidentMessage: row[23] || '',

    // 社員の声（3名）
    members: [
      {
        imagePath: row[24] || '',
        question: row[25] || '',
        answer: row[26] || '',
      },
      {
        imagePath: row[27] || '',
        question: row[28] || '',
        answer: row[29] || '',
      },
      {
        imagePath: row[30] || '',
        question: row[31] || '',
        answer: row[32] || '',
      },
    ],

    // 企業の取り組み（3項目）
    initiatives: [
      {
        title: row[33] || '',
        description: row[34] || '',
      },
      {
        title: row[35] || '',
        description: row[36] || '',
      },
      {
        title: row[37] || '',
        description: row[38] || '',
      },
    ],

    // 企業情報
    contactInfo: {
      address: row[39] || '',
      phone: row[40] || '',
      fax: row[41] || '',
      website: row[42] || '',
      email: row[43] || '',
    },
    established: row[44] || '',
    employees: row[45] || '',
    business: row[46] || '',

    // メタ情報
    firstIssue: row[47] || '',
    lastIssue: row[48] || '',
    status: row[49] || 'active',
    notes: row[50] || '',
  }));
}
```

---

## ✅ 動作検証チェックリスト

Phase 7実装時、以下を確認してください：

### データ取得
- [ ] 企業マスターシートから全6社のデータが取得できる
- [ ] ヘッダー行を正しくスキップしている
- [ ] 51列すべてが正しく読み込まれる

### パース処理
- [ ] 基本情報（1-14列）が正しくマッピングされる
- [ ] サービス情報（15-23列）が3つの配列として構造化される
- [ ] 社長メッセージ（24列）が正しく取得される
- [ ] 社員の声（25-33列）が3名分の配列として構造化される
- [ ] 企業の取り組み（34-39列）が3項目の配列として構造化される
- [ ] 企業情報（40-47列）が正しくマッピングされる
- [ ] メタ情報（48-51列）が正しくマッピングされる

### ステータス判定
- [ ] `status === 'active'` の企業のみフィルタリングされる
- [ ] 初掲載号・最終更新号からステータスを判定できる

### エラーハンドリング
- [ ] 空のセルがあっても正常に動作する（デフォルト値 `''` が設定される）
- [ ] 企業マスターシートが存在しない場合、適切なエラーメッセージが返る

---

## 🎯 Phase 7実装のゴール

Phase 7完了時、以下が実現されます：

1. **企業一覧表示**
   - 6社すべてが企業カードで表示される
   - ロゴ、企業名、業種、エリア、説明文が表示される

2. **企業ステータス判定**
   - 初掲載号・最終更新号から「新規」「継続」「休止」を判定
   - ステータスバッジが表示される

3. **企業詳細表示**（オプション）
   - クリックで企業の詳細情報が表示される
   - サービス、社長メッセージ、社員の声、取り組み、企業情報が表示される

---

## 📝 更新履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|-----------|---------|--------|
| 2025-10-08 | 1.0 | 初版作成（62列スキーマ定義） | Claude Code |
| 2025-10-08 | 1.1 | 実データ確認により51列に修正、ヘッダー行追加 | Claude Code |

---

**作成者**: Claude Code
**参照**: `company-master-setup.gs`
**次世代実装者へ**: このスキーマ定義を基にPhase 7を実装してください
