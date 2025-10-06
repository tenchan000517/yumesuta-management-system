# HP・LLMO分析ダッシュボード表示設計タスク

## 目的
HP・LLMO分析データをTOPページと専用ダッシュボード（/dashboard/analytics）でどのように表示するかを設計・実装する。

**マネージャー目線**: アクセス数や順位といった数値ではなく、「営業成果につながっているか」「コンテンツが効果的か」「ユーザー体験に問題がないか」を判断できる情報を提供する。

---

## 現状

### 利用可能なデータ（/api/analytics）

#### 1. Google Analytics（GA4）
- **基本メトリクス**:
  - アクティブユーザー: 337
  - セッション数: 337
  - ページビュー数: 2,311
  - 平均セッション時間: 1分8秒
  - 直帰率: 50.15%

- **流入元分析**:
  - Direct: 160セッション（47.48%）
  - Google検索: 102セッション（30.27%）
  - Yahoo検索: 28セッション（8.31%）
  - Bing検索: 10セッション（2.97%）
  - Instagram: 11セッション（3.26%）
  - Gmail: 12セッション（3.56%）

- **LLM流入** ✨（新規実装）:
  - ChatGPT、Perplexity、Gemini等からの流入: 0セッション（準備完了、測定中）

- **検索エンジン別内訳** ✨（新規実装）:
  - Google: 102セッション
  - Yahoo: 28セッション
  - Bing: 10セッション

- **人気ページTOP10**:
  - ページパス、ページタイトル、閲覧数、ユーザー数

#### 2. Google Search Console
- **検索パフォーマンス**:
  - クリック数: 総計
  - 表示回数: 総計
  - CTR: クリック率
  - 平均掲載順位: 総合順位

- **検索クエリTOP10**:
  - クエリ、クリック数、表示回数、CTR、掲載順位

- **検索パフォーマンスTOP10ページ**:
  - ページURL、クリック数、表示回数、CTR、掲載順位

#### 3. Microsoft Clarity
- **ユーザー行動メトリクス**:
  - セッション数
  - 平均スクロール深度
  - 平均滞在時間
  - レイジクリック数（イライラクリック）
  - デッドクリック数（反応しないクリック）
  - クイックバック数（すぐ戻る行動）

---

## 実装済み内容

### API実装
- **ファイル**: `app/api/analytics/route.ts`
- **取得データ**:
  - Google Analytics: 基本メトリクス、流入元、人気ページ、LLM流入、検索エンジン別流入
  - Search Console: 検索パフォーマンス、検索クエリ、検索ページ
  - Microsoft Clarity: ユーザー行動メトリクス
- **型定義**: `types/analytics.ts` に全データ型定義済み

### 専用ダッシュボード
- **ファイル**: `app/dashboard/analytics/page.tsx`
- **現在の表示**: 各APIの生データを羅列（情報過多、マネージャー視点不足）

---

## マネージャー目線での問題点

### ❌ 現在のTOPページ表示の問題
**現在の表示**（`app/page.tsx:450-475`）:
- 今月のアクセス: 337（単なる数値のみ、増減・トレンド不明）
- 検索順位変動: ↑0位（**常に0、実装されていない**）

**何が問題か**:
1. **増減がわからない**（先月比、前週比がない）
2. **虚偽の数値を表示**（検索順位変動が常に0）
3. **アクションに結びつかない**（この数値を見て何をすべきかわからない）

### ❌ 専用ダッシュボードの問題
**現在の表示**: GA、Search Console、Clarityの生データを羅列

**何が問題か**:
1. **情報過多**（どこを見ればいいかわからない）
2. **マネジメント視点がない**（営業成果、コンテンツ効果、UX問題の視点がない）
3. **トレンドがない**（すべて単発の静的データ）
4. **アクションに結びつかない**（問題があっても何をすべきかわからない）

---

## マネージャーが本当に知りたいこと

### 🎯 最重要指標（すぐ実装すべき）

#### 1. **LLMO対策の成果**
- ✅ LLM経由の流入数（ChatGPT、Perplexity、Gemini等）
- ✅ ブランド検索の増減（「ゆめスタ」「ゆめマガ」等の検索回数）
- 📅 LLM掲載状況の確認（手動チェック、Phase 2）

**マネージャーの判断**:
- LLM流入が増えている → LLMO施策が効いている
- ブランド検索が増えている → 認知度が上がっている

#### 2. **営業成果への貢献**
- 📅 問い合わせ件数（CV計測、Phase 2）
- 📅 問い合わせページのアクセス推移（すぐ実装可能）
- 📅 どのページから問い合わせが来たか（Phase 2）

