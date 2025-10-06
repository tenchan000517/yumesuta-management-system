# Phase 3 自動データ取得機能 - 引き継ぎ書

**作成日**: 2025-10-06
**担当**: 次世代Claude Code
**優先度**: 中（UX改善）

---

## 📋 要件定義

### 現状の問題

すべてのダッシュボードページ（`/app/dashboard/*/page.tsx`）で、以下の問題が発生しています：

1. **ページを開いた直後は何もデータが表示されない**
2. **ユーザーが手動で「更新」ボタンを押さないとデータが表示されない**
3. **初回表示時に空白画面が表示され、UXが悪い**

### 理想の動作

1. **ページマウント時に自動的にデータを取得して表示**
2. **「更新」ボタンは最新データを再取得したい時だけ使う**
3. **リアルタイム性は不要**（自動更新・ポーリング不要）

---

## 🎯 対象ページ一覧

以下のすべてのダッシュボードページが対象です：

| ページ | パス | API エンドポイント |
|--------|------|-------------------|
| 売上進捗管理 | `app/dashboard/sales/page.tsx` | `/api/sales-kpi` |
| ゆめマガ制作 | `app/dashboard/process/page.tsx` | `/api/process-schedule` |
| パートナー＆Stars | `app/dashboard/partners/page.tsx` | `/api/partners` |
| HP/LLMO分析 | `app/dashboard/analytics/page.tsx` | `/api/analytics` |
| SNS投稿管理 | `app/dashboard/sns/page.tsx` | `/api/sns` |
| タスク/プロジェクト | `app/dashboard/tasks/page.tsx` | `/api/tasks` |
| クイックアクセス | `app/dashboard/quick-access/page.tsx` | `/api/quick-access` |
| 競合分析 | `app/dashboard/competitive-analysis/page.tsx` | `/api/competitive-analysis` |

**合計8ページ**

---

## 🔧 実装方法の選択肢

### 選択肢A: 各ページに個別で `useEffect` を追加

**実装内容:**
```typescript
// 各ページの handleRefresh 関数の後に追加
useEffect(() => {
  handleRefresh();
}, []);
```

**メリット:**
- シンプルで理解しやすい
- 既存コードの変更が最小限
- 各ページの独立性が保たれる

**デメリット:**
- 8ページすべてに同じコードを追加する必要がある
- コードの重複（DRY原則に反する）

**実装工数:** 約10分（8ページ × 1-2分）

---

### 選択肢B: カスタムフックで共通化

**実装内容:**

1. **カスタムフックを作成** (`hooks/useAutoFetch.ts`)

```typescript
import { useState, useEffect } from 'react';

export function useAutoFetch<T>(apiUrl: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true); // 初期値をtrueに
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl);
      const json = await response.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, loading, error, refresh };
}
```

2. **各ページで使用**

```typescript
// Before（既存コード）
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleRefresh = async () => {
  setLoading(true);
  // ... fetch処理
};

// After（カスタムフック使用）
const { data, loading, error, refresh } = useAutoFetch('/api/competitive-analysis');
```

**メリット:**
- ロジックが1箇所に集約される（DRY原則）
- テストが容易
- 将来的な拡張（エラーリトライ、キャッシュ等）が楽

**デメリット:**
- 各ページのコードを大幅に書き換える必要がある
- `useState` と `handleRefresh` を削除し、カスタムフックに置き換える作業が発生
- 既存の `setData` 等を使っている箇所がある場合、影響範囲が広い

**実装工数:** 約30-40分（カスタムフック作成10分 + 各ページ書き換え20-30分）

---

### 選択肢C: Server Componentsへの移行

**実装内容:**
- `'use client'` を削除
- Server Componentsでサーバー側でデータ取得
- 初回HTMLにデータが含まれる（SSR）

**メリット:**
- 初回表示が最速（サーバー側でデータ取得済み）
- SEO対応が可能
- Next.js 15の推奨アーキテクチャ

**デメリット:**
- **大幅なリファクタリングが必要**
- 現在のクライアント側のインタラクション（更新ボタン、アコーディオン等）をServer ActionsやClient Componentsに分離する必要がある
- 実装難易度が高い

**実装工数:** 2-3時間以上

---

## 💡 推奨アプローチ

### 現時点での最適解：**選択肢A（個別useEffect追加）**

**理由:**

1. **MVP段階である**
   - 現在はフェーズ1の実装段階
   - 完璧を目指すより、まず動くものを優先すべき

2. **対象ページ数が少ない**
   - 8ページ程度なら、コード重複のデメリットは小さい
   - カスタムフック化のコストの方が高い

3. **既存コードへの影響が最小**
   - 各ページに2-3行追加するだけ
   - バグの混入リスクが低い

