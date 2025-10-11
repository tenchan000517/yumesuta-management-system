# 企業別ページ制作進捗管理 改修作業 引き継ぎドキュメント

**作成日**: 2025-10-10
**作成者**: Claude Code (第4世代)
**対象読者**: 次世代Claude Code（暗黙知ゼロで理解可能）
**残作業時間**: 約1-2時間

---

## 📋 現在の状況

### ✅ 完了済み

1. **カテゴリC/Eカードで企業別進捗を表示** - 完了
   - `CategoryManagementSection.tsx` 362-408行目で企業別リストを表示
   - 工程リストは非表示にする条件分岐を実装済み
   - メインページ（`page.tsx` 159-172行目）でデータを統合済み

2. **企業別ページ制作進捗API** - 基本実装完了
   - `/app/api/yumemaga-v2/company-page-production/route.ts` が存在
   - 新規企業・変更企業を取得し、進捗入力シートから工程を取得
   - しかし、**詳細な進捗（プログレスバー）は未実装**

### ⚠ 未完了（これから実装する作業）

**企業別ページ制作進捗の改修** - 以下の3つのタスクを実装

1. **情報提供依頼タスク** - プログレスバー表示
2. **写真取得タスク** - 8フォルダの詳細進捗
3. **ページ制作タスク** - 企業マスター入力状況

---

## 🎯 やりたいこと（要件）

### 現状の問題点

現在の企業別ページ制作進捗は以下の問題がある：

```
マルトモ（新規）50%
├─ 情報シート取得 ✅
├─ 情報シート取得 ✅  ← 重複！
├─ 写真取得 ✅          ← 1フォルダで完了扱い（実際は8フォルダ必要）
└─ ページ制作 ❌
```

### あるべき姿

```
マルトモ（新規）62%
├─ 情報提供依頼 [75%] ━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├─ 情報シート: 1ファイル ✅
│   └─ 企業情報入力: 25/51項目 (49%)
│
├─ 写真取得 [62%] ━━━━━━━━━━━━━━━━━━━━━━━━
│   ├─ ロゴ: 2ファイル ✅
│   ├─ ヒーロー画像: 1ファイル ✅
│   ├─ QRコード: 0ファイル ❌
│   ├─ 代表者写真: 1ファイル ✅
│   ├─ サービス画像: 3ファイル ✅
│   ├─ 社員写真: 5ファイル ✅
│   ├─ 情報シート: 1ファイル ✅
│   └─ その他: 0ファイル ❌
│
└─ ページ制作 [49%] ━━━━━━━━━━━━━━━━━━━━
    （企業マスター51列の入力状況）
```

---

## 📊 データの取得元

### 既存API: `/api/yumemaga-v2/company-processes`

このAPIが既に必要なデータを返している：

```typescript
{
  companies: [
    {
      companyId: "marutomo",
      companyName: "マルトモ",
      status: "new", // 新規企業
      progress: {
        masterSheet: {
          total: 51,
          filled: 25,
          notFilled: 26,
          progressRate: 49  // ← ページ制作の進捗に使う
        },
        fileUpload: {  // ← 写真取得の進捗に使う
          "ロゴ": { uploaded: true, fileCount: 2 },
          "ヒーロー画像": { uploaded: true, fileCount: 1 },
          "QRコード": { uploaded: false, fileCount: 0 },
          "代表者写真": { uploaded: true, fileCount: 1 },
          "サービス画像": { uploaded: true, fileCount: 3 },
          "社員写真": { uploaded: true, fileCount: 5 },
          "情報シート": { uploaded: true, fileCount: 1 },  // ← 情報提供依頼に使う
          "その他": { uploaded: false, fileCount: 0 }
        }
      }
    }
  ]
}
```

**重要**: このAPIは `issue` パラメータで今号の企業のみを返す。

---

## 🔧 実装手順

### Phase 1: `/api/yumemaga-v2/company-page-production/route.ts` の改修

**目的**: 3つのタスク（情報提供依頼、写真取得、ページ制作）を詳細な進捗付きで返す。

**実装方法**:

1. **company-processes APIを内部で呼び出す**

```typescript
// 行77の直後に追加
// 企業別の詳細データを取得
const companyProcessesRes = await fetch(`http://localhost:3000/api/yumemaga-v2/company-processes?issue=${encodeURIComponent(issue)}`);
const companyProcessesData = await companyProcessesRes.json();

if (!companyProcessesData.success) {
  throw new Error('企業データの取得に失敗しました');
}

// 企業IDをキーにしたマップを作成
const companyDetailsMap = new Map();
companyProcessesData.companies.forEach((c: any) => {
  companyDetailsMap.set(c.companyId, c);
});
```

2. **タスク構造を変更** (行100-124を置き換え)

```typescript
// 企業の詳細データを取得
const companyDetails = companyDetailsMap.get(company.companyId);

