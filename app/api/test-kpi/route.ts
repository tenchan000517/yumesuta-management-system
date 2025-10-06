import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'SALES_SPREADSHEET_ID is not set' },
        { status: 500 }
      );
    }

    // KPIダッシュボードシートから最初の20行を取得
    const kpiData = await getSheetData(spreadsheetId, 'KPIダッシュボード!A1:Z20');

    return NextResponse.json({
      success: true,
      sheetName: 'KPIダッシュボード',
      rowCount: kpiData.length,
      data: kpiData,
    });
  } catch (error) {
    console.error('Test KPI API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
