# データ提出進捗管理UI実装 - 引き継ぎドキュメント

**作成日**: 2025-10-09
**作成者**: Claude Code (前世代)
**次担当**: 次世代 Claude Code
**状態**: フォルダアイコンUI完成、企業モードUI未実装

---

## 📋 完成した機能

### 1. フォルダアイコングリッドUI（カテゴリモード）

**場所**: `components/data-submission/DataSubmissionSection.tsx`

**実装内容**:
- ✅ タブ切り替え（カテゴリ別/企業別）
- ✅ カテゴリドロップダウン選択
- ✅ 月号ドロップダウン選択（アップロード先）
- ✅ 3つのフォルダアイコン（録音データ/写真データ/企画内容）
- ✅ フォルダ選択機能（クリックで青くハイライト）
- ✅ 4カラム目: 選択フォルダ内のファイル一覧表示
- ✅ ファイル選択 → プレビュー表示
- ✅ プレビュークリック → Google Driveで開く
- ✅ フォルダ変更時にプレビュー自動クリア

**UIレイアウト**:
```
┌────────────────────────────────────────────────┐
│ [カテゴリ別|企業別] [カテゴリ▼] [月号▼]        │
└────────────────────────────────────────────────┘
  ↓
┌──────┐ ┌──────┐ ┌──────┐ ┌─────────────┐
│ 📁🎵 │ │ 📁📷 │ │ 📁📄 │ │ ファイル一覧│
│ 録音 │ │ 写真 │ │ 企画 │ │ file1.mp3   │
│データ│ │データ│ │内容  │ │ file2.mp3   │
└──────┘ └──────┘ └──────┘ │ (2ファイル) │
    ↑選択                  └─────────────┘
                                ↓
                           ┌─────────┐
                           │プレビュー│
                           │  🎵     │
                           │file1.mp3│
                           └─────────┘
```

**ファイル一覧の表示ロジック**:
- 6件以下: 最初から全ファイル表示
- 7件以上: 折りたたみ表示（「7ファイル」ボタンをクリックで展開）

**プレビュー機能**:
- ファイル名をクリック → 選択状態（青背景）
- 選択したファイルが右側にプレビュー表示
- プレビュー全体がクリッカブル（Google Driveで開く）
- アイコンの色: 画像=青、音声=緑、PDF=赤、その他=グレー

---

## 🔧 実装した新機能

### API: ファイル一覧取得

**場所**: `app/api/yumemaga-v2/data-submission/list-files/route.ts`

**エンドポイント**:
```
GET /api/yumemaga-v2/data-submission/list-files?categoryId=A&dataType=recording&issue=2025_11
```

**パラメータ**:
- `categoryId`: カテゴリID（例: "A", "D", "H"）
- `dataType`: データ種別（"recording", "photo", "planning"）
- `issue`: 月号フォーマット（例: "2025_11"）

**レスポンス**:
```json
{
  "success": true,
  "folderId": "1aBcDeFgHiJkLmNoPqRsTuVwXyZ",
  "files": [
    {
      "id": "fileId123",
      "name": "interview.mp3",
      "mimeType": "audio/mpeg",
      "size": 1024000,
      "modifiedTime": "2025-10-09T10:30:00Z",
      "webViewLink": "https://drive.google.com/file/d/..."
    }
  ],
  "count": 1
}
```

**動作**:
1. カテゴリマスターからDriveフォルダIDを取得
2. `ensureDirectoryWithOAuth` でフォルダパスを解決（存在しなければ作成）
3. `listFilesInFolderWithOAuth` でファイル一覧を取得
4. ファイル情報を整形して返却

---

### ライブラリ: OAuth版ファイル一覧取得関数

**場所**: `lib/google-drive.ts`

**追加関数**:
```typescript
export async function listFilesInFolderWithOAuth(folderId: string)
```

**機能**:
- OAuth認証でGoogle Drive APIを呼び出し
- 指定フォルダ内のファイル一覧を取得
- 更新日時の降順でソート
- ファイル名、mimeType、サイズ、更新日時、webViewLinkを返す

---

## 📂 修正したファイル

### 1. `app/dashboard/yumemaga-v2/page.tsx`

**変更箇所**: 行65-108（categoryList生成部分）