// タスクを動的に生成
const tasks = [];

if (companyDetails) {
  // 1. 情報提供依頼タスク
  const infoSheetFileCount = companyDetails.progress.fileUpload['情報シート']?.fileCount || 0;
  const masterSheetProgress = companyDetails.progress.masterSheet.progressRate;

  // 情報シート: ファイルが1つ以上あれば100%
  const infoSheetProgress = infoSheetFileCount > 0 ? 100 : 0;

  // 情報提供依頼の全体進捗: (情報シート進捗 + 企業情報入力進捗) / 2
  const infoProvisionProgress = Math.round((infoSheetProgress + masterSheetProgress) / 2);

  tasks.push({
    taskId: 'info-provision',
    taskName: '情報提供依頼',
    progress: infoProvisionProgress,
    details: [
      {
        type: 'file',
        name: '情報シート',
        fileCount: infoSheetFileCount,
        completed: infoSheetFileCount > 0,
        progress: infoSheetProgress
      },
      {
        type: 'form',
        name: '企業情報入力フォーム',
        filledCount: companyDetails.progress.masterSheet.filled,
        totalCount: companyDetails.progress.masterSheet.total,
        progress: masterSheetProgress
      }
    ]
  });

  // 2. 写真取得タスク
  const photoFolders = ['ロゴ', 'ヒーロー画像', 'QRコード', '代表者写真', 'サービス画像', '社員写真', 'その他'];

  const photoDetails = photoFolders.map(folder => {
    const fileData = companyDetails.progress.fileUpload[folder] || { uploaded: false, fileCount: 0 };
    return {
      folder,
      fileCount: fileData.fileCount,
      hasFiles: fileData.uploaded
    };
  });

  // 写真取得の進捗: ファイルがあるフォルダ数 / 7フォルダ
  // （情報シートは除外）
  const completedFolders = photoDetails.filter(d => d.hasFiles).length;
  const photoProgress = Math.round((completedFolders / photoFolders.length) * 100);

  tasks.push({
    taskId: 'photo-collection',
    taskName: '写真取得',
    progress: photoProgress,
    details: photoDetails
  });

  // 3. ページ制作タスク
  tasks.push({
    taskId: 'page-production',
    taskName: 'ページ制作',
    progress: masterSheetProgress,
    note: '企業マスター51列の入力状況'
  });
} else {
  // companyDetailsが取得できない場合は従来の方式
  // （進捗入力シートのみから判定）
  console.warn(`⚠️ 企業詳細データが見つかりません: ${company.companyId}`);

  tasks.push({
    taskId: 'fallback',
    taskName: '進捗データ取得中',
    progress: 0,
    note: '企業データを取得できませんでした'
  });
}
```

3. **進捗計算を更新** (行126-129を置き換え)

```typescript
// 全体進捗: 3つのタスクの平均
const totalProgress = tasks.reduce((sum, t) => sum + t.progress, 0);
const progress = tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0;
```

4. **型定義を更新** (行11-17を置き換え)

```typescript
interface TaskDetail {
  type?: 'file' | 'form';
  name?: string;
  folder?: string;
  fileCount?: number;
  filledCount?: number;
  totalCount?: number;
  completed?: boolean;
  hasFiles?: boolean;
  progress?: number;
}

