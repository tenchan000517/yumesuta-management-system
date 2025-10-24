import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata, getSheetData } from '@/lib/google-sheets';

export async function GET(request: Request) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'YUMEMAGA_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sheetName = searchParams.get('sheet');
    const limit = searchParams.get('limit');

    // シート一覧を取得（sheetパラメータがない場合）
    if (!sheetName) {
      const metadata = await getSpreadsheetMetadata(spreadsheetId);
      return NextResponse.json({
        success: true,
        data: {
          spreadsheetTitle: metadata.properties.title,
          sheets: metadata.sheets.map((sheet: any) => ({
            title: sheet.properties.title,
            sheetId: sheet.properties.sheetId,
            index: sheet.properties.index,
            rowCount: sheet.properties.gridProperties?.rowCount,
            columnCount: sheet.properties.gridProperties?.columnCount,
          })),
        },
      });
    }

    // 特定シートのデータを取得
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const range = `${sheetName}!A1:Z${limitNum + 1}`; // ヘッダー + データ行
    const data = await getSheetData(spreadsheetId, range);

    return NextResponse.json({
      success: true,
      data: {
        sheetName,
        rowCount: data.length,
        columnCount: data[0]?.length || 0,
        headers: data[0] || [],
        rows: data.slice(1),
      },
    });
  } catch (error: any) {
    console.error('Yumemaga sheet API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
