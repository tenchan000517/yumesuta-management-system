# ゆめマガスプレッドシート調査レポート - インデックス

調査日: 2025-10-07
調査者: Claude Code (Sonnet 4.5)
調査対象: YUMEMAGA_SPREADSHEET_ID (1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw)

---

## 📚 ドキュメント一覧

### 🎯 クイックスタート

**読む順番:**
1. **INVESTIGATION_SUMMARY.md** (最初に読む)
2. **SAMPLE_DATA_EXAMPLES.md** (データ例を確認)
3. **yumemaga-spreadsheet-structure-report.md** (詳細を理解)

### 📄 各ドキュメントの説明

#### 1. INVESTIGATION_SUMMARY.md (11KB, 305行)
**推奨読者:** プロジェクトマネージャー、開発者全員

**内容:**
- スプレッドシート全体のサマリー
- 14シート、96工程、108依存関係の概要
- 作業カテゴリ、依存関係タイプの分類
- カテゴリ同期の13グループ
- スケジュールの5段階構造
- 負荷制約・期間制約の重要ポイント
- レイヤー構造の説明
- 現在の進捗状況
- 実装ロードマップ（Phase 1-4）

**このドキュメントで分かること:**
- 全体像を素早く把握できる
- 重要な数字とポイントが一目で分かる
- 次に何をすべきかが明確

---

#### 2. yumemaga-spreadsheet-structure-report.md (22KB, 607行)
**推奨読者:** システムアーキテクト、バックエンド開発者

**内容:**
- 全14シートの完全な構造分析
- 新工程マスター（96工程の完全リスト）
- 新依存関係マスター（108依存関係の完全リスト）
- 設定マスター（月号設定の詳細）
- カテゴリ同期マスター（13グループの詳細）
- 負荷制約マスター（8件の制約条件）
- 期間制約マスター（8期間の作業制約）
- 進捗入力シート（実績データ構造）
- ガントシート（61日間の配置分析）
- システム実装への推奨事項
- TypeScript型定義の提案
- API実装の段階的アプローチ
- UI/UX設計の推奨

**このドキュメントで分かること:**
- データベーススキーマに相当する構造
- 各マスターテーブルの関連性
- 実装時の技術的な詳細
- パフォーマンス最適化のヒント

---

#### 3. SAMPLE_DATA_EXAMPLES.md (16KB, 300行)
**推奨読者:** フロントエンド開発者、UI/UXデザイナー

**内容:**
- 新工程マスターのサンプル20工程
- 新依存関係マスターのサンプル30依存関係
- カテゴリ同期マスターの全13グループ
- 負荷制約マスターの全8件
- 期間制約マスターの全8期間
- 進捗入力シートのサンプル10工程
- ガントシートの日付配置例
- TypeScript型定義の実装例
- API実装のコード例

**このドキュメントで分かること:**
- 実際のデータがどう見えるか
- UI設計のための具体例
- コピー&ペーストで使えるコード例
- データの前後関係の理解

---

#### 4. PROCESS_SCHEDULE_STRUCTURE_REPORT.md (15KB, 379行)
**推奨読者:** 工程管理担当者、プロジェクトマネージャー

**内容:**
- 旧バージョンの調査レポート（参考資料）
- 初期の構造分析
- 工程マスターの基本理解

**このドキュメントで分かること:**
- スプレッドシートの進化の経緯
- 初期バージョンとの比較
- レガシーシステムとの互換性

---

#### 5. SHEET_DATA_ANALYSIS.md (9.1KB, 256行)
**推奨読者:** データアナリスト、QA担当者

**内容:**
- シートデータの初期分析
- データ品質の確認
- 異常値の検出

**このドキュメントで分かること:**
- データの健全性
- 欠損値や異常値の有無
- データクリーニングの必要性

---

#### 6. GAS_SCHEDULER_ANALYSIS.md (28KB, 985行)
**推奨読者:** Google Apps Script開発者、自動化エンジニア

**内容:**
- Google Apps Scriptの詳細分析
- 逆算スケジューラーのアルゴリズム
- カテゴリ同期の実装
- 負荷制約の処理ロジック
- 期間制約の適用方法

