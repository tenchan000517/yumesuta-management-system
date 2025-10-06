import { google } from 'googleapis';

/**
 * Google Sheets API クライアント
 * サービスアカウント認証を使用してGoogle Sheetsからデータを取得
 */

// サービスアカウント認証情報の型定義
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
 * スプレッドシートからデータを取得
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string} range - 取得範囲（例: 'Sheet1!A1:Z100'）
 * @returns {Promise<any[][]>} スプレッドシートのデータ（2次元配列）
 */
export async function getSheetData(
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    throw error;
  }
}

/**
 * 複数の範囲からデータを一括取得
 * @param {string} spreadsheetId - スプレッドシートID
 * @param {string[]} ranges - 取得範囲の配列
 * @returns {Promise<any[][][]>} 各範囲のデータ配列
 */
export async function getBatchSheetData(
  spreadsheetId: string,
  ranges: string[]
): Promise<any[][][]> {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    return response.data.valueRanges?.map((vr) => vr.values || []) || [];
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
