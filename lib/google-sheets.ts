import { google } from 'googleapis';

/**
 * Google Sheets API クライアント
 * サービスアカウント認証を使用してGoogle Sheetsからデータを取得
 */

// ========================================
// リクエスト数カウンター（デバッグ用）
// ========================================
interface RequestLog {
  timestamp: string;
  type: 'getSheetData' | 'getBatchSheetData' | 'getSpreadsheetMetadata';
  spreadsheetId: string;
  range?: string;
  ranges?: string[];
}

let requestCount = 0;
let requestLogs: RequestLog[] = [];

export function getRequestCount(): number {
  return requestCount;
}

export function getRequestLogs(): RequestLog[] {
  return requestLogs;
}

export function resetRequestCount(): void {
  requestCount = 0;
  requestLogs = [];
  console.log('🔄 Request counter reset');
}

function logRequest(log: RequestLog): void {
  requestCount++;
  requestLogs.push(log);
  console.log(`[Google Sheets API] Request #${requestCount}: ${log.type} - ${log.range || log.ranges?.join(', ') || 'metadata'}`);
}

// ========================================
// キャッシュ機能（APIクォータ対策）
// ========================================
interface CacheEntry {
  data: any[][];
  timestamp: number;
}

interface BatchCacheEntry {
  data: any[][][];
  timestamp: number;
}

// キャッシュストレージ
const dataCache = new Map<string, CacheEntry>();
const batchCache = new Map<string, BatchCacheEntry>();

// キャッシュ有効期限: 5分
const CACHE_TTL = 5 * 60 * 1000;

/**
 * キャッシュをクリア（全削除）
 */
export function clearCache(): void {
  dataCache.clear();
  batchCache.clear();
  console.log('🧹 Cache cleared');
}

/**
 * 特定のスプレッドシートに関連するキャッシュをクリア
 * @param spreadsheetId - クリアするスプレッドシートのID
 * @param range - (オプション) 特定の範囲のみクリア。省略時は全範囲をクリア
 */
export function clearCacheForSpreadsheet(spreadsheetId: string, range?: string): void {
  const keysToDelete: string[] = [];

  // 削除対象のキーを収集
  for (const key of dataCache.keys()) {
    if (range) {
      // 特定範囲のみクリア
      if (key === `${spreadsheetId}:${range}`) {
        keysToDelete.push(key);
      }
    } else {
      // スプレッドシート全体のキャッシュをクリア
      if (key.startsWith(`${spreadsheetId}:`)) {
        keysToDelete.push(key);
      }
    }
  }

  // キャッシュから削除
  keysToDelete.forEach(key => dataCache.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`🧹 Cleared ${keysToDelete.length} cache entries for spreadsheet ${spreadsheetId}${range ? ` (range: ${range})` : ''}`);
  }
}

/**
 * キャッシュ統計を取得
 */
export function getCacheStats(): { entries: number; batchEntries: number } {
  return {
    entries: dataCache.size,
    batchEntries: batchCache.size,
  };
}

// ========================================
// サービスアカウント認証情報の型定義
// ========================================
interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Google Sheets APIクライアントを初期化
 * @returns {sheets_v4.Sheets} Google Sheets APIクライアント
 */
export function getGoogleSheetsClient() {
  try {
    // 環境変数からサービスアカウント認証情報を取得
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!credentialsJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const credentials: ServiceAccountCredentials = JSON.parse(credentialsJson);

    // Google認証クライアントを作成
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Google Sheets APIクライアントを作成
    const sheets = google.sheets({ version: 'v4', auth });

    return sheets;
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error);
    throw error;
  }
}

/**
 * スプレッドシートからデータを取得（キャッシュ対応）
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string} range - 取得範囲（例: 'Sheet1!A1:Z100'）
 * @returns {Promise<any[][]>} スプレッドシートのデータ（2次元配列）
 */
