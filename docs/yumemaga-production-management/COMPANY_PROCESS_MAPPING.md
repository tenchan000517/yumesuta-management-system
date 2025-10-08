# 企業別工程マッピング定義

**作成日**: 2025-10-08
**目的**: 企業マスターと工程マスターを紐付けるためのマッピング定義

---

## 📋 基本方針

企業マスターの「初掲載号」「最終更新号」を元に、各企業の掲載ステータスを判定し、適切な工程セットを割り当てます。

---

## 🏢 企業ステータスの判定ロジック

### ステータス定義

| ステータス | 説明 | 判定条件 | 工程カテゴリ |
|-----------|------|---------|------------|
| **new** | 新規企業 | 初掲載号 === 今号 | C（新規企業） |
| **updated** | 既存企業（変更） | 最終更新号 === 今号 AND 初掲載号 !== 今号 | E（既存企業）※一部のみ |
| **existing** | 既存企業（継続） | 最終更新号 === 前号 | E（既存企業）※確認のみ |
| **none** | 今号非掲載 | 上記以外 | なし |

### 判定コード例

```typescript
function getCompanyStatus(company: Company, currentIssue: string): CompanyStatus {
  // 初掲載号が今号 → 新規企業
  if (company.firstIssue === currentIssue) {
    return {
      status: 'new',
      processCategoryId: 'C',
      description: '新規企業（フル制作）'
    };
  }

  // 最終更新号が今号 → 既存企業（変更）
  if (company.lastIssue === currentIssue) {
    return {
      status: 'updated',
      processCategoryId: 'E',
      description: '既存企業（一部変更）'
    };
  }

  // 最終更新号が前号 → 既存企業（継続）
  const previousIssue = getPreviousIssue(currentIssue);
  if (company.lastIssue === previousIssue) {
    return {
      status: 'existing',
      processCategoryId: 'E',
      description: '既存企業（継続掲載）'
    };
  }

  // 該当なし
  return {
    status: 'none',
    processCategoryId: null,
    description: '今号非掲載'
  };
}
```

---

## 🔧 工程とカテゴリの紐付け

### カテゴリC（新規企業）の工程

新規企業は**フル制作**が必要なため、以下の工程を実施:

| 工程No | 工程名 | 説明 | 標準所要日数 | 依存工程 |
|-------|--------|------|------------|---------|
| C-1 | データ提出・撮影 | 企業情報ヒアリング、写真撮影 | 1日 | なし |
| C-2 | 文字起こし | インタビュー音声の文字起こし | 2日 | C-1 |
| C-3 | 内容整理 | 文字起こしデータの編集・整理 | 2日 | C-2 |
| C-4 | ページ制作 | 企業ページのデザイン・制作 | 5日 | C-3 |
| C-5 | 内部チェック | 社内での最終確認 | 1日 | C-4 |
| C-6 | 確認送付 | クライアントへの確認依頼 | - | C-5 |
| C-7 | 修正対応 | 修正依頼への対応 | 可変 | C-6 |

**注**: C-6（確認送付）、C-7（修正対応）は**ステータス**として扱うため、独立した工程ではなく、C-4〜C-5の進捗ステータスとして管理します。

### カテゴリE（既存企業）の工程

既存企業は**確認のみ**または**一部変更**のため、軽量な工程:

#### パターン1: 継続掲載（変更なし）

| 工程No | 工程名 | 説明 | 標準所要日数 | 依存工程 |
|-------|--------|------|------------|---------|
| E-1 | ページ確認 | 前号からの変更がないか確認 | 1日 | なし |

#### パターン2: 一部変更

| 工程No | 工程名 | 説明 | 標準所要日数 | 依存工程 |
|-------|--------|------|------------|---------|
| E-1 | 変更箇所確認 | 変更内容のヒアリング | 1日 | なし |
| E-2 | 追加撮影（任意） | 必要に応じて追加撮影 | 1日 | E-1 |
| E-3 | ページ更新 | 変更箇所の反映 | 2日 | E-1 or E-2 |
| E-4 | 内部チェック | 社内確認 | 1日 | E-3 |

---

## 🗂️ 企業別工程の取得ロジック

### API設計