**変更内容**:
```typescript
// 変更前: requiredDataは文字列配列
requiredData: getRequiredData(catId), // ["録音データ", "写真データ"]

// 変更後: RequiredData型のオブジェクト配列
const categoryMeta = categoryMetadata.find(c => c.categoryId === catId);
const requiredDataArray = categoryMeta?.requiredData
  ? categoryMeta.requiredData.split(',').map((dataName: string) => {
      const trimmedName = dataName.trim();
      return {
        type: trimmedName,
        name: trimmedName,
        status: 'pending',
        deadline: cat.dataSubmissionDeadline || '',
        optional: false,
      };
    })
  : [];
```

**理由**: DataSubmissionSectionが期待する型に合わせるため

**削除した部分**: 行249-263（セクション独立の月号選択UI）
- 右上にあった「対象月号」のドロップダウンを削除
- ページ全体の月号選択に統一

---

### 2. `components/data-submission/DataSubmissionSection.tsx`

**主な変更**:

#### (1) ステート管理（行46, 61-64）
```typescript
const [selectedIssue, setSelectedIssue] = useState(defaultIssue); // アップロード先の月号
const [folderFiles, setFolderFiles] = useState<any[]>([]);
const [loadingFiles, setLoadingFiles] = useState(false);
const [filesExpanded, setFilesExpanded] = useState(false);
const [selectedFile, setSelectedFile] = useState<any | null>(null);
```

#### (2) ファイル一覧取得（行90-128）
```typescript
useEffect(() => {
  const fetchFolderFiles = async () => {
    if (uploadMode !== 'category' || !selectedCategory || !selectedDataType || !selectedIssue) {
      setFolderFiles([]);
      setSelectedFile(null);
      return;
    }

    setLoadingFiles(true);
    setSelectedFile(null); // フォルダ変更時にプレビューをクリア

    // 月号フォーマット変換: "2025年11月号" → "2025_11"
    const issueFormatted = selectedIssue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
      const paddedMonth = month.padStart(2, '0');
      return `${year}_${paddedMonth}`;
    });

    const response = await fetch(
      `/api/yumemaga-v2/data-submission/list-files?categoryId=${selectedCategory}&dataType=${selectedDataType}&issue=${issueFormatted}`
    );
    const data = await response.json();

    if (data.success) {
      setFolderFiles(data.files || []);
    }
  };

  fetchFolderFiles();
}, [uploadMode, selectedCategory, selectedDataType, selectedIssue]);
```

**重要**:
- フォルダ（カテゴリ、データ種別、月号）が変更されたら即座にプレビューをクリア
- 月号フォーマットは「2025年11月号」→「2025_11」に変換

#### (3) タブ切り替えUI（行307-346）
```typescript
<div className="flex items-center gap-4 mb-6">
  {/* モード選択タブ */}
  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
    <button
      onClick={() => setUploadMode('category')}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        uploadMode === 'category'
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      カテゴリ別
    </button>
    <button
      onClick={() => setUploadMode('company')}
      className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
        uploadMode === 'company'
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      企業別
    </button>
  </div>

  {/* カテゴリ選択 */}
  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
    {/* ... */}
  </select>

  {/* 月号選択（アップロード先） */}
  <select value={selectedIssue} onChange={(e) => setSelectedIssue(e.target.value)}>
    {/* ... */}
  </select>
</div>
```

**レイアウト**: モード選択・カテゴリ選択・月号選択を1行に横並び

#### (4) フォルダアイコングリッド（行389-519）

**構造**:
```typescript
<div className="grid grid-cols-4 gap-4">
  {/* 1-3カラム: フォルダアイコン */}
  {dataTypesToShow.map((dataType) => (
    <button onClick={() => setSelectedDataType(dataType)}>
      <Folder className="w-16 h-16" />
      <FolderIcon className="w-6 h-6" />
      <span>{folderName}</span>
    </button>
  ))}

  {/* 4カラム: ファイル一覧＋プレビュー */}
  <div className="flex gap-3">
    {/* 左: ファイル一覧 */}
    <div className="flex-1">
      {folderFiles.length <= 6 ? (
        // 6件以下: 全表示
        <div className="space-y-1.5">
          {folderFiles.map((file) => (
            <button onClick={() => setSelectedFile(file)}>
              {file.name}
            </button>
          ))}
        </div>
      ) : (
        // 7件以上: 折りたたみ
        <button onClick={() => setFilesExpanded(!filesExpanded)}>
          {folderFiles.length}ファイル
        </button>
      )}
    </div>

    {/* 右: プレビュー */}
    {selectedFile && (
      <div className="w-40">
        <a href={selectedFile.webViewLink} target="_blank">
          <Icon className="w-12 h-12" />
          <div>{selectedFile.name}</div>
          <div>クリックで開く</div>
        </a>
      </div>
    )}
  </div>
</div>
```

