# ゆめマガ進捗管理システム - 問題点と引き継ぎ事項

**作成日**: 2025-10-08
**作成者**: Claude Code (前任)
**対象**: 次世代Claude Code（実装担当者）

---

## 🚨 緊急対応が必要な問題

現在、Phase 2（準備OK判定）まで実装完了しましたが、以下の**6つの重大な問題**が発見されました。
これらの問題を徹底的に調査し、根本原因を特定して修正してください。

---

## ❌ 問題1: 各カテゴリに紐づいている工程の予定日が正しく取得できていない

### 症状
- 工程カードで「予定: -」と表示される
- 本来は「予定: 10/15」のように逆算予定日が表示されるべき

### 原因の可能性
1. **進捗入力シートのE列（逆算予定日）が空**
   - スプレッドシートに予定日が入力されていない可能性
   - または、GASによる自動入力が機能していない

2. **progress APIが予定日を正しく取得していない**
   - `app/api/yumemaga-v2/progress/route.ts:58` で `plannedDate: row[4]` を追加したが、データが空
   - E列のインデックスが間違っている可能性（0始まりなのでrow[4]はE列）

3. **ガントシートから予定日を取得すべき**
   - `processes` APIは既にガントシートから予定日を取得している
   - progress APIもガントシートを参照すべきかもしれない

### 調査手順
1. スプレッドシート「進捗入力シート」のE列を確認
   ```
   工程No | 工程名 | 必要データ | 月号 | 逆算予定日(E列) | ...
   A-1    | ...    | ...        | ... | ←ここに日付が入っているか？
   ```

2. progress APIのレスポンスを確認
   ```bash
   curl "http://localhost:3000/api/yumemaga-v2/progress?issue=2025年11月号" | jq '.categories.A.processes[0]'
   ```

3. processes APIと比較
   ```bash
   curl "http://localhost:3000/api/yumemaga-v2/processes?issue=2025年11月号" | jq '.processes[0]'
   ```

### 修正方針
- **案A**: 進捗入力シートのE列にGASで逆算予定日を自動入力
- **案B**: progress APIでガントシートから予定日を取得（processes APIと同様の実装）
- **推奨**: 案Bが確実（ガントシートが信頼できるデータソース）

---

## ❌ 問題2: データ提出と正しく連動できていない

### 症状
- データ提出していないのに「準備OK」バッジが表示される
- 準備OK判定が依存関係のみで判定され、データ提出状態を考慮していない

### 原因
`app/api/yumemaga-v2/ready-processes/route.ts` の準備OK判定ロジックが不完全

現在の実装:
```typescript
// 前提工程が完了しているかだけをチェック
const allPrerequisitesCompleted = prerequisites.every(prereq => {
  const prereqProcess = processStatusMap[prereq];
  return prereqProcess && prereqProcess.completed;
});
```

**問題点**: データ提出状態をチェックしていない

### 必要な修正
1. **カテゴリマスターの「必要データ」を取得**
   - カテゴリマスターのD列（必要データ）を読み込む

2. **データ提出状態を確認**
   - データ提出セクションのステータスと連動
   - 必要データがすべて提出済みかチェック

3. **準備OK判定に追加**
   ```typescript
   // 修正後のロジック
   if (!process.completed && prerequisites.length > 0) {
     const allPrerequisitesCompleted = prerequisites.every(...);
     const requiredDataSubmitted = checkRequiredData(processNo, categoryId);

     if (allPrerequisitesCompleted && requiredDataSubmitted) {
       readyProcesses.push(...);
     }
   }
   ```

### 調査手順
1. カテゴリマスターのD列を確認
2. データ提出状態の管理方法を確認（どこに保存されているか？）
3. データ提出APIがあるか確認

---

## ❌ 問題3: 遅延ラベルが正しくないように見える

### 症状
- 遅延していないのに「遅延」バッジが表示される
- または、遅延しているのに表示されない

### 原因の可能性
1. **予定日が取得できていない**（問題1と関連）
   - 予定日が「-」なので遅延判定できない

2. **日付パース処理の問題**
   - `ready-processes/route.ts:7-18` の `parseDate()` 関数
   - スプレッドシートの日付フォーマットと不一致の可能性

3. **今日の日付との比較ロジック**
   - `calculateDelayDays()` 関数が正しく動作していない

### 調査手順
1. スプレッドシートの日付フォーマットを確認
   - 「10/15」形式？「2025/10/15」形式？
   - Excelシリアル値？

2. 実際の予定日と今日の日付を比較してテスト
   ```typescript
   console.log('今日:', new Date());
   console.log('予定日:', parseDate('10/15'));
   console.log('遅延日数:', calculateDelayDays('10/15'));
   ```

### 修正方針
- 日付フォーマットを統一
- parseDate関数を修正（年の取得方法を見直す）

---

## ❌ 問題4: データ提出にまだカテゴリXが表示されていて邪魔

### 症状
- データ提出セクションで「カテゴリA」「カテゴリK」のように表示される
- カテゴリ名だけの方が見やすい

### 対象ファイル
おそらく `components/data-submission/DataSubmissionSection.tsx`

### 修正内容
```typescript
// Before
カテゴリ{category.id}: {category.name}

// After
{category.name}
```

### 調査手順
```bash
grep -r "カテゴリ.*category" components/data-submission/
```

---

## ❌ 問題5: データ提出に締切が正しく反映できていない

### 症状
- データ提出の締切日が表示されない、または間違っている

### 原因の可能性
1. **カテゴリマスターから締切を取得していない**
2. **締切の列が間違っている**
3. **締切データがスプレッドシートに存在しない**

