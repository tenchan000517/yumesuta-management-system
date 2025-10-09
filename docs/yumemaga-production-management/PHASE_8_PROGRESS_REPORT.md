# Phase 8: データ提出進捗管理 統合実装 進捗報告書

**作成日**: 2025-10-09
**最終更新**: 2025-10-09
**担当**: Claude Code
**状態**: 計画完了、実装未着手

---

## 📊 全体進捗

| Phase | 内容 | 状態 | 完了率 | 想定時間 | 実績時間 |
|-------|------|------|--------|---------|---------|
| Phase 8.1 | 全体進捗の月号対応 | 未着手 | 0% | 30分 | - |
| Phase 8.2 | 工程表ステータスリンク | 未着手 | 0% | 30分 | - |
| Phase 8.3 | 企業情報との連動 | 未着手 | 0% | 20分 | - |
| Phase 8.4 | 企業情報入力フォーム | 未着手 | 0% | 60分 | - |
| **合計** | - | **未着手** | **0%** | **2時間20分** | **0分** |

---

## 🎯 Phase 8.1: 全体進捗の月号対応

### 実装内容

- [ ] データ提出状況取得API作成（`app/api/yumemaga-v2/data-submission/status/route.ts`）
- [ ] フロントエンド修正（`components/data-submission/DataSubmissionSection.tsx`）

### 完了条件

- [ ] データ提出状況APIが正しく月号別データを返す
- [ ] 全体進捗が選択月号のデータで計算される
- [ ] カテゴリカードが月号別の提出状況を表示
- [ ] 月号を変更すると進捗が更新される

### 作成ファイル

- `app/api/yumemaga-v2/data-submission/status/route.ts`（新規作成）

### 修正ファイル

- `components/data-submission/DataSubmissionSection.tsx`（修正）
  - 行66-88: データ提出状況API呼び出し追加
  - 行166-176: 全体進捗表示ロジック変更

### 実装詳細

**API処理フロー**:
1. カテゴリマスターから全カテゴリ取得
2. E列（requiredData）をカンマ区切りでパース
3. データ種別名を型にマッピング（`録音データ` → `recording`）
4. Google Driveでファイル存在確認（`listFilesInFolderWithOAuth`）
5. サマリー計算（`submitted / total * 100`）

**フロントエンド変更**:
- 新しいstate追加: `overallProgress`
- 月号変更時にデータ提出状況API呼び出し
- 全体進捗を `overallProgress.progress` から表示

### テスト方法

```bash
# APIテスト
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/status?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" | python3 -m json.tool

# ブラウザテスト
# http://localhost:3000/dashboard/yumemaga-v2 を開く
# 月号を切り替えて進捗が更新されることを確認
```

### 進捗メモ

（実装開始後にメモを追記）

---

## 🔗 Phase 8.2: 工程表ステータスリンク

### 実装内容

- [ ] 工程完了API作成（`app/api/yumemaga-v2/data-submission/complete-process/route.ts`）
- [ ] `lib/google-sheets.ts` に `updateSheetCell` 追加
- [ ] フロントエンド修正（`components/data-submission/DataSubmissionSection.tsx`）

### 完了条件

- [ ] ファイルアップロード時に対応工程が自動完了
- [ ] 進捗入力シートのG列（実績日）が更新される
- [ ] 既に実績日がある場合はスキップされる
- [ ] 該当工程がない場合もエラーにならない

### 作成ファイル

- `app/api/yumemaga-v2/data-submission/complete-process/route.ts`（新規作成）

### 修正ファイル

- `lib/google-sheets.ts`（`updateSheetCell` 関数追加）
- `components/data-submission/DataSubmissionSection.tsx`（`handleFileUpload` 修正）

### 実装詳細

**API処理フロー**:
1. データ種別を日本語名に変換（`recording` → `録音データ`）
2. 進捗入力シートから該当工程を検索
   - 工程NoがカテゴリIDで始まる
   - 必要データ（C列）にデータ種別名を含む
   - 月号（D列）が一致または空