**このドキュメントで分かること:**
- スプレッドシートの自動化の仕組み
- スケジューラーのアルゴリズム
- GASコードの詳細

---

## 🎯 読み方ガイド

### 🚀 初めての方

1. **INVESTIGATION_SUMMARY.md** を読む（10分）
   - 全体像を把握
   - 重要な数字を確認

2. **SAMPLE_DATA_EXAMPLES.md** を読む（15分）
   - 実際のデータを見る
   - UI設計のイメージを掴む

3. 必要に応じて詳細ドキュメントへ

### 💻 実装担当者

1. **INVESTIGATION_SUMMARY.md** で概要把握（10分）

2. **yumemaga-spreadsheet-structure-report.md** で詳細理解（30分）
   - システム実装への推奨事項を熟読
   - TypeScript型定義を確認
   - API実装の段階的アプローチを理解

3. **SAMPLE_DATA_EXAMPLES.md** でコード例確認（20分）
   - 型定義をコピー
   - API実装例を参考にする

4. 実装開始

### 📊 プロジェクトマネージャー

1. **INVESTIGATION_SUMMARY.md** 全体を読む（15分）
   - 実装ロードマップを確認
   - 各フェーズの工数を把握

2. **yumemaga-spreadsheet-structure-report.md** の「まとめと推奨事項」を読む（10分）
   - 実装の優先順位を確認
   - リスクと対策を理解

3. チームに指示

---

## 📊 調査結果サマリー

| 項目 | 値 | ドキュメント |
|------|-----|-------------|
| 総シート数 | 14シート | INVESTIGATION_SUMMARY |
| 総工程数 | 96工程 | yumemaga-spreadsheet-structure-report |
| 依存関係数 | 108件 | SAMPLE_DATA_EXAMPLES |
| カテゴリ同期グループ | 13グループ | INVESTIGATION_SUMMARY |
| 負荷制約 | 8件 | SAMPLE_DATA_EXAMPLES |
| 期間制約 | 8期間 | SAMPLE_DATA_EXAMPLES |
| ガント日数 | 61日間 | yumemaga-spreadsheet-structure-report |
| レイヤー数 | 7種類 | INVESTIGATION_SUMMARY |
| 作業カテゴリ | 9種類 | yumemaga-spreadsheet-structure-report |

---

## 🔑 重要な発見

### 1. 完全な逆算配置
- ガントシートの全96工程に日付が配置済み
- 空白工程: 0件
- 手動調整不要（システムが最適化済み）

### 2. カテゴリ同期による効率化
- 文字起こし6工程が9日目に同期（1.2倍）
- 内容整理6工程が10日目に同期（1.2倍）
- 確認送付10工程が18日目に同期（1.2倍）

### 3. 新規案件厳禁期間の厳格管理
- 14～20日目は新規案件受入完全禁止
- 負荷制約: 最大同時実行数0、最大負荷0人日
- ページ制作と内部チェックに集中

### 4. 次月号作業の並行実行
- 現月号の25日目以降に次月号開始
- 14工程が「次月号」レイヤーで配置
- シームレスな月号間移行

---

## 🚀 実装ロードマップ

### Phase 1: 基本表示の改善（1-2日）
**ドキュメント:** INVESTIGATION_SUMMARY, SAMPLE_DATA_EXAMPLES

- 新工程マスターの全96工程を表示
- 進捗入力シートの実績日との統合
- カテゴリ別のグループ化表示

### Phase 2: ガントチャート実装（3-5日）
**ドキュメント:** yumemaga-spreadsheet-structure-report, SAMPLE_DATA_EXAMPLES

- 逆算配置ガントの61日間表示
- レイヤー別の色分け
- 工程名と日付のマッピング

### Phase 3: 依存関係可視化（3-5日）
**ドキュメント:** yumemaga-spreadsheet-structure-report, SAMPLE_DATA_EXAMPLES

- 新依存関係マスターの108依存関係表示
- クリティカルパスの計算
- 工程間の前後関係図

