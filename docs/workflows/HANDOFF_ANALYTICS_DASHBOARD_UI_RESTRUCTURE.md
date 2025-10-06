# アナリティクスダッシュボードUI再構成 引き継ぎドキュメント

**作成日**: 2025-10-06
**重要度**: ★★★★☆
**ステータス**: 🟡 UI再構成が必要
**次世代担当者**: このドキュメントを最初から最後まで読んでから作業開始

---

## 🎯 目的

アナリティクスダッシュボード (`app/dashboard/analytics/page.tsx`) のセクション順序を以下のように再構成する:

### 現在の構成（問題あり）

1. KGI/KPI進捗モニタリング
2. **流入元キーワード分析**（←不要、削除して別のものに置き換える）
3. **重要キーワード順位**（←削除する）
4. **LLM流入状況**（←これは残すが位置を変える）
5. **キーワード検索順位**（←これを上に移動する）
6. Google Analytics
7. Search Console
8. Microsoft Clarity

### 理想の構成（これを実現する）

1. KGI/KPI進捗モニタリング（変更なし）
2. **LLMO対策推奨アクション**（新規作成、現在の「流入元キーワード分析」を置き換え）
3. **登録済みキーワード順位**（既存の「キーワード検索順位」を移動＋折りたたみ入力欄追加）
4. **LLMO対策・流入分析**（既存の「LLM流入状況」を移動＋名前変更）
5. Google Analytics（変更なし）
6. Search Console（変更なし）
7. Microsoft Clarity（変更なし）

---

## 📁 現在の実装状況

### ✅ 完成済み

- **API実装**: `/app/api/keyword-rank/route.ts`
  - GET: スプレッドシートからキーワード順位を取得
  - POST: コピペデータをパースしてスプレッドシートに保存（同じキーワード=上書き、新規=追加）

- **スプレッドシート書き込み**: `lib/google-sheets.ts` の `updateSheetData()`

- **既存UIコンポーネント**: `app/dashboard/analytics/page.tsx` の「キーワード検索順位」セクション
  - 入力テキストエリア
  - 保存ボタン
  - 登録済みキーワード表示テーブル

### ❌ 未完了（あなたがやること）

- UI再構成（セクションの並び替え）
- 入力欄を折りたたみ式に変更
- LLMO対策推奨アクションセクションの作成
- 不要なセクションの削除

---

## 🛠️ 実装手順（段階的に進める）

### ステップ1: 既存の「キーワード検索順位」セクションを確認

**ファイル**: `app/dashboard/analytics/page.tsx`

**場所**: 検索すると見つかる
```bash
grep -n "キーワード検索順位" app/dashboard/analytics/page.tsx
```

**内容**:
- 2カラムグリッド（左=入力エリア、右=表示エリア）
- テキストエリアでコピペ入力
- 保存ボタン
- 登録済みキーワードをテーブル表示

### ステップ2: 折りたたみ式入力欄に変更

**現在の構造**:
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* 入力エリア */}
  <div>...</div>
  {/* 表示エリア */}
  <div>...</div>
</div>
```

**変更後の構造**:
```jsx
<div>
  {/* 表示エリア（常に表示） */}
  <div>
    <table>...</table>

    {/* 折りたたみボタン */}
    <button onClick={() => setShowInputForm(!showInputForm)}>
      {showInputForm ? '入力欄を閉じる' : '新しい順位データを追加'}
    </button>
  </div>

  {/* 入力エリア（折りたたみ） */}
  {showInputForm && (
    <div className="mt-4 border-t pt-4">
      <textarea>...</textarea>
      <button>保存</button>
    </div>
  )}