```typescript
// GET /api/yumemaga-v2/company-processes?issue=2025年11月号

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const issue = searchParams.get('issue');

  // 1. 企業マスター取得
  const companies = await getCompanyMaster();

  // 2. 今号の掲載企業をフィルタ
  const featuredCompanies = companies.filter(company => {
    const status = getCompanyStatus(company, issue);
    return status.status !== 'none';
  });

  // 3. 各企業の工程を取得
  const companiesWithProcesses = await Promise.all(
    featuredCompanies.map(async (company) => {
      const status = getCompanyStatus(company, issue);
      const processes = await getProcessesForCompany(company, status, issue);

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        status: status.status,
        statusDescription: status.description,
        progress: calculateProgress(processes),
        processes,
      };
    })
  );

  return NextResponse.json({
    success: true,
    companies: companiesWithProcesses,
  });
}
```

### 工程取得の実装

```typescript
async function getProcessesForCompany(
  company: Company,
  status: CompanyStatus,
  issue: string
): Promise<Process[]> {
  const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

  // 進捗入力シートから該当企業の工程を取得
  const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

  // カテゴリC or Eの工程のうち、該当企業のものだけ抽出
  const categoryId = status.processCategoryId; // 'C' or 'E'

  const companyProcesses = progressData
    .slice(1) // ヘッダー除く
    .filter(row => {
      const processNo = row[0]; // A列: 工程No
      const rowIssue = row[3];  // D列: 月号
      const processCategory = processNo.split('-')[0]; // "C-1" → "C"

      return (
        processCategory === categoryId &&
        rowIssue === issue
      );
    })
    .map(row => ({
      processNo: row[0],
      processName: row[1],
      plannedDate: row[4] || '-',
      actualDate: row[6] || '',
      status: row[8] || 'not_started',
    }));

  return companyProcesses;
}
```

---

## 📊 進捗計算ロジック

```typescript
function calculateProgress(processes: Process[]) {
  const total = processes.length;
  const completed = processes.filter(p => p.actualDate).length;
  const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress: processes.filter(p => !p.actualDate && p.status === 'in_progress').length,
    notStarted: processes.filter(p => !p.actualDate && p.status === 'not_started').length,
    progressRate,
  };
}
```

---

## 🎨 UI表示用データ構造

```typescript
interface CompanyWithProcesses {
  // 基本情報
  companyId: string;
  companyName: string;
  logoPath: string;

  // ステータス
  status: 'new' | 'updated' | 'existing';
  statusDescription: string;
  statusBadge: {
    label: string;
    color: 'orange' | 'blue' | 'green';
  };

  // 進捗
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    progressRate: number;
  };

  // 工程
  processes: Process[];

  // 確認ステータス（Phase 3で実装）
  confirmationStatus?: 'not_sent' | 'pending' | 'approved' | 'revision_requested';
}
```

---

## 🔄 ステータスバッジの表示

```typescript
function getStatusBadge(status: CompanyStatus['status']) {
  switch (status) {
    case 'new':
      return {
        label: '新規',
        color: 'orange' as const,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
      };
    case 'updated':
      return {
        label: '変更',
        color: 'blue' as const,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
      };
    case 'existing':
      return {
        label: '継続',
        color: 'green' as const,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
      };
    default:
      return {
        label: '非掲載',
        color: 'gray' as const,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
      };
  }
}
```

---

## 📅 予定日の逆算ロジック（Phase 4実装予定）

```typescript
function calculatePlannedDates(
  company: Company,
  status: CompanyStatus,
  publishDate: Date
): Record<string, string> {
  const plannedDates: Record<string, string> = {};

  // 工程テンプレート取得
  const processTemplates = getProcessTemplates(status.status);

  let currentDate = new Date(publishDate);

  // 逆算（発行日から遡る）
  for (let i = processTemplates.length - 1; i >= 0; i--) {
    const template = processTemplates[i];
    currentDate = subtractDays(currentDate, template.standardDuration);
    plannedDates[template.processNo] = formatDate(currentDate);
  }

  return plannedDates;
}
```

---

## ✅ 実装チェックリスト

### API
- [ ] `/api/yumemaga-v2/company-processes` 作成
- [ ] 企業マスター取得機能
- [ ] 企業ステータス判定ロジック
- [ ] 企業別工程取得ロジック
- [ ] 進捗計算ロジック

### UI
- [ ] 企業カードコンポーネント作成
- [ ] 企業管理セクション作成（折り畳み機能付き）
- [ ] ステータスバッジ表示
- [ ] 進捗バー表示
- [ ] 工程リスト表示（予定日・実績日・遅延日数）

### データ
- [ ] 企業マスターに「初掲載号」「最終更新号」が正しく入力されている
- [ ] 進捗入力シートにC/E工程が正しく登録されている

---

**作成者**: Claude Code
**最終更新**: 2025-10-08
**次のステップ**: API実装開始
