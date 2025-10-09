# データ提出進捗管理 - フォルダアイコンUI実装の引き継ぎ

**作成日**: 2025-10-09
**状態**: 未完成（UI表示に問題あり）
**対象**: 次世代Claude Code

---

## 📋 現状の問題

### 実装済みの機能
- ✅ OAuth 2.0認証フロー完成
- ✅ ファイルアップロードAPI完成
- ✅ フォルダアイコングリッドUIのコード実装完了

### 発生している問題
**症状:**
1. ❌ フォルダアイコンが**表示されない**
2. ❌ クリックしても**選択状態にならない**（ハイライトされない）
3. ✅ 「選択中: 〇〇」の表示は動作している
4. ❓ ファイルアップロード機能は未検証（恐らく動作する）

### ユーザーの要望
**ドロップダウン選択 → フォルダアイコングリッド選択への変更**

- 上部で月号を選択
- カテゴリごとにグループ化されたフォルダアイコンを表示
- フォルダアイコンをクリック → そのフォルダが選択される（青くハイライト）
- 選択された状態でファイルをドラッグ&ドロップ → 選択フォルダにアップロード

**重要**: フォルダアイコンの表示名は「録音データ」「写真データ」「企画内容」だが、内部的には選択中の月号（例: `2025_11`）と紐付いている。

---

## 🗂️ 関連ファイル

### 修正済みファイル
1. **`components/data-submission/DataSubmissionSection.tsx`** (行290-375)
   - フォルダアイコングリッドUI実装済み
   - **問題箇所**: カテゴリのrequiredDataからデータ種別を推測する部分

### データ構造

#### カテゴリデータ (`categories` prop)
```typescript
interface Category {
  id: string;           // "A", "D", "H" など
  name: string;         // "メインインタビュー", "表紙制作" など
  requiredData: RequiredData[];
  deadline?: string;
}

interface RequiredData {
  type: string;         // データ種別（例: "audio", "image", "document"）
  name: string;         // 表示名（例: "録音データ", "写真データ"）
  status: string;       // "submitted", "pending", "none"
  deadline: string;     // 締切日
  optional?: boolean;   // 任意かどうか
}
```

#### データ種別 (DataType)
```typescript
type DataType = 'recording' | 'photo' | 'planning';
```

---

## 🔍 問題の原因分析

### 問題1: フォルダアイコンが表示されない

**原因の可能性:**

1. **カテゴリデータの`requiredData`が空配列**
   - フィルター条件 `category.requiredData && category.requiredData.length > 0` で除外されている可能性

2. **データ種別の推測ロジックが機能していない**
   ```typescript
   const name = (rd?.name || rd?.type || '').toString();
   if (name.includes('録音') || name.includes('音声')) return 'recording';
   if (name.includes('写真') || name.includes('画像')) return 'photo';
   if (name.includes('企画') || name.includes('資料')) return 'planning';
   ```
   - `name`が期待する値と異なる可能性
   - 実際の`requiredData`の構造を確認する必要あり

3. **デフォルトフォールバック**
   - データ種別が検出できない場合、全種別（recording/photo/planning）を表示する実装済み
   - しかし、それでも表示されていない = カテゴリ自体が表示されていない

### 問題2: クリックしても選択状態にならない

**可能性:**
- フォルダアイコンが表示されていないため、クリックできない
- 問題1を解決すれば自動的に解決する可能性が高い

---

## 🛠️ デバッグ手順

### ステップ1: カテゴリデータの確認

**目的**: `categories` propに実際にどんなデータが渡されているか確認

**方法1: コンソールログで確認**
```typescript
// DataSubmissionSection.tsx の先頭（useEffect内など）に追加
useEffect(() => {
  console.log('📊 カテゴリデータ:', categories);
  categories.forEach(cat => {
    console.log(`カテゴリ ${cat.id} (${cat.name}):`, cat.requiredData);
  });
}, [categories]);
```

**方法2: ブラウザのReact DevToolsで確認**
1. React DevTools をインストール
2. `DataSubmissionSection` コンポーネントを選択
3. Props → `categories` を確認

**確認ポイント:**
- `categories` は配列か？
- 各カテゴリの `requiredData` は配列か？空配列ではないか？
- `requiredData` の中身:
  - `name` フィールドの値は？（例: "録音データ", "写真データ"）
  - `type` フィールドの値は？（例: "audio", "image"）

