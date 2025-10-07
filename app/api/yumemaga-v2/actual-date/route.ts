import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * 実績日を更新
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { issue, processNo, actualDate } = body;

    if (!issue || !processNo) {
      return NextResponse.json(
        { success: false, error: '月号と工程Noを指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 進捗入力シートから該当行を検索
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    const rowIndex = progressData.findIndex((row, i) => {
      if (i === 0) return false; // ヘッダー行をスキップ
      return row[0] === processNo && (row[3] === issue || !row[3]);
    });

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: '工程が見つかりません' },
        { status: 404 }
      );
    }

    // G列（実績日）を更新（行番号は1-indexed）
    await updateSheetData(
      spreadsheetId,
      `進捗入力シート!G${rowIndex + 1}`,
      [[actualDate || '']]
    );

    console.log(`✅ 実績日を更新: ${processNo} → ${actualDate}`);

    return NextResponse.json({
      success: true,
      message: '実績日を更新しました',
      processNo,
      actualDate,
    });
  } catch (error: any) {
    console.error('実績日更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '実績日の更新に失敗しました',
      },
      { status: 500 }
    );
  }
}