3. G列（実績日）を今日の日付で更新
4. 完了通知を返す

**エッジケース**:
- 該当工程なし → `success: true, completedProcesses: []`
- 既に実績日あり → スキップ
- 複数該当 → 最初の1件のみ

**フロントエンド変更**:
- `handleFileUpload` 内でアップロード成功後に工程完了API呼び出し
- カテゴリモードのみ実行（企業モードはスキップ）

### テスト方法

```bash
# APIテスト
curl -X PUT "http://127.0.0.1:3000/api/yumemaga-v2/data-submission/complete-process" \
  -H "Content-Type: application/json" \
  -d '{"issue":"2025年11月号","categoryId":"A","dataType":"recording"}'

# スプレッドシート確認
# 進捗入力シートのG列に今日の日付が入力されているか確認
```

### 進捗メモ

（実装開始後にメモを追記）

---

## 🏢 Phase 8.3: 企業情報との連動

### 実装内容

- [ ] 企業別工程管理API拡張（`app/api/yumemaga-v2/company-processes/route.ts`）
- [ ] フロントエンド修正（`components/company-management/CompanyManagementSection.tsx`）

### 完了条件

- [ ] 企業別工程管理にファイルアップロード状況が表示
- [ ] 8つのフォルダすべての状況が確認できる
- [ ] ファイル数がリアルタイムで取得される
- [ ] アップロード済みフォルダは✅、未提出は⬜で表示

### 修正ファイル

- `app/api/yumemaga-v2/company-processes/route.ts`（`fileUpload` フィールド追加）
- `components/company-management/CompanyManagementSection.tsx`（UI追加）

### 実装詳細

**API処理追加**:
1. カテゴリC（企業情報）のDriveフォルダID取得
2. 8つのフォルダ種別をループ
   - パス: `カテゴリC_DriveID/企業名/フォルダ種別/`
   - ファイル数カウント
   - `fileCount > 0` なら `uploaded: true`
3. `fileUpload` オブジェクトを `progress` に追加

**フロントエンド変更**:
- 企業カード内にファイルアップロード状況セクション追加
- 2列グリッドで8フォルダを表示
- ✅/⬜ アイコンでステータス表示

### テスト方法

```bash
# APIテスト
curl -s "http://127.0.0.1:3000/api/yumemaga-v2/company-processes?issue=2025%E5%B9%B411%E6%9C%88%E5%8F%B7" | python3 -m json.tool

# ブラウザテスト
# http://localhost:3000/dashboard/yumemaga-v2 の企業別工程管理セクションを確認
```

### 進捗メモ

（実装開始後にメモを追記）

---

## 📄 Phase 8.4: 企業情報入力フォーム

### 実装内容

- [ ] 企業情報入力フォームページ作成（`app/dashboard/yumemaga-v2/company-form/page.tsx`）
- [ ] 企業情報保存API作成（`app/api/yumemaga-v2/companies/upsert/route.ts`）
- [ ] `lib/google-sheets.ts` に `appendSheetRow`, `updateSheetRow` 追加
- [ ] ナビゲーション追加（`app/dashboard/yumemaga-v2/page.tsx`）

### 完了条件

- [ ] 企業情報入力フォームが表示される
- [ ] 51列すべてのフィールドが入力可能
- [ ] 新規企業登録が成功する
- [ ] 既存企業の編集が成功する
- [ ] 進捗バーが正しく動作する
- [ ] 企業マスターに正しくデータが反映される

### 作成ファイル

- `app/dashboard/yumemaga-v2/company-form/page.tsx`（新規作成）
- `app/api/yumemaga-v2/companies/upsert/route.ts`（新規作成）

### 修正ファイル

- `lib/google-sheets.ts`（`appendSheetRow`, `updateSheetRow` 追加）
- `app/dashboard/yumemaga-v2/page.tsx`（ナビゲーションボタン追加）

