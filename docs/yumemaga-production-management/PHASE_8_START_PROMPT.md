# Phase 8: データ提出進捗管理 統合実装 スタートプロンプト

**作成日**: 2025-10-09
**対象**: 次世代Claude Code
**目的**: Phase 8の実装を完璧に引き継ぐためのスタートプロンプト

---

## 🎯 あなたのミッション

Phase 8（データ提出進捗管理の統合実装）を完遂してください。

**目標**: データ提出進捗管理UIと既存システム（工程表、企業マスター）を統合し、以下4つの機能を実装する：

1. **Phase 8.1**: 全体進捗の月号対応（30分）
2. **Phase 8.2**: 工程表ステータスリンク（30分）
3. **Phase 8.3**: 企業情報との連動（20分）
4. **Phase 8.4**: 企業情報入力フォーム（60分）

**合計想定時間**: 2時間20分

---

## 📚 必読ドキュメント

実装開始前に以下のドキュメントを**必ず読んでください**：

1. **`docs/yumemaga-production-management/PHASE_8_IMPLEMENTATION_PLAN_V2.md`**
   - 完全な実装計画書（v2.0）
   - 各Phaseの詳細な実装手順
   - コード例、API仕様、処理フロー

2. **`docs/yumemaga-production-management/PHASE_8_PROGRESS_REPORT.md`**
   - 進捗報告書
   - チェックリスト
   - テスト方法

3. **`CLAUDE.md`**
   - プロジェクト全体の開発ガイド
   - 開発コマンド、API テスト方法
   - WSL環境での注意事項

---

## 🚀 実装開始手順

### ステップ1: 環境確認

```bash
# 開発サーバーが起動しているか確認
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/categories" | python3 -m json.tool

# 起動していない場合
npm run dev
```

### ステップ2: Phase 8.1実装開始

**実装内容**:
- データ提出状況取得API作成
- フロントエンド修正（全体進捗の月号対応）

**手順**:

1. **新規ファイル作成**: `app/api/yumemaga-v2/data-submission/status/route.ts`
   - `PHASE_8_IMPLEMENTATION_PLAN_V2.md` の「Phase 8.1 > 1. データ提出状況取得API作成」のコードをそのまま使用
   - 処理フロー通りに実装

2. **既存ファイル修正**: `components/data-submission/DataSubmissionSection.tsx`
   - Read → Edit パターンで修正
   - 行66-88付近: データ提出状況API呼び出し追加
   - 行166-176付近: 全体進捗表示ロジック変更
   - 新しいstate追加: `overallProgress`

3. **テスト実行**:
   ```bash
   # APIテスト
   curl -s "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/status?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" | python3 -m json.tool

   # ブラウザテスト
   # http://localhost:3000/dashboard/yumemaga-v2 を開く
   # 月号を切り替えて進捗が更新されることを確認
   ```

4. **完了条件確認**:
   - [ ] データ提出状況APIが正しく月号別データを返す
   - [ ] 全体進捗が選択月号のデータで計算される
   - [ ] カテゴリカードが月号別の提出状況を表示

5. **進捗報告書更新**:
   - `PHASE_8_PROGRESS_REPORT.md` のPhase 8.1セクションにチェック

### ステップ3: Phase 8.3実装

**なぜ8.2より先に8.3？**: Phase 8.3は独立機能で実装が簡単なため

**実装内容**:
- 企業別工程管理API拡張（ファイルアップロード状況追加）
- フロントエンド修正（企業カードにアップロード状況表示）

**手順**:

1. **既存ファイル修正**: `app/api/yumemaga-v2/company-processes/route.ts`
   - Read → Edit パターンで修正
   - カテゴリCのDriveフォルダID取得処理を追加
   - 8つのフォルダ種別をループしてファイル数カウント
   - `fileUpload` フィールドを `progress` に追加

2. **既存ファイル修正**: `components/company-management/CompanyManagementSection.tsx`
   - Read → Edit パターンで修正
   - 企業カード内にファイルアップロード状況セクション追加

3. **テスト実行**:
   ```bash
   # APIテスト
   curl -s "http://127.0.0.1:3000/api/yumemaga-v2/company-processes?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" | python3 -m json.tool

   # ブラウザテスト
   # http://localhost:3000/dashboard/yumemaga-v2 の企業別工程管理セクションを確認
   ```

4. **完了条件確認**:
   - [ ] 企業別工程管理にファイルアップロード状況が表示
   - [ ] 8つのフォルダすべての状況が確認できる

5. **進捗報告書更新**:
   - `PHASE_8_PROGRESS_REPORT.md` のPhase 8.3セクションにチェック

### ステップ4: Phase 8.2実装

**実装内容**:
- 工程完了API作成
- ヘルパー関数追加（`updateSheetCell`）
- フロントエンド修正（アップロード時に工程自動完了）

**手順**:

1. **ヘルパー関数追加**: `lib/google-sheets.ts`
   - Read → Edit パターンで修正
   - `updateSheetCell` 関数を追加（`PHASE_8_IMPLEMENTATION_PLAN_V2.md` のコードをコピー）