**マネージャーの判断**:
- 問い合わせが増えている → HPが営業に貢献している
- 特定のページから問い合わせが多い → そのコンテンツを強化すべき

#### 3. **コンテンツの効果**
- ✅ 人気ページTOP5（PV数、先週比）
- 📅 新規記事の閲覧数トレンド（Phase 2）
- ✅ STAR紹介ページ別閲覧数
- 📅 ガイド記事別閲覧数（Phase 2）

**マネージャーの判断**:
- 人気コンテンツを特定 → SNSで拡散、営業資料に活用
- 不人気コンテンツを特定 → リライト、削除検討

#### 4. **SEO/LLMOの成果**
- ✅ 検索順位上位10キーワード（先月比変動）
- ✅ 検索流入数（先週比、先月比）
- ✅ CTR改善トレンド

**マネージャーの判断**:
- 順位が上がっている → SEO施策が効いている
- CTRが低い → タイトル・ディスクリプションを改善すべき

#### 5. **ユーザー体験の問題検知**
- ✅ 直帰率が高いページ（70%以上）
- ✅ 平均滞在時間が短いページ（30秒未満）
- ✅ レイジクリック・デッドクリックが多いページ

**マネージャーの判断**:
- 直帰率が高い → コンテンツが期待と違う、改善が必要
- レイジクリックが多い → UIに問題がある、修正が必要

---

## 設計方針

### TOPページ: マネージャーが毎日確認する指標（3-4項目）

**表示すべき項目**:
1. **今月のアクセス数**（先月比 ±○%）
2. **検索流入数**（先週比 ±○%）
3. **LLM経由の流入**（新規、測定中表示）
4. **ユーザー体験の問題件数**（直帰率70%以上のページ数）

**表示しない項目**:
- ❌ 検索順位変動（実装されていない）
- ❌ 単なるアクセス数（増減がわからない）

### 専用ダッシュボード: 詳細分析と問題発見

**セクション構成**:

#### セクション1: LLMO成果（最優先）
- LLM別流入数（ChatGPT、Perplexity、Gemini等）
  - 現状: 0セッション → 「準備完了、測定中」と表示
  - 将来: LLM流入が発生したら内訳を表示
- ブランド検索クエリTOP10
  - 「ゆめスタ」「ゆめマガ」等の検索回数
  - 先月比の増減
- LLM流入の推移グラフ（Phase 2）

#### セクション2: SEO成果
- 検索順位上位10キーワード
  - キーワード、順位、先月比変動
  - 順位が上がった → 緑、下がった → 赤
- 検索流入数の推移（先週比、先月比）
- CTR改善トレンド

#### セクション3: コンテンツパフォーマンス
- 人気ページTOP10
  - ページ名、PV数、滞在時間、直帰率
  - 先週比の増減
- STAR紹介ページ別閲覧数
  - スター名、PV数、先週比
- ガイド記事別閲覧数（Phase 2）

#### セクション4: ユーザー体験の問題
- 直帰率が高いページ（70%以上）
  - ページ名、直帰率、PV数
  - アクション: コンテンツ改善が必要
- 平均滞在時間が短いページ（30秒未満）
  - ページ名、滞在時間、PV数
  - アクション: コンテンツの質を確認
- レイジクリック・デッドクリックが多いページ
  - ページ名、クリック数、問題箇所
  - アクション: UIを修正

#### セクション5: 流入元分析
- SNS vs 検索 vs 直接アクセスの比率
  - 円グラフで視覚化
- 流入元別の滞在時間・CV率（Phase 2）
- Instagram投稿とHP流入の相関（Phase 2）

---

## 実装タスク

### Phase 1: API側の改善（優先度: 高）

#### Task 1-1: ブランド検索クエリの抽出
**ファイル**: `lib/search-console.ts`

```typescript
export async function getBrandSearchQueries(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<{ queries: TopQuery[]; totalClicks: number }> {
  // 「ゆめスタ」「ゆめマガ」等のブランドクエリを抽出
  const brandKeywords = ['ゆめスタ', 'yumesuta', 'ゆめマガ', 'yumemaga'];

  // Search Console APIで取得
  // フィルタ: クエリに brandKeywords が含まれる

  return {
    queries: [...], // ブランドクエリTOP10
    totalClicks: 85, // ブランド検索の総クリック数
  };
}
```

#### Task 1-2: 人気ページの先週比計算
**ファイル**: `lib/google-analytics.ts`

