# UI思想サマリー

**作成日**: 2025年10月11日
**作成者**: Claude Code
**目的**: 既存システムのUI設計思想を事実ベースで記録する

---

## 📋 調査対象

- メインダッシュボード: `app/page.tsx`
- ゆめマガ制作進捗ダッシュボード: `app/dashboard/yumemaga-v2/page.tsx`
- 営業進捗管理ダッシュボード: `app/dashboard/sales/page.tsx`

---

## 🎨 既存ダッシュボードのUI設計思想

### 1. レイアウト構造

#### メインダッシュボード (`app/page.tsx`)

**構造**:
```
┌────────────────────────────────────────┐
│ サイドメニュー │ メインエリア          │
│ (固定幅264px) │                       │
│               │ ヘッダー              │
│               │ クイックアクセスエリア│
│               │ サマリーグリッド      │
└────────────────────────────────────────┘
```

**コード例**:
```tsx
<div className="min-h-screen bg-gray-50 flex">
  {/* サイドメニュー */}
  <aside className="w-64 bg-white shadow-lg">
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">メニュー</h2>
      <nav className="space-y-2">
        <Link href="/dashboard/sales" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
          <BarChart3 className="w-5 h-5" />
          <span>営業進捗</span>
        </Link>
        {/* 他のナビゲーション項目 */}
      </nav>
    </div>
  </aside>

  {/* メインエリア */}
  <main className="flex-1 p-8">
    {/* コンテンツ */}
  </main>
</div>
```

#### 個別ダッシュボード (営業、ゆめマガ)

**構造**:
```
┌────────────────────────────────────────┐
│ ヘッダー (戻るボタン + タイトル + 更新ボタン) │
│────────────────────────────────────────│
│ コンテンツエリア                        │
│ - カードベースのレイアウト              │
│ - グリッドシステム                      │
└────────────────────────────────────────┘
```

**コード例** (`app/dashboard/sales/page.tsx`):
```tsx
<div className="min-h-screen bg-gray-50 p-8">
  <div className="max-w-7xl mx-auto">
    {/* ヘッダー */}
    <div className="mb-8">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        トップページへ戻る
      </Link>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            営業進捗管理ダッシュボード
          </h1>
        </div>
        <button onClick={fetchKPIData} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-5 h-5" />
          更新
        </button>
      </div>
    </div>
    {/* コンテンツ */}
  </div>
</div>
```

---

### 2. カードコンポーネント設計

#### カード基本構造

**使用されているパターン**:
```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
    <Icon className="w-5 h-5 text-blue-600" />
    タイトル
  </h3>
  {/* カードコンテンツ */}
</div>
```

#### サマリーカード（KPI表示用）

**実装例** (`app/dashboard/sales/page.tsx` 166-254行目):
```tsx
<div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
  <p className="text-sm font-semibold text-gray-700 mb-2">契約件数</p>
  <div className="space-y-1 text-sm">
    <div className="flex justify-between">
      <span className="text-gray-600">目標:</span>
      <span className="font-semibold">{monthlyPerformance.contractTarget}件</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">実績:</span>
      <span className="font-bold text-blue-600">{monthlyPerformance.contractActual}件</span>
    </div>
    {/* ... */}
  </div>
</div>
```

#### ステータスカード（進捗サマリー用）

**実装例** (`app/dashboard/yumemaga-v2/page.tsx` 689-719行目):
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <div className="flex items-center justify-between">
    <span className="text-green-700 font-semibold">完了</span>
    <CheckCircle2 className="w-5 h-5 text-green-600" />
  </div>
  <div className="text-3xl font-bold text-green-900 mt-2">{summary.completed}</div>
</div>
```

---

### 3. 視覚的デザイン規則

#### 色の使用法

**ステータス別カラー**:
```tsx
// 成功・完了
'bg-green-50 border-green-200' // 背景
'text-green-600' // テキスト
'bg-green-100 text-green-800' // バッジ

// 警告・遅延
'bg-yellow-50 border-yellow-200' // 背景
'text-yellow-600' // テキスト
'bg-yellow-100 text-yellow-800' // バッジ

// エラー・重大遅延
'bg-red-50 border-red-200' // 背景
'text-red-600' // テキスト
'bg-red-100 text-red-800' // バッジ

// 進行中
'bg-blue-50 border-blue-200' // 背景
'text-blue-600' // テキスト
'bg-blue-100 text-blue-800' // バッジ

// 未着手・ニュートラル
'bg-gray-50 border-gray-200' // 背景
'text-gray-600' // テキスト
'bg-gray-100 text-gray-800' // バッジ
```

**実装例** (`app/dashboard/sales/page.tsx` 359-366行目):
```tsx
<div className={`p-4 rounded-lg border-2 ${
  metric.status === 'ok'
    ? 'bg-green-50 border-green-200'
    : 'bg-red-50 border-red-200'
}`}>
```

#### フォント・テキストスタイル

**ヘッダー**:
```tsx
<h1 className="text-3xl font-bold text-gray-900">
  統合ダッシュボード
</h1>
<p className="text-gray-600 mt-1">
  全業務の状況を一目で確認
</p>
```

**カードタイトル**:
```tsx
<h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
  <Icon className="w-5 h-5 text-blue-600" />
  タイトル
</h3>
```

**メトリクス値**:
```tsx
<p className="text-4xl font-bold text-gray-900">
  {value}