### 調査手順
1. カテゴリマスターの構造を確認
   ```bash
   cat docs/yumemaga-production-management/COMPANY_MASTER_SCHEMA.md
   ```
   または、スプレッドシートを直接確認

2. データ提出APIのレスポンスを確認
   ```bash
   curl "http://localhost:3000/api/yumemaga-v2/data-submission?issue=2025年11月号"
   ```

### 修正方針
- カテゴリマスターに「データ提出締切」列があるか確認
- なければ、工程マスターから「データ提出」工程の予定日を取得

---

## ❌ 問題6: 工程に対して逆算予定が取得できていない & 予定の編集もできない

### 症状
1. **逆算予定が取得できていない**（問題1と同じ）
2. **予定日の編集機能が実装されていない**
   - 仕様上、予定日は編集できるべきだが、UIに編集機能がない

### 必要な実装
1. **予定日の表示**（問題1の修正で解決）

2. **予定日の編集機能**
   - 工程カードに「予定日編集」ボタンまたは入力欄を追加
   - PUT APIを作成（`/api/yumemaga-v2/planned-date`）
   - スプレッドシートのE列を更新

### 実装例
```typescript
// UI (CategoryManagementSection.tsx)
<input
  type="date"
  value={process.plannedDate}
  onChange={(e) => handleUpdatePlannedDate(process.id, e.target.value)}
  className="..."
/>

// API (app/api/yumemaga-v2/planned-date/route.ts)
export async function PUT(request: Request) {
  const { processNo, plannedDate } = await request.json();
  // スプレッドシートのE列を更新
}
```

---

## 📋 修正の優先順位

### 🔴 最優先（システムが使えない）
1. **問題1**: 予定日が取得できない → すべての機能に影響
2. **問題3**: 遅延判定が正しくない → 問題1が解決すれば自動的に解決する可能性

### 🟡 高優先（機能として不完全）
3. **問題2**: データ提出と連動していない → 準備OK判定が不正確
4. **問題6**: 予定日の編集ができない → 運用上必須

### 🟢 中優先（UI改善）
5. **問題4**: カテゴリX表記が邪魔 → すぐ直せる
6. **問題5**: 締切が表示されない → データ提出の使い勝手に影響

---

## 🔍 徹底調査の手順

### Step 1: スプレッドシート構造の完全理解
```bash
# 調査資料を読む
cat docs/investigation/INVESTIGATION_RESULTS.md
cat docs/investigation/SHEET_DATA_ANALYSIS.md

# 進捗入力シートの構造を確認
# - どの列に何のデータが入っているか
# - 予定日はどの列か（E列？F列？）
# - データ提出状態はどこで管理されているか
```

### Step 2: 各APIのレスポンスを確認
```bash
# サーバー起動
npm run dev

# 各APIを叩いてデータを確認
curl "http://localhost:3000/api/yumemaga-v2/categories" | jq
curl "http://localhost:3000/api/yumemaga-v2/processes?issue=2025年11月号" | jq
curl "http://localhost:3000/api/yumemaga-v2/progress?issue=2025年11月号" | jq
curl "http://localhost:3000/api/yumemaga-v2/ready-processes?issue=2025年11月号" | jq
```

### Step 3: 実際のスプレッドシートを確認
- Google Sheetsを開いて、進捗入力シートを確認
- E列に予定日が入っているか？
- 日付のフォーマットは？
- データ提出状態はどこに記録されているか？

### Step 4: 問題の根本原因を特定
- 問題1が他の問題の根本原因になっている可能性が高い
- まず問題1を徹底的に調査・修正
- その後、問題2, 3, 6を修正

---

## 📁 関連ファイル

### API
- `app/api/yumemaga-v2/progress/route.ts` - カテゴリ別進捗（問題1, 5）
- `app/api/yumemaga-v2/ready-processes/route.ts` - 準備OK判定（問題2, 3）
- `app/api/yumemaga-v2/processes/route.ts` - 工程一覧（参考：予定日取得の実装例）

### UI
- `app/dashboard/yumemaga-v2/page.tsx` - メインページ
- `components/category-management/CategoryManagementSection.tsx` - カテゴリ管理（問題6）
- `components/data-submission/DataSubmissionSection.tsx` - データ提出（問題4, 5）

### ドキュメント
- `docs/investigation/INVESTIGATION_RESULTS.md` - 調査結果
- `docs/yumemaga-production-management/PROJECT_PLAN_FINAL.md` - プロジェクト計画
- `docs/yumemaga-production-management/PROGRESS_REPORT.md` - 進捗報告

---

## ✅ 成功基準

以下がすべて確認できたら修正完了：

- [ ] 工程カードに「予定: 10/15」のように予定日が表示される
- [ ] データ提出していない工程は「準備OK」バッジが表示されない
- [ ] 予定日を過ぎた工程のみ「遅延」バッジが表示される
- [ ] データ提出セクションで「カテゴリX」表記がなくなる
- [ ] データ提出の締切が正しく表示される
- [ ] 工程の予定日を編集できる

---

## 💡 重要なヒント

1. **processes APIが正しく動作している**
   - このAPIは予定日を正しく取得できている
   - progress APIも同じ実装パターンを参考にすべき

2. **スプレッドシートが唯一の真実**
   - UIの問題ではなく、データ取得の問題の可能性が高い
   - まずスプレッドシートを確認

3. **段階的に修正**
   - 問題1 → 問題3 → 問題2 → 問題6 → 問題4, 5の順
   - 1つずつ確実に修正してテスト

---

**作成者**: Claude Code (前任)
**最終更新**: 2025-10-08
**次のアクション**: 問題1の徹底調査から開始