---

## 🚨 未実装の機能

### 1. 企業モードUI

**状態**: ❌ 未実装
**場所**: `components/data-submission/DataSubmissionSection.tsx` 行531以降

**現状**:
- タブで「企業別」を選択可能
- しかし、企業別のUIは古いドロップダウン形式のまま
- フォルダアイコングリッドUIに変更する必要あり

**TODO**:
- カテゴリモードと同様の4カラムグリッドUIに変更
- 企業選択 → フォルダ種別選択（メイン/サブ/情報シート）
- ファイル一覧＋プレビュー表示

---

### 2. 全体進捗の実データ取得

**状態**: ❌ 未実装
**場所**: `components/data-submission/DataSubmissionSection.tsx` 行66-87

**現状**:
```typescript
useEffect(() => {
  const fetchSubmissionStatus = async () => {
    setLoadingSubmission(true);
    try {
      // TODO: Phase 8.3で実装予定
      // const response = await fetch(`/api/yumemaga-v2/data-submission?issue=${encodeURIComponent(selectedIssue)}`);
      // const result = await response.json();
      // if (result.success) {
      //   setSubmissionData(result.categories);
      // }

      // 暫定: 既存のカテゴリデータを使用
      setSubmissionData(categories);
    } catch (error) {
      console.error('Failed to fetch submission status:', error);
    } finally {
      setLoadingSubmission(false);
    }
  };

  fetchSubmissionStatus();
}, [selectedIssue, categories]);
```

**問題**:
- プログレスバーは表示されているが、データは仮データ
- APIエンドポイント `/api/yumemaga-v2/data-submission` が未実装
- 実際のファイル提出状況を取得・集計する必要あり

**TODO**:
1. APIエンドポイント作成（`/api/yumemaga-v2/data-submission`）
2. Google Driveから各フォルダのファイル数を取得
3. カテゴリごとの必要データと照合
4. 提出済み/未提出の状態を計算
5. propsとして渡されている`categories`の`requiredData[].status`を更新

---

## 🔍 既知の問題

### 1. 2025年10月号でAPIエラー

**エラー**:
```
GET /api/yumemaga-v2/processes?issue=2025年10月号 500 (Internal Server Error)
TypeError: File URL path must be absolute
```

**原因**:
- 2025年10月号のGoogleシートが存在しないか、シート名が異なる
- `/api/yumemaga-v2/processes` APIがシートを見つけられない

**影響範囲**:
- ページ全体の月号選択で10月号を選択すると、全てのセクションでエラー
- 11月号は正常動作

**対応**:
- スプレッドシートに「逆算配置_ガント_2025年10月号」シートを作成
- または、存在しない月号は選択肢に表示しない

---

### 2. ページ全体の月号選択の仕様

**現状の動作**:
- ページ最上部（行633-640）に月号選択UIあり
- `selectedIssue`ステートで管理
- 各セクション（カテゴリ別進捗、次月号準備、データ提出など）に`defaultIssue`として渡される
- DataSubmissionSectionでは`selectedIssue`として独立管理（初期値は`defaultIssue`）

**仕様の確認事項**:
- ユーザーの要望: **ページ全体の月号選択と連動させたい**
- 現状: DataSubmissionSection内で独自の月号選択可能（アップロード先を変えられる）
- **質問**: この独立した月号選択は必要か？それともページ全体と完全連動すべきか？

**もしページ全体と完全連動する場合の修正**:
```typescript
// components/data-submission/DataSubmissionSection.tsx

// 削除
const [selectedIssue, setSelectedIssue] = useState(defaultIssue);

// 変更
const selectedIssue = defaultIssue; // 常にページ全体の月号を使用

// タブ内の月号選択UIを削除（行350-361）
```

---

## 📋 データフロー図

### カテゴリモード（現在の実装）

