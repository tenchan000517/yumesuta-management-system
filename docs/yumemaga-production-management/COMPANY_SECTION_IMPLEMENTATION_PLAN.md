# 企業セクション完全実装計画書

**作成日**: 2025-10-08
**対象**: 次世代Claude Code（暗黙知ゼロで実装可能）
**目的**: 企業紹介ページ管理セクションを100%完成させる

---

## 🎯 実装ゴール

### 現状の問題点（ユーザー指摘）

1. ❌ **ページマウント時に独立更新** - 他セクションは自動読み込み、企業だけ手動更新
2. ❌ **進捗が工程ベース** - 企業マスターの51列入力状況を進捗とすべき
3. ❌ **新規企業フローが皆無** - ヒアリング→撮影などの工程が必要
4. ❌ **カードのステータスカラー未適用** - ステータスバッジの色が反映されていない
5. ❌ **作業アシストがない** - 次のアクションが不明確

### 完成時の仕様

- ✅ ページマウント時に他セクションと同時に自動読み込み
- ✅ 進捗 = 企業マスター51列の入力率（例: 45列入力済み → 88%）
- ✅ 新規企業フロー（ヒアリング→撮影→…）の工程表示
- ✅ ステータスバッジの色が企業カード全体に適用
- ✅ 次のアクション表示（「データ提出待ち」「内部チェック中」など）

---

## 📋 前提知識: 企業マスターの構造

### データ構造（確認済み）

- **列数**: 51列（A～AY列）
- **インデックス**: 0-50
- **ヘッダー行**: 1行目
- **データ行**: 2行目以降

### 重要な列（インデックス）

| 列名 | インデックス | 説明 | 例 |
|------|-------------|------|-----|
| 企業ID | 0 | 一意識別子 | `marutomo` |
| 企業名 | 1 | 表示名 | `株式会社マルトモ` |
| 初掲載号 | 47 | 初めて掲載した号 | `2024年10月号` |
| 最終更新号 | 48 | 最後に更新した号 | `2025年11月号` |
| ステータス | 49 | active/inactive | `active` |
| 備考 | 50 | メモ | `✅ 実データ反映済み` |

### 進捗計算ロジック

```typescript
function calculateCompanyProgress(companyRow: any[]): number {
  const totalColumns = 51;
  const filledColumns = companyRow.filter(cell => cell && cell.trim() !== '').length;
  return Math.round((filledColumns / totalColumns) * 100);
}
```

**重要**: 企業マスターの各セルが入力されているかチェックし、入力率を進捗とする

---

## ✅ 完了したタスク

### ✅ タスク0: 折りたたみUI実装（完了: 2025-10-08）

**ファイル**: `components/company-management/CompanyManagementSection.tsx`

**実装内容**:
- 「企業詳細を開く/閉じる」ボタンで企業カード表示/非表示を切り替え
- カテゴリ別予実管理と同じUIパターンを採用
- 全社展開/全社折りたたみボタン
- 区切り線下の余白調整（親コンテナpy-6で実現）

**実装コード**:
```tsx
// 折りたたみボタン (L168-189)
{isSectionExpanded && (
  <div className="py-6">
    <div className="flex justify-center">
      <button
        onClick={() => setShowCompanyCards(!showCompanyCards)}
        className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
      >
        {showCompanyCards ? (
          <>
            <ChevronUp className="w-5 h-5" />
            企業詳細を閉じる
          </>
        ) : (
          <>
            <ChevronDown className="w-5 h-5" />
            企業詳細を開く
          </>
        )}
      </button>
    </div>
  </div>
)}
```

**テスト結果**:
- ✅ ボタンクリックで企業カード表示/非表示が切り替わる
- ✅ カテゴリ別予実管理と一貫したUXを実現
- ✅ 区切り線下の余白が適切に表示される

---

## 🏗️ 実装タスク（優先度順）

### タスク1: 進捗計算ロジックの修正

**ファイル**: `app/api/yumemaga-v2/company-processes/route.ts`

**現状の問題**:
```typescript
// ❌ 間違い: 進捗入力シートの工程を見ている
const progress = calculateProgress(companyProcesses);
```

**修正内容**:
```typescript
// ✅ 正しい: 企業マスター51列の入力状況を見る
const progress = calculateCompanyMasterProgress(companyRow);

function calculateCompanyMasterProgress(row: any[]): {
  total: number;
  filled: number;
  progressRate: number;
} {
  const total = 51;
  const filled = row.filter(cell => cell && String(cell).trim() !== '').length;
  const progressRate = Math.round((filled / total) * 100);

  return {
    total,
    filled,
    notFilled: total - filled,
    progressRate
  };
}
```

