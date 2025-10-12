import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const companyMaster = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約企業マスタ!A:B'
    );

    const companies = companyMaster
      .slice(1) // ヘッダー行をスキップ
      .filter(row => row[0] && row[1]) // 空行を除外
      .map(row => ({
        companyId: parseInt(row[0]),  // A列
        officialName: row[1]          // B列
      }));

    return NextResponse.json({
      success: true,
      companies
    });

  } catch (error) {
    console.error('企業リスト取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