```
ページ全体の月号選択（yumemaga-v2/page.tsx）
  ↓ defaultIssue prop
DataSubmissionSection
  ↓ 初期値として使用
selectedIssue state（セクション内で独立管理）
  ↓
┌─────────────────────────────────────┐
│ タブ内UI                             │
│ [カテゴリ別] [カテゴリ▼] [月号▼]     │
│                           ↑         │
│                      ユーザーが変更可│
└─────────────────────────────────────┘
  ↓
selectedCategory + selectedDataType + selectedIssue
  ↓
/api/yumemaga-v2/data-submission/list-files
  ↓
Google Drive: /A_メインインタビュー/録音データ/2025_11/
  ↓
ファイル一覧表示
```

### 全体進捗（未実装部分）

```
ページ全体の月号選択
  ↓ defaultIssue prop
DataSubmissionSection
  ↓
useEffect (行66-87)
  ↓ TODO
/api/yumemaga-v2/data-submission?issue=2025年11月号
  ↓ 未実装
Google Drive: 各カテゴリのフォルダをスキャン
  ↓ 未実装
提出状況を集計
  ↓
submissionData state
  ↓
全体進捗バー（提出済み/未提出）
```

---

## 🧪 テスト手順

### 動作確認

1. **ページ全体の月号選択**
   - http://localhost:3000/dashboard/yumemaga-v2 にアクセス
   - 上部の「既存の号を読み込み」で月号を選択
   - 「2025年11月号」を選択（10月号はエラーになる）

2. **データ提出進捗管理セクション**
   - セクションを展開
   - タブで「カテゴリ別」が選択されていることを確認

3. **フォルダアイコン選択**
   - カテゴリドロップダウンから「A: メインインタビュー」を選択
   - 3つのフォルダアイコンが表示される
   - 「録音データ」フォルダをクリック → 青くハイライト

4. **ファイル一覧表示**
   - 4カラム目にファイル一覧が表示される
   - ファイルがない場合は「ファイルなし」と表示
   - ファイルがある場合:
     - 6件以下: 全ファイル表示
     - 7件以上: 「7ファイル」ボタンをクリックで展開

5. **プレビュー機能**
   - ファイル名をクリック → 選択状態（青背景）
   - 右側にプレビュー表示（アイコン+ファイル名）
   - プレビューをクリック → Google Driveで開く

6. **フォルダ切り替え**
   - 「写真データ」フォルダをクリック
   - プレビューが消える
   - 新しいフォルダのファイル一覧が表示

### API確認（curlでテスト）

```bash
# 月号フォーマット変換に注意
# "2025年11月号" → "2025_11"

# ファイル一覧取得（URLエンコード必要）
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/list-files?categoryId=A&dataType=recording&issue=2025_11" | python3 -m json.tool
```

**期待するレスポンス**:
```json
{
  "success": true,
  "folderId": "1aBcDeFgHi...",
  "files": [
    {
      "id": "file123",
      "name": "interview.mp3",
      "mimeType": "audio/mpeg",
      "size": 1024000,
      "modifiedTime": "2025-10-09T10:30:00Z",
      "webViewLink": "https://drive.google.com/..."
    }
  ],
  "count": 1
}
```

---

## 🚀 次のステップ（優先順位順）

### Phase 1: 企業モードUI実装

**タスク**:
1. 企業モードのタブ内UIを4カラムグリッドに変更
2. 企業選択ドロップダウンを追加
3. フォルダ種別アイコン（メイン/サブ/情報シート）を実装
4. ファイル一覧＋プレビュー機能を実装（カテゴリモードと同じ）

**参考**: カテゴリモードの実装（行389-519）をベースにする

---

### Phase 2: 全体進捗のデータ取得実装

**タスク**:
1. APIエンドポイント作成: `/api/yumemaga-v2/data-submission`
2. Google Driveから各カテゴリのフォルダをスキャン
3. 必要データ（`requiredData`）と照合
4. 提出済み/未提出の状態を計算
5. フロントエンドで全体進捗バーを更新

**API仕様（案）**:
```
GET /api/yumemaga-v2/data-submission?issue=2025年11月号

レスポンス:
{
  "success": true,
  "categories": [
    {
      "id": "A",
      "name": "メインインタビュー",
      "requiredData": [
        {
          "type": "録音データ",
          "name": "録音データ",
          "status": "submitted",  // or "pending", "none"
          "deadline": "2025-11-01",
          "optional": false,
          "fileCount": 3  // 提出されたファイル数
        }
      ]
    }
  ]
}
```

