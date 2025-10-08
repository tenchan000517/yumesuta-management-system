# Phase 3 引き継ぎドキュメント

**作成日**: 2025-10-08
**前任**: Claude Code (Phase 3実装担当)
**対象**: 次世代Claude Code

---

## 🚨 緊急対応が必要な問題

### 問題1: Progress APIでサーバーエラー発生中

**症状**:
- 工程の実績日を入力すると500エラーが無限ループ
- `/api/yumemaga-v2/progress` が500エラー
- `/api/yumemaga-v2/actual-date` が500エラー
- `/api/yumemaga-v2/next-month` が500エラー
- `/api/yumemaga-v2/ready-processes` が500エラー

**原因**:
`app/api/yumemaga-v2/progress/route.ts` で以下の問題がある：

1. **rowIndexの取得ロジックが不正確**
   - 現在: `index + 2` としているが、フィルタリングされた行のindexなので正しくない
   - 必要: progressData全体の中での実際の行番号

2. **自動ステータス遷移ロジックをコメントアウト済み（137-146行目）**
   - updateSheetDataの非同期処理が原因でエラー
   - 本来は制作工程100%完了時に「内部チェック」へ自動遷移すべき

**修正が必要な箇所**:

```typescript
// app/api/yumemaga-v2/progress/route.ts

// ❌ 現在のコード（105行目）
rowIndex: index + 2, // Phase 3: 行番号を保存（+2はヘッダー行考慮）

// ✅ 修正すべきコード
// progressDataの元の配列での位置を保存する必要がある
// フィルタリング前の行番号を保持する仕組みが必要
```

**修正手順**:

1. **rowIndexの正確な取得**
```typescript
// progressDataの各行に元の行番号を付与
const progressDataWithIndex = progressData.slice(1).map((row, idx) => ({
  row,
  originalRowNumber: idx + 2 // ヘッダー行考慮
}));

progressDataWithIndex.forEach(({ row, originalRowNumber }) => {
  // ... 既存のロジック
  if (categories[prefix]) {
    categories[prefix].push({
      // ...
      rowIndex: originalRowNumber, // 正確な行番号
    });
  }
});
```

2. **自動ステータス遷移の修正**
```typescript
// 非同期処理を正しく扱う
if (progressRate === 100 && categoryConfirmationStatus === '制作中' && confirmationProcessRowIndex > 0) {
  categoryConfirmationStatus = '内部チェック';

  // 非同期処理をawaitで待つ（GETリクエスト内では難しいため、別の方法を検討）
  // または、フロントエンドで100%検知時にステータス更新APIを叩く方式に変更
}
```

---

### 問題2: 進捗率計算が正しく動作していない

**要件**:
- 内部チェック・確認送付工程を**除外**して100%計算
- 例: 制作工程5個 + 内部チェック1個 + 確認送付1個 = 計7工程の場合
  - 制作工程5個が完了 = **100%**（内部チェック・確認送付は計算外）

**現在の実装（116-124行目）**:
```typescript
const productionProcesses = processes.filter(p =>
  !p.processName.includes('内部チェック') &&
  !p.processName.includes('確認送付')
);

const completed = productionProcesses.filter(p => p.actualDate).length;
const total = productionProcesses.length || processes.length; // 空配列チェック
const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;
```

**確認事項**:
- 工程名に「内部チェック」「確認送付」が含まれる工程が正しく除外されているか
- F, J, N, Sカテゴリなど、内部チェック・確認送付工程がないカテゴリでもエラーが出ないか

---

### 問題3: Zセクション（全体進捗管理）のUI実装完了

**実装済み**:
- `components/overall-progress/OverallProgressSection.tsx` 作成完了
- カテゴリ別予実管理の下に配置済み
- ステータス別の背景色表示
  - ヘッダー: bg-200（濃い）
  - ボディ: bg-100（薄い）
- ステータス選択セレクトボックス
- 内部チェック時のアシストボタン表示

**動作確認できていない項目**:
1. ステータス変更が正しくスプレッドシートに反映されるか
2. 制作工程100%完了時の自動ステータス遷移（現在コメントアウト中）
3. カード背景色が正しく変わるか

---

## 📋 Phase 3の実装内容

### 完了した作業

#### 1. 確認ステータスAPIの拡張
**ファイル**: `app/api/yumemaga-v2/confirmation-status/route.ts`

- 拡張ステータス値に対応（22行目）:
  ```typescript
  const validStatuses = ['制作中', '内部チェック', '確認送付', '確認待ち', '確認OK', '未送付', '-'];
  ```

#### 2. 進捗APIの改修（⚠️ エラー発生中）
**ファイル**: `app/api/yumemaga-v2/progress/route.ts`

- 内部チェック・確認送付工程を除外して進捗率計算（116-124行目）
- カテゴリ別確認送付ステータスをレスポンスに追加（127-135行目）
- 自動ステータス遷移ロジック追加（137-146行目・コメントアウト中）

#### 3. Zセクションコンポーネント作成
**ファイル**: `components/overall-progress/OverallProgressSection.tsx`

- Z以外の全カテゴリを縦型カードで表示
- ステータス別背景色表示関数:
  - `getCardBackgroundColor()`: カード全体の背景色（bg-100）
  - `getHeaderBackgroundColor()`: ヘッダー背景色（bg-200）
  - `getStatusBadge()`: ステータスバッジ表示
- ステータス選択セレクトボックス
- 内部チェック時のアシストボタン

#### 4. CategoryManagementSectionの更新
**ファイル**: `components/category-management/CategoryManagementSection.tsx`

- 確認送付ステータスUIを削除（244行目）
- `onUpdateConfirmation`をオプショナルに変更

