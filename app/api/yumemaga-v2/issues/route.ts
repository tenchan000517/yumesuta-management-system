import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * 月号一覧を取得
 * 進捗入力シート_V2のA列から月号を抽出
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 進捗入力シート_V2のA列から月号一覧を取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート_V2!A1:A100');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シート_V2が見つかりません' },
        { status: 404 }
      );
    }

    // A列の月号を抽出（ヘッダー行をスキップし、空セルを除外）
    const issues = progressData
      .slice(1) // ヘッダー行をスキップ
      .map(row => row[0])
      .filter(issue => issue && typeof issue === 'string' && issue.match(/\d+年\d+月号/));

    console.log(`✅ Found ${issues.length} issues:`, issues);

    return NextResponse.json({
      success: true,
      issues,
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
