# UX思想サマリー

**作成日**: 2025年10月11日
**作成者**: Claude Code
**目的**: 既存システムのUX設計思想を事実ベースで記録する

---

## 📋 調査対象

- メインダッシュボード: `app/page.tsx`
- ゆめマガ制作進捗ダッシュボード: `app/dashboard/yumemaga-v2/page.tsx`
- 営業進捗管理ダッシュボード: `app/dashboard/sales/page.tsx`

---

## 🔄 ユーザーインタラクションパターン

### 1. データ更新フロー（手動更新ボタン）

#### メインダッシュボード

**実装** (`app/page.tsx` 71-151行目):
```tsx
const [loading, setLoading] = useState(false);
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

const fetchDashboardSummary = async () => {
  setLoading(true);
  try {
    // 全APIを並列で取得
    const [salesRes, yumemagaRes, tasksRes, analyticsRes, snsRes, partnersRes, quickAccessRes, keywordRankRes] = await Promise.all([
      fetch('/api/sales-kpi'),
      fetch('/api/process-schedule'),
      fetch('/api/tasks'),
      fetch('/api/analytics'),
      fetch('/api/sns'),
      fetch('/api/partners'),
      fetch('/api/quick-access'),
      fetch('/api/keyword-rank'),
    ]);

    const [salesData, yumemagaData, tasksData, analyticsData, snsData, partnersData, quickAccessData, keywordRankData] = await Promise.all([
      salesRes.json(),
      yumemagaRes.json(),
      tasksRes.json(),
      analyticsRes.json(),
      snsRes.json(),
      partnersRes.json(),
      quickAccessRes.json(),
      keywordRankRes.json(),
    ]);

    // サマリーデータを整形
    setSummary({...});

    setLastUpdated(new Date());
  } catch (error) {
    console.error('ダッシュボードサマリー取得エラー:', error);
  } finally {
    setLoading(false);
  }
};

// 初回マウント時に自動でデータ取得
useEffect(() => {
  fetchDashboardSummary();
}, []);
```

**ボタン実装**:
```tsx
<button
  onClick={fetchDashboardSummary}
  disabled={loading}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
>
  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
  更新
</button>
```

**最終更新時刻表示**:
```tsx
{lastUpdated && (
  <p className="text-sm text-gray-500 mt-2">
    最終更新: {lastUpdated.toLocaleString('ja-JP')}
  </p>
)}
```

#### 営業ダッシュボード

**実装** (`app/dashboard/sales/page.tsx` 55-72行目):
```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchKPIData = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch('/api/sales-kpi');
    const data: SalesKPIResponse = await response.json();

    if (data.success) {
      setKpiData(data);
    } else {
      setError(data.error || '不明なエラーが発生しました');
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchKPIData();
}, []);
```

#### ゆめマガダッシュボード

**実装** (`app/dashboard/yumemaga-v2/page.tsx` 45-179行目):
```tsx
const [loading, setLoading] = useState(false);

const fetchAllData = async () => {
  if (!selectedIssue) return;

  setLoading(true);
  try {
    // 工程データ取得でサマリーも取得
    const processesRes = await fetch(`/api/yumemaga-v2/processes?issue=${encodeURIComponent(selectedIssue)}`);
    const processesData = await processesRes.json();
    if (processesData.success) {
      setSummary({...});
    }

    // カテゴリ別進捗取得
    const progressRes = await fetch(`/api/yumemaga-v2/progress?issue=${encodeURIComponent(selectedIssue)}`);
    const progressData = await progressRes.json();
    if (progressData.success) {
      setCategories(categoryList);
    }

    // 次月号準備データ取得
    // ... その他のAPI取得
  } catch (error) {
    console.error('データ取得エラー:', error);
  } finally {
    setLoading(false);
  }
};
```

---

### 2. ローディング状態の表示

#### スケルトンローディング

**営業ダッシュボード** (`app/dashboard/sales/page.tsx` 78-93行目):
```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### ボタン無効化 + スピナー

**メインダッシュボード** (`app/page.tsx` 207-214行目):
```tsx
<button
  onClick={fetchDashboardSummary}
  disabled={loading}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
>
  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
  更新
</button>
```

---

### 3. エラーハンドリング

#### エラー表示UI

**営業ダッシュボード** (`app/dashboard/sales/page.tsx` 95-114行目):
```tsx
if (error || !kpiData?.data) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold text-lg mb-2">
            エラーが発生しました
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchKPIData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### エラーログ

