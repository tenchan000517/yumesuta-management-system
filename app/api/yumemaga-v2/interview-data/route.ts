import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * インタビュー実績データ取得・更新API
 *
 * GET: インタビュー実績データをJSON形式で取得
 *      /api/yumemaga-v2/interview-data?issue=2025年11月号&categoryId=A
 *
 * PUT: インタビュー実績データをJSON形式で更新
 *      Body: { issue: "2025年11月号", categoryId: "A", data: {...} }
 */

// カテゴリIDと列インデックスのマッピング
const CATEGORY_COLUMN_MAP: Record<string, number> = {
  'A': 1,  // B列
  'K': 2,  // C列
  'H': 3,  // D列
  'I': 4,  // E列
  'L': 5,  // F列
  'M': 6,  // G列
  'C': 7,  // H列
};

/**
 * GET: データ取得
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue');
    const categoryId = searchParams.get('categoryId');

    if (!issue) {
      return NextResponse.json(
        { success: false, error: 'issue parameter is required' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'YUMEMAGA_SPREADSHEET_ID is not configured' },
        { status: 500 }
      );
    }

    const data = await getSheetData(
      spreadsheetId,
      'インタビュー実績データ!A1:H100'
    );

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'インタビュー実績データシートが見つかりません' },
        { status: 404 }
      );
    }

    // 該当月号の行を取得
    const row = data.find(r => r[0] === issue);

    if (!row) {
      return NextResponse.json({
        success: true,
        data: null,
        message: `月号 ${issue} のデータが見つかりません`,
      });
    }

    if (categoryId) {
      // 特定カテゴリのデータのみ取得
      const columnIndex = CATEGORY_COLUMN_MAP[categoryId];

      if (columnIndex === undefined) {
        return NextResponse.json(
          { success: false, error: `Invalid categoryId: ${categoryId}` },
          { status: 400 }
        );
      }

      const jsonData = row[columnIndex] || '{}';

      try {
        const parsedData = JSON.parse(jsonData);
        return NextResponse.json({
          success: true,
          data: parsedData,
        });
      } catch (error) {
        console.error(`JSON parse error for ${categoryId}:`, error);
        return NextResponse.json(
          { success: false, error: `Invalid JSON data for category ${categoryId}` },
          { status: 500 }
        );
      }
    } else {
      // 全カテゴリのデータを取得
      const allData: Record<string, any> = {};

      for (const [catId, colIndex] of Object.entries(CATEGORY_COLUMN_MAP)) {
        const jsonData = row[colIndex] || '{}';
        try {
          allData[catId] = JSON.parse(jsonData);
        } catch (error) {
          console.error(`JSON parse error for ${catId}:`, error);
          allData[catId] = {};
        }
      }

      return NextResponse.json({
        success: true,
        data: allData,
      });
    }
  } catch (error) {
    console.error('インタビュー実績データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: データ更新
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { issue, categoryId, data: interviewData } = body;

    if (!issue || !categoryId || !interviewData) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: issue, categoryId, data' },
        { status: 400 }
      );
    }

    const columnIndex = CATEGORY_COLUMN_MAP[categoryId];

    if (columnIndex === undefined) {
      return NextResponse.json(
        { success: false, error: `Invalid categoryId: ${categoryId}` },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'YUMEMAGA_SPREADSHEET_ID is not configured' },
        { status: 500 }
      );
    }

    const sheetData = await getSheetData(
      spreadsheetId,
      'インタビュー実績データ!A1:H100'
    );

    if (!sheetData || sheetData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'インタビュー実績データシートが見つかりません' },
        { status: 404 }
      );
    }

    // 該当月号の行を検索
    let rowIndex = sheetData.findIndex(r => r[0] === issue);

    // 行が存在しない場合は新規作成
    if (rowIndex === -1) {
      rowIndex = sheetData.length;
      sheetData.push([issue, '{}', '{}', '{}', '{}', '{}', '{}', '{}']);
      console.log(`新規行を作成: ${issue} (行番号: ${rowIndex + 1})`);
    }

    // 既存データを取得
    const existingJsonData = sheetData[rowIndex][columnIndex] || '{}';
    let existingData = {};

    try {
      existingData = JSON.parse(existingJsonData);
    } catch (error) {
      console.warn(`既存JSONのパースに失敗: ${existingJsonData}`, error);
      existingData = {};
    }

    // マージ（新しいデータで上書き）
    const mergedData = { ...existingData, ...interviewData };

    // JSON文字列に変換
    const jsonString = JSON.stringify(mergedData);

    // 列記号を計算（B列=66, C列=67, ...）
    const columnLetter = String.fromCharCode(66 + columnIndex - 1);
    const cellAddress = `${columnLetter}${rowIndex + 1}`;

    console.log(`データ更新: ${cellAddress} = ${jsonString.substring(0, 100)}...`);

    // シートに書き込み
    await updateSheetData(
      spreadsheetId,
      `インタビュー実績データ!${cellAddress}`,
      [[jsonString]]
    );

    return NextResponse.json({
      success: true,
      message: 'Interview data updated successfully',
      cellAddress,
      updatedData: mergedData,
    });
  } catch (error) {
    console.error('インタビュー実績データ更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