</div>
```

**必要なstate追加**:
```typescript
const [showInputForm, setShowInputForm] = useState(false);
```

### ステップ3: セクションを移動

**作業内容**:

1. 「キーワード検索順位」セクション全体をコピー
2. KGI/KPIセクションの直後（`{/* KPI Details Grid */}`の後）に貼り付け
3. タイトルを「登録済みキーワード順位」に変更
4. 元の場所から削除

**目印**:
- KGI/KPIセクションの終わり: `</div>` が続く部分の後
- 「流入元キーワード分析」の直前に挿入

### ステップ4: 「流入元キーワード分析」を「LLMO対策推奨アクション」に置き換え

**現在のコード** (410行目付近):
```jsx
<div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4">
    流入元キーワード分析
  </h3>
  {/* ブランドワード vs 一般ワードの分析 */}
</div>
```

**置き換え後**:
```jsx
<div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
    <AlertCircle className="w-5 h-5 text-orange-600" />
    LLMO対策推奨アクション
  </h3>

  <div className="space-y-3">
    {/* LLM流入ゼロの場合 */}
    {data.kpiMetrics.llmStatus.totalSessions === 0 && (
      <div className="border-l-4 border-red-600 bg-red-50 p-4 rounded">
        <div className="flex items-start gap-3">
          <span className="text-xl">🚨</span>
          <div className="flex-1">
            <p className="font-bold text-red-900 mb-1">緊急: LLMからの流入がゼロです</p>
            <p className="text-sm text-red-700 mb-2">
              ChatGPT・Perplexity・Geminiなどの生成AIからのアクセスが検出されていません
            </p>
            <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
              <p className="font-bold text-red-800">推奨対策:</p>
              <p>1. Q&A形式のコンテンツを追加（「高校生 就職 愛知 よくある質問」など）</p>
              <p>2. FAQページを作成・充実化</p>
              <p>3. 構造化データ（Schema.org）を実装</p>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* お問い合わせゼロの場合 */}
    {data.kpiMetrics.kgi.inquiries === 0 && (
      <div className="border-l-4 border-orange-600 bg-orange-50 p-4 rounded">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-orange-900 mb-1">重要: お問い合わせがゼロです</p>
            <p className="text-sm text-orange-700 mb-2">
              過去{days}日間でコンバージョンが発生していません
            </p>
            <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
              <p className="font-bold text-orange-800">推奨対策:</p>
              <p>1. CTAボタンの配置・文言を見直し</p>
              <p>2. お問い合わせフォームを簡略化</p>
              <p>3. GA4イベント設定の確認（generate_leadイベントが正しく発火しているか）</p>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* セッション目標未達の場合 */}
    {data.kpiMetrics.kgi.sessionAchievementRate < 80 && (
      <div className="border-l-4 border-yellow-600 bg-yellow-50 p-4 rounded">
        <div className="flex items-start gap-3">
          <span className="text-xl">📊</span>
          <div className="flex-1">
            <p className="font-bold text-yellow-900 mb-1">
              セッション数が目標の{data.kpiMetrics.kgi.sessionAchievementRate.toFixed(0)}%です
            </p>
            <p className="text-sm text-yellow-700 mb-2">
              目標まであと {formatNumber(data.kpiMetrics.kgi.targetSessions - data.kpiMetrics.kgi.sessions)} セッション
            </p>
            <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
              <p className="font-bold text-yellow-800">推奨対策:</p>
              <p>1. SNS投稿頻度を増やす（週3回→毎日）</p>
              <p>2. 検索順位の低いキーワードのコンテンツ改善</p>
              <p>3. 内部リンク構造の最適化</p>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* すべて順調な場合 */}
    {data.kpiMetrics.llmStatus.totalSessions > 0 &&
      data.kpiMetrics.kgi.inquiries > 0 &&
      data.kpiMetrics.kgi.sessionAchievementRate >= 80 && (
      <div className="border-l-4 border-green-600 bg-green-50 p-4 rounded">
        <div className="flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div className="flex-1">
            <p className="font-bold text-green-900 mb-1">すべて順調です！</p>
            <p className="text-sm text-green-700 mb-2">
              主要KPIが目標を達成しています
            </p>
            <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
              <p className="font-bold text-green-800">さらなる改善施策:</p>
              <p>1. コンバージョン率2.0%以上を目指してフォーム最適化</p>
              <p>2. LLM流入をさらに増やすためのFAQコンテンツ追加</p>
              <p>3. リピーターを増やすためのメルマガ・SNS運用強化</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
```

### ステップ5: 「重要キーワード順位」セクションを削除

**場所**: 542行目付近

**検索方法**:
```bash
grep -n "重要キーワード順位" app/dashboard/analytics/page.tsx
```

**削除範囲**:
```jsx
{/* Important Keywords Ranking */}
<div className="bg-white rounded-lg shadow-sm p-6">
  ...
</div>
```

**注意**: このセクション全体を削除（約100行）

### ステップ6: 「LLM流入状況」を「LLMO対策・流入分析」に名前変更

**場所**: 636行目付近

**変更前**:
```jsx
<h3 className="text-lg font-bold text-gray-900 mb-4">
  LLM流入状況
</h3>
```

**変更後**:
```jsx
<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
  <TrendingUp className="w-5 h-5 text-purple-600" />
  LLMO対策・流入分析
</h3>
```

---

## ✅ 完成後の確認ポイント

1. http://localhost:3000/dashboard/analytics にアクセス
2. セクション順序が理想通りか確認:
   - KGI/KPI進捗モニタリング
   - LLMO対策推奨アクション
   - 登録済みキーワード順位
   - LLMO対策・流入分析
   - Google Analytics
   - Search Console
   - Microsoft Clarity

3. 折りたたみ機能の動作確認:
   - 「新しい順位データを追加」ボタンをクリック
   - 入力欄が表示される
   - もう一度クリックすると非表示になる

4. データ入力・保存の動作確認:
   - https://checker.search-rank-check.com/ で検索順位を調べる
   - 結果をコピーして貼り付け
   - 「保存」ボタンをクリック
   - 成功メッセージが表示される
   - テーブルに反映される

---

## ⚠️ 注意事項

### 構文エラーを防ぐために

1. **1つずつ変更してテストする**
   - ステップ2を実装したら動作確認
   - ステップ3を実装したら動作確認
   - 一気にやらない

2. **JSXの閉じタグに注意**
   - `{` と `}` の数が合っているか確認
   - `<div>` と `</div>` の数が合っているか確認

3. **条件分岐の `&&` に注意**
   - `{condition && (<div>...</div>)}` の形式を守る
   - カッコを忘れない

4. **importを忘れない**
   - `AlertCircle` を使う場合は `lucide-react` からimport済みか確認

### デバッグ方法

エラーが出たら:
1. dev serverのログを確認 (`npm run dev` のターミナル)
2. ブラウザのコンソールを開く (F12)
3. エラーメッセージの行番号を確認
4. その付近の閉じタグ・カンマ・カッコをチェック

---

## 📦 最終的なコミット

すべて動作確認できたら:

```bash
git add -A
git commit -m "アナリティクスダッシュボードUI再構成: セクション順序変更＋折りたたみ入力欄追加

- LLMO対策推奨アクション追加（データに基づくタスク提示）
- 登録済みキーワード順位を上部に移動＋折りたたみ入力欄
- 不要な「流入元キーワード分析」「重要キーワード順位」削除
- LLMO対策・流入分析セクション名変更

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🎉 完了後の報告

ユーザーに以下を報告:

```
UI再構成が完了しました！

変更内容:
1. LLMO対策推奨アクション: データに基づいて具体的な施策を提示
2. 登録済みキーワード順位: 折りたたみ式入力欄で省スペース化
3. セクション順序の最適化: 重要な情報が上部に集約

動作確認済みです。http://localhost:3000/dashboard/analytics をご確認ください。
```

---

**作成者**: Claude Code (2025-10-06)
**次世代担当者**: [あなたの名前]
**作業開始日**: [記入してください]
**作業完了日**: [記入してください]
