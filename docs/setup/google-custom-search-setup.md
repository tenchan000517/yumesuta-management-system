# Google Custom Search API セットアップ手順

**目的**: 重要キーワードの検索順位を自動取得

---

## 1. Google Cloud Console でプロジェクト設定

### 1-1. Custom Search API を有効化

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 既存のプロジェクトを選択（Google Sheets APIと同じプロジェクト）
3. 「APIとサービス」→「ライブラリ」
4. 「Custom Search API」を検索
5. 「有効にする」をクリック

### 1-2. APIキーを作成

1. 「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「APIキー」
3. 作成されたAPIキーをコピー
4. `.env.local` に追加:
   ```
   GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
   ```

---

## 2. プログラマブル検索エンジンの作成

### 2-1. 検索エンジン作成

1. [Programmable Search Engine](https://programmablesearchengine.google.com/) にアクセス
2. 「新しい検索エンジン」をクリック
3. 設定:
   - **検索対象**: 「ウェブ全体を検索」を選択
   - **名前**: 「Yumesuta Rank Checker」など
   - **言語**: 日本語
4. 「作成」をクリック

### 2-2. 検索エンジンIDを取得

1. 作成した検索エンジンの「設定」を開く
2. 「検索エンジンID」をコピー
3. `.env.local` に追加:
   ```
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_here
   ```

---

## 3. 環境変数設定（最終確認）

`.env.local` に以下が設定されていることを確認:

```bash
# Google Custom Search API（順位チェック用）
GOOGLE_CUSTOM_SEARCH_API_KEY=AIza...
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=a1b2c3d4e5f6...

# 既存の設定
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
SEARCH_CONSOLE_SITE_URL=sc-domain:yumesuta.com
GA4_PROPERTY_ID=123456789
# ... その他
```

---

## 4. 無料枠と制限

### 無料プラン
- **1日100クエリまで無料**
- 101クエリ目以降: $5/1000クエリ

### 使用量の目安
- 重要キーワード8個 × 1回更新 = 8クエリ
- 1日1回更新: 月間240クエリ
- **無料枠を超えます** → 月間費用: 約$7（140クエリ × $5/1000）

### 推奨運用
- **2日に1回更新**: 月間120クエリ（無料枠内）
- または手動更新のみ

---

## 5. セットアップ完了確認

以下のコマンドでテスト:

```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=ゆめスタ"
```

成功すると、検索結果JSONが返ってきます。

---

## トラブルシューティング

### エラー: "API key not valid"
- APIキーが正しいか確認
- Custom Search APIが有効化されているか確認

### エラー: "Invalid Value"
- 検索エンジンIDが正しいか確認
- 検索エンジンが「ウェブ全体を検索」に設定されているか確認

### 無料枠を超えた場合
- Google Cloud Consoleで請求先アカウントを設定
- または更新頻度を減らす（2日に1回など）
