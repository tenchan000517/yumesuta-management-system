import { NextResponse } from 'next/server';
import { getSheetData, updateCell } from '@/lib/google-sheets';

/**
 * 予定日更新API
 * PUT /api/yumemaga-v2/planned-date
 */
export async function PUT(request: Request) {
  try {
    const { processNo, plannedDate, issue } = await request.json();

    if (!processNo || !plannedDate) {
      return NextResponse.json(
        { success: false, error: '工程Noと予定日を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 進捗入力シートから該当工程の行番号を特定
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シートが見つかりません' },
        { status: 404 }
      );
    }

    // 工程Noが一致する行を探す（ヘッダー行はスキップ）
    let targetRow = -1;
    for (let i = 1; i < progressData.length; i++) {
      const rowProcessNo = progressData[i][0]; // A列: 工程No
      const rowIssue = progressData[i][3];    // D列: 月号

      // 工程Noが一致 && (月号が指定されていない or 月号が一致)
      if (rowProcessNo === processNo && (!issue || !rowIssue || rowIssue === issue)) {
        targetRow = i + 1; // 1-indexed
        break;
      }
    }

    if (targetRow === -1) {
      return NextResponse.json(
        { success: false, error: `工程${processNo}が見つかりませんでした` },
        { status: 404 }
      );
    }

    // 2. E列（逆算予定日）を更新
    await updateCell(
      spreadsheetId,
      '進捗入力シート',
      targetRow,
      5, // E列 = 5
      plannedDate
    );

    console.log(`✅ 予定日更新: ${processNo} → ${plannedDate} (行${targetRow})`);

    return NextResponse.json({
      success: true,
      message: `工程${processNo}の予定日を${plannedDate}に更新しました`,
      updatedRow: targetRow,
    });
  } catch (error: any) {
    console.error('予定日更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '予定日の更新に失敗しました',
      },
      { status: 500 }
    );
  }
}
