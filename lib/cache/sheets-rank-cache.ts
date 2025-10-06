/**
 * Google Sheets を使った検索順位キャッシュ
 *
 * スプレッドシート: TASKS_SPREADSHEET_ID
 * シート名: キーワード順位
 *
 * 列構成:
 * A: キーワード
 * B: 順位
 * C: URL
 * D: 最終更新日時
 * E: 前回順位
 * F: 変動
 * G: 目標順位
 * H: 優先度
 */

import { getSheetData, updateSheetData } from '@/lib/google-sheets';

export interface SheetRankCache {
  keyword: string;
  position: number;
  url: string | null;
  lastUpdated: string;
  previousPosition?: number;
  change?: number;
  targetPosition: number;
  priority: 'high' | 'medium' | 'low';
}

const SHEET_NAME = 'キーワード順位';
const DATA_RANGE = `${SHEET_NAME}!A2:H`; // ヘッダー除く

/**
 * Sheetsからキャッシュを読み込む
 */
export async function loadRankCacheFromSheets(spreadsheetId: string): Promise<SheetRankCache[]> {
  try {
    const data = await getSheetData(spreadsheetId, DATA_RANGE);

    if (!data || data.length === 0) {
      console.log('⚠️ No rank cache data in Sheets');
      return [];
    }

    const result = data
      .filter(row => row[0]) // キーワードがある行のみ
      .map(row => ({
        keyword: row[0] || '',
        position: row[1] ? parseInt(row[1]) : 999,
        url: row[2] || null,
        lastUpdated: row[3] || '',
        previousPosition: row[4] ? parseInt(row[4]) : undefined,
        change: row[5] ? parseInt(row[5]) : undefined,
        targetPosition: row[6] ? parseInt(row[6]) : 999,
        priority: (row[7] || 'medium') as 'high' | 'medium' | 'low',
      }));

    console.log(`📊 Loaded ${result.length} cached keywords from Sheets`);
    if (result.length > 0) {
      console.log(`   Sample: ${result[0].keyword} = ${result[0].position}, lastUpdated: ${result[0].lastUpdated}`);
    }

    return result;
  } catch (error) {
    console.error('Failed to load rank cache from Sheets:', error);
    return [];
  }
}

/**
 * Sheetsにキャッシュを保存（上書き）
 */
export async function saveRankCacheToSheets(
  spreadsheetId: string,
  caches: SheetRankCache[]
): Promise<void> {
  try {
    const values = caches.map(cache => [
      cache.keyword,
      cache.position.toString(),
      cache.url || '',
      cache.lastUpdated,
      cache.previousPosition?.toString() || '',
      cache.change?.toString() || '',
      cache.targetPosition.toString(),
      cache.priority,
    ]);

    await updateSheetData(spreadsheetId, DATA_RANGE, values);

    console.log(`✅ Saved ${caches.length} rank caches to Google Sheets`);
  } catch (error) {
    console.error('Failed to save rank cache to Sheets:', error);
    throw error;
  }
}

/**
 * 特定キーワードのキャッシュを更新
 */
export async function updateKeywordRankInSheets(
  spreadsheetId: string,
  keyword: string,
  position: number,
  url: string | null
): Promise<void> {
  try {
    const caches = await loadRankCacheFromSheets(spreadsheetId);
    const index = caches.findIndex(c => c.keyword === keyword);

    if (index >= 0) {
      const oldPosition = caches[index].position;
      const change = oldPosition !== 999 ? oldPosition - position : 0;

      caches[index] = {
        ...caches[index],
        position,
        url,
        lastUpdated: new Date().toISOString(),
        previousPosition: oldPosition,
        change,
      };
    } else {
      // 新規追加（通常は起こらない）
      caches.push({
        keyword,
        position,
        url,
        lastUpdated: new Date().toISOString(),
        targetPosition: 999,
        priority: 'medium',
      });
    }

    await saveRankCacheToSheets(spreadsheetId, caches);
  } catch (error) {
    console.error(`Failed to update rank cache for keyword: ${keyword}`, error);
    throw error;
  }
}