export async function getSheetData(
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  try {
    // キャッシュキーを生成
    const cacheKey = `${spreadsheetId}:${range}`;

    // キャッシュをチェック
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 [Cache HIT] ${range}`);
      return cached.data;
    }

    // キャッシュミス: API呼び出し
    console.log(`🌐 [Cache MISS] ${range} - Fetching from API...`);

    // リクエストをログに記録
    logRequest({
      timestamp: new Date().toISOString(),
      type: 'getSheetData',
      spreadsheetId,
      range,
    });

    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const data = response.data.values || [];

    // キャッシュに保存
    dataCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    throw error;
  }
}

/**
 * 複数の範囲からデータを一括取得（キャッシュ対応）
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string[]} ranges - 取得範囲の配列
 * @returns {Promise<any[][][]>} 各範囲のデータ配列
 */
export async function getBatchSheetData(
  spreadsheetId: string,
  ranges: string[]
): Promise<any[][][]> {
  try {
    // 各範囲を個別にキャッシュチェック
    const results: any[][][] = new Array(ranges.length);
    const uncachedRanges: string[] = [];
    const uncachedIndices: number[] = [];

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const cacheKey = `${spreadsheetId}:${range}`;
      const cached = dataCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 [Cache HIT] ${range}`);
        results[i] = cached.data;
      } else {
        uncachedRanges.push(range);
        uncachedIndices.push(i);
      }
    }

    // キャッシュミスした範囲がある場合のみAPI呼び出し
    if (uncachedRanges.length > 0) {
      console.log(`🌐 [Cache MISS] ${uncachedRanges.length} range(s) - Fetching from API...`);

      // リクエストをログに記録
      logRequest({
        timestamp: new Date().toISOString(),
        type: 'getBatchSheetData',
        spreadsheetId,
        ranges: uncachedRanges,
      });

      const sheets = getGoogleSheetsClient();

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: uncachedRanges,
      });

      const fetchedData = response.data.valueRanges?.map((vr) => vr.values || []) || [];

      // 取得したデータをキャッシュに保存 & 結果配列に格納
      for (let i = 0; i < uncachedRanges.length; i++) {
        const range = uncachedRanges[i];
        const data = fetchedData[i];
        const originalIndex = uncachedIndices[i];

        // キャッシュに保存
        const cacheKey = `${spreadsheetId}:${range}`;
        dataCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });

        results[originalIndex] = data;
      }
    } else {
      console.log(`📦 [Cache HIT] All ${ranges.length} range(s) from cache`);
    }

    return results;
  } catch (error) {
    console.error('Failed to fetch batch sheet data:', error);
    throw error;
  }
}

/**
 * スプレッドシートのメタデータを取得
 * @param {string} spreadsheetId - スプレッドシートID
 * @returns {Promise<any>} スプレッドシートのメタデータ
 */
export async function getSpreadsheetMetadata(spreadsheetId: string) {
  try {
    // リクエストをログに記録
    logRequest({
      timestamp: new Date().toISOString(),
      type: 'getSpreadsheetMetadata',
      spreadsheetId,
    });

    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch spreadsheet metadata:', error);
    throw error;
  }
}

/**
 * Update sheet data (overwrite)
 * @param spreadsheetId - The spreadsheet ID
 * @param range - The range to update (e.g., 'Sheet1!A1:D10')
 * @param values - 2D array of values to write
 */
export async function updateSheetData(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    console.log(`✅ Updated ${values.length} rows in ${range}`);
  } catch (error) {
    console.error('Failed to update sheet data:', error);
    throw error;
  }
}

/**
 * Update a single cell
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetName - The sheet name
 * @param row - Row number (1-indexed)
 * @param col - Column number (1-indexed)
 * @param value - The value to write
 */
export async function updateCell(
  spreadsheetId: string,
  sheetName: string,
  row: number,
  col: number,
  value: any
): Promise<void> {
  const colLetter = String.fromCharCode(64 + col); // 1=A, 2=B, etc.
  const range = `${sheetName}!${colLetter}${row}`;
  await updateSheetData(spreadsheetId, range, [[value]]);
}