2. **新規ファイル作成**: `app/api/yumemaga-v2/data-submission/complete-process/route.ts`
   - 処理フロー通りに実装
   - エッジケース処理を忘れずに

3. **既存ファイル修正**: `components/data-submission/DataSubmissionSection.tsx`
   - Read → Edit パターンで修正
   - `handleFileUpload` 関数内でアップロード成功後に工程完了API呼び出し

4. **テスト実行**:
   ```bash
   # APIテスト
   curl -X PUT "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/complete-process" \
     -H "Content-Type: application/json" \
     -d '{"issue":"2025年11月号","categoryId":"A","dataType":"recording"}'

   # スプレッドシート確認
   # 進捗入力シートのG列に今日の日付が入力されているか確認
   ```

5. **完了条件確認**:
   - [ ] ファイルアップロード時に対応工程が自動完了
   - [ ] 進捗入力シートのG列（実績日）が更新される

6. **進捗報告書更新**:
   - `PHASE_8_PROGRESS_REPORT.md` のPhase 8.2セクションにチェック

### ステップ5: Phase 8.4実装

**実装内容**:
- 企業情報入力フォームページ作成
- 企業情報保存API作成
- ヘルパー関数追加（`appendSheetRow`, `updateSheetRow`）
- ナビゲーション追加

**手順**:

1. **ヘルパー関数追加**: `lib/google-sheets.ts`
   - Read → Edit パターンで修正
   - `appendSheetRow`, `updateSheetRow` 関数を追加

2. **新規ファイル作成**: `app/dashboard/yumemaga-v2/company-form/page.tsx`
   - 企業マスター51列すべてのフィールド定義
   - `PHASE_8_IMPLEMENTATION_PLAN_V2.md` のコードを参考に実装
   - **重要**: 企業マスター51列の正確な定義は `COMPANY_MASTER_SCHEMA.md` を参照

3. **新規ファイル作成**: `app/api/yumemaga-v2/companies/upsert/route.ts`
   - 処理フロー通りに実装
   - 新規/既存モード対応

4. **既存ファイル修正**: `app/dashboard/yumemaga-v2/page.tsx`
   - Read → Edit パターンで修正
   - 企業情報入力フォームへのナビゲーションボタン追加

5. **テスト実行**:
   ```bash
   # APIテスト（新規企業登録）
   curl -X POST "http://127.0.0.1:3000/api/yumemaga-v2/companies/upsert" \
     -H "Content-Type: application/json" \
     -d '{"mode":"new","companyName":"テスト企業","data":{"companyId":"test","companyName":"テスト企業"}}'

   # ブラウザテスト
   # http://localhost:3000/dashboard/yumemaga-v2/company-form を開く
   ```

6. **完了条件確認**:
   - [ ] 企業情報入力フォームが表示される
   - [ ] 51列すべてのフィールドが入力可能
   - [ ] 新規企業登録が成功する
   - [ ] 既存企業の編集が成功する

7. **進捗報告書更新**:
   - `PHASE_8_PROGRESS_REPORT.md` のPhase 8.4セクションにチェック

### ステップ6: 最終確認

1. **全機能の動作確認**:
   - Phase 8.1: 月号を変更して全体進捗が更新されるか
   - Phase 8.2: ファイルアップロード後に工程が完了するか
   - Phase 8.3: 企業別工程管理でファイル状況が表示されるか
   - Phase 8.4: 企業情報入力フォームで登録・編集できるか

2. **進捗報告書の最終チェックリスト完了**:
   - `PHASE_8_PROGRESS_REPORT.md` の「最終チェックリスト」をすべてチェック

3. **ユーザーに完了報告**:
   - 実装完了した機能のサマリー
   - テスト結果
   - 追加で確認してほしい事項

---

## ⚠️ 重要な注意事項

### 必ず守ること

1. **実装順序を厳守**
   - Phase 8.1 → 8.3 → 8.2 → 8.4の順で実装
   - 前のPhaseが完了してから次に進む

2. **既存コードを壊さない**
   - 既存ファイルを修正する場合は必ず Read → Edit パターン
   - Write は新規ファイル作成のみ

3. **エラーハンドリングを徹底**
   - Google Drive API呼び出しは `try-catch` で囲む
   - エラー発生時もクラッシュせず継続
   - スプレッドシート更新は権限エラーの可能性を考慮

4. **各Phase完了後にテスト**
   - APIテスト（curl）
   - ブラウザテスト
   - 完了条件すべてを確認

5. **進捗報告書を随時更新**
   - 各Phase完了時にチェック
   - 実装中のメモを追記
   - トラブルシューティング情報を記録

### やってはいけないこと

1. **勝手な判断で設計変更しない**
   - 計画書通りに実装
   - 不明点があればユーザーに確認

2. **テストをスキップしない**
   - 各Phase完了後に必ずテスト
   - テスト失敗時は原因を特定して修正

