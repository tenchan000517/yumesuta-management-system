import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    // 営業管理スプレッドシートから最初の10行を取得してテスト
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'SALES_SPREADSHEET_ID is not set' },
        { status: 500 }
      );
    }

    // シート名とレンジを指定（営業管理スプレッドシートの最初のシート）
    const data = await getSheetData(spreadsheetId, 'A1:J10');

    return NextResponse.json({
      success: true,
      message: 'Google Sheets API connection successful!',
      spreadsheetId,
      rowCount: data.length,
      data: data,
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
