import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const data = await getSheetData(spreadsheetId, '契約・入金管理!A:AH');

    // ヘッダー行と最初の数行のデータを返す
    return NextResponse.json({
      success: true,
      headers: data[0] || [],
      sampleData: data.slice(1, 6),
      totalRows: data.length - 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
