/**
 * 検索順位キャッシュ
 * Google Custom Search APIの課金を防ぐため、24時間キャッシュする
 */

import fs from 'fs';
import path from 'path';

interface CacheEntry {
  keyword: string;
  position: number;
  url: string | null;
  found: boolean;
  timestamp: number; // Unix timestamp
}

interface CacheData {
  lastUpdated: number;
  results: CacheEntry[];
}

const CACHE_FILE = path.join(process.cwd(), '.next', 'search-rank-cache.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）

/**
 * キャッシュディレクトリを作成
 */
function ensureCacheDir() {
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

/**
 * キャッシュを読み込む
 */
export function loadCache(): CacheData | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cache: CacheData = JSON.parse(content);

    // キャッシュの有効期限チェック
    const now = Date.now();
    if (now - cache.lastUpdated > CACHE_DURATION) {
      console.log('Search rank cache expired');
      return null;
    }

    console.log(`Search rank cache loaded (age: ${Math.floor((now - cache.lastUpdated) / 1000 / 60)} minutes)`);
    return cache;
  } catch (error) {
    console.error('Failed to load search rank cache:', error);
    return null;
  }
}

/**
 * キャッシュを保存
 */
export function saveCache(results: CacheEntry[]): void {
  try {
    ensureCacheDir();

    const cache: CacheData = {
      lastUpdated: Date.now(),
      results,
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    console.log('Search rank cache saved successfully');
  } catch (error) {
    console.error('Failed to save search rank cache:', error);
  }
}

/**
 * キャッシュをクリア
 */
export function clearCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('Search rank cache cleared');
    }
  } catch (error) {
    console.error('Failed to clear search rank cache:', error);
  }
}

/**
 * キャッシュの状態を取得
 */
export function getCacheStatus(): {
  exists: boolean;
  age?: number; // 分単位
  expiresIn?: number; // 分単位
} {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return { exists: false };
    }

    const content = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cache: CacheData = JSON.parse(content);
    const now = Date.now();
    const age = Math.floor((now - cache.lastUpdated) / 1000 / 60);
    const expiresIn = Math.floor((CACHE_DURATION - (now - cache.lastUpdated)) / 1000 / 60);

    return {
      exists: true,
      age,
      expiresIn: Math.max(0, expiresIn),
    };
  } catch (error) {
    return { exists: false };
  }
}