**すべてのダッシュボードで使用**:
```tsx
catch (error) {
  console.error('データ取得エラー:', error);
}
```

---

### 4. ナビゲーション設計

#### サイドメニュー（メインダッシュボード）

**実装** (`app/page.tsx` 162-191行目):
```tsx
<aside className="w-64 bg-white shadow-lg">
  <div className="p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-6">メニュー</h2>
    <nav className="space-y-2">
      <Link href="/dashboard/sales" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
        <BarChart3 className="w-5 h-5" />
        <span>営業進捗</span>
      </Link>
      <Link href="/dashboard/yumemaga" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
        <BookOpen className="w-5 h-5" />
        <span>ゆめマガ制作</span>
      </Link>
      {/* 他のナビゲーション */}
    </nav>
  </div>
</aside>
```

**特徴**:
- アイコン + テキストラベル
- ホバー時に背景色変更 (`hover:bg-blue-50`)
- アクティブリンクの視覚的フィードバック

#### 戻るボタン（個別ダッシュボード）

**実装** (`app/dashboard/sales/page.tsx` 123-128行目):
```tsx
<Link
  href="/"
  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
>
  <ArrowLeft className="w-5 h-5" />
  トップページへ戻る
</Link>
```

#### 詳細リンク

**メインダッシュボード** (`app/page.tsx` 290-292行目):
```tsx
<Link href="/dashboard/sales" className="text-sm text-blue-600 hover:underline">
  詳細 →
</Link>
```

---

### 5. データフィルタリング・選択

#### 月号選択（ゆめマガダッシュボード）

**実装** (`app/dashboard/yumemaga-v2/page.tsx` 26行目 + 664-672行目):
```tsx
const [selectedIssue, setSelectedIssue] = useState('2025年11月号');

<select
  value={selectedIssue}
  onChange={(e) => setSelectedIssue(e.target.value)}
  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option>2025年11月号</option>
  <option>2025年10月号</option>
  <option>2025年9月号</option>
</select>
```

**選択変更時のデータ再取得** (`app/dashboard/yumemaga-v2/page.tsx` 240-244行目):
```tsx
useEffect(() => {
  if (categoryMetadata.length > 0) {
    fetchAllData();
  }
}, [selectedIssue, categoryMetadata]);
```

---

### 6. モーダル・ポップアップ

**実装なし**: 現時点ではモーダルは使用されていません（メインダッシュボードと2つの調査対象ダッシュボード内では未使用）。

---

### 7. アラート・通知

#### ステータスバッジでの視覚的フィードバック

**メインダッシュボード** (`app/page.tsx` 451-459行目):
```tsx
{summary.yumemaga.delayedCount > 0 && (
  <div className="flex justify-between items-center text-red-600">
    <span className="flex items-center gap-1">
      <AlertTriangle className="w-4 h-4" />
      遅延工程
    </span>
    <span className="font-semibold">{summary.yumemaga.delayedCount}件</span>
  </div>
)}
```

#### 遅延タスク表示

**メインダッシュボード** (`app/page.tsx` 1034-1045行目):
```tsx
{summary.tasks.delayedTasks.length > 0 && (
  <div className="mt-4 pt-4 border-t">
    <h4 className="text-sm font-semibold text-gray-700 mb-2">遅延タスク</h4>
    <div className="space-y-1">
      {summary.tasks.delayedTasks.map((task, idx) => (
        <div key={idx} className="text-sm text-red-600">
          • {task.name} ({task.delayedDays}日遅延)
        </div>
      ))}
    </div>
  </div>
)}
```

---

### 8. インタラクティブ要素

#### クイックアクセスボタン

**実装** (`app/page.tsx` 238-273行目):
```tsx
{quickAccessButtons.slice(0, 8).map((button, index) => {
  const IconComponent = button.iconName
    ? (LucideIcons as any)[button.iconName]
    : ExternalLink;

  const bgColorClass = {
    blue: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
    green: 'bg-green-100 hover:bg-green-200 text-green-800',
    orange: 'bg-orange-100 hover:bg-orange-200 text-orange-800',
    purple: 'bg-purple-100 hover:bg-purple-200 text-purple-800',
    gray: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
  }[button.bgColor || 'blue'];

  return (
    <button
      key={index}
      onClick={() => window.open(button.url, '_blank')}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${bgColorClass}`}
    >
      {IconComponent && <IconComponent className="w-4 h-4" />}
      <span className="font-medium">{button.buttonName}</span>
    </button>
  );
})}
```

**特徴**:
- 外部リンクを新しいタブで開く (`window.open(url, '_blank')`)
- 動的なアイコン読み込み
- 背景色のカスタマイズ可能

#### ホバーエフェクト

**すべてのインタラクティブ要素で使用**:
```tsx
// ボタン
className="hover:bg-blue-700 transition-colors"