**実装手順**:
1. `calculateCompanyMasterProgress()` 関数を追加
2. API応答の `progress` を企業マスター入力状況に変更
3. `processes` は削除または別フィールドに移動

---

### タスク2: ページマウント時の自動読み込み

**ファイル**: `app/dashboard/yumemaga-v2/page.tsx`

**現状の問題**:
- 企業データは「更新」ボタンクリック時のみ取得
- 他のセクション（カテゴリ別進捗など）はページマウント時に自動取得

**修正内容**:
```typescript
// ✅ useEffect内で企業データも自動取得
useEffect(() => {
  if (selectedIssue) {
    fetchProgress(selectedIssue);
    fetchCategories();
    fetchCompanies(selectedIssue); // ← 追加
  }
}, [selectedIssue]);

const fetchCompanies = async (issue: string) => {
  setCompanyLoading(true);
  const res = await fetch(`/api/yumemaga-v2/companies?issue=${encodeURIComponent(issue)}`);
  const data = await res.json();
  setCompanies(data.companies || []);
  setCompanyLoading(false);
};
```

**実装手順**:
1. `fetchCompanies()` 関数を追加
2. `useEffect` 内で `fetchCompanies()` を呼び出し
3. ステート `companies`, `companyLoading` を追加
4. `CompanyManagementSection` に `companies` を渡す

---

### タスク3: 新規企業フローの実装

**新規API**: `app/api/yumemaga-v2/company-workflow/route.ts`

**仕様**:
- 新規企業（status: 'new'）の場合、専用の工程フローを返す
- 既存企業（status: 'updated', 'existing'）の場合、簡易フローを返す

**工程定義**:

#### 新規企業フロー（C）
```typescript
const NEW_COMPANY_WORKFLOW = [
  { id: 'C-1', name: 'ヒアリング', order: 1 },
  { id: 'C-2', name: '撮影', order: 2 },
  { id: 'C-3', name: 'データ入力', order: 3 },
  { id: 'C-4', name: '内容整理', order: 4 },
  { id: 'C-5', name: 'ページ制作', order: 5 },
  { id: 'C-6', name: '内部チェック', order: 6 },
  { id: 'C-7', name: '確認送付', order: 7 },
  { id: 'C-8', name: '修正対応', order: 8 },
];
```

#### 既存企業フロー（E）
```typescript
const EXISTING_COMPANY_WORKFLOW = [
  { id: 'E-1', name: 'データ確認', order: 1 },
  { id: 'E-2', name: '追加撮影（任意）', order: 2, optional: true },
  { id: 'E-3', name: 'ページ更新', order: 3 },
  { id: 'E-4', name: '内部チェック', order: 4 },
];
```

**実装手順**:
1. 新規API `/api/yumemaga-v2/company-workflow` を作成
2. 企業ステータスに応じて適切なフローを返す
3. 進捗入力シートから実績日を取得してマージ

---

### タスク4: ステータスカラーの適用

**ファイル**: `components/company-management/CompanyCard.tsx`

**現状の問題**:
- ステータスバッジの色情報（`statusBadge`）が定義されているが、カード全体には適用されていない

**修正内容**:
```tsx
// ✅ ステータスに応じたカードのボーダー色
const borderColorClass = {
  new: 'border-l-4 border-orange-500',
  updated: 'border-l-4 border-blue-500',
  existing: 'border-l-4 border-green-500',
}[company.status] || 'border-l-4 border-gray-300';

return (
  <div className={`bg-white rounded-lg shadow ${borderColorClass} p-4`}>
    {/* カード内容 */}
  </div>
);
```

**実装手順**:
1. ステータスごとのボーダー色マッピングを追加
2. カードのクラス名に動的ボーダー色を適用
3. ステータスバッジも同じ色で統一

---

### タスク5: 作業アシスト機能

**ファイル**: `components/company-management/CompanyCard.tsx`

**仕様**:
- 企業の現在の工程状況から「次にやるべきこと」を表示
- 例: 「データ提出待ち」「内部チェック中」「確認送付待ち」

**実装ロジック**:
```typescript
function getNextAction(company: Company): string {
  const { workflow, progress } = company;

  // 最初の未完了工程を探す
  const nextProcess = workflow.find(p => !p.actualDate);

  if (!nextProcess) {
    return '✅ 全工程完了';
  }

  if (nextProcess.status === 'in_progress') {
    return `🔄 ${nextProcess.name}中`;
  }

  return `⏳ ${nextProcess.name}待ち`;
}
```

**表示位置**:
- 企業カードの上部、企業名の下
- 目立つ色とアイコンで表示

