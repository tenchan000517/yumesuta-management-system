# 企業別ページ制作進捗管理 完全実装計画書

**作成日**: 2025-10-10
**作成者**: Claude Code (第4世代)
**対象読者**: 次世代Claude Code（暗黙知ゼロで理解可能な設計書）
**想定実装時間**: 3時間

---

## 📋 目次

1. [背景と問題点](#1-背景と問題点)
2. [システム全体像の理解](#2-システム全体像の理解)
3. [実装する機能の全体像](#3-実装する機能の全体像)
4. [実装詳細](#4-実装詳細)
5. [テスト方法](#5-テスト方法)
6. [完了条件](#6-完了条件)

---

## 1. 背景と問題点

### 1.1 現状の問題

**カテゴリ別予実管理セクション**に以下の問題がある：

#### 問題1: カテゴリC/Eが企業と紐づいていない

**現状**:
- カテゴリC: 新規企業（括り）
- カテゴリE: 既存企業（括り）
- 工程: 「新規企業①情報シート取得」のような抽象的な名前

**問題点**:
- **どの企業**が未完了かわからない
- **新規企業が何社**あるのかわからない
- **既存企業の「変更」がある企業**が特定できない

**具体例**:
```
現状のカテゴリCカード:
┌─────────────────┐
│ C: 新規企業     │
│ 進捗: 50%       │  ← 全体進捗のみ
│                 │
│ 工程:           │
│ C-2: 情報シート │  ← どの企業？
│ C-4: 写真取得   │
└─────────────────┘
```

#### 問題2: データ提出進捗管理との連携不足

**現状**:
- データ提出進捗管理（企業モード）で、企業を選んでファイルをアップロード可能
- しかし、カテゴリC/Eの工程と連動しない
- 企業別の詳細データ（ステータス、進捗）が活用されていない

**データフロー**:
```
企業マスター → company-processes API → 企業紹介ページ管理セクション
                                        ↓（ここで止まっている）
                                    （カテゴリC/Eと連携なし）
```

### 1.2 求められる要件

ユーザーが知りたいこと：
1. **どの企業が未完了か**（例：マルトモ：情報シート未提出）
2. **新規企業がどれか**（例：新規企業3社中、2社完了）
3. **既存企業の「変更」があるか**（例：セントラル：ロゴ変更対応中）

---

## 2. システム全体像の理解

### 2.1 関連セクションの役割

#### A. カテゴリ別予実管理（`CategoryManagementSection`）
**役割**: ページ制作工程の予実管理

- A: メインインタビュー記事のページ制作
- K: レジェンドインタビュー記事のページ制作
- **C: 新規企業のページ制作**
- **E: 既存企業のページ制作（変更対応）**

**重要**: ここは「ページ制作」の管理であり、「企業データ管理」ではない。

#### B. 企業紹介ページ管理（`CompanyManagementSection`）
**役割**: 企業データの管理

- 企業マスター51列の入力状況
- ファイルアップロード状況（8フォルダ）
- 企業ステータス（新規/変更/継続/アーカイブ）

#### C. データ提出進捗管理（`DataSubmissionSection`）
**役割**: データ提出のためのファイルアップロード機能

- **カテゴリモード**: カテゴリA, K, H などのデータ提出
- **企業モード**: 企業別の8フォルダへのファイルアップロード

### 2.2 データの流れ

```
企業マスター（スプレッドシート）
    ↓
company-processes API
    ↓
├─ 企業紹介ページ管理セクション（企業データ表示）
└─ 【今回実装】企業別ページ制作進捗セクション（制作工程表示）
    ↓
カテゴリ別予実管理セクション（カテゴリC/Eと連携）
```

---

## 3. 実装する機能の全体像

### 3.1 新規作成物

#### 1. 企業別ページ制作進捗セクション（新規）
- **場所**: 企業紹介ページ管理セクションの下
- **目的**: 企業ごとのページ制作工程を表示
- **表示内容**:
  - 新規企業カード × N枚（今号の新規企業）
  - 既存企業（変更）カード × N枚（今号の変更企業）
  - 各カードに制作工程リストと進捗

#### 2. カテゴリC/Eカードの拡張（修正）
- **場所**: カテゴリ別予実管理セクション
- **目的**: 企業別の詳細を表示
- **表示内容**:
  - カテゴリC/Eカードを展開時、企業別リストを表示
  - 各企業の進捗と未完了工程を表示

#### 3. 企業モードとカテゴリC/E工程の連携（新規）
- **場所**: データ提出進捗管理（企業モード）
- **目的**: ファイルアップロード時に工程を自動完了
- **処理**:
  1. 企業ステータスを取得（新規 → C、変更 → E）
  2. アップロードしたフォルダ種別から工程を判定
  3. 該当する工程を自動完了

### 3.2 UI配置イメージ

```
┌──────────────────────────────────────────┐
│ カテゴリ別予実管理                        │
│ ┌────────┐ ┌────────┐ ┌────────────┐   │
│ │ A: メイン│ │ K: レジェ│ │ C: 新規企業 │   │
│ │   80%   │ │   100%  │ │    62%     │◀─┐│
│ └────────┘ └────────┘ └────────────┘  ││
│                          ↑ 展開すると   ││
│                          │ 企業別リスト  ││
└──────────────────────────────────────────┘│
                                            │
┌──────────────────────────────────────────┐│
│ 企業紹介ページ管理                        ││
│ （企業マスター・ファイルアップロード）     ││
├──────────────────────────────────────────┤│
│ 📋 企業別ページ制作進捗 ← 【新規追加】    ││
│ ┌────────┐ ┌────────┐ ┌──────────┐     ││
│ │マルトモ │ │セントラル│ │テクノシン│     ││
│ │ (新規) │ │ (新規)  │ │エイ(変更)│     ││
│ │  50%   │ │  75%    │ │   25%    │     ││
│ │        │ │         │ │          │     ││
│ │✅情報  │ │✅情報   │ │✅ロゴ    │     │┘
│ │❌写真  │ │✅写真   │ │❌更新    │     │
│ └────────┘ └────────┘ └──────────┘     │
│                                          │
│ ↑ ここの進捗がカテゴリC/Eに反映される    │
└──────────────────────────────────────────┘
```

---

## 4. 実装詳細

### Phase 1: 企業別ページ制作進捗API作成

#### 4.1.1 新規ファイル: `app/api/yumemaga-v2/company-page-production/route.ts`

**エンドポイント**: `GET /api/yumemaga-v2/company-page-production?issue=2025年11月号`

**目的**: 今号の新規企業・変更企業の制作工程進捗を返す

**レスポンス構造**:
```typescript
{
  success: true,
  issue: "2025年11月号",
  newCompanies: [  // 新規企業
    {
      companyId: "marutomo",
      companyName: "マルトモ",
      status: "新規",
      categoryId: "C",
      progress: 50,
      tasks: [
        {
          taskId: "info-sheet",
          taskName: "情報シート取得",
          processNo: "C-2",
          completed: true,
          completedDate: "10/15"
        },
        {
          taskId: "photos",
          taskName: "写真取得",
          processNo: "C-4",
          completed: false,
          completedDate: ""
        },
        {
          taskId: "photo-retouch",
          taskName: "写真レタッチ",
          processNo: "C-5",
          completed: false,
          completedDate: ""
        },
        {
          taskId: "page-production",
          taskName: "ページ制作",
          processNo: "C-6",
          completed: false,
          completedDate: ""
        }
      ]
    }
  ],
  updatedCompanies: [  // 変更企業
    {
      companyId: "techno",
      companyName: "テクノシンエイ",
      status: "変更",
      categoryId: "E",
      progress: 25,
      tasks: [
        {
          taskId: "logo-change",
          taskName: "ロゴ変更データ取得",
          processNo: "E-1",
          completed: true,
          completedDate: "10/16"
        },
        {
          taskId: "page-update",
          taskName: "ページ更新",
          processNo: "E-2",
          completed: false,
          completedDate: ""
        }
      ]
    }
  ],
  summary: {
    totalNew: 3,
    completedNew: 1,
    totalUpdated: 1,
    completedUpdated: 0
  }
}
```

#### 4.1.2 処理フロー

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue');

    if (!issue) {
      return NextResponse.json(
        { success: false, error: '月号を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 企業マスターから今号の企業を取得
    const companyData = await getSheetData(spreadsheetId, '企業マスター!A2:AZ100');

    // 今号の企業をフィルタリング（最終更新号が今号 または 初掲載号が今号）
    const currentIssueCompanies = companyData
      .filter((row: any[]) => {
        const companyId = row[0];
        const companyName = row[1];
        const firstIssue = row[47] || '';  // AV列: 初掲載号
        const lastIssue = row[48] || '';   // AW列: 最終更新号
        const status = row[49] || '';       // AX列: ステータス

        // 今号に関連する企業（初掲載 or 最終更新が今号）
        const isCurrentIssue = firstIssue === issue || lastIssue === issue;

        // ステータスが新規/変更のみ対象
        const isTargetStatus = status === '新規' || status === '変更';

        return companyId && companyName && isCurrentIssue && isTargetStatus;
      })
      .map((row: any[]) => ({
        companyId: row[0],
        companyName: row[1],
        status: row[49] || '',
      }));

    console.log(`📊 今号の対象企業: ${currentIssueCompanies.length}社`);

    // 2. 進捗入力シートから工程データ取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A2:J1000');

    // 3. 各企業の制作工程を取得
    const newCompanies: any[] = [];
    const updatedCompanies: any[] = [];

    for (const company of currentIssueCompanies) {
      const categoryId = company.status === '新規' ? 'C' : 'E';

      // 該当カテゴリの工程を取得
      const companyProcesses = progressData.filter((row: any[]) => {
        const processNo = row[0];
        const processIssue = row[3];

        return processNo.startsWith(categoryId) && processIssue === issue;
      });

      // タスクリスト生成
      const tasks = companyProcesses.map((row: any[]) => {
        const processNo = row[0];
        let processName = row[1] || '';
        const actualDate = row[6] || '';

        // 工程名から「新規企業①」などのプレフィックスを除去
        processName = processName
          .replace(/^新規企業①?/, '')
          .replace(/^既存企業/, '')
          .trim();

        return {
          taskId: processNo,
          taskName: processName,
          processNo,
          completed: !!actualDate,
          completedDate: actualDate,
        };
      });

      // 進捗計算
      const completedTasks = tasks.filter(t => t.completed).length;
      const totalTasks = tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const companyData = {
        companyId: company.companyId,
        companyName: company.companyName,
        status: company.status,
        categoryId,
        progress,
        tasks,
      };

      if (company.status === '新規') {
        newCompanies.push(companyData);
      } else {
        updatedCompanies.push(companyData);
      }
    }

    // 4. サマリー計算
    const summary = {
      totalNew: newCompanies.length,
      completedNew: newCompanies.filter(c => c.progress === 100).length,
      totalUpdated: updatedCompanies.length,
      completedUpdated: updatedCompanies.filter(c => c.progress === 100).length,
    };

    return NextResponse.json({
      success: true,
      issue,
      newCompanies,
      updatedCompanies,
      summary,
    });

  } catch (error: any) {
    console.error('企業別ページ制作進捗取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message || '取得に失敗しました' },
      { status: 500 }
    );
  }
}
```

#### 4.1.3 重要な実装ポイント

1. **今号の企業判定**:
   ```typescript
   // 企業マスターのAV列（初掲載号）またはAW列（最終更新号）が今号と一致
   const isCurrentIssue = firstIssue === issue || lastIssue === issue;
   ```

2. **ステータスフィルタリング**:
   ```typescript
   // 新規 or 変更のみ対象（継続はページ制作不要）
   const isTargetStatus = status === '新規' || status === '変更';
   ```

3. **工程名のクリーニング**:
   ```typescript
   // 「新規企業①情報シート取得」→「情報シート取得」
   processName = processName
     .replace(/^新規企業①?/, '')
     .replace(/^既存企業/, '')
     .trim();
   ```

---

### Phase 2: 企業別ページ制作進捗セクションのUI作成

#### 4.2.1 新規ファイル: `components/company-page-production/CompanyPageProductionSection.tsx`

```typescript
'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface Task {
  taskId: string;
  taskName: string;
  processNo: string;
  completed: boolean;
  completedDate: string;
}

interface Company {
  companyId: string;
  companyName: string;
  status: string;
  categoryId: string;
  progress: number;
  tasks: Task[];
}

interface CompanyPageProductionSectionProps {
  newCompanies: Company[];
  updatedCompanies: Company[];
  summary: {
    totalNew: number;
    completedNew: number;
    totalUpdated: number;
    completedUpdated: number;
  };
  loading?: boolean;
  onRefresh?: () => void;
}

export function CompanyPageProductionSection({
  newCompanies,
  updatedCompanies,
  summary,
  loading = false,
  onRefresh,
}: CompanyPageProductionSectionProps) {
  const [showNewCompanies, setShowNewCompanies] = useState(true);
  const [showUpdatedCompanies, setShowUpdatedCompanies] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-md">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">企業別ページ制作進捗</h2>
            {loading && (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          )}
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs text-orange-700 mb-1">新規企業</div>
            <div className="text-2xl font-bold text-orange-900">
              {summary.completedNew}/{summary.totalNew}社完了
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700 mb-1">変更企業</div>
            <div className="text-2xl font-bold text-blue-900">
              {summary.completedUpdated}/{summary.totalUpdated}社完了
            </div>
          </div>
        </div>
      </div>

      {/* 新規企業セクション */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={() => setShowNewCompanies(!showNewCompanies)}
          className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          {showNewCompanies ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
          新規企業（{newCompanies.length}社）
        </button>

        {showNewCompanies && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {newCompanies.map((company) => (
              <CompanyCard key={company.companyId} company={company} />
            ))}
          </div>
        )}
      </div>

      {/* 変更企業セクション */}
      <div className="p-6">
        <button
          onClick={() => setShowUpdatedCompanies(!showUpdatedCompanies)}
          className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          {showUpdatedCompanies ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
          変更企業（{updatedCompanies.length}社）
        </button>

        {showUpdatedCompanies && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {updatedCompanies.map((company) => (
              <CompanyCard key={company.companyId} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 企業カードコンポーネント
function CompanyCard({ company }: { company: Company }) {
  const isCompleted = company.progress === 100;

  return (
    <div className={`border rounded-lg overflow-hidden ${
      isCompleted
        ? 'border-green-300 bg-green-50'
        : 'border-gray-200 bg-white'
    }`}>
      {/* カードヘッダー */}
      <div className={`p-4 border-b ${
        isCompleted
          ? 'bg-green-100 border-green-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">{company.companyName}</h3>
          <span className={`text-xs px-2 py-1 rounded font-semibold ${
            company.status === '新規'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {company.status}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isCompleted ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${company.progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">{company.progress}%</p>
      </div>

      {/* タスクリスト */}
      <div className="p-4">
        <div className="space-y-2">
          {company.tasks.map((task) => (
            <div key={task.taskId} className="flex items-start gap-2">
              <span className="text-lg">
                {task.completed ? '✅' : '❌'}
              </span>
              <div className="flex-1">
                <p className={`text-sm ${
                  task.completed ? 'text-gray-600' : 'text-red-600 font-semibold'
                }`}>
                  {task.taskName}
                </p>
                {task.completed && task.completedDate && (
                  <p className="text-xs text-gray-500">完了: {task.completedDate}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 4.2.2 メインページへの統合

**修正ファイル**: `app/dashboard/yumemaga-v2/page.tsx`

**追加する箇所**（行725-731の企業紹介ページ管理セクションの直後）:

```typescript
// 1. import追加（ファイル冒頭）
import { CompanyPageProductionSection } from '@/components/company-page-production/CompanyPageProductionSection';

// 2. state追加（行38付近）
const [companyPageProduction, setCompanyPageProduction] = useState<any>(null);

// 3. fetchAllData関数内にAPI呼び出し追加（行142の直後）
// 企業別ページ制作進捗取得
const productionRes = await fetch(`/api/yumemaga-v2/company-page-production?issue=${encodeURIComponent(selectedIssue)}`);
const productionData = await productionRes.json();
if (productionData.success) {
  setCompanyPageProduction(productionData);
}

// 4. JSX追加（行731の企業紹介ページ管理セクションの直後）
{/* 企業別ページ制作進捗 */}
{companyPageProduction && (
  <CompanyPageProductionSection
    newCompanies={companyPageProduction.newCompanies || []}
    updatedCompanies={companyPageProduction.updatedCompanies || []}
    summary={companyPageProduction.summary}
    loading={loading}
    onRefresh={fetchAllData}
  />
)}
```

---

### Phase 3: カテゴリC/Eカードの拡張

#### 4.3.1 既存API拡張: `/api/yumemaga-v2/progress`

**修正ファイル**: `app/api/yumemaga-v2/progress/route.ts`

**追加する処理**（カテゴリC/Eのデータ生成部分）:

```typescript
// カテゴリC/Eの場合、企業別詳細を追加
if (categoryId === 'C' || categoryId === 'E') {
  // 企業マスターから今号の対象企業を取得
  const companyData = await getSheetData(spreadsheetId, '企業マスター!A2:AZ100');

  const targetStatus = categoryId === 'C' ? '新規' : '変更';

  const categoryCompanies = companyData
    .filter((row: any[]) => {
      const companyId = row[0];
      const companyName = row[1];
      const firstIssue = row[47] || '';
      const lastIssue = row[48] || '';
      const status = row[49] || '';

      const isCurrentIssue = firstIssue === issue || lastIssue === issue;
      const isTargetStatus = status === targetStatus;

      return companyId && companyName && isCurrentIssue && isTargetStatus;
    })
    .map((row: any[]) => {
      const companyId = row[0];
      const companyName = row[1];

      // この企業の工程を取得
      const companyProcesses = categoryProcesses.filter((p: any) => {
        // 工程名に企業名が含まれる、または工程Noで判定
        // （将来的には工程に企業IDを紐付ける）
        return true; // 暫定: 全工程を含む
      });

      const completedCount = companyProcesses.filter((p: any) => p.actualDate).length;
      const totalCount = companyProcesses.length;
      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        companyId,
        companyName,
        status: targetStatus,
        progress,
        completed: completedCount,
        total: totalCount,
      };
    });

  // カテゴリデータに企業リストを追加
  categoryData.companies = categoryCompanies;
}
```

#### 4.3.2 フロントエンド拡張: `CategoryManagementSection.tsx`

**修正ファイル**: `components/category-management/CategoryManagementSection.tsx`

**追加するUI**（カード展開時、行359の工程詳細の前に追加）:

```typescript
{/* カテゴリC/Eの場合、企業別リストを表示 */}
{expandedCategory === category.id && (category.id === 'C' || category.id === 'E') && category.companies && (
  <div className="px-4 pb-4 border-b border-gray-200">
    <h4 className="font-semibold text-sm text-gray-700 mb-3">
      企業別進捗（{category.companies.length}社）
    </h4>
    <div className="space-y-2">
      {category.companies.map((company: any) => (
        <div
          key={company.companyId}
          className={`border rounded-lg p-3 ${
            company.progress === 100
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{company.companyName}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                company.status === '新規'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {company.status}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-600">
              {company.completed}/{company.total} ({company.progress}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                company.progress === 100 ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${company.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

### Phase 4: 企業モードとカテゴリC/E工程の連携

#### 4.4.1 工程完了API拡張: `app/api/yumemaga-v2/data-submission/complete-process/route.ts`

**既存ファイルを修正**（企業モード対応を追加）:

```typescript
// リクエストボディに企業モード用のパラメータを追加
interface RequestBody {
  issue: string;
  categoryId?: string;     // カテゴリモード用
  dataType?: DataType;     // カテゴリモード用
  companyId?: string;      // 企業モード用（新規追加）
  companyFolderType?: string; // 企業モード用（新規追加）
}

export async function PUT(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { issue, categoryId, dataType, companyId, companyFolderType } = body;

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 企業モードの場合
    if (companyId && companyFolderType) {
      // 1. 企業マスターから企業ステータスを取得
      const companyData = await getSheetData(spreadsheetId, '企業マスター!A2:AZ100');
      const companyRow = companyData.find((row: any[]) => row[0] === companyId);

      if (!companyRow) {
        return NextResponse.json(
          { success: false, error: '企業が見つかりません' },
          { status: 404 }
        );
      }

      const companyStatus = companyRow[49] || ''; // AX列: ステータス

      // 2. ステータスからカテゴリを判定
      const targetCategory = companyStatus === '新規' ? 'C' : 'E';

      // 3. フォルダ種別から工程を判定
      const FOLDER_PROCESS_MAP: Record<string, string> = {
        '情報シート': `${targetCategory}-2`,  // 情報シート取得
        'ロゴ': `${targetCategory}-4`,         // 写真取得
        'ヒーロー画像': `${targetCategory}-4`,
        'QRコード': `${targetCategory}-4`,
        '代表者写真': `${targetCategory}-4`,
        'サービス画像': `${targetCategory}-4`,
        '社員写真': `${targetCategory}-4`,
        'その他': `${targetCategory}-4`,
      };

      const targetProcessNo = FOLDER_PROCESS_MAP[companyFolderType];

      if (!targetProcessNo) {
        return NextResponse.json(
          { success: true, completedProcesses: [], message: '対象工程なし' }
        );
      }

      // 4. 進捗入力シートから該当工程を検索
      const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A2:J1000');

      const targetRow = progressData.find((row: any[]) => {
        const processNo = row[0];
        const processIssue = row[3];
        const actualDate = row[6];

        return processNo === targetProcessNo &&
               processIssue === issue &&
               !actualDate; // 未完了のもの
      });

      if (!targetRow) {
        return NextResponse.json({
          success: true,
          completedProcesses: [],
          message: '対象工程が見つからないか、既に完了しています',
        });
      }

      // 5. 実績日を更新
      const today = new Date().toLocaleDateString('ja-JP');
      const rowIndex = progressData.indexOf(targetRow) + 2;

      await updateSheetCell(
        spreadsheetId,
        '進捗入力シート',
        `G${rowIndex}`,
        today
      );

      return NextResponse.json({
        success: true,
        completedProcesses: [targetProcessNo],
        processName: targetRow[1],
        message: `${companyRow[1]}の工程 ${targetProcessNo} を完了しました`,
      });
    }

    // カテゴリモードの既存処理（省略）
    // ...

  } catch (error: any) {
    console.error('工程完了エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### 4.4.2 データ提出進捗管理の修正

**修正ファイル**: `components/data-submission/DataSubmissionSection.tsx`

**修正箇所**: `handleFileUpload`関数（行254付近）

**企業モードの工程完了API呼び出しを追加**:

```typescript
// 工程完了API呼び出し（企業モード追加）
if (uploadMode === 'company' && companyMode === 'existing' && selectedCompany && selectedCompanyFolder) {
  try {
    // 企業IDを取得（companies配列から）
    const company = companies.find(c => c.companyName === selectedCompany);
    const companyId = company?.companyId;

    if (companyId) {
      const completeRes = await fetch('/api/yumemaga-v2/data-submission/complete-process', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: selectedIssue,
          companyId: companyId,
          companyFolderType: selectedCompanyFolder,
        }),
      });
      const completeData = await completeRes.json();

      if (completeData.success && completeData.completedProcesses.length > 0) {
        alert(`✅ ${completeData.message}\n工程が自動完了しました`);
      }
    }
  } catch (error) {
    console.error('工程完了API呼び出しエラー:', error);
  }
}
```

**重要**: 企業モードで使う`companies`の型を拡張する必要があります。

**修正箇所**: `DataSubmissionSectionProps`インターフェース（行31付近）

```typescript
interface Company {
  companyId: string;      // 追加
  companyName: string;    // 既存（nameから変更）
  status?: string;        // 追加（新規/変更/継続）
}
```

**修正箇所**: メインページの企業データ渡し方（`app/dashboard/yumemaga-v2/page.tsx`）

```typescript
// 現状（行753）
companies={companies.map(c => ({ name: c.companyName }))}

// 修正後
companies={companies.map(c => ({
  companyId: c.companyId,
  companyName: c.companyName,
  status: c.status
}))}
```

---

## 5. テスト方法

### 5.1 API動作確認

#### テスト1: 企業別ページ制作進捗API

```bash
# 開発サーバー起動
npm run dev

# APIテスト（今号の企業取得）
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/company-page-production?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" | python3 -m json.tool

# 確認ポイント:
# - newCompanies配列に新規企業が含まれるか
# - updatedCompanies配列に変更企業が含まれるか
# - 各企業のtasks配列に工程が含まれるか
# - 進捗率が正しく計算されているか
```

#### テスト2: 工程完了API（企業モード）

```bash
# 企業モードでの工程完了テスト
curl -X PUT "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/complete-process" \
  -H "Content-Type: application/json" \
  -d '{
    "issue": "2025年11月号",
    "companyId": "marutomo",
    "companyFolderType": "情報シート"
  }'

# 確認ポイント:
# - success: true が返るか
# - completedProcesses配列に工程Noが含まれるか
# - 進捗入力シートのG列が更新されているか
```

### 5.2 UI動作確認

#### テスト3: 企業別ページ制作進捗セクション表示

1. ブラウザで http://localhost:3000/dashboard/yumemaga-v2 を開く
2. 企業紹介ページ管理セクションの下に「📋 企業別ページ制作進捗」セクションが表示されることを確認
3. 新規企業カードが表示されることを確認
4. 各カードのタスクリストが表示されることを確認
5. 更新ボタンをクリックして再取得できることを確認

#### テスト4: カテゴリC/Eカードの企業別表示

1. カテゴリ別予実管理セクションを開く
2. カテゴリCカード（新規企業）を展開
3. 企業別進捗リストが表示されることを確認
4. 各企業の進捗率が表示されることを確認

#### テスト5: 企業モードのファイルアップロードと工程連携

1. データ提出進捗管理セクションを開く
2. 企業別モードに切り替え
3. 既存企業から「マルトモ」を選択
4. 「情報シート」フォルダにファイルをアップロード
5. アップロード成功後、「工程が自動完了しました」というアラートが表示されることを確認
6. 企業別ページ制作進捗セクションで、マルトモの「情報シート取得」タスクが✅になっていることを確認
7. カテゴリCカードの進捗が更新されていることを確認

### 5.3 エッジケーステスト

#### テスト6: 今号に該当企業がない場合

```bash
# 存在しない月号でAPIテスト
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/company-page-production?issue=2099%E5%B9%B412%E6%9C%88%E5%8F%B7" | python3 -m json.tool

# 確認ポイント:
# - newCompanies: []
# - updatedCompanies: []
# - summary.totalNew: 0
```

#### テスト7: 既に完了している工程へのアップロード

1. 既に実績日が入力されている工程に対応するフォルダにファイルをアップロード
2. 「対象工程が見つからないか、既に完了しています」というメッセージが返ることを確認

---

## 6. 完了条件

### 6.1 実装完了チェックリスト

#### Phase 1: API実装
- [ ] `app/api/yumemaga-v2/company-page-production/route.ts` 作成完了
- [ ] 今号の新規企業を正しく取得できる
- [ ] 今号の変更企業を正しく取得できる
- [ ] 各企業の制作工程リストを正しく返す
- [ ] 進捗率が正しく計算される

#### Phase 2: UI実装
- [ ] `components/company-page-production/CompanyPageProductionSection.tsx` 作成完了
- [ ] メインページに統合完了
- [ ] 新規企業カードが正しく表示される
- [ ] 変更企業カードが正しく表示される
- [ ] タスクの完了/未完了が視覚的にわかる

#### Phase 3: カテゴリ拡張
- [ ] `/api/yumemaga-v2/progress` API拡張完了
- [ ] `CategoryManagementSection.tsx` 修正完了
- [ ] カテゴリC/Eカード展開時に企業別リストが表示される
- [ ] 企業別進捗が正しく表示される

#### Phase 4: 連携実装
- [ ] 工程完了API（企業モード対応）実装完了
- [ ] `DataSubmissionSection.tsx` 修正完了
- [ ] 企業モードでファイルアップロード時に工程が自動完了する
- [ ] カテゴリC/Eの進捗が更新される

### 6.2 機能完成チェックリスト

- [ ] **どの企業が未完了か**が一目でわかる
- [ ] **新規企業がどれか**が明確に表示される
- [ ] **既存企業の変更対応**が可視化される
- [ ] 企業モードでのファイルアップロードとカテゴリC/E工程が連携している
- [ ] 全てのテストケースがパスする

### 6.3 最終確認事項

1. **データ整合性**
   - 企業マスターのステータスと表示が一致しているか
   - 進捗入力シートの実績日が正しく更新されるか
   - カテゴリC/Eの進捗と企業別進捗が一致しているか

2. **パフォーマンス**
   - API呼び出しが60秒以内に完了するか
   - UIの描画が遅延なく行われるか

3. **エラーハンドリング**
   - 該当企業がない場合に適切に処理されるか
   - 工程が見つからない場合にエラーにならないか
   - ネットワークエラー時に適切なメッセージが表示されるか

---

## 7. トラブルシューティング

### 問題1: 企業が表示されない

**原因**:
- 企業マスターのAV列（初掲載号）またはAW列（最終更新号）が今号と一致していない
- ステータス列（AX列）が「新規」「変更」以外

**解決策**:
```bash
# 企業マスターの該当企業の行を確認
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/companies" | python3 -m json.tool

# 該当企業のAV, AW, AX列の値を確認
# 必要に応じて手動で修正
```

### 問題2: 工程が自動完了しない

**原因**:
- 企業IDが取得できていない
- フォルダ種別と工程のマッピングが間違っている
- 進捗入力シートに該当工程が存在しない

**解決策**:
```bash
# API呼び出しをテスト
curl -X PUT "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/complete-process" \
  -H "Content-Type: application/json" \
  -d '{"issue":"2025年11月号","companyId":"marutomo","companyFolderType":"情報シート"}' \
  | python3 -m json.tool

# レスポンスを確認
# - success: true か
# - completedProcesses配列に工程Noが含まれるか
# - エラーメッセージがあるか
```

### 問題3: 進捗率が正しくない

**原因**:
- タスク数のカウントが間違っている
- 完了判定（actualDate）が正しく行われていない

**解決策**:
```typescript
// デバッグログ追加
console.log('Tasks:', tasks);
console.log('Completed:', completedTasks);
console.log('Total:', totalTasks);
console.log('Progress:', progress);
```

---

## 8. 次世代Claude Codeへのメッセージ

### 実装開始前に必ず確認すること

1. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

2. **既存のAPIとデータ構造の確認**
   ```bash
   # 企業マスターの構造確認
   curl -s "http://127.0.0.1:3000/api/yumemaga-v2/companies" | python3 -m json.tool | head -50

   # カテゴリマスター確認
   curl -s "http://127.0.0.1:3000/api/yumemaga-v2/categories" | python3 -m json.tool

   # 進捗入力シート確認
   curl -s "http://127.0.0.1:3000/api/yumemaga-v2/progress?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" | python3 -m json.tool | head -100
   ```

3. **実装の優先順位**
   - Phase 1（API）→ Phase 2（UI）→ Phase 3（拡張）→ Phase 4（連携）の順で実装
   - 各Phase完了後に必ずテストを実行
   - テスト失敗時は次のPhaseに進まない

### 重要な注意事項

1. **既存コードを壊さない**
   - 既存ファイルの修正は必ず Read → Edit パターン
   - 新規ファイルのみ Write を使用

2. **エラーハンドリングを徹底**
   - Google Sheets API呼び出しは必ず try-catch
   - エラー発生時もクラッシュせず、空配列や既定値で継続

3. **企業マスターの列番号は厳守**
   - AV列（47）: 初掲載号
   - AW列（48）: 最終更新号
   - AX列（49）: ステータス

4. **工程名のクリーニングを忘れない**
   ```typescript
   processName = processName
     .replace(/^新規企業①?/, '')
     .replace(/^既存企業/, '')
     .trim();
   ```

### 成功基準

以下がすべて満たされたら完了：

1. ✅ 企業別ページ制作進捗セクションが表示される
2. ✅ 新規企業/変更企業が正しく分類される
3. ✅ 各企業の制作工程と進捗が表示される
4. ✅ カテゴリC/Eカードで企業別詳細が見られる
5. ✅ 企業モードのファイルアップロードで工程が自動完了する
6. ✅ すべてのテストケースがパスする

---

**最終更新**: 2025-10-10
**作成者**: Claude Code (第4世代)
**想定読者**: 次世代Claude Code

この計画書に従って、確実に実装を完了させてください。
不明点があれば、まず本ドキュメントを精読し、それでも解決しない場合のみユーザーに質問してください。

成功を祈っています！🚀