// リンク
className="hover:text-blue-700 transition-colors"

// ナビゲーション
className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
```

---

## 🎯 データフローパターン

### 1. 手動更新方式（Pull型）

**フロー**:
```
ユーザーが「更新」ボタンをクリック
  ↓
APIへのfetchリクエスト送信
  ↓
ローディング状態表示（ボタン無効化 + スピナー）
  ↓
レスポンス受信・データ整形
  ↓
stateを更新（再レンダリング）
  ↓
最終更新時刻を表示
```

**コード例** (`app/page.tsx` 71-151行目):
```tsx
const fetchDashboardSummary = async () => {
  setLoading(true); // ローディング開始
  try {
    // API並列取得
    const [salesRes, yumemagaRes, ...] = await Promise.all([...]);
    const [salesData, yumemagaData, ...] = await Promise.all([...]);

    // データ整形・state更新
    setSummary({...});
    setLastUpdated(new Date());
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    setLoading(false); // ローディング終了
  }
};
```

### 2. 初回自動取得

**すべてのダッシュボードで使用**:
```tsx
useEffect(() => {
  fetchData();
}, []);
```

**特徴**:
- ページマウント時に1度だけ自動実行
- 以降は手動更新ボタンが必要

### 3. 依存関係による自動再取得

**ゆめマガダッシュボード** (`app/dashboard/yumemaga-v2/page.tsx` 240-244行目):
```tsx
useEffect(() => {
  if (categoryMetadata.length > 0) {
    fetchAllData();
  }
}, [selectedIssue, categoryMetadata]);
```

**特徴**:
- `selectedIssue`（月号選択）が変更されたら自動再取得
- `categoryMetadata`が読み込まれたら自動再取得

---

## 📱 レスポンシブ対応

### ブレークポイント

Tailwind CSSのデフォルトブレークポイントを使用:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### グリッドレイアウトの自動調整

**実装例** (`app/page.tsx` 280行目):
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* 小画面: 1カラム、大画面: 2カラム */}
</div>
```

**実装例** (`app/dashboard/sales/page.tsx` 348行目):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
  {/* 小画面: 1カラム、中画面: 2カラム、大画面: 5カラム */}
</div>
```

---

## 🔍 アクセシビリティ

### 1. セマンティックHTML

**ヘッダー**:
```tsx
<h1 className="text-3xl font-bold text-gray-900">
  統合ダッシュボード
</h1>
```

**ナビゲーション**:
```tsx
<nav className="space-y-2">
  <Link href="/dashboard/sales">...</Link>
</nav>
```

**メイン**:
```tsx
<main className="flex-1 p-8">
  {/* コンテンツ */}
</main>
```

### 2. ボタン無効化状態

```tsx
<button
  onClick={fetchDashboardSummary}
  disabled={loading}
  className="... disabled:bg-gray-400 ..."
>
  更新
</button>
```

### 3. アイコンとテキストラベルの併用

すべてのボタン・リンクでアイコンとテキストを併用:
```tsx
<button className="flex items-center gap-2">
  <RefreshCw className="w-5 h-5" />
  更新
</button>
```

---

## 🎯 UX設計原則（事実ベース）

1. **手動更新方式**: 初回マウント時に自動取得、以降は「更新」ボタンクリックで手動更新
2. **ローディングフィードバック**: ボタン無効化 + スピナーアニメーション + スケルトンUI
3. **エラーハンドリング**: エラー画面 + 再読み込みボタン + console.errorログ
4. **最終更新時刻表示**: データの鮮度を明示
5. **戻るボタン**: すべての個別ダッシュボードにトップページへの戻るリンク
6. **視覚的フィードバック**: ホバー時の色変更、クリック時のアクション実行
7. **ステータス別色分け**: 緑（成功）、黄（警告）、赤（エラー）で視覚的に区別
8. **アイコン + テキスト**: すべてのインタラクティブ要素でアイコンとテキストを併用
9. **レスポンシブデザイン**: 画面サイズに応じたグリッド自動調整
10. **並列API取得**: `Promise.all`を使用した高速データ取得

---

**調査完了日**: 2025年10月11日
**調査者**: Claude Code
