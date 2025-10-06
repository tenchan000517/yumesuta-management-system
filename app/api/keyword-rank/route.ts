import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

export interface KeywordRankData {
  keyword: string;
  googleRank: number | null;
  yahooRank: number | null;
  bingRank: number | null;
  googleHits: number | null;
  yahooHits: number | null;
  bingHits: number | null;
  updatedAt: string;
}

/**
 * キーワード順位データ取得API
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.TASKS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'TASKS_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    // スプレッドシートからキーワード順位データを取得
    const data = await getSheetData(spreadsheetId, 'キーワード順位!A1:H100');

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // ヘッダー行を除いてパース
    const headers = data[0];
    const rows = data.slice(1);

    const rankings: KeywordRankData[] = rows
      .filter((row) => row[0]) // キーワードが存在する行のみ
      .map((row) => ({
        keyword: row[0] || '',
        googleRank: parseRank(row[1]),
        yahooRank: parseRank(row[2]),
        bingRank: parseRank(row[3]),
        googleHits: parseHits(row[4]),
        yahooHits: parseHits(row[5]),
        bingHits: parseHits(row[6]),
        updatedAt: row[7] || '',
      }));

    return NextResponse.json({
      success: true,
      data: rankings,
    });
  } catch (error: any) {
    console.error('Failed to fetch keyword rankings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * キーワード順位データ保存API
 * コピペしたデータをパースして保存
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pastedData } = body;

    if (!pastedData) {
      return NextResponse.json(
        { success: false, error: 'pastedData is required' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.TASKS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'TASKS_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    // ペーストデータをパース
    const parsedData = parseRankCheckerData(pastedData);

    if (parsedData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid data found' },
        { status: 400 }
      );
    }

    // 既存データを取得
    const existingData = await getSheetData(spreadsheetId, 'キーワード順位!A1:H100');

    // ヘッダー行
    const headers = existingData[0] || [
      'キーワード',
      'Google順位',
      'Yahoo順位',
      'Bing順位',
      'Googleヒット数',
      'Yahooヒット数',
      'Bingヒット数',
      '最終更新日時',
    ];

    // 既存データ（ヘッダー除く）
    const existingRows = existingData.slice(1);

    // キーワードをキーとしたマップを作成（上書き更新用）
    const rowMap = new Map<string, any[]>();

    existingRows.forEach((row) => {
      if (row[0]) {
        rowMap.set(row[0], row);
      }
    });

    // 新しいデータで上書き・追加
    const now = new Date().toISOString();

    parsedData.forEach((item) => {
      rowMap.set(item.keyword, [
        item.keyword,
        item.googleRank ?? '圏外',
        item.yahooRank ?? '圏外',
        item.bingRank ?? '圏外',
        item.googleHits ?? '',
        item.yahooHits ?? '',
        item.bingHits ?? '',
        now,
      ]);
    });

    // マップを配列に変換
    const updatedRows = Array.from(rowMap.values());

    // スプレッドシートに書き込み
    const allData = [headers, ...updatedRows];
    await updateSheetData(spreadsheetId, 'キーワード順位!A1:H100', allData);

    return NextResponse.json({
      success: true,
      message: `${parsedData.length}件のキーワードを保存しました`,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Failed to save keyword rankings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * 検索順位チェッカーの結果をパース
 *
 * 入力例:
 * ゆめスタ    1    4240000    1    4610000    圏外    圏外    -    -    -
 * ゆめマガ    1    2980000    1    2960000    圏外    圏外    -    -    -
 */
function parseRankCheckerData(pastedData: string): KeywordRankData[] {
  const lines = pastedData.split('\n').filter((line) => line.trim());

  const results: KeywordRankData[] = [];

  lines.forEach((line) => {
    // タブまたは複数スペースで分割
    const parts = line.split(/\t+|\s{2,}/).map((p) => p.trim());

    if (parts.length < 7) {
      return; // 不正な行はスキップ
    }

    const keyword = parts[0];

    // Google順位（1列目）
    const googleRank = parseRank(parts[1]);
    const googleHits = parseHits(parts[2]);

    // Yahoo順位（3列目）
    const yahooRank = parseRank(parts[3]);
    const yahooHits = parseHits(parts[4]);

    // Bing順位（5列目）
    const bingRank = parseRank(parts[5]);
    const bingHits = parseHits(parts[6]);

    results.push({
      keyword,
      googleRank,
      yahooRank,
      bingRank,
      googleHits,
      yahooHits,
      bingHits,
      updatedAt: new Date().toISOString(),
    });
  });

  return results;
}

/**
 * 順位をパース（圏外・取得失敗 → null）
 */
function parseRank(value: string | undefined): number | null {
  if (!value || value === '圏外' || value === '取得失敗' || value === '-') {
    return null;
  }

  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

/**
 * ヒット数をパース
 */
function parseHits(value: string | undefined): number | null {
  if (!value || value === '圏外' || value === '取得失敗' || value === '-') {
    return null;
  }

  const num = parseInt(value.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}