**実装手順**:
1. `getNextAction()` 関数を追加
2. カード上部に次のアクションを表示
3. アイコンと色で視覚的に強調

---

## 🧪 動作確認手順（完全版）

### 1. APIデータ確認

**重要**: WSL環境では `localhost` が使えない。必ず `127.0.0.1` を使用。

```bash
# サーバー起動
npm run dev

# 企業マスター取得（URLエンコード必須）
curl -s "http://127.0.0.1:3000/api/yumemaga-sheets?sheet=%E4%BC%81%E6%A5%AD%E3%83%9E%E3%82%B9%E3%82%BF%E3%83%BC&limit=2" | python3 -m json.tool

# 企業別工程取得
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/companies?issue=2025年11月号" | python3 -m json.tool
```

### 2. ブラウザ確認

```
http://localhost:3000/dashboard/yumemaga-v2
```

**確認ポイント**:
- [ ] ページ読み込み時に企業データが自動取得される
- [ ] 進捗が「X列/51列入力済み（Y%）」と表示される
- [ ] 新規企業は8工程、既存企業は4工程が表示される
- [ ] カードのボーダー色がステータスに応じて変わる
- [ ] 次のアクション（「データ提出待ち」など）が表示される

### 3. デバッグログ確認

開発ツール（F12）→ Consoleで確認:
```
✅ 企業マスター: 6社取得
✅ 企業別工程: 6社の進捗を返却
進捗計算: marutomo → 45列/51列 (88%)
```

---

## 📁 ファイル構成（最終形）

```
app/api/yumemaga-v2/
  ├── companies/route.ts           # 企業一覧取得（進捗は51列入力率）
  ├── company-workflow/route.ts    # 企業工程フロー取得（NEW）
  └── company-processes/route.ts   # （削除または統合）

components/company-management/
  ├── CompanyCard.tsx              # 企業カード（ステータスカラー適用）
  ├── CompanyManagementSection.tsx # 企業管理セクション
  └── CompanyWorkflow.tsx          # 企業工程表示（NEW）

app/dashboard/yumemaga-v2/page.tsx # メインページ（自動読み込み対応）
```

---

## ✅ 完成チェックリスト

### 機能実装
- [x] 折りたたみUI実装（カテゴリ別予実管理と同じパターン） ✨ NEW
- [x] 企業カード基本表示
- [x] サマリー表示（総企業数、新規/変更/継続企業数、平均進捗）
- [ ] 進捗 = 企業マスター51列の入力率
- [ ] ページマウント時に自動読み込み
- [ ] 新規企業8工程フロー実装
- [ ] 既存企業4工程フロー実装
- [ ] ステータスカラーをカード全体に適用
- [ ] 次のアクション表示機能

### 動作確認
- [x] 企業データが正しく取得される
- [x] 6社すべてが表示される
- [x] 折りたたみUIが正常に動作する ✨ NEW
- [ ] 企業データが自動取得される
- [ ] 進捗率が正しく計算される（例: 45/51 = 88%）
- [ ] 新規/既存で異なる工程が表示される
- [ ] カードのボーダー色が正しい
- [ ] 次のアクションが表示される

### ドキュメント
- [x] PROGRESS_REPORT.md更新（Phase 7の進捗を反映） ✨ NEW
- [x] START_PROMPT.md更新（Phase 7の現状を反映） ✨ NEW
- [x] COMPANY_SECTION_IMPLEMENTATION_PLAN.md更新（折りたたみUI完了を記載） ✨ NEW
- [ ] API確認方法をCLAUDE.mdに追記
- [ ] 実装完了を引き継ぎドキュメントに記載

---

## 🚨 実装時の注意事項

### 1. URLエンコード必須
日本語を含むAPIパラメータは必ずエンコード:
```bash
# ❌ 失敗
curl "http://127.0.0.1:3000/api/yumemaga-sheets?sheet=企業マスター"

# ✅ 成功
curl "http://127.0.0.1:3000/api/yumemaga-sheets?sheet=%E4%BC%81%E6%A5%AD%E3%83%9E%E3%82%B9%E3%82%BF%E3%83%BC"
```

### 2. localhostではなく127.0.0.1
WSL環境では `localhost` の名前解決に失敗する。必ず `127.0.0.1` を使用。

### 3. 企業マスターの列番号
- インデックス47: 初掲載号
- インデックス48: 最終更新号
- インデックス49: ステータス
- インデックス50: 備考

---

**作成者**: Claude Code
**最終更新**: 2025-10-08
**次世代実装者へ**: この計画書に従って実装すれば、暗黙知なしで100%完成できます
