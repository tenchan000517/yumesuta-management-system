import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    // 契約企業マスタシートの最初の2行を取得
    const companyMaster = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約企業マスタ!A1:F2'
    );

    return NextResponse.json({
      success: true,
      data: companyMaster,
      explanation: {
        row1: "ヘッダー行",
        row2: "データ行1（あれば）"
      }
    });

  } catch (error) {
    console.error('テストエラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
