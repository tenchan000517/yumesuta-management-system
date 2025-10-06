/**
 * Google検索結果スクレイパー
 * Puppeteerを使って実際のGoogle検索結果から順位を取得
 */

import puppeteer from 'puppeteer';

export interface SearchRankResult {
  keyword: string;
  position: number; // 1-100位、圏外は999
  url: string | null; // ヒットしたURL（圏外の場合null）
  found: boolean; // 見つかったか
}

/**
 * Google検索で指定キーワードの順位を取得（複数ページ対応）
 */
export async function getSearchRankByScraping(
  keyword: string,
  targetDomain: string
): Promise<SearchRankResult> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const allResults: string[] = [];
    const maxPages = 5; // 最大5ページ（50位まで）確認

    // 日本のGoogleで検索
    await page.goto(`https://www.google.co.jp/search?q=${encodeURIComponent(keyword)}&hl=ja&gl=jp&num=10`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`📄 "${keyword}" の${pageNum}ページ目を取得中...`);

      // 検索結果のリンクを取得
      const pageResults = await page.evaluate(() => {
        const results: string[] = [];
        // Google検索結果の実際のリンク要素を取得
        const resultDivs = document.querySelectorAll('div.g');

        resultDivs.forEach((div) => {
          const link = div.querySelector('a[href]') as HTMLAnchorElement;
          if (link && link.href && link.href.startsWith('http') && !link.href.includes('google.com')) {
            results.push(link.href);
          }
        });

        return results;
      });

      console.log(`  → ${pageResults.length}件取得`);
      allResults.push(...pageResults);

      // 対象ドメインを探す（現在のページまで）
      for (let i = 0; i < allResults.length; i++) {
        if (allResults[i].includes(targetDomain)) {
          console.log(`✅ "${keyword}" で ${i + 1}位に発見: ${allResults[i]}`);
          await browser.close();
          return {
            keyword,
            position: i + 1,
            url: allResults[i],
            found: true,
          };
        }
      }

      // 次のページがあるかチェック
      if (pageNum < maxPages) {
        const nextButton = await page.$('a#pnnext');
        if (nextButton) {
          await nextButton.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        } else {
          console.log(`  → 次のページがありません（${pageNum}ページで終了）`);
          break;
        }
      }
    }

    console.log(`🔍 "${keyword}" の検索結果（合計${allResults.length}件取得）:`);
    allResults.slice(0, 50).forEach((url, index) => {
      console.log(`  ${index + 1}位: ${url}`);
    });

    console.log(`❌ "${keyword}" は50位以内に見つかりませんでした`);
    await browser.close();
    return {
      keyword,
      position: 999,
      url: null,
      found: false,
    };
  } catch (error) {
    await browser.close();
    console.error(`Failed to scrape search rank for keyword: ${keyword}`, error);
    throw error;
  }
}