</p>
```

#### アイコンの使用

**lucide-react使用**:
```tsx
import {
  BarChart3,
  BookOpen,
  Users,
  TrendingUp,
  Share2,
  CheckSquare,
  RefreshCw,
  AlertTriangle,
  // ...
} from 'lucide-react';

// 使用例
<BarChart3 className="w-5 h-5 text-blue-600" />
```

**アイコンサイズ**:
- ナビゲーション: `w-5 h-5` (20px)
- カードタイトル: `w-5 h-5` または `w-6 h-6` (20-24px)
- 大型アイコン: `w-12 h-12` または `w-16 h-16` (48-64px)

#### スペーシング

**セクション間**:
```tsx
<div className="space-y-8">
  {/* セクション */}
</div>
```

**カード内**:
```tsx
<div className="bg-white rounded-lg shadow p-6">
  {/* p-6 = 24px padding */}
</div>
```

**グリッド間隔**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* gap-6 = 24px gap */}
</div>
```

#### ボーダー・影

**カード**:
```tsx
className="bg-white rounded-lg shadow-md"
// rounded-lg = 8px border-radius
// shadow-md = 中程度の影
```

**強調カード**:
```tsx
className="bg-white rounded-xl shadow-md"
// rounded-xl = 12px border-radius
```

**ボーダー付きカード**:
```tsx
className="border border-gray-200 rounded-lg"
// 1px solid border
```

---

### 4. グリッドシステム

#### レスポンシブグリッド

**2カラム**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* カラム */}
</div>
```

**4カラム**:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {/* カラム */}
</div>
```

**5カラム** (営業進捗のメトリクス表示):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
  {/* カラム */}
</div>
```

**実装例** (`app/page.tsx` 280-1084行目):
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* 左カラム */}
  <div className="space-y-6">
    {/* 営業進捗 */}
    {/* ゆめマガ制作 */}
    {/* HP・LLMO分析 */}
  </div>

  {/* 右カラム */}
  <div className="space-y-6">
    {/* タスク管理 */}
    {/* SNS投稿 */}
  </div>
</div>
```

---

### 5. ボタンデザイン

#### プライマリボタン

**更新ボタン**:
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

#### セカンダリボタン

**戻るボタン**:
```tsx
<Link
  href="/"
  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3 transition-colors"
>
  <ArrowLeft className="w-5 h-5" />
  トップページへ戻る
</Link>
```

#### ナビゲーションボタン (サイドメニュー)

```tsx
<Link
  href="/dashboard/sales"
  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
>
  <BarChart3 className="w-5 h-5" />
  <span>営業進捗</span>
</Link>
```

---

### 6. バッジ・ラベル

#### ステータスバッジ

**実装例** (`app/dashboard/sales/page.tsx` 396-405行目):
```tsx
<span
  className={`text-xs font-semibold px-2 py-1 rounded ${
    metric.status === 'ok'
      ? 'bg-green-200 text-green-800'
      : 'bg-red-200 text-red-800'
  }`}
>
  {metric.status === 'ok' ? '✅順調' : '⚠遅れ'}
</span>
```

#### インラインバッジ

```tsx
<span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
  <CheckCircle2 className="w-4 h-4" />
  完了
</span>
```

---

### 7. クイックアクセスエリア

**実装** (`app/page.tsx` 222-277行目):
```tsx
<div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Zap className="w-5 h-5 text-blue-600" />
      <h2 className="text-lg font-bold text-gray-900">クイックアクセス</h2>
    </div>
    <Link href="/dashboard/quick-access" className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
      すべて表示 →
    </Link>
  </div>
  <div className="flex gap-2 flex-wrap">
    {quickAccessButtons.slice(0, 8).map((button, index) => {
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
  </div>
</div>
```

---

## 📊 共通UIパターンまとめ

### カードベースレイアウト

全ダッシュボードで使用されている基本パターン:
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  {/* タイトル + アイコン */}
  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
    <Icon className="w-5 h-5 text-blue-600" />
    タイトル
  </h3>

  {/* コンテンツ */}
  <div className="mt-4">
    {/* カード内容 */}
  </div>
</div>
```

### データ表示パターン

**ラベル + 値の2カラム**:
```tsx
<div className="flex justify-between items-center">
  <span className="text-gray-600">ラベル</span>
  <span className="font-semibold">値</span>
</div>
```

**メトリクスカード**:
```tsx
<div className="p-4 bg-gray-50 rounded-lg">
  <p className="text-sm text-gray-600 mb-1">ラベル</p>
  <p className="text-3xl font-bold text-gray-900">{value}</p>
</div>
```

---

## 🎯 設計原則（事実ベース）

1. **カードベースレイアウト**: すべてのセクションが白背景カード (`bg-white rounded-lg shadow`)
2. **ステータス別色分け**: 緑（成功）、黄（警告）、赤（エラー）、青（進行中）、灰（未着手）
3. **lucide-reactアイコン**: すべてのアイコンはlucide-reactライブラリから使用
4. **Tailwind CSS v4**: すべてのスタイリングはTailwind CSSクラスで実装
5. **レスポンシブデザイン**: グリッドシステムを使用した自動レイアウト調整
6. **統一されたボタンデザイン**: プライマリ(青)、セカンダリ(グレー/テキストリンク)
7. **固定幅サイドメニュー**: 264pxの固定幅サイドナビゲーション（メインダッシュボード）
8. **最大幅コンテナ**: 個別ダッシュボードは`max-w-7xl`で中央揃え

---

**調査完了日**: 2025年10月11日
**調査者**: Claude Code