---

### Phase 3: ページ全体の月号選択の仕様確定

**確認事項**:
- DataSubmissionSection内の月号選択は必要か？
- ページ全体の月号選択と完全連動すべきか？

**パターンA（現状）**: セクション内で独立した月号選択
- メリット: アップロード先を自由に変更できる
- デメリット: ページ全体の月号と異なる月号を選択できてしまう

**パターンB（連動）**: ページ全体の月号選択と完全連動
- メリット: シンプル、混乱しない
- デメリット: 別の月号にアップロードしたい場合に不便

**ユーザーの要望**: 「ページ全体の月号選択と連動させたい」

**推奨**: パターンBを採用し、タブ内の月号選択UIを削除

---

## 📝 重要な注意事項

### 1. 月号フォーマットの変換

**UIでの表示**: `2025年11月号`
**APIパラメータ**: `2025_11`
**Google Driveフォルダ名**: `2025_11`

**変換コード**（行103-106）:
```typescript
const issueFormatted = selectedIssue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
  const paddedMonth = month.padStart(2, '0');
  return `${year}_${paddedMonth}`;
});
```

### 2. RequiredData型の定義

**場所**: `components/data-submission/DataSubmissionSection.tsx` 行7-13

```typescript
interface RequiredData {
  type: string;      // データ種別（例: "録音データ"）
  name: string;      // 表示名（例: "録音データ"）
  status: string;    // "submitted", "pending", "none"
  deadline: string;  // 締切日
  optional?: boolean; // 任意かどうか
}
```

**重要**: `categories` propの`requiredData`は必ずこの型に従うこと

### 3. OAuth認証の必要性

**全てのGoogle Drive操作にOAuth認証が必要**:
- ファイル一覧取得: `listFilesInFolderWithOAuth`
- フォルダ作成: `createFolderWithOAuth`
- ファイルアップロード: `uploadFileWithOAuth`

**サービスアカウントではストレージ容量がないため使用不可**

### 4. データ種別の推測ロジック

**場所**: `components/data-submission/DataSubmissionSection.tsx` 行358-364

```typescript
const availableDataTypes = category.requiredData.map(rd => {
  const name = (rd?.name || rd?.type || '').toString();
  if (name.includes('録音') || name.includes('音声')) return 'recording';
  if (name.includes('写真') || name.includes('画像')) return 'photo';
  if (name.includes('企画') || name.includes('資料')) return 'planning';
  return null;
}).filter((dt): dt is DataType => dt !== null);
```

**問題**: 名前ベースの推測なので、カテゴリマスターの表記が変わるとエラーになる

**改善案**: カテゴリマスターに明示的なデータ種別フィールドを追加

---

## 🔗 関連ドキュメント

- `docs/yumemaga-production-management/OAUTH_IMPLEMENTATION_PLAN.md` - OAuth 2.0実装計画
- `docs/yumemaga-production-management/DATA_UPLOAD_IMPLEMENTATION_PLAN.md` - データアップロード機能実装計画
- `types/data-submission.ts` - データ提出関連の型定義

---

## ✅ チェックリスト（次世代Claude Code用）

引き継ぎ前に以下を確認してください：

- [ ] このドキュメントを最初から最後まで読んだ
- [ ] フォルダアイコングリッドUIの動作を実際にブラウザで確認した
- [ ] `/api/yumemaga-v2/data-submission/list-files` APIをcurlでテストした
- [ ] `components/data-submission/DataSubmissionSection.tsx`のコードを読んだ
- [ ] `app/dashboard/yumemaga-v2/page.tsx`の`requiredData`生成ロジックを理解した
- [ ] 未実装の機能（企業モードUI、全体進捗データ取得）を把握した
- [ ] 既知の問題（10月号エラー、月号選択の仕様）を理解した

---

**最終更新**: 2025-10-09
**作成者**: Claude Code (前世代)
**次担当**: 次世代 Claude Code

**質問がある場合**: このドキュメントに記載されていない内容があれば、コードを直接確認するか、ユーザーに質問してください。暗黙知を作らないことが最優先です。