interface Task {
  taskId: string;
  taskName: string;
  progress: number;
  details?: TaskDetail[];
  note?: string;
}
```

---

### Phase 2: `CompanyPageProductionSection.tsx` のUI更新

**ファイル**: `/mnt/c/yumesuta-management-system/components/company-page-production/CompanyPageProductionSection.tsx`

**目的**: プログレスバーと詳細を表示する

**実装方法**:

1. **CompanyCardコンポーネントを拡張** (行108-153を置き換え)

```typescript
function CompanyCard({ company }: { company: Company }) {
  const [expanded, setExpanded] = useState(false);
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
        <div className="space-y-3">
          {company.tasks.map((task) => (
            <div key={task.taskId} className="border-l-4 border-blue-400 pl-3">
              {/* タスク名とプログレスバー */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{task.taskName}</span>
                <span className="text-xs text-gray-600">{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>

              {/* 詳細（折りたたみ可能） */}
              {task.details && task.details.length > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {expanded ? '詳細を閉じる ▲' : '詳細を見る ▼'}
                </button>
              )}

              {/* 詳細表示 */}
              {expanded && task.details && (
                <div className="mt-2 pl-2 space-y-1">
                  {task.details.map((detail, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                      {detail.type === 'file' && (
                        <>
                          <span className={detail.completed ? 'text-green-600' : 'text-red-600'}>
                            {detail.completed ? '✅' : '❌'}
                          </span>
                          <span>{detail.name}: {detail.fileCount}ファイル</span>
                        </>
                      )}
                      {detail.type === 'form' && (
                        <>
                          <span>{detail.name}:</span>
                          <span className="font-semibold">{detail.filledCount}/{detail.totalCount}項目 ({detail.progress}%)</span>
                        </>
                      )}
                      {detail.folder && (
                        <>
                          <span className={detail.hasFiles ? 'text-green-600' : 'text-gray-400'}>
                            {detail.hasFiles ? '✅' : '❌'}
                          </span>
                          <span>{detail.folder}: {detail.fileCount}ファイル</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ノート */}
              {task.note && (
                <p className="text-xs text-gray-500 mt-1">{task.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

2. **型定義を更新** (行1-26を確認・追加)

```typescript
interface TaskDetail {
  type?: 'file' | 'form';
  name?: string;
  folder?: string;
  fileCount?: number;
  filledCount?: number;
  totalCount?: number;
  completed?: boolean;
  hasFiles?: boolean;
  progress?: number;
}

interface Task {
  taskId: string;
  taskName: string;
  progress: number;
  details?: TaskDetail[];
  note?: string;
}
```

---

## 🧪 テスト方法

### 1. APIのテスト

```bash
# company-processes APIのレスポンスを確認
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/company-processes?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" | python3 -m json.tool | head -100

# 改修後のcompany-page-production APIのレスポンスを確認
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/company-page-production?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" | python3 -m json.tool
```

### 2. UIの確認

1. ブラウザで `http://localhost:3000/dashboard/yumemaga-v2` を開く
2. 「企業別ページ制作進捗」セクションを探す
3. 企業カードに以下が表示されることを確認：
   - 情報提供依頼のプログレスバー
   - 写真取得のプログレスバー（7フォルダ）
   - ページ制作のプログレスバー

---

## ⚠ 注意事項

### 1. company-processes APIの呼び出し

**問題**: サーバーサイドから `http://localhost:3000` を呼び出すと失敗する可能性がある。

**解決策**: 同じロジックを再実装するか、`company-processes` のコードを関数として切り出して共有する。

**簡易実装** (推奨):
```typescript
// company-processes APIを呼び出す代わりに、
// 同じデータ取得ロジックを company-page-production 内に実装する

// 1. 企業マスターから51列入力状況を計算
// 2. Googleドライブから8フォルダのファイル数を取得
```

### 2. Googleドライブアクセス

`listFilesInFolderWithOAuth` を使ってファイル数を取得する必要がある。

既存の `company-processes/route.ts` の行355-382を参考にする。

### 3. WSL環境でのlocalhost

WSLでは `localhost` が動作しない場合がある。`127.0.0.1` を使用すること。

---

## 📁 関連ファイル

### 修正が必要なファイル

1. `/app/api/yumemaga-v2/company-page-production/route.ts` - API改修
2. `/components/company-page-production/CompanyPageProductionSection.tsx` - UI更新

### 参考にするファイル

1. `/app/api/yumemaga-v2/company-processes/route.ts` - データ取得方法
2. `/lib/google-drive.ts` - ファイル数取得関数

---

## 🎯 完了条件

以下がすべて満たされたら完了：

- [ ] 企業別ページ制作進捗APIが3つのタスクを返す
- [ ] 各タスクに詳細な進捗（プログレスバー）が含まれる
- [ ] UIでプログレスバーが表示される
- [ ] 「詳細を見る」で8フォルダの内訳が表示される
- [ ] 情報シート取得の重複が解消されている
- [ ] 写真取得が1フォルダではなく7フォルダで判定される

---

## 💡 実装のヒント

### データフローを理解する

```
企業マスター（スプレッドシート）
    ↓
company-processes API
    ↓ (51列入力状況 + 8フォルダファイル数)
company-page-production API
    ↓ (3つのタスクに変換)
CompanyPageProductionSection (UI)
```

### 進捗計算の公式

```typescript
// 情報提供依頼
情報提供依頼進捗 = (情報シート進捗 + 企業情報入力進捗) / 2
情報シート進捗 = ファイル数 > 0 ? 100 : 0
企業情報入力進捗 = (入力済み項目数 / 51) * 100

// 写真取得
写真取得進捗 = (ファイルがあるフォルダ数 / 7) * 100
※ 情報シートフォルダは除外

// ページ制作
ページ制作進捗 = 企業情報入力進捗

// 全体進捗
全体進捗 = (情報提供依頼進捗 + 写真取得進捗 + ページ制作進捗) / 3
```

---

**最後に**: このドキュメントに従って、確実に実装を完了させてください。不明点があれば、関連ファイルを読んでから判断してください。成功を祈っています！🚀