### ステップ2: フィルター条件の確認

**現在の実装（行299-303）:**
```typescript
.filter(category => {
  // 必要データがあるカテゴリのみ表示
  return category.requiredData && category.requiredData.length > 0;
})
```

**デバッグ用に修正:**
```typescript
.filter(category => {
  const hasData = category.requiredData && category.requiredData.length > 0;
  console.log(`カテゴリ ${category.id}: requiredData=${category.requiredData?.length || 0}, 表示=${hasData}`);
  return hasData;
})
```

**期待する結果:**
- 少なくとも数カテゴリが `表示=true` になるはず
- もし全て `表示=false` なら、`requiredData` が空か存在しない

### ステップ3: データ種別推測ロジックの確認

**現在の実装（行306-313）:**
```typescript
const availableDataTypes = category.requiredData.map(rd => {
  const name = (rd?.name || rd?.type || '').toString();
  if (name.includes('録音') || name.includes('音声')) return 'recording';
  if (name.includes('写真') || name.includes('画像')) return 'photo';
  if (name.includes('企画') || name.includes('資料')) return 'planning';
  return null;
}).filter((dt): dt is DataType => dt !== null);
```

**デバッグ用に修正:**
```typescript
const availableDataTypes = category.requiredData.map(rd => {
  const name = (rd?.name || rd?.type || '').toString();
  console.log(`  - requiredData: name="${rd?.name}", type="${rd?.type}" → 推測名="${name}"`);

  let detected = null;
  if (name.includes('録音') || name.includes('音声')) detected = 'recording';
  else if (name.includes('写真') || name.includes('画像')) detected = 'photo';
  else if (name.includes('企画') || name.includes('資料')) detected = 'planning';

  console.log(`    → 検出: ${detected || '(なし)'}`);
  return detected;
}).filter((dt): dt is DataType => dt !== null);

console.log(`カテゴリ ${category.id}: 検出されたデータ種別 =`, availableDataTypes);
```

**期待する結果:**
- `name` に「録音データ」「写真データ」などが含まれる
- `detected` が適切に設定される

### ステップ4: 実際のrequiredDataの構造を確認

**もし`name`や`type`が期待と異なる場合:**

実際のデータ構造例:
```json
{
  "id": "A",
  "name": "メインインタビュー",
  "requiredData": [
    {
      "type": "録音データ",    // ← これが実際の値かも
      "name": "録音データ",    // ← またはこれ
      "status": "pending",
      "deadline": "2025-11-01"
    }
  ]
}
```

---

## 🔧 想定される修正案

### 修正案1: requiredDataが存在しない場合の対応

**問題**: `categories` propに`requiredData`が含まれていない

**解決策**: カテゴリマスターから必要データ情報を取得する

#### 修正箇所: `app/dashboard/yumemaga-v2/page.tsx`

カテゴリデータを渡す際に、`requiredData`フィールドを追加:

```typescript
const categoryList = Object.keys(progressData.categories).map(catId => {
  const cat = progressData.categories[catId];

  // カテゴリメタデータから必要データを取得
  const categoryMeta = categoryMetadata.find(c => c.categoryId === catId);
  const requiredDataStr = categoryMeta?.requiredData || ''; // "録音データ,写真データ"

  // 必要データを配列に変換
  const requiredDataArray = requiredDataStr
    .split(',')
    .map(d => d.trim())
    .filter(Boolean)
    .map(dataName => ({
      type: dataName,
      name: dataName,
      status: 'pending', // TODO: 実際の提出状況を取得
      deadline: cat.dataSubmissionDeadline || '',
      optional: false,
    }));

  return {
    id: catId,
    name: getCategoryName(catId),
    progress: cat.progress,
    completed: cat.completed,
    total: cat.total,
    canvaUrl: null,
    confirmationRequired: isConfirmationRequired(catId),
    confirmationStatus: cat.confirmationStatus || '制作中',
    deadline: cat.dataSubmissionDeadline,
    processes: cat.processes.map((p: any) => ({ /*...*/ })),
    requiredData: requiredDataArray, // ← 追加
  };
});
```

### 修正案2: データ種別推測ロジックの改善

**問題**: `name` や `type` の値が想定と異なる

