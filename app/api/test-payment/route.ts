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

    // 契約・入金管理シートから最初の20行を取得
    const paymentData = await getSheetData(spreadsheetId, '契約・入金管理!A1:Z20');

    return NextResponse.json({
      success: true,
      sheetName: '契約・入金管理',
      rowCount: paymentData.length,
      data: paymentData,
    });
  } catch (error) {
    console.error('Test Payment API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
