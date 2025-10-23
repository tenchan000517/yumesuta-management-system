import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * インタビューテンプレート取得API
 * GET /api/yumemaga-v2/interview-templates
 *
 * インタビューテンプレートマスターから静的データを取得
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'YUMEMAGA_SPREADSHEET_ID is not configured' },
        { status: 500 }
      );
    }

    const data = await getSheetData(
      spreadsheetId,
      'インタビューテンプレートマスター!A1:F100'
    );

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'インタビューテンプレートマスターが見つかりません' },
        { status: 404 }
      );
    }

    // ヘッダー行を除外
    const headers = data[0];
    const rows = data.slice(1);

    // 空行を除外してテンプレートを構築
    const templates = rows
      .filter(row => row[0]) // カテゴリIDが存在する行のみ
      .map(row => ({
        categoryId: row[0],
        interviewName: row[1] || '',
        useGoogleForm: row[2] === 'TRUE',
        googleFormUrl: row[3] || '',
        questionTemplate: row[4] || '',
        defaultDuration: row[5] || '',
      }));

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('インタビューテンプレート取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
