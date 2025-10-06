# キーワード順位スクレイピング機能 引き継ぎドキュメント

**作成日**: 2025-10-06
**重要度**: ★★★★★
**ステータス**: 🔴 実装途中・Puppeteer動作不可・方針転換が必要
**次世代担当者**: このドキュメントを最初から最後まで読んでから作業開始

---

## 🚨 現在の状況

### 問題

Custom Search APIでは正確な順位が取得できないため、Puppeteerでスクレイピングに切り替えた。
しかし、**WSL環境でPuppeteerが動作しない**（Chromeの依存ライブラリ不足）。

### エラー内容

```
libnspr4.so: cannot open shared object file: No such file or directory
```

Puppeteerがシステムにインストールされたライブラリを要求するが、WSL環境に不足している。

---

## 📋 実装した内容

### 1. Puppeteerによるスクレイピング実装

**ファイル**: `lib/google-search-scraper.ts`（新規作成）

**機能**:
- Puppeteerでヘッドレスブラウザを起動
- Google検索結果を取得
- 最大5ページ（50位まで）自動で「次へ」ボタンをクリック
- yumesuta.comのページを探して順位を返す

**問題**: WSL環境でChromeが起動できない

---

### 2. Custom Search APIの問題

#### 検証結果

**手動Google検索**（ユーザーが実施）:
```
1位: ユメマガジン（夢展望）
2位: ゆめマガ 7月号（yumesuta.com）← これが重要！
3位: ゆめスタ トップページ（yumesuta.com）
```

**Custom Search API結果**（私が実施）:
```
1位: 花とゆめ
2位: 郵趣サービス社
3位: Amazon
...
10位まで yumesuta.com が1つもない
```

**結論**: Custom Search APIは通常のGoogle検索と**完全に異なる結果**を返す。使用不可。

---

### 3. 現在のコード状態

#### 修正済み

- ✅ `lib/google-custom-search.ts` をスクレイピング版に書き換え
- ✅ キャッシュ機能を一時的にコメントアウト（動作確認優先）
- ✅ Puppeteerをインストール (`npm install puppeteer`)

#### コメントアウト箇所

`lib/google-custom-search.ts`:
- 52-65行目: キャッシュ読み込み
- 93-114行目: キャッシュ保存

**理由**: 正しく取得できるか確認するまで、スプレッドシート保存は不要

---

## 🔧 次世代担当者がすべきこと

### Option 1: Puppeteerの依存ライブラリをインストール（推奨しない）

WSLに大量のシステムライブラリをインストールする必要がある。
ユーザーは拒否した。

### Option 2: cheerio + axios で実装し直す（推奨）

**方針**:
1. Puppeteerをアンインストール
2. `cheerio` と `axios` をインストール
3. `lib/google-search-scraper.ts` を書き直し
   - axiosでGoogle検索結果のHTMLを取得
   - cheerioでHTMLをパース
   - リンクを抽出して順位を判定

**メリット**:
- ブラウザ不要（軽量）
- WSLでも確実に動作
- スクレイピングはできる（ただしJavaScript実行なし）

**デメリット**:
- GoogleがUser-Agentをチェックしている可能性
- reCAPTCHAに引っかかる可能性

**対策**:
- User-Agentを設定
- リクエスト間隔を空ける（2-3秒）
- 1日の実行回数を制限

### Option 3: 外部APIサービスを使う（有料）

- **SerpAPI** (https://serpapi.com/) - $50/月〜
- **ScraperAPI** (https://www.scraperapi.com/) - $49/月〜
- **DataForSEO** (https://dataforseo.com/) - 従量課金

**メリット**: 確実に動作、メンテ不要
**デメリット**: 有料

---

## 📝 cheerio実装の参考コード

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function getSearchRankByCheerio(
  keyword: string,
  targetDomain: string
): Promise<SearchRankResult> {
  const results: string[] = [];

  for (let page = 0; page < 5; page++) {
    const start = page * 10;
    const url = `https://www.google.co.jp/search?q=${encodeURIComponent(keyword)}&start=${start}&hl=ja&gl=jp`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // Google検索結果のリンクを抽出（セレクタは要調整）
    $('div.g a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.startsWith('http') && !href.includes('google.com')) {
        results.push(href);
      }
    });

    // 対象ドメインを探す
    for (let i = 0; i < results.length; i++) {
      if (results[i].includes(targetDomain)) {
        return {
          keyword,
          position: i + 1,
          url: results[i],
          found: true,
        };
      }
    }

    // 次のページまで2秒待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return {
    keyword,
    position: 999,
    url: null,
    found: false,
  };
}
```

**注意**: Googleの検索結果HTMLの構造は頻繁に変わるため、セレクタは要調整。

---

## ⚠️ 重要な注意事項

### Googleのスクレイピングについて

1. **利用規約違反の可能性**
   - Googleの利用規約ではスクレイピングを禁止している
   - Custom Search APIが正式な方法

2. **reCAPTCHA対策**
   - 短時間に大量リクエストするとブロックされる
   - User-Agent、Referer、Cookieなどの設定が必要な場合がある

3. **HTMLセレクタの変更**
   - Googleは頻繁にHTMLを変更する
   - 定期的なメンテナンスが必要

### 推奨アプローチ

1. **まず cheerio で実装してみる**
2. **動作確認**（ゆめマガが何位か取得できるか）
3. **reCAPTCHAに引っかかったら外部APIサービスを検討**

---

## 📊 データ構造

### キーワードリスト

`app/api/analytics/route.ts` の `IMPORTANT_KEYWORDS`:

```typescript
{ keyword: 'ゆめスタ', targetPosition: 1, priority: 'high' },
{ keyword: 'ゆめマガ', targetPosition: 5, priority: 'high' },
{ keyword: '高校生 就職 愛知', targetPosition: 10, priority: 'high' },
{ keyword: '就活情報誌', targetPosition: 15, priority: 'medium' },
{ keyword: '高卒採用 三重', targetPosition: 20, priority: 'medium' },
{ keyword: '高校生 就職情報誌', targetPosition: 15, priority: 'medium' },
{ keyword: '愛知 高校生 求人', targetPosition: 20, priority: 'medium' },
{ keyword: '東海 高校生 就職', targetPosition: 30, priority: 'low' },
```

### スプレッドシート

- ID: `TASKS_SPREADSHEET_ID`
- シート名: `キーワード順位`
- 列: A=キーワード、B=順位、C=URL、D=最終更新日時、E=前回順位、F=変動、G=目標順位、H=優先度

---

## 🤝 次世代担当者への最後のメッセージ

**Puppeteerは諦めてください。** WSL環境で動かすのは現実的ではありません。

**cheerioで実装し直してください。** これが一番現実的な解決策です。

動作確認ができたら、キャッシュ機能のコメントアウトを外してください。

頑張ってください！

---

**作成者**: Claude Code (2025-10-06)
**トークン残量**: 5%
**次世代担当者**: [あなたの名前]
**作業開始日**: [記入してください]