#### 5. メインページの統合
**ファイル**: `app/dashboard/yumemaga-v2/page.tsx`

- Zセクションコンポーネントをインポート（19行目）
- 確認ステータス更新ハンドラー追加（215-238行目）
- カテゴリ別予実管理の下にZセクション配置（631-635行目）

---

## 🔧 修正が必要な実装

### 優先度1: サーバーエラーの解消

**手順**:

1. **progress APIのrowIndex取得を修正**
   - progressDataの元の行番号を正確に保持
   - フィルタリング後のindexではなく、元の配列での位置を使用

2. **自動ステータス遷移の実装方法を変更**

   **案1: フロントエンドで制御**
   ```typescript
   // app/dashboard/yumemaga-v2/page.tsx

   useEffect(() => {
     categories.forEach(category => {
       // 制作工程のみで進捗率を計算
       const productionProcesses = category.processes.filter(p =>
         !p.processName.includes('内部チェック') &&
         !p.processName.includes('確認送付')
       );
       const completed = productionProcesses.filter(p => p.actualDate).length;
       const total = productionProcesses.length;
       const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

       // 100%完了 かつ 制作中 → 自動的に内部チェックに遷移
       if (progress === 100 && category.confirmationStatus === '制作中') {
         handleUpdateConfirmationStatus(category.id, '内部チェック');
       }
     });
   }, [categories]);
   ```

   **案2: 専用APIエンドポイント作成**
   - `/api/yumemaga-v2/auto-transition` を作成
   - 定期的にポーリングして100%完了を検知

3. **エラーハンドリング強化**
   ```typescript
   // 各APIで適切なエラーレスポンスを返す
   catch (error: any) {
     console.error('エラー詳細:', error);
     return NextResponse.json(
       { success: false, error: error.message, stack: error.stack },
       { status: 500 }
     );
   }
   ```

---

### 優先度2: ステータス表示の統一

**問題点**:
- 一部カテゴリで「制作中」、一部で「ステータスなし」が混在

**原因**:
- 進捗入力シートH列の初期値が統一されていない可能性

**確認手順**:
1. 進捗入力シートH列（先方確認ステータス）の全行を確認
2. 空白セルがある場合、デフォルト値「制作中」を設定
3. APIレスポンスで `confirmationStatus: row[7] || '制作中'` としているか確認（104行目）

---

## 📝 次のセッションで実施すべきこと

### Step 1: サーバーエラーの解消（最優先）

1. サーバーログを確認
   ```bash
   # 既存の開発サーバーがあれば停止
   # 新しいサーバーを起動してログ確認
   npm run dev
   ```

2. エラーの詳細を特定
   - progress APIのどの行でエラーが発生しているか
   - rowIndexの値が正しいか
   - updateSheetDataが正しく呼ばれているか

3. rowIndex取得ロジックを修正

4. 自動ステータス遷移を実装（案1または案2）

### Step 2: 動作確認

1. 実績日入力時にエラーが発生しないか
2. 制作工程100%完了時に自動で「内部チェック」に遷移するか
3. Zセクションでステータス変更が正しく反映されるか
4. カード背景色が正しく変わるか

### Step 3: テスト項目

- [ ] 内部チェック・確認送付工程が進捗率計算から除外されている
- [ ] 制作工程100%完了時に自動で「内部チェック」に遷移
- [ ] Zセクションでステータス手動変更が可能
- [ ] ステータスに応じてカード背景色が変わる
- [ ] 内部チェック時にアシストボタンが表示される
- [ ] F, J, N, Sカテゴリ（内部チェック・確認送付工程なし）でもエラーなし

---

## 🎯 Phase 3の目的（再確認）

Zセクション（全体進捗管理）を作成し、以下を実現：

1. ✅ 各カテゴリの制作進捗を監視
2. ⚠️ 制作工程100%完了時に「内部チェック」ステータスに自動遷移（未実装）
3. ✅ ディレクターが内部チェック→確認送付→確認待ち→確認OKのフローを管理
4. ✅ カテゴリ別予実管理から「確認送付ステータス」をZセクションに移行

---

## 📚 参考ドキュメント

- プロジェクト計画書: `docs/yumemaga-production-management/PROJECT_PLAN_FINAL.md`
- Phase 3実装ガイド: プロンプト内に記載
- 進捗報告シート: `docs/yumemaga-production-management/PROGRESS_REPORT.md`

---

## 💡 実装のヒント

### updateSheetDataの正しい使い方

```typescript
// ❌ 非同期処理を待たない（エラーの原因）
updateSheetData(spreadsheetId, range, values).catch(err => console.error(err));

// ✅ awaitで待つ
await updateSheetData(spreadsheetId, range, values);

// ✅ try-catchで囲む
try {
  await updateSheetData(spreadsheetId, range, values);
} catch (error) {
  console.error('スプレッドシート更新エラー:', error);
  throw error;
}
```

### 進捗率計算のデバッグ

```typescript
// デバッグログを追加
console.log(`カテゴリ${cat}: 制作工程 ${productionProcesses.length}個`);
console.log(`  完了: ${completed}個, 進捗率: ${progressRate}%`);
console.log(`  確認ステータス: ${categoryConfirmationStatus}`);
```

---

## 🚀 開発サーバー起動方法

```bash
npm run dev
```

ブラウザで `http://localhost:3000/dashboard/yumemaga-v2` にアクセス

---

**前任者より**:
Phase 3の実装は8割完了していますが、progress APIのエラーにより動作確認ができていません。
rowIndexの取得ロジックと自動ステータス遷移の実装を修正すれば完了します。

頑張ってください！
