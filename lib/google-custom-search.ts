/**
 * Google検索順位取得（スクレイピング版）
 * Custom Search APIが使えないため、Puppeteerで直接Google検索結果を取得
 *
 * ⚠️ 課金防止のため、Google Sheetsをキャッシュとして使用
 */

import { loadRankCacheFromSheets, saveRankCacheToSheets } from './cache/sheets-rank-cache';
import { getSearchRankByScraping } from './google-search-scraper';

export interface SearchRankResult {
  keyword: string;
  position: number; // 1-100位、圏外は999
  url: string | null; // ヒットしたURL（圏外の場合null）
  found: boolean; // 100位以内に見つかったか
}

/**
 * 指定キーワードでの検索順位を取得（スクレイピング版）
 *
 * @param keyword - 検索キーワード
 * @param targetDomain - 順位を調べたいドメイン（例: "yumesuta.com"）
 * @returns 検索順位結果
 */
export async function getSearchRank(
  keyword: string,
  targetDomain: string
): Promise<SearchRankResult> {
  return await getSearchRankByScraping(keyword, targetDomain);
}

/**
 * 複数キーワードの検索順位を一括取得
 *
 * ⚠️ 課金防止：
 * - Google Sheetsをキャッシュとして使用
 * - Sheetsに順位データがある場合は絶対にAPIを叩かない
 * - 1回の更新で8クエリのみ
 *
 * @param keywords - 検索キーワードの配列
 * @param targetDomain - 順位を調べたいドメイン
 * @param spreadsheetId - キャッシュ用スプレッドシートID
 * @param forceRefresh - キャッシュを無視して強制更新（デフォルト: false）
 * @returns 検索順位結果の配列
 */
export async function getBatchSearchRanks(
  keywords: string[],
  targetDomain: string,
  spreadsheetId: string,
  forceRefresh: boolean = false
): Promise<SearchRankResult[]> {
  // TODO: キャッシュ機能は動作確認後に有効化
  // // Sheetsからキャッシュをチェック
  // if (!forceRefresh) {
  //   const cache = await loadRankCacheFromSheets(spreadsheetId);
  //   if (cache && cache.length > 0) {
  //     console.log('✅ Using cached rank data from Google Sheets');
  //     return cache.map(c => ({
  //       keyword: c.keyword,
  //       position: c.position,
  //       url: c.url,
  //       found: c.position < 999,
  //     }));
  //   }
  // }

  console.log('🔄 Fetching search rank data via web scraping (Puppeteer)');
  console.log(`📊 Checking ${keywords.length} keywords...`);

  const results: SearchRankResult[] = [];

  // 順次実行（並列実行するとAPI制限に引っかかる可能性あり）
  for (const keyword of keywords) {
    try {
      console.log(`Fetching rank for: ${keyword}`);
      const result = await getSearchRank(keyword, targetDomain);
      results.push(result);

      // レート制限対策: 各リクエスト間に500ms待機（より安全に）
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to get rank for keyword: ${keyword}`, error);
      // エラーでも続行（圏外扱い）
      results.push({
        keyword,
        position: 999,
        url: null,
        found: false,
      });
    }
  }

  // TODO: キャッシュ保存機能は動作確認後に有効化
  // // Sheetsに保存
  // const existingCache = await loadRankCacheFromSheets(spreadsheetId);
  // const updatedCache = existingCache.map(cache => {
  //   const newData = results.find(r => r.keyword === cache.keyword);
  //   if (newData) {
  //     const oldPosition = cache.position;
  //     const change = oldPosition > 0 && oldPosition < 999 ? oldPosition - newData.position : 0;
  //
  //     return {
  //       ...cache,
  //       position: newData.position,
  //       url: newData.url,
  //       lastUpdated: new Date().toISOString(),
  //       previousPosition: oldPosition > 0 && oldPosition < 999 ? oldPosition : undefined,
  //       change: change !== 0 ? change : undefined,
  //     };
  //   }
  //   return cache;
  // });
  //
  // await saveRankCacheToSheets(spreadsheetId, updatedCache);

  console.log(`✅ Search rank data fetched (${results.length} keywords)`);

  return results;
}