3. **ドキュメント更新を忘れない**
   - 進捗報告書は必ず更新
   - 変更した設計があればメモ

---

## 🔍 トラブルシューティング

### Google Drive APIが遅い場合

- タイムアウトを60秒に設定済み
- バッチ処理は不要（各カテゴリ・企業で並列処理）
- エラーログを確認してボトルネックを特定

### 企業マスター更新が失敗する場合

1. サービスアカウントに書き込み権限があるか確認
   ```bash
   # .env.localのGOOGLE_SERVICE_ACCOUNT_KEYを確認
   ```

2. スプレッドシートIDが正しいか確認
   ```bash
   # .env.localのYUMEMAGA_SPREADSHEET_IDを確認
   ```

3. 列番号が正しいか確認
   - 企業マスターは51列（A～AY列）
   - `COMPANY_MASTER_SCHEMA.md` で構造を確認

### フォームの進捗が100%にならない場合

1. 必須項目（`required: true`）の定義を確認
2. 空白文字のトリム処理を確認（`.trim()`）
3. 進捗計算ロジックを確認

### APIレスポンスが空の場合

1. スプレッドシートのシート名が正しいか確認
   - 「カテゴリマスター」「新工程マスター」「進捗入力シート」「企業マスター」
2. スプレッドシートにデータが存在するか確認
3. カテゴリマスターのI列（ステータス）が `"active"` か確認

---

## 📊 成功基準

Phase 8が完璧に完了したと判断する基準：

1. **全4 Phaseの実装完了**
   - Phase 8.1～8.4のすべてのファイルが作成・修正されている

2. **全機能の動作確認完了**
   - 各Phaseの完了条件がすべて満たされている
   - テストがすべてパスしている

3. **ドキュメント更新完了**
   - 進捗報告書の最終チェックリストがすべてチェックされている
   - 実装中のメモが記録されている

4. **ユーザー確認完了**
   - ユーザーが実際に動作を確認して承認している

---

## 🎓 コード例の参照先

すべてのコード例は `PHASE_8_IMPLEMENTATION_PLAN_V2.md` に記載されています。

**Phase 8.1**:
- データ提出状況取得API: 行42-147
- フロントエンド修正: 行149-191

**Phase 8.2**:
- 工程完了API: 行240-348
- ヘルパー関数（`updateSheetCell`）: 行350-372
- フロントエンド修正: 行374-416

**Phase 8.3**:
- 企業別工程管理API拡張: 行483-551
- フロントエンド修正: 行553-583

**Phase 8.4**:
- 企業情報入力フォームページ: 行681-940
- 企業情報保存API: 行942-1030
- ヘルパー関数（`appendSheetRow`, `updateSheetRow`）: 行1032-1089

---

## 💡 実装のコツ

### 効率的な実装方法

1. **コードはコピペでOK**
   - 計画書のコード例をそのまま使用
   - ただし、既存ファイル修正時は必ずReadで内容確認

2. **一度に1つのPhaseに集中**
   - Phase 8.1が完璧に終わってから8.3に進む
   - 中途半端な状態で次に進まない

3. **テストは小まめに**
   - ファイル作成後すぐにAPIテスト
   - エラーが出たらすぐに修正

4. **進捗報告書を活用**
   - チェックリストで進捗を確認
   - メモ欄で情報を記録

### よくあるミス

1. **既存ファイルをWriteで上書き**
   - 必ずRead → Editパターン
   - Writeは新規ファイルのみ

2. **エラーハンドリング忘れ**
   - Google Drive APIは必ずtry-catch
   - エラー時もクラッシュせず継続

3. **テストスキップ**
   - 各Phase完了後に必ずテスト
   - テスト失敗は次に進まない

---

## 📞 サポート

不明点があれば以下を確認：

1. **`PHASE_8_IMPLEMENTATION_PLAN_V2.md`** - 詳細な実装手順
2. **`CLAUDE.md`** - プロジェクト全体のガイド
3. **既存コード** - 似た機能の実装パターンを参考
4. **ユーザーに質問** - 上記で解決しない場合のみ

---

## ✅ スタートプロンプトの使い方

このプロンプトを次世代Claude Codeに渡す際の推奨メッセージ：

```
Phase 8（データ提出進捗管理の統合実装）を開始してください。

以下のドキュメントを読んで、Phase 8.1から順次実装してください：
- docs/yumemaga-production-management/PHASE_8_START_PROMPT.md（このファイル）
- docs/yumemaga-production-management/PHASE_8_IMPLEMENTATION_PLAN_V2.md
- docs/yumemaga-production-management/PHASE_8_PROGRESS_REPORT.md

実装順序: Phase 8.1 → 8.3 → 8.2 → 8.4

各Phase完了後にテストを実行し、進捗報告書を更新してください。
完了したら最終確認をして報告してください。
```

---

**最終更新**: 2025-10-09
**作成者**: Claude Code（現世代）
**対象**: 次世代Claude Code

このスタートプロンプトに従って、Phase 8を完璧に実装してください。
成功を祈っています！🚀