4. **将来的な移行が容易**
   - 後でカスタムフック化やServer Components化する際も、容易に移行できる

### 将来的な最適解：**選択肢C（Server Components）**

フェーズ2以降で、以下のタイミングで検討：
- パフォーマンス改善が必要になったとき
- SEOが必要になったとき
- Next.js 15の機能をフル活用したいとき

---

## 📝 実装手順（選択肢A採用時）

### Step 1: 各ページファイルを開く

```bash
app/dashboard/sales/page.tsx
app/dashboard/process/page.tsx
app/dashboard/partners/page.tsx
app/dashboard/analytics/page.tsx
app/dashboard/sns/page.tsx
app/dashboard/tasks/page.tsx
app/dashboard/quick-access/page.tsx
app/dashboard/competitive-analysis/page.tsx
```

### Step 2: `handleRefresh` 関数の後に追加

各ページで、`handleRefresh` 関数定義の直後（`return` 文の前）に以下を追加：

```typescript
// 初回マウント時に自動でデータ取得
useEffect(() => {
  handleRefresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**重要:** `eslint-disable-next-line` コメントが必要な理由：
- `handleRefresh` を依存配列に入れると、無限ループのリスクがある
- 初回マウント時のみ実行したいため、空配列`[]`が正しい

### Step 3: `useEffect` のインポートを確認

各ファイルの冒頭で `useEffect` がインポートされているか確認：

```typescript
import { useState, useEffect } from 'react';
```

なければ追加。

### Step 4: 動作確認

1. 各ページを開く
2. **ページ表示と同時にローディングが始まることを確認**
3. **データが自動で表示されることを確認**
4. **「更新」ボタンを押して再取得できることを確認**

---

## 🧪 テストケース

各ページで以下を確認：

- [ ] ページを開いた瞬間にローディングインジケーターが表示される
- [ ] 数秒後にデータが表示される
- [ ] 「更新」ボタンを押すとデータが再取得される
- [ ] エラー時にエラーメッセージが表示される
- [ ] ブラウザをリロードすると再度自動取得される

---

## 🚨 注意事項

### 1. `handleRefresh` 関数の依存関係

もし `handleRefresh` が他のstate/propsに依存している場合、依存配列の扱いに注意：

```typescript
// ❌ 悪い例（無限ループのリスク）
useEffect(() => {
  handleRefresh();
}, [handleRefresh]);

// ✅ 良い例（初回のみ実行）
useEffect(() => {
  handleRefresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### 2. loading の初期値

初回マウント時に自動取得する場合、`loading` の初期値を `true` にするか検討：

```typescript
// Before
const [loading, setLoading] = useState(false);

// After（オプション）
const [loading, setLoading] = useState(true);
```

これにより、初回表示時に「データなし」ではなく「ローディング中」と表示される。

### 3. API負荷

8ページすべてで自動取得が有効になると、ユーザーが複数ページを開いた際にAPI負荷が上がる可能性があります。現時点では問題ないはずですが、将来的にキャッシュ戦略（SWR、React Query等）の導入を検討してください。

---

## 🔄 将来の拡張案（フェーズ2以降）

### Option 1: SWR / React Query の導入

```typescript
import useSWR from 'swr';

const { data, error, mutate } = useSWR('/api/competitive-analysis', fetcher);
```

**メリット:**
- 自動キャッシュ
- 自動再検証
- フォーカス時の自動更新
- 重複リクエストの削除

### Option 2: Server Components への移行

```typescript
// app/dashboard/competitive-analysis/page.tsx (Server Component)
export default async function CompetitiveAnalysisPage() {
  const data = await fetch('http://localhost:3000/api/competitive-analysis').then(r => r.json());

  return <CompetitiveAnalysisClient initialData={data} />;
}
```

---

## 🎯 次世代Claude Codeへの質問

実装を開始する前に、以下を検討してください：

1. **選択肢A（個別useEffect）、選択肢B（カスタムフック）、選択肢C（Server Components）のどれを採用しますか？**
   - 理由も含めて判断してください

2. **loading の初期値を `true` にすべきですか？**
   - UX観点で検討してください

3. **すべてのページを一度に修正しますか、それとも1ページずつ動作確認しながら進めますか？**
   - リスク管理の観点で判断してください

4. **将来的な拡張（SWR/React Query）を今から見据えて設計すべきですか？**
   - オーバーエンジニアリングにならないよう注意してください

---

## 📚 参考情報

- Next.js公式ドキュメント: https://nextjs.org/docs/app/building-your-application/data-fetching
- React useEffect: https://react.dev/reference/react/useEffect
- SWR: https://swr.vercel.app/
- React Query: https://tanstack.com/query/latest

---

**作成者**: Claude Code
**引き継ぎ先**: 次世代Claude Code
**最終更新**: 2025-10-06
