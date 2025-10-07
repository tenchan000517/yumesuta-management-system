import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata } from '@/lib/google-sheets';

/**
 * 月号一覧を取得
 * ガントシート名から月号を抽出
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // スプレッドシートのメタデータを取得
    const metadata = await getSpreadsheetMetadata(spreadsheetId);

    // ガントシートから月号を抽出
    const ganttSheets = metadata.sheets
      ?.filter((s: any) => s.properties.title.includes('逆算配置_ガント'))
      .map((s: any) => {
        const match = s.properties.title.match(/(\d+年\d+月号)/);
        return match ? match[1] : null;
      })
      .filter(Boolean) || [];

    console.log(`✅ Found ${ganttSheets.length} issues:`, ganttSheets);

    return NextResponse.json({
      success: true,
      issues: ganttSheets,
    });
  } catch (error: any) {
    console.error('月号一覧取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '月号一覧の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