/**
 * Update a single cell with support for multi-character columns (AA, AX, etc.)
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetName - The sheet name
 * @param row - Row number (1-indexed)
 * @param col - Column number (1-indexed, e.g., 50 for AX)
 * @param value - The value to write
 */
export async function updateCellExtended(
  spreadsheetId: string,
  sheetName: string,
  row: number,
  col: number,
  value: any
): Promise<void> {
  const colLetter = getColumnLetter(col);
  const range = `${sheetName}!${colLetter}${row}`;
  await updateSheetData(spreadsheetId, range, [[value]]);
}

/**
 * Convert column number to letter (1=A, 26=Z, 27=AA, 50=AX, etc.)
 */
function getColumnLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Append rows to the end of a sheet
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetName - The sheet name
 * @param values - 2D array of values to append
 */
export async function appendSheetData(
  spreadsheetId: string,
  sheetName: string,
  values: any[][]
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    console.log(`✅ Appended ${values.length} rows to ${sheetName}`);
  } catch (error) {
    console.error('Failed to append sheet data:', error);
    throw error;
  }
}

/**
 * Insert columns into a sheet
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (not name)
 * @param startIndex - Column index to insert at (0-indexed)
 * @param columnCount - Number of columns to insert
 */
export async function insertColumns(
  spreadsheetId: string,
  sheetId: number,
  startIndex: number,
  columnCount: number = 1
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex,
                endIndex: startIndex + columnCount,
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Inserted ${columnCount} column(s) at index ${startIndex}`);
  } catch (error) {
    console.error('Failed to insert columns:', error);
    throw error;
  }
}

/**
 * Delete columns from a sheet
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (not name)
 * @param startIndex - Column index to delete from (0-indexed)
 * @param columnCount - Number of columns to delete
 */
export async function deleteColumns(
  spreadsheetId: string,
  sheetId: number,
  startIndex: number,
  columnCount: number = 1
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex,
                endIndex: startIndex + columnCount,
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Deleted ${columnCount} column(s) from index ${startIndex}`);
  } catch (error) {
    console.error('Failed to delete columns:', error);
    throw error;
  }
}

/**
 * Delete rows from a sheet
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (not name)
 * @param startIndex - Row index to delete from (0-indexed)
 * @param rowCount - Number of rows to delete
 */
export async function deleteRows(
  spreadsheetId: string,
  sheetId: number,
  startIndex: number,
  rowCount: number = 1
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex,
                endIndex: startIndex + rowCount,
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Deleted ${rowCount} row(s) from index ${startIndex}`);
  } catch (error) {
    console.error('Failed to delete rows:', error);
    throw error;
  }
}

/**
 * Update a single sheet cell by cell address (e.g., "G5")
 * Phase 8.2 helper function for updating process completion dates
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetName - The sheet name
 * @param cellAddress - Cell address (e.g., "G5", "AX10")
 * @param value - The value to write
 */
export async function updateSheetCell(
  spreadsheetId: string,
  sheetName: string,
  cellAddress: string,
  value: string
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${cellAddress}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });

    console.log(`✅ Updated cell ${sheetName}!${cellAddress} with value: ${value}`);
  } catch (error) {
    console.error(`Failed to update cell ${sheetName}!${cellAddress}:`, error);
    throw error;
  }
}

/**
 * Append a single row to a sheet (Phase 8.4 helper)
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetName - The sheet name
 * @param rowData - Array of values for the row
 */
export async function appendSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowData: any[]
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:AY`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log(`✅ Appended 1 row to ${sheetName}`);
  } catch (error) {
    console.error(`Failed to append row to ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Update a specific row in a sheet (Phase 8.4 helper)
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetName - The sheet name
 * @param rowNumber - Row number (1-indexed)
 * @param rowData - Array of values for the row
 */
export async function updateSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  rowData: any[]
): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowNumber}:AY${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log(`✅ Updated row ${rowNumber} in ${sheetName}`);
  } catch (error) {
    console.error(`Failed to update row ${rowNumber} in ${sheetName}:`, error);
    throw error;
  }
}
