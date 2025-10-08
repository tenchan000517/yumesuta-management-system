# ゆめマガ進捗管理システム改善 - スタートプロンプト

**対象**: 後続のClaude Code（実装担当者）
**作成日**: 2025-10-07
**前任PM**: Claude Code

---

## 📖 このドキュメントについて

このプロジェクトは**7つのフェーズ**に分かれており、各フェーズを順番に完了させることでシステムが完成します。

あなたの役割は、**進捗報告シートを確認し、次のフェーズを実装すること**です。

---

## 🚀 初回起動時の手順

### Step 1: 進捗報告シートを確認

```bash
# 進捗報告シートを開く
cat docs/yumemaga-production-management/PROGRESS_REPORT.md
```

**確認事項**:
- 現在どのフェーズまで完了しているか
- 次に実装すべきフェーズは何か
- 前回のセッションで発生した問題はないか

### Step 2: プロジェクト計画書を確認

```bash
# プロジェクト計画書を開く
cat docs/yumemaga-production-management/PROJECT_PLAN_FINAL.md
```

**確認事項**:
- 次のフェーズの実装タスク
- 成功基準
- テスト項目

### Step 3: 調査結果を確認（必要に応じて）

```bash
# 徹底調査結果を確認
cat docs/investigation/INVESTIGATION_RESULTS.md
```

---

## 📋 フェーズ別実装ガイド

### Phase 0: 事前準備（スプレッドシート作業）

**担当**: ユーザー（GAS自動化）
**所要時間**: 約1分（GAS実行）

**✨ GAS自動化スクリプト利用可能！**

Phase 0は**GAS自動化スクリプト**で完全自動化されています：
- 従来の手動作業: 2-3時間
- GAS自動化: **約1分で完了**

**確認事項**:
- [x] カテゴリマスター作成済みか（15カテゴリ）
- [x] 企業マスター作成済みか（6社・実データ反映）✨
- [x] 作業アシストマスター作成済みか（6工程）
- [x] 新工程マスターのクリーンナップ完了か

**Phase 0が未完了の場合**:

```
ユーザーに以下を伝えてください：

「Phase 0（スプレッドシート作業）はGAS自動化スクリプトで1分で完了できます。
以下のドキュメントを参照して実行してください：

📄 詳細ガイド: docs/yumemaga-production-management/PHASE0_SETUP_GUIDE.md
📄 GASスクリプト: docs/yumemaga-production-management/phase0-setup.gs

実行手順:
1. Google Sheetsで「拡張機能」→「Apps Script」を開く
2. phase0-setup.gs の内容をコピー&ペースト
3. 保存して「onOpen」を実行（初回のみ）
4. スプレッドシートに戻り、「Phase 0」メニュー→「✅ 全シート自動作成」
5. 完了！（約1分）
」
```

**Phase 0完了後の確認方法**:

```bash
# 進捗報告シートで確認
cat docs/yumemaga-production-management/PROGRESS_REPORT.md
```

または、スプレッドシートで「Phase 0」メニュー→「🔍 Phase 0完了チェック」を実行

---

### Phase 1: カテゴリの動的管理

**優先度**: 🔴 最高
**工数**: 4時間

#### 実装手順

1. **カテゴリ取得API作成**

```bash
# ファイル作成
touch app/api/yumemaga-v2/categories/route.ts
```

実装内容:
- カテゴリマスターから全カテゴリを取得
- カテゴリID、カテゴリ名、確認送付必須、表示順を返却

参考実装は `docs/yumemaga-production-management/PROJECT_PLAN_FINAL.md` のPhase 1セクション参照

2. **フロントエンド修正**

```bash
# 対象ファイル
app/dashboard/yumemaga-v2/page.tsx
```

削除する箇所:
- `getCategoryName()` 関数
- `getRequiredData()` 関数
- 確認必須カテゴリ配列 `['A', 'K', 'H', ...]`

追加する箇所:
- `useState`: categoryMetadata
- `useEffect`: fetchCategories()

3. **progress API修正**

```bash
# 対象ファイル
app/api/yumemaga-v2/progress/route.ts
```

削除する箇所:
- `const categories: Record<string, any[]> = { A: [], K: [], ... }`

変更する箇所:
- 動的にカテゴリを抽出するロジックに変更

#### テスト

```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
http://localhost:3000/dashboard/yumemaga-v2
```

確認項目:
- [ ] 全15カテゴリが表示される
- [ ] カテゴリ名が正しく表示される
- [ ] 確認送付必須フラグが機能する

#### 完了後

```bash
# 進捗報告シートを更新
# Phase 1のステータスを「完了」に変更
```

---

### Phase 2: 依存関係ベースの準備OK判定

**優先度**: 🔴 高
**工数**: 6時間

#### 実装手順

1. **準備OK判定API作成**

```bash
# ファイル作成
touch app/api/yumemaga-v2/ready-processes/route.ts
```

実装内容:
- 新依存関係マスターを読み込み
- 前提工程が完了した工程を「準備OK」と判定
- 予定日を過ぎた未完了工程を「遅延」と判定

2. **UI表示**

工程カードに以下を追加:
- 準備OKバッジ（緑色）
- 遅延バッジ（赤色、遅延日数表示）

#### テスト

確認項目:
- [ ] 依存関係が正しく読み込まれる
- [ ] 準備OK判定が正確に動作する
- [ ] 遅延判定が正確に動作する

---

### Phase 3-7

Phase 3以降の詳細は `PROJECT_PLAN_FINAL.md` を参照してください。

---

## 🔍 トラブルシューティング

### スプレッドシートが見つからない

```typescript
// 環境変数を確認
console.log(process.env.YUMEMAGA_SPREADSHEET_ID);
```

### カテゴリマスターが空

Phase 0が完了していない可能性があります。ユーザーに確認してください。

### APIエラーが発生

```bash
# サーバーログを確認
npm run dev

# エラーメッセージを確認
# Google Sheets APIのエラーの場合、認証情報を確認
```

---

## 📊 進捗報告の書き方

各フェーズ完了時に `PROGRESS_REPORT.md` を更新してください。

更新内容:
```markdown
### Phase X: [フェーズ名]

**ステータス**: ✅ 完了 / ⚠️ 一部完了 / ❌ 未着手

**完了日**: 2025-10-XX

**実装内容**:
- [実装した内容を箇条書き]

**テスト結果**:
- [x] テスト項目1
- [x] テスト項目2

**問題点**:
- [発生した問題があれば記載]

**次のフェーズへの引き継ぎ事項**:
- [次の担当者に伝えたいことがあれば記載]
```

---

## ✅ 完成条件

**全7フェーズが完了し、以下がすべて✅になれば完成**:

- [x] Phase 0: スプレッドシート作業完了
- [x] Phase 1: カテゴリ動的管理完了
- [x] Phase 2: 準備OK判定完了
- [x] Phase 3: Z・B専用セクション完了
- [ ] Phase 4: カテゴリ同期マスター活用完了
- [ ] Phase 5: 作業アシスト機能完了
- [ ] Phase 6: フレキシブル企画対応完了
- [ ] Phase 7: 企業紹介ページ管理完了（⚠️ 一部完了、残タスクあり）

---

## 🎯 重要な原則

1. **進捗報告シートを常に最新に保つ**
2. **各フェーズのテストを必ず実施**
3. **問題が発生したら詳細を記録**
4. **前任者のコードを尊重（無駄な変更をしない）**
5. **シンプルに保つ（複雑化しない）**

---

**前任PM**: Claude Code
**連絡先**: このドキュメントに質問を追記してください
**最終更新**: 2025-10-07