**解決策**: より柔軟なマッチング

```typescript
const availableDataTypes = category.requiredData.map(rd => {
  const name = (rd?.name || rd?.type || '').toString().toLowerCase();

  // より柔軟なマッチング
  if (name.includes('録音') || name.includes('音声') || name === 'recording' || name === 'audio') {
    return 'recording';
  }
  if (name.includes('写真') || name.includes('画像') || name.includes('photo') || name === 'image') {
    return 'photo';
  }
  if (name.includes('企画') || name.includes('資料') || name.includes('planning') || name === 'document') {
    return 'planning';
  }
  return null;
}).filter((dt): dt is DataType => dt !== null);
```

### 修正案3: デバッグ用の強制表示

**問題**: データがなくてもUIを確認したい

**解決策**: 開発時のみ全カテゴリに全データ種別を表示

```typescript
.map((category) => {
  // デバッグ: 開発時は強制的に全データ種別を表示
  const isDev = process.env.NODE_ENV === 'development';

  const availableDataTypes = category.requiredData.map(rd => {
    // 既存のロジック
  }).filter((dt): dt is DataType => dt !== null);

  const uniqueDataTypes = Array.from(new Set(availableDataTypes));

  // 開発時は必ず全種別を表示（デバッグ用）
  const dataTypesToShow = isDev
    ? ['recording', 'photo', 'planning'] as DataType[]
    : uniqueDataTypes.length > 0
      ? uniqueDataTypes
      : ['recording', 'photo', 'planning'] as DataType[];

  return (
    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
      {/* ... */}
    </div>
  );
})
```

---

## ✅ 完成の定義

以下がすべて動作すれば完成:

1. ✅ **フォルダアイコンが表示される**
   - カテゴリごとにグループ化
   - 各カテゴリに「録音データ」「写真データ」「企画内容」のアイコン
   - フォルダアイコン（Folder）+ データ種別アイコン（Music/Image/FileText）

2. ✅ **クリックで選択できる**
   - フォルダアイコンをクリック
   - 選択されたアイコンが青くハイライトされる
   - 右上に青い丸（選択インジケーター）が表示される

3. ✅ **選択情報が表示される**
   - 「選択中: メインインタビュー / 録音データ / 2025年11月号」のような表示

4. ✅ **ファイルアップロードが動作する**
   - フォルダを選択
   - ファイルをドラッグ&ドロップまたは選択
   - Google Driveの正しいフォルダ（`A_メインインタビュー/録音データ/2025_11`）にアップロードされる

---

## 🚀 次のアクション

### 優先順位1: データ構造の確認
1. ステップ1のコンソールログを追加
2. ブラウザで実行して、`categories` の中身を確認
3. `requiredData` の構造を特定

### 優先順位2: 問題に応じた修正
- `requiredData` が空 → 修正案1を実装
- データ種別が検出できない → 修正案2を実装
- とりあえず動作確認したい → 修正案3を実装（一時的）

### 優先順位3: UI/UX改善（完成後）
- フォルダアイコンのホバーエフェクト調整
- ダブルクリック対応（現在はシングルクリック）
- アップロード後のフィードバック改善

---

## 📝 コード変更履歴

### 変更1: フォルダアイコングリッドUI実装
**ファイル**: `components/data-submission/DataSubmissionSection.tsx`
**行**: 290-375
**内容**: ドロップダウン選択をフォルダアイコングリッドに変更

### 変更2: エラー修正
**ファイル**: `components/data-submission/DataSubmissionSection.tsx`
**行**: 308, 319-321
**内容**:
- `rd?.name` が undefined の場合のエラー対応
- デフォルトフォールバックの追加

---

## 🔗 関連ドキュメント

- `docs/yumemaga-production-management/OAUTH_IMPLEMENTATION_PLAN.md` - OAuth実装計画
- `docs/yumemaga-production-management/DATA_UPLOAD_IMPLEMENTATION_PLAN.md` - データアップロード機能実装計画
- `types/data-submission.ts` - データ提出関連の型定義

---

**最終更新**: 2025-10-09
**作成者**: Claude Code (前世代)
**次担当**: 次世代 Claude Code

**重要**: このドキュメントを読んだ次世代Claude Codeは、まずステップ1のデバッグから開始し、実際のデータ構造を確認してから修正を行ってください。