### 実装詳細

**フォーム機能**:
- 企業マスター51列すべてのフィールド定義
- 新規/既存モード切り替え
- 進捗バー（必須項目の入力率）
- バリデーション（必須項目チェック）
- リアルタイム進捗計算

**API処理フロー**:
1. 企業マスターから対象企業を検索（既存モードの場合）
2. フォームデータを配列形式に変換（列順序に従う）
3. 新規 → `appendSheetRow`、既存 → `updateSheetRow`
4. 成功レスポンス返却

**ヘルパー関数**:
- `appendSheetRow`: 企業マスターに新規行追加
- `updateSheetRow`: 企業マスターの既存行更新

### テスト方法

```bash
# APIテスト（新規企業登録）
curl -X POST "http://127.0.0.1:3000/api/yumemaga-v2/companies/upsert" \
  -H "Content-Type: application/json" \
  -d '{"mode":"new","companyName":"テスト企業","data":{"companyId":"test","companyName":"テスト企業"}}'

# ブラウザテスト
# http://localhost:3000/dashboard/yumemaga-v2/company-form を開く
# フォーム入力 → 送信 → 企業マスター確認
```

### 進捗メモ

（実装開始後にメモを追記）

---

## 📝 実装中のメモ

### 判明した事項

（実装中に判明した仕様や制約をメモ）

### 変更した設計

（計画から変更した設計をメモ）

### トラブルシューティング

（発生した問題と解決方法をメモ）

---

## ✅ 最終チェックリスト

### Phase 8.1完了時

- [ ] `app/api/yumemaga-v2/data-submission/status/route.ts` 作成完了
- [ ] データ提出状況APIが正しく月号別データを返す
- [ ] `DataSubmissionSection.tsx` 修正完了
- [ ] 全体進捗が選択月号のデータで計算される

### Phase 8.2完了時

- [ ] `app/api/yumemaga-v2/data-submission/complete-process/route.ts` 作成完了
- [ ] `lib/google-sheets.ts` に `updateSheetCell` 追加完了
- [ ] ファイルアップロード時に工程が自動完了
- [ ] 進捗入力シートのG列が更新される

### Phase 8.3完了時

- [ ] `app/api/yumemaga-v2/company-processes/route.ts` 修正完了
- [ ] 企業別工程管理にファイルアップロード状況が表示
- [ ] `CompanyManagementSection.tsx` 修正完了

### Phase 8.4完了時

- [ ] `app/dashboard/yumemaga-v2/company-form/page.tsx` 作成完了
- [ ] `app/api/yumemaga-v2/companies/upsert/route.ts` 作成完了
- [ ] `lib/google-sheets.ts` に `appendSheetRow`, `updateSheetRow` 追加完了
- [ ] 新規企業登録が成功する
- [ ] 既存企業の編集が成功する

### Phase 8全体完了時

- [ ] 全4 Phaseの実装完了
- [ ] 全機能のテスト完了
- [ ] ドキュメント更新完了
- [ ] ユーザー確認完了

---

## 🔄 次世代への引き継ぎ事項

### 実装完了後に確認すべきこと

1. **データ整合性**
   - 企業マスターのデータが正しく反映されているか
   - 進捗入力シートの実績日が正しく入力されているか
   - Google Driveのファイル数が正しくカウントされているか

2. **パフォーマンス**
   - Google Drive API呼び出しが遅い場合の対策
   - スプレッドシート読み書きのタイムアウト設定

3. **エラーハンドリング**
   - 権限エラー時の挙動
   - ネットワークエラー時の挙動
   - データ不整合時の挙動

### 今後の拡張予定

- 企業情報入力フォームの画像アップロード機能統合
- 工程完了時の通知機能
- データ提出リマインダー機能

---

**最終更新**: 2025-10-09
**次回更新予定**: Phase 8.1完了時

このドキュメントは実装進捗に応じて随時更新してください。