### Phase 4: 制約条件の反映（2-3日）
**ドキュメント:** INVESTIGATION_SUMMARY, SAMPLE_DATA_EXAMPLES

- 期間制約マスターによる背景色変更
- 負荷制約マスターによる警告表示
- カテゴリ同期の推奨表示

---

## 🛠 技術スタック

### データ取得
- Google Sheets API v4
- BatchSheetData API（複数シートを一度に取得）

### 型定義
- TypeScript
- `types/yumemaga-process.ts`
- `types/yumemaga-dependency.ts`

### API実装
- Next.js 15 App Router
- `/app/api/yumemaga-sheets/route.ts`

### UI実装
- React 19
- Tailwind CSS v4
- lucide-react（アイコン）

---

## 📞 サポート

### 質問がある場合

1. まず該当するドキュメントを読む
2. INVESTIGATION_SUMMARY.mdで全体像を確認
3. SAMPLE_DATA_EXAMPLES.mdで具体例を確認
4. yumemaga-spreadsheet-structure-report.mdで詳細を確認

### 実装で困った場合

1. SAMPLE_DATA_EXAMPLES.mdのコード例を参照
2. yumemaga-spreadsheet-structure-report.mdの「システム実装への推奨事項」を確認
3. 型定義が不明な場合はSAMPLE_DATA_EXAMPLES.mdの「TypeScript型定義」を参照

---

## 📝 更新履歴

| 日付 | バージョン | 変更内容 |
|------|----------|---------|
| 2025-10-07 | 1.0 | 初版作成（Claude Code） |
| | | - 全14シートの完全調査完了 |
| | | - 6つの詳細レポート作成 |
| | | - インデックスドキュメント作成 |

---

## ✅ チェックリスト

実装開始前に確認すべきこと：

- [ ] INVESTIGATION_SUMMARY.mdを読んだ
- [ ] 実装ロードマップ（Phase 1-4）を理解した
- [ ] SAMPLE_DATA_EXAMPLES.mdのコード例を確認した
- [ ] 必要な環境変数（YUMEMAGA_SPREADSHEET_ID）を設定した
- [ ] Google Sheets APIの権限を確認した
- [ ] TypeScript型定義を準備した
- [ ] API実装の方針を決めた

実装中に参照すべきこと：

- [ ] yumemaga-spreadsheet-structure-report.mdの「システム実装への推奨事項」
- [ ] SAMPLE_DATA_EXAMPLES.mdの「実装時のデータ取得例」
- [ ] 各マスターシートの列構成（yumemaga-spreadsheet-structure-report.md）

---

## 🎓 用語集

| 用語 | 説明 |
|------|------|
| 新工程マスター | 96工程の基本情報を定義するシート |
| 新依存関係マスター | 108件の工程間依存関係を定義するシート |
| カテゴリ同期 | 同種作業を同日実行して効率化する仕組み |
| 負荷制約 | 担当者の同時実行数や負荷の上限 |
| 期間制約 | 期間別の許可/禁止作業の定義 |
| レイヤー | 工程の階層構造（Layer 1-6 + 次月号） |
| 逆算配置 | 入稿日から逆算してスケジュール配置 |
| クリティカルパス | 工程完了に最も時間がかかる経路 |
| 効率ボーナス | カテゴリ同期時の作業効率向上率 |

---

## 🔗 関連リンク

- **スプレッドシート:** (YUMEMAGA_SPREADSHEET_ID)
- **調査API:** http://localhost:3000/api/investigate-process-sheets
- **プロジェクトルート:** /mnt/c/yumesuta-management-system
- **ドキュメントフォルダ:** /docs/investigation/

---

## 📧 フィードバック

このドキュメントについてのフィードバックや改善提案は：
- ドキュメント内の不明点をリストアップ
- 追加で必要な情報を明確化
- 実装時に困った点を記録

---

**最終更新:** 2025-10-07
**調査者:** Claude Code (Sonnet 4.5)
**総ドキュメント数:** 6ファイル
**総行数:** 2,832行
**総ファイルサイズ:** 64KB
