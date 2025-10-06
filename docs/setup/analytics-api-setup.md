# HP・LLMO分析管理 外部API設定ガイド

**作成日**: 2025-10-05
**対象機能**: Phase 1-5 HP・LLMO分析管理機能

---

## 概要

HP・LLMO分析管理機能では、以下の3つの外部APIからデータを取得します:

1. **Google Analytics 4** - アクセス解析（ユーザー数、PV、滞在時間等）
2. **Google Search Console** - 検索パフォーマンス（クリック、表示回数、CTR等）
3. **Microsoft Clarity** - ユーザー行動分析（スクロール深度、Rage Clicks等）

---

## 1. Google Analytics 4 プロパティID取得

### ステップ1: プロパティIDを確認

1. [Google Analytics](https://analytics.google.com/)にアクセス
2. 左下の「管理」（歯車アイコン）をクリック
3. 「プロパティ」列で対象のプロパティを選択
4. 「プロパティ設定」をクリック
5. 画面上部に「プロパティID」が表示されます
   - 形式: 数字のみ（例: `123456789`）
   - **注意**: トラッキングID（`G-XXXXXXXX`）ではなく、プロパティID（数字のみ）が必要です

### ステップ2: サービスアカウントに閲覧権限を付与

1. Google Analytics管理画面で「プロパティアクセス管理」をクリック
2. 右上の「+」ボタンから「ユーザーを追加」をクリック
3. メールアドレス欄に以下を入力:
   ```
   yumesuta-sheets-reader@fair-yew-446514-q5.iam.gserviceaccount.com
   ```
4. 役割: 「閲覧者」を選択
5. データ制限: なし（デフォルト）
6. 「追加」ボタンをクリック

### ステップ3: .env.localに追加

`.env.local`ファイルに以下を追加:

```bash
# Google Analytics 4プロパティID
GA_PROPERTY_ID=123456789
```

**注意**: `123456789`の部分を実際のプロパティIDに置き換えてください。

---

## 2. Google Search Console API設定

### ステップ1: サービスアカウントに権限を付与

1. [Google Search Console](https://search.google.com/search-console)にアクセス
2. 対象のプロパティ（`https://yumesuta.com`）を選択
3. 左メニューから「設定」をクリック
4. 「ユーザーと権限」をクリック
5. 「ユーザーを追加」ボタンをクリック
6. メールアドレス欄に以下を入力:
   ```
   yumesuta-sheets-reader@fair-yew-446514-q5.iam.gserviceaccount.com
   ```
7. 権限: 「制限付き」を選択
8. 「追加」ボタンをクリック

### ステップ2: .env.localの確認

`.env.local`に既に設定されています:

```bash
SEARCH_CONSOLE_SITE_URL=https://yumesuta.com
```

設定不要です。

---

## 3. Microsoft Clarity APIトークン取得

### ステップ1: APIトークンを生成

1. [Microsoft Clarity](https://clarity.microsoft.com/)にアクセス
2. プロジェクト一覧から対象プロジェクト（`tf4nnc5zn9`）をクリック
3. 左メニューから「Settings」（設定）をクリック
4. 下にスクロールして「Data Export」セクションを探す
5. 「Generate new API token」ボタンをクリック
6. トークン名を入力（例: `yumesuta-management-system`）
   - 4〜32文字
   - 使用可能文字: 英数字、`-`、`_`、`.`
7. 「Generate」をクリック
8. 表示されたトークンをコピー
   - **重要**: トークンは一度しか表示されません。必ずコピーして保存してください

### ステップ2: .env.localに追加

`.env.local`ファイルに以下を追加:

```bash
# Microsoft Clarity APIトークン
CLARITY_API_TOKEN=生成されたトークンをここに貼り付け
```

### Clarity API制限事項

- **リクエスト制限**: 1日10リクエストまで
- **データ期間**: 過去1〜3日間のみ
- **注意**: リクエスト数制限があるため、頻繁な更新は避けてください

---

## 設定完了後の確認

### 1. 環境変数の確認

`.env.local`に以下の3つが設定されているか確認:

```bash
# Google Analytics 4
GA_PROPERTY_ID=123456789  # 実際のプロパティID

# Google Search Console
SEARCH_CONSOLE_SITE_URL=https://yumesuta.com  # 既に設定済み

# Microsoft Clarity
CLARITY_API_TOKEN=your_actual_token_here  # 生成したトークン
```

### 2. 開発サーバーを再起動

環境変数を変更した場合は、開発サーバーを再起動してください:

```bash
# 既存のサーバーを停止（Ctrl + C）
npm run dev
```

### 3. ダッシュボードで動作確認

1. ブラウザで http://localhost:3000 を開く
2. 「HP・LLMO分析管理」カードをクリック
3. 「更新」ボタンをクリック
4. データが表示されることを確認

---

## トラブルシューティング

### エラー: "Google Analytics API error"

**原因**:
- プロパティIDが間違っている
- サービスアカウントに権限が付与されていない

**対処法**:
1. プロパティIDを再確認（数字のみ、G-XXXXXXではない）
2. Google Analyticsでサービスアカウントが「閲覧者」権限で追加されているか確認
3. 権限付与後、数分待ってから再試行

### エラー: "Search Console API error"

**原因**:
- サービスアカウントに権限が付与されていない
- サイトURLが間違っている

**対処法**:
1. Search Consoleでサービスアカウントが「制限付き」権限で追加されているか確認
2. SEARCH_CONSOLE_SITE_URLが正しいか確認（`https://yumesuta.com`）
3. Search Consoleで該当サイトが検証済みか確認

### エラー: "Clarity API error: 401 Unauthorized"

**原因**:
- APIトークンが間違っている
- トークンが無効化されている

**対処法**:
1. Clarityで新しいトークンを生成
2. `.env.local`のCLARITY_API_TOKENを更新
3. 開発サーバーを再起動

### エラー: "Clarity API error: 429 Too Many Requests"

**原因**:
- 1日のリクエスト制限（10回）に達した

**対処法**:
- 翌日まで待つ
- リクエスト頻度を減らす

### データが一部しか表示されない

**正常な動作です**:
- 各APIは独立して動作します
- 一部のAPIでエラーが発生しても、他のAPIのデータは表示されます
- すべての環境変数を設定しなくても、設定済みのAPIのデータのみ表示されます

---

## サービスアカウント情報

システムで使用しているサービスアカウント:

- **メールアドレス**: `yumesuta-sheets-reader@fair-yew-446514-q5.iam.gserviceaccount.com`
- **プロジェクトID**: `fair-yew-446514-q5`
- **用途**: Google Sheets、Google Analytics、Search Consoleへの読み取り専用アクセス

---

## セキュリティ上の注意

1. **APIトークンの管理**
   - `.env.local`はGitにコミットしない（`.gitignore`に追加済み）
   - トークンを共有する場合は安全な方法で（Slack DM等、公開チャネル不可）

2. **サービスアカウントの権限**
   - 最小権限の原則: 閲覧権限のみ付与
   - 書き込み権限は不要（MVP範囲は読み取り専用）

3. **APIトークンのローテーション**
   - 定期的にトークンを再生成することを推奨
   - Clarityで古いトークンを削除し、新しいトークンを生成

---

## 参考リンク

- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Google Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [Microsoft Clarity Data Export API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api)

---

**作成者**: Claude Code
**最終更新**: 2025-10-05
