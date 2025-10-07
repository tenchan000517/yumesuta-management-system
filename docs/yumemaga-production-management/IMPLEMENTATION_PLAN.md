# ゆめマガ進捗管理システム 実装計画

**作成日**: 2025-10-07
**ステータス**: 承認待ち
**前提**: `docs/investigation/INVESTIGATION_RESULTS.md` の調査完了

---

## 📋 目次

1. [実装方針サマリー](#実装方針サマリー)
2. [Phase 1: カテゴリの動的抽出](#phase-1-カテゴリの動的抽出)
3. [Phase 2: 依存関係ベースの準備OK判定](#phase-2-依存関係ベースの準備ok判定)
4. [Phase 3: Z・Bカテゴリの専用セクション](#phase-3-zBカテゴリの専用セクション)
5. [Phase 4: カテゴリ同期マスターの活用](#phase-4-カテゴリ同期マスターの活用)
6. [Phase 5: 作業アシスト機能](#phase-5-作業アシスト機能)
7. [Phase 6: フレキシブル企画対応](#phase-6-フレキシブル企画対応)
8. [Phase 7: 企業紹介ページ管理](#phase-7-企業紹介ページ管理)
9. [実装スケジュール](#実装スケジュール)

---

## 実装方針サマリー

### 改善要件との対応

| Phase | 改善要件 | 優先度 | 実装内容 |
|-------|---------|-------|---------|
| Phase 1 | 要件1, 2, 9 | 🔴 最高 | カテゴリの動的抽出・ハードコード削除 |
| Phase 2 | 要件3 | 🔴 高 | 依存関係ベースの準備OK判定・遅延アラート |
| Phase 3 | 要件4 | 🔴 高 | Z・Bカテゴリ専用セクション |
| Phase 4 | 要件3, 9 | 🟡 中 | カテゴリ同期マスターの活用 |
| Phase 5 | 要件6 | 🟡 中 | 作業アシスト機能（Google Studio連携） |
| Phase 6 | 要件8 | 🟡 中 | フレキシブル企画対応（カスタム工程追加） |
| Phase 7 | 要件7 | 🟢 低 | 企業紹介ページ管理（yumesutaHP連携） |

### 設計原則

1. **データソースの一元管理**: すべてのデータは新工程マスター・新依存関係マスターから取得
2. **ハードコード削除**: カテゴリ・工程名・必要データをすべて動的に取得
3. **段階的実装**: Phase 1から順番に実装し、各Phaseで動作確認
4. **後方互換性**: 既存の進捗入力シートのデータを保持

---

## Phase 1: カテゴリの動的抽出

### 目的

- 改善要件1: カテゴリの確定（全15カテゴリ対応）
- 改善要件2: 工程名にカテゴリ名が入っている問題の改善
- 改善要件9: カテゴリの動的設定・ハードコード削除

### 現状の問題

1. **カテゴリハードコード（4箇所）**:
   - `app/dashboard/yumemaga-v2/page.tsx:74` - confirmationRequired配列
   - `app/dashboard/yumemaga-v2/page.tsx:110-116` - getCategoryName関数
   - `app/dashboard/yumemaga-v2/page.tsx:119-127` - getRequiredData関数
   - `app/api/yumemaga-v2/progress/route.ts:32-34` - categories定義

2. **カテゴリ不一致**:
   - 新工程マスター: 15カテゴリ（A, B, C, E, F, H, I, J, K, L, M, N, P, S, Z）
   - コード内: 9〜10カテゴリ（B, F, J, N, Sが不足）

### 実装内容

#### 1-1. カテゴリ取得API作成

**ファイル**: `/app/api/yumemaga-v2/categories/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 新工程マスターから全工程を取得
    const processData = await getSheetData(spreadsheetId, '新工程マスター!A1:I200');

    if (processData.length === 0) {
      return NextResponse.json(
        { success: false, error: '新工程マスターが見つかりません' },
        { status: 404 }
      );
    }

    // カテゴリごとに工程を集計
    const categoryMap: Record<string, any> = {};

    processData.slice(1).forEach(row => {
      if (!row || !row[0]) return;

      const processNo = row[0]; // A列: 工程No
      const processName = row[1]; // B列: 工程名
      const requiredData = row[5] || ''; // F列: 必要データ

      // 工程Noからカテゴリプレフィックスを抽出（例: "A-3" → "A"）
      const prefix = processNo.split('-')[0];

      if (!categoryMap[prefix]) {
        categoryMap[prefix] = {
          categoryId: prefix,
          categoryName: getCategoryDisplayName(prefix),
          processes: [],
          requiredData: new Set<string>(),
        };
      }

      categoryMap[prefix].processes.push({
        processNo,
        processName,
      });

      // 必要データを追加
      if (requiredData) {
        requiredData.split(',').forEach((data: string) => {
          categoryMap[prefix].requiredData.add(data.trim());
        });
      }
    });

    // Set → Array変換
    const categories = Object.values(categoryMap).map(cat => ({
      ...cat,
      requiredData: Array.from(cat.requiredData),
      processCount: cat.processes.length,
    }));

    return NextResponse.json({
      success: true,
      categories,
      totalCategories: categories.length,
    });
  } catch (error: any) {
    console.error('カテゴリ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// カテゴリ表示名の取得（暫定的な実装）
function getCategoryDisplayName(prefix: string): string {
  const names: Record<string, string> = {
    A: 'メインインタビュー',
    K: 'インタビュー②',
    H: 'STAR①',
    I: 'STAR②',
    L: '記事L',
    M: '記事M',
    C: '新規企業',
    E: '既存企業',
    P: 'パートナー一覧',
    Z: '全体進捗',
    B: '全体調整',
    F: '固定ページ',
    J: 'STAR導入',
    N: '修正対応',
    S: 'スタート',
  };
  return names[prefix] || prefix;
}
```

#### 1-2. フロントエンドの修正

**ファイル**: `/app/dashboard/yumemaga-v2/page.tsx`

```typescript
// ハードコードを削除し、APIから取得
const [categories, setCategories] = useState<any[]>([]);
const [categoryMetadata, setCategoryMetadata] = useState<Record<string, any>>({});

useEffect(() => {
  const fetchCategories = async () => {
    const res = await fetch('/api/yumemaga-v2/categories');
    const data = await res.json();
    if (data.success) {
      // カテゴリメタデータをマップ化
      const metadata: Record<string, any> = {};
      data.categories.forEach((cat: any) => {
        metadata[cat.categoryId] = {
          name: cat.categoryName,
          requiredData: cat.requiredData,
          confirmationRequired: ['A', 'K', 'H', 'I', 'L', 'M', 'C', 'E', 'P'].includes(cat.categoryId), // 後でカテゴリ同期マスターから取得
        };
      });
      setCategoryMetadata(metadata);
    }
  };
  fetchCategories();
}, []);

// ハードコード関数を削除
// const getCategoryName = (catId: string) => { ... }  // 削除
// const getRequiredData = (catId: string) => { ... }  // 削除

// 代わりにcategoryMetadataを使用
const categoryName = categoryMetadata[catId]?.name || catId;
const requiredData = categoryMetadata[catId]?.requiredData || [];
```

#### 1-3. progress APIの修正

**ファイル**: `/app/api/yumemaga-v2/progress/route.ts`

```typescript
// ハードコードを削除
// const categories: Record<string, any[]> = { A: [], K: [], ... };  // 削除

// 動的にカテゴリを抽出
const categories: Record<string, any[]> = {};

progressData.slice(1).forEach(row => {
  const processNo = row[0];
  const prefix = processNo.split('-')[0];

  if (!categories[prefix]) {
    categories[prefix] = [];
  }

  categories[prefix].push({
    processNo: row[0],
    processName: row[1],
    actualDate: row[6] || '',
    confirmationStatus: row[7] || '-',
  });
});
```

### 成功基準

- ✅ 新工程マスターの全15カテゴリが表示される
- ✅ カテゴリハードコードが全て削除される
- ✅ カテゴリ名・必要データが動的に取得される
- ✅ 新カテゴリ追加時にコード修正不要

---

## Phase 2: 依存関係ベースの準備OK判定

### 目的

- 改善要件3: 依存関係に基づく準備OK工程の表示とアラート

### 実装内容

#### 2-1. 準備OK工程判定API作成

**ファイル**: `/app/api/yumemaga-v2/ready-processes/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

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

    // 1. 新依存関係マスターを取得
    const dependenciesData = await getSheetData(spreadsheetId, '新依存関係マスター!A1:D200');

    // 2. 進捗入力シートから完了状態を取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    // 工程ごとの完了状態をマップ化
    const completionMap: Record<string, boolean> = {};
    progressData.slice(1).forEach(row => {
      const processNo = row[0];
      const actualDate = row[6]; // G列: 実績日
      const rowIssue = row[3]; // D列: 月号

      if (!rowIssue || rowIssue === issue) {
        completionMap[processNo] = !!actualDate;
      }
    });

    // 3. 準備OK工程を判定
    const readyProcesses: any[] = [];
    const delayedProcesses: any[] = [];

    // 工程ごとに前提工程を集計
    const prerequisitesMap: Record<string, string[]> = {};
    dependenciesData.slice(1).forEach(row => {
      const processNo = row[0]; // A列: 工程No
      const prerequisite = row[1]; // B列: 前提工程

      if (!prerequisite) return;

      if (!prerequisitesMap[processNo]) {
        prerequisitesMap[processNo] = [];
      }
      prerequisitesMap[processNo].push(prerequisite);
    });

    // 各工程について準備OK判定
    Object.keys(prerequisitesMap).forEach(processNo => {
      const prerequisites = prerequisitesMap[processNo];
      const allPrerequisitesCompleted = prerequisites.every(
        prereq => completionMap[prereq]
      );
      const isNotCompleted = !completionMap[processNo];

      if (allPrerequisitesCompleted && isNotCompleted) {
        readyProcesses.push({
          processNo,
          prerequisites,
        });
      }
    });

    // 4. 遅延工程を判定（予定日を過ぎているが未完了）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    progressData.slice(1).forEach(row => {
      const processNo = row[0];
      const plannedDate = row[4]; // E列: 逆算予定日
      const actualDate = row[6]; // G列: 実績日
      const rowIssue = row[3]; // D列: 月号

      if (rowIssue && rowIssue !== issue) return;
      if (actualDate) return; // 完了済みはスキップ

      if (plannedDate && plannedDate !== '-') {
        const planned = parseDate(plannedDate);
        if (planned && today > planned) {
          const delayDays = Math.floor((today.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
          delayedProcesses.push({
            processNo,
            plannedDate,
            delayDays,
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      readyProcesses,
      delayedProcesses,
      summary: {
        readyCount: readyProcesses.length,
        delayedCount: delayedProcesses.length,
      },
    });
  } catch (error: any) {
    console.error('準備OK工程判定エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;

  const parts = dateStr.split('/');
  if (parts.length !== 2) return null;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = new Date().getFullYear();

  return new Date(year, month - 1, day);
}
```

#### 2-2. UIに準備OK・遅延アラートを表示

**ファイル**: `/app/dashboard/yumemaga-v2/page.tsx`

```tsx
// 準備OK工程・遅延工程を取得
const [readyProcesses, setReadyProcesses] = useState<any[]>([]);
const [delayedProcesses, setDelayedProcesses] = useState<any[]>([]);

useEffect(() => {
  const fetchReadyProcesses = async () => {
    const res = await fetch(`/api/yumemaga-v2/ready-processes?issue=${encodeURIComponent(selectedIssue)}`);
    const data = await res.json();
    if (data.success) {
      setReadyProcesses(data.readyProcesses);
      setDelayedProcesses(data.delayedProcesses);
    }
  };
  fetchReadyProcesses();
}, [selectedIssue]);

// 工程カードに準備OK・遅延バッジを表示
<div className="flex items-center gap-2">
  {readyProcesses.some(p => p.processNo === processNo) && (
    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
      ✅ 準備OK
    </span>
  )}
  {delayedProcesses.some(p => p.processNo === processNo) && (
    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
      ⚠️ {delayedProcesses.find(p => p.processNo === processNo)?.delayDays}日遅延
    </span>
  )}
</div>
```

### 成功基準

- ✅ 前提工程が完了した工程に「準備OK」バッジが表示される
- ✅ 予定日を過ぎた未完了工程に「遅延」アラートが表示される
- ✅ 遅延日数が表示される

---

## Phase 3: Z・Bカテゴリの専用セクション

### 目的

- 改善要件4: Z・Bカテゴリの進捗管理セクション作成

### 実装内容

#### 3-1. Z・B専用セクションコンポーネント作成

**ファイル**: `/components/yumemaga-v2/OverallProgressSection.tsx`

```tsx
'use client';

import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface OverallProgressSectionProps {
  zProcesses: any[];
  bProcesses: any[];
  onUpdateActualDate: (processNo: string, date: string) => Promise<void>;
}

export function OverallProgressSection({
  zProcesses,
  bProcesses,
  onUpdateActualDate,
}: OverallProgressSectionProps) {
  return (
    <div className="space-y-6">
      {/* Zカテゴリ: 全体進捗 */}
      <div className="border rounded-lg p-6 bg-blue-50">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          全体進捗（Zカテゴリ）
        </h3>
        <div className="space-y-3">
          {zProcesses.map(process => (
            <ProcessCard
              key={process.processNo}
              process={process}
              onUpdateActualDate={onUpdateActualDate}
            />
          ))}
        </div>
      </div>

      {/* Bカテゴリ: 全体調整 */}
      <div className="border rounded-lg p-6 bg-yellow-50">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          全体調整（Bカテゴリ）
        </h3>
        <div className="space-y-3">
          {bProcesses.map(process => (
            <ProcessCard
              key={process.processNo}
              process={process}
              onUpdateActualDate={onUpdateActualDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcessCard({ process, onUpdateActualDate }: any) {
  return (
    <div className="bg-white p-4 rounded border">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-sm text-gray-500">{process.processNo}</span>
          <h4 className="font-medium">{process.processName}</h4>
        </div>
        <div className="flex items-center gap-2">
          {process.actualDate ? (
            <span className="text-sm text-green-600">✅ {process.actualDate}</span>
          ) : (
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onUpdateActualDate(process.processNo, today);
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              完了
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 成功基準

- ✅ Zカテゴリ（全体進捗）専用セクションが表示される
- ✅ Bカテゴリ（全体調整）専用セクションが表示される
- ✅ 他のカテゴリとは別枠で管理される

---

## Phase 4: カテゴリ同期マスターの活用

### 目的

- 改善要件3, 9: カテゴリ同期マスターを活用した一括管理

### 実装内容

#### 4-1. カテゴリ同期マスター取得API

**ファイル**: `/app/api/yumemaga-v2/category-sync/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    const syncData = await getSheetData(spreadsheetId, 'カテゴリ同期マスター!A1:F20');

    const groups = syncData.slice(1).map(row => ({
      groupName: row[0],
      processes: row[1]?.split(',').map((p: string) => p.trim()) || [],
      idealDay: row[2],
      priority: row[3],
      efficiencyBonus: row[4],
    }));

    return NextResponse.json({
      success: true,
      groups,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### 4-2. 「確認送付」グループの一元管理

カテゴリ同期マスターの「確認送付」グループには以下の工程が含まれます：
- A-14, A-15, K-7, L-10, M-10, H-9, I-9, C-8, E-4, P-4

これらを一括で管理するUIを提供します。

### 成功基準

- ✅ カテゴリ同期マスターから動的にグループを取得
- ✅ 「確認送付」グループの工程を一括表示
- ✅ グループ単位でのステータス管理が可能

---

## Phase 5: 作業アシスト機能

### 目的

- 改善要件6: 各工程での作業アシスト機能

### ユーザーからの回答内容

1. **Google Studio URL**: https://aistudio.google.com/prompts/new_chat
2. **プロンプト**: 音声文字起こし用（話者特定）
3. **対象工程**: 文字起こし（A-3, K-3, L-5, M-5, H-3, I-3）、内容整理（プロンプト未作成）

### 実装内容

#### 5-1. 作業アシストデータ構造

**ファイル**: `/types/work-assist.ts`

```typescript
export interface WorkAssist {
  processNo: string;
  toolName: string;
  toolUrl: string;
  promptTitle: string;
  promptContent: string;
  description: string;
}
```

#### 5-2. 作業アシスト設定マスター作成

スプレッドシートに新シート「作業アシストマスター」を作成（または設定マスターに追加）:

| 工程No | ツール名 | ツールURL | プロンプトタイトル | プロンプト内容 | 説明 |
|-------|---------|----------|-----------------|--------------|------|
| A-3 | Google Studio | https://aistudio.google.com/prompts/new_chat | 音声文字起こし：話者特定 | [プロンプト全文] | 複数人インタビューの話者特定 |
| K-3 | Google Studio | https://aistudio.google.com/prompts/new_chat | 音声文字起こし：話者特定 | [プロンプト全文] | 複数人インタビューの話者特定 |
| ... | ... | ... | ... | ... | ... |

#### 5-3. 作業アシストAPI作成

**ファイル**: `/app/api/yumemaga-v2/work-assist/route.ts`

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const processNo = searchParams.get('processNo');

  const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;
  const assistData = await getSheetData(spreadsheetId, '作業アシストマスター!A1:F100');

  const assists = assistData.slice(1)
    .filter(row => !processNo || row[0] === processNo)
    .map(row => ({
      processNo: row[0],
      toolName: row[1],
      toolUrl: row[2],
      promptTitle: row[3],
      promptContent: row[4],
      description: row[5],
    }));

  return NextResponse.json({ success: true, assists });
}
```

#### 5-4. UI表示

工程カードに「アシスト」ボタンを追加し、クリックでモーダル表示：
- ツール名・URLへのリンク
- プロンプト内容（コピーボタン付き）
- 説明

### 成功基準

- ✅ 文字起こし工程で作業アシストボタンが表示される
- ✅ Google Studioへのリンクが機能する
- ✅ プロンプトをワンクリックでコピー可能

---

## Phase 6: フレキシブル企画対応

### 目的

- 改善要件8: フレキシブルな企画への対応

### ユーザーからの回答内容

- **通常企画**: ほとんどテンプレが可能
- **フレキシブル企画**: 取材が必要、撮影が必要、企画が固まっていない、打ち合わせがある
- **対応方法**: カスタムで工程を追加できるようにする

### 実装内容

#### 6-1. カスタム工程追加機能

**ファイル**: `/app/api/yumemaga-v2/custom-process/route.ts`

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { issue, categoryId, processName, plannedDate, requiredData } = body;

  const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

  // 進捗入力シートに新行を追加
  const newRow = [
    `${categoryId}-CUSTOM-${Date.now()}`, // 工程No（一意なID）
    processName,
    requiredData || '',
    issue,
    plannedDate || '',
    '', // 入力予定日
    '', // 実績日
    '-', // 先方確認ステータス
    'active', // ステータス
    'カスタム工程', // 備考
  ];

  await appendSheetData(spreadsheetId, '進捗入力シート', [newRow]);

  return NextResponse.json({ success: true, message: 'カスタム工程を追加しました' });
}
```

#### 6-2. UI: カスタム工程追加フォーム

各カテゴリセクションに「+ カスタム工程を追加」ボタンを配置：
- 工程名入力
- 予定日選択
- 必要データ入力
- 追加ボタン

### 成功基準

- ✅ カスタム工程を追加できる
- ✅ 追加した工程が進捗管理に表示される
- ✅ カスタム工程も実績日を入力できる

---

## Phase 7: 企業紹介ページ管理

### 目的

- 改善要件7: 企業紹介ページの適切な管理

### ユーザーからの回答内容

1. **企業データベース**: yumesutaHPに存在（計画段階）
2. **判別方法**: データベースにあるかないか、または前月以前の号で作成したかどうか
3. **新規作成タスク一覧**: Cカテゴリ（新規企業）の工程がそれに該当

### 実装内容

#### 7-1. 企業データベース連携API

yumesutaHPの企業データベースと連携して、既存企業・新規企業を判別します。

**参考**: `/docs/workflows/partner-management-guide.md`

```typescript
// 企業マスターデータの取得（将来的にyumesutaHPのDBと連携）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('companyName');

  // 現時点では、PARTNERS_SPREADSHEET_IDから企業情報を取得
  const spreadsheetId = process.env.PARTNERS_SPREADSHEET_ID!;
  const partnersData = await getSheetData(spreadsheetId, 'パートナー一覧!A1:Z1000');

  const existingCompany = partnersData.slice(1).find(row => row[0] === companyName);

  return NextResponse.json({
    success: true,
    exists: !!existingCompany,
    isNew: !existingCompany,
    companyData: existingCompany || null,
  });
}
```

#### 7-2. UI: 企業ステータス表示

Cカテゴリ（新規企業）・Eカテゴリ（既存企業）の工程に、企業ステータスを表示：
- 🆕 新規企業
- ✏️ 変更企業
- ✅ 既存企業（変更なし）

### 成功基準

- ✅ 企業が新規か既存かを判別できる
- ✅ 新規企業の場合、Cカテゴリのタスク一覧が表示される
- ✅ 将来的にyumesutaHPのDBと連携可能な設計

---

## 実装スケジュール

### 推奨実装順序

| Phase | タスク | 工数目安 | 依存関係 |
|-------|--------|---------|---------|
| Phase 1 | カテゴリの動的抽出 | 4時間 | なし |
| Phase 2 | 依存関係ベースの準備OK判定 | 6時間 | Phase 1 |
| Phase 3 | Z・Bカテゴリの専用セクション | 3時間 | Phase 1 |
| Phase 4 | カテゴリ同期マスターの活用 | 4時間 | Phase 1, 2 |
| Phase 5 | 作業アシスト機能 | 5時間 | Phase 1 |
| Phase 6 | フレキシブル企画対応 | 4時間 | Phase 1 |
| Phase 7 | 企業紹介ページ管理 | 6時間 | Phase 1, yumesutaHP連携計画 |

**総工数**: 32時間（約4日間）

### マイルストーン

- **Milestone 1** (完了後): Phase 1-3完了 → カテゴリ管理・準備OK判定・Z/B専用セクション
- **Milestone 2** (完了後): Phase 4-5完了 → カテゴリ同期・作業アシスト
- **Milestone 3** (完了後): Phase 6-7完了 → フレキシブル企画・企業管理

---

## 次のステップ

1. ✅ この実装計画をユーザーに承認してもらう
2. Phase 1から順番に実装開始
3. 各Phase完了後に動作確認・ユーザー確認
4. 問題なければ次のPhaseへ進む

---

**最終更新**: 2025-10-07
**ステータス**: 承認待ち
**承認後**: Phase 1の実装開始
