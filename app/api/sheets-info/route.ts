import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'SALES_SPREADSHEET_ID is not set' },
        { status: 500 }
      );
    }

    const metadata = await getSpreadsheetMetadata(spreadsheetId);

    // シート名を抽出
    const sheets = metadata.sheets?.map((sheet: any) => ({
      sheetId: sheet.properties?.sheetId,
      title: sheet.properties?.title,
      index: sheet.properties?.index,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount,
    }));

    return NextResponse.json({
      success: true,
      spreadsheetId,
      title: metadata.properties?.title,
      sheets,
    });
  } catch (error) {
    console.error('Sheets info API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