```typescript
export async function getTopPagesWithComparison(
  propertyId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<Array<{
  pagePath: string;
  pageTitle: string;
  views: number;
  previousViews: number;
  changePercent: number;
  averageTime: number;
  bounceRate: number;
}>> {
  // 現在の期間と前期間のデータを取得
  // 前期間のデータと比較
  // 増減率を計算
}
```

#### Task 1-3: UX問題ページの抽出
**ファイル**: `lib/google-analytics.ts`

```typescript
export async function getUXIssuePages(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{
  highBounceRatePages: Array<{ page: string; bounceRate: number; views: number }>;
  shortStayPages: Array<{ page: string; avgTime: number; views: number }>;
}> {
  // 直帰率70%以上のページ
  // 平均滞在時間30秒未満のページ
}
```

**ファイル**: `lib/microsoft-clarity.ts`

```typescript
export async function getRageClickPages(
  token: string
): Promise<Array<{ page: string; rageClicks: number; deadClicks: number }>> {
  // Clarity APIでレイジクリック・デッドクリックが多いページを取得
}
```

---

### Phase 2: フロントエンド改善（優先度: 高）

#### Task 2-1: TOPページの表示修正
**ファイル**: `app/page.tsx:450-475`

**現在の表示**:
```tsx
<div className="space-y-2">
  <div className="flex justify-between items-center">
    <span className="text-gray-600">今月のアクセス</span>
    <span className="font-semibold">{summary.analytics.monthlyUsers.toLocaleString()}</span>
  </div>
  <div className="flex justify-between items-center">
    <span className="text-gray-600">検索順位変動</span>
    <span className="font-semibold text-green-600">↑{summary.analytics.searchRankingChange}位</span>
  </div>
</div>
```

**改善後の表示**:
```tsx
<div className="space-y-3">
  {/* 今月のアクセス（先月比） */}
  <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
    <p className="text-xs font-semibold text-gray-700 mb-1">今月のアクセス</p>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-gray-900">
        {summary.analytics.currentMonthUsers.toLocaleString()}
      </span>
      <span className={`text-sm font-semibold ${
        summary.analytics.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {summary.analytics.changePercent >= 0 ? '↑' : '↓'}
        {Math.abs(summary.analytics.changePercent)}%
      </span>
    </div>
  </div>

  {/* 検索流入（先週比） */}
  <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
    <p className="text-xs font-semibold text-gray-700 mb-1">検索流入</p>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-blue-600">
        {summary.analytics.searchTraffic.toLocaleString()}
      </span>
      <span className={`text-sm font-semibold ${
        summary.analytics.searchChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {summary.analytics.searchChangePercent >= 0 ? '↑' : '↓'}
        {Math.abs(summary.analytics.searchChangePercent)}%
      </span>
    </div>
  </div>

  {/* LLM流入（新規） */}
  <div className="p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
    <p className="text-xs font-semibold text-gray-700 mb-1">LLM経由の流入</p>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-purple-600">
        {summary.analytics.llmTraffic > 0
          ? summary.analytics.llmTraffic
          : '測定中'}
      </span>
      {summary.analytics.llmTraffic > 0 && (
        <span className="text-xs text-gray-600">セッション</span>
      )}
    </div>
  </div>

  {/* UX問題件数 */}
  {summary.analytics.uxIssueCount > 0 && (
    <div className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
      <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        UX問題
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-red-600">
          {summary.analytics.uxIssueCount}
        </span>
        <span className="text-xs text-gray-600">ページ</span>
      </div>
    </div>
  )}
</div>
```

#### Task 2-2: 専用ダッシュボードの全面改善
**ファイル**: `app/dashboard/analytics/page.tsx`

**セクション構成**:
1. LLMO成果セクション
2. SEO成果セクション
3. コンテンツパフォーマンスセクション
4. ユーザー体験の問題セクション
5. 流入元分析セクション

（詳細は別途設計）

---

### Phase 3: データ蓄積・トレンド分析（優先度: 中）

#### Task 3-1: 過去データの保存
- Google Sheetsに過去データを保存
- 週次・月次でスナップショットを取得
- トレンドグラフを表示

#### Task 3-2: CV計測の実装
- GA4でイベントトラッキング設定
- 問い合わせフォーム送信をCV計測
- 流入元別のCV率を表示

---

## 次のステップ

1. ✅ **Task 1-1**: ブランド検索クエリの抽出（すぐ実装可能）
2. ✅ **Task 1-2**: 人気ページの先週比計算（すぐ実装可能）
3. ✅ **Task 2-1**: TOPページの表示修正（すぐ実装可能）
4. **Task 2-2**: 専用ダッシュボードの改善（設計後に実装）

どのタスクから着手しますか？
