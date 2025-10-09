import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * 企業一覧取得API
 * GET /api/yumemaga-v2/companies
 *
 * 企業マスターから全企業の基本情報（ID、企業名）を取得
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 企業マスターのA列（企業ID）、B列（企業名）を取得
    const data = await getSheetData(spreadsheetId, '企業マスター!A:B');

    if (!data || data.length < 2) {
      return NextResponse.json({
        success: true,
        companies: [],
      });
    }

    // ヘッダー行をスキップし、データ行のみ処理
    const companies = data
      .slice(1) // 1行目（ヘッダー）をスキップ
      .filter((row) => row[0]?.trim() && row[1]?.trim()) // 企業IDと企業名が両方存在
      .map((row) => ({
        companyId: row[0].trim(),
        companyName: row[1].trim(),
      }));

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error: any) {
    console.error('企業一覧取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '企業一覧の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
