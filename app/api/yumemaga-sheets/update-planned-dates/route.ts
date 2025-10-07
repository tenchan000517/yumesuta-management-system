import { NextResponse } from 'next/server';
import { getSheetData, getSpreadsheetMetadata, updateSheetData } from '@/lib/google-sheets';

/**
 * ガントシートから逆算予定日を更新
 */
export async function POST(request: Request) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;
    const body = await request.json();
    const { issue } = body; // 例: "2025年11月号"

    if (!issue) {
      return NextResponse.json(
        { success: false, error: '月号を指定してください' },
        { status: 400 }
      );
    }

    // ガントシート名を構築
    const ganttSheetName = `逆算配置_ガント_${issue}`;

    // ガントシートからデータを取得
    const ganttData = await getSheetData(spreadsheetId, `${ganttSheetName}!A1:ZZ1000`);

    if (!ganttData || ganttData.length === 0) {
      return NextResponse.json(
        { success: false, error: `ガントシート「${ganttSheetName}」が見つかりません` },
        { status: 404 }
      );
    }

    const headers = ganttData[0];
    const dateHeaders = headers.slice(3); // D列以降が日付

    // 各工程の最初の実施日を抽出
    const processSchedule: Record<string, string> = {};

    ganttData.slice(1).forEach(row => {
      const processName = row[0]; // 例: "A-3 メイン文字起こし"
      if (!processName) return;

      const match = processName.match(/^([A-Z]-\d+)/); // 工程Noを抽出
      if (!match) return;

      const processNo = match[1];

      // この工程が実施される最初の日付を探す
      for (let i = 0; i < dateHeaders.length; i++) {
        const cellValue = row[i + 3];
        if (cellValue) {
          processSchedule[processNo] = dateHeaders[i];
          break;
        }
      }
    });

    console.log(`${Object.keys(processSchedule).length}工程の予定日を抽出しました`);

    // 進捗入力シートから既存データを取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    // 更新対象の行を特定
    const updatesToApply: { row: number; plannedDate: string }[] = [];

    progressData.slice(1).forEach((row, index) => {
      const processNo = row[0];
      const currentIssue = row[3]; // D列: 月号
      const currentStatus = row[8]; // I列: ステータス

      // active状態で、指定された月号の工程のみ更新
      if (
        processNo &&
        currentStatus !== 'archived' &&
        processSchedule[processNo]
      ) {
        updatesToApply.push({
          row: index + 2, // ヘッダー行を除く
          plannedDate: processSchedule[processNo],
        });
      }
    });

    // 一括更新
    for (const update of updatesToApply) {
      await updateSheetData(
        spreadsheetId,
        `進捗入力シート!E${update.row}`, // E列: 逆算予定日
        [[update.plannedDate]]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${updatesToApply.length}工程の逆算予定日を更新しました`,
      updated: updatesToApply.length,
      issue,
    });
  } catch (error: any) {
    console.error('逆算予定日更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '逆算予定日の更新に失敗しました',
      },
      { status: 500 }
    );
  }
}
