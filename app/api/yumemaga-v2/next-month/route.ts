import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * 次月号準備データ取得
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentIssue = searchParams.get('currentIssue');

    if (!currentIssue) {
      return NextResponse.json(
        { success: false, error: '現在の月号を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // ガントシートから次月号工程を取得
    const ganttSheetName = `逆算配置_ガント_${currentIssue}`;
    const ganttData = await getSheetData(spreadsheetId, `${ganttSheetName}!A1:ZZ1000`);

    if (ganttData.length === 0) {
      return NextResponse.json(
        { success: false, error: `ガントシート「${ganttSheetName}」が見つかりません` },
        { status: 404 }
      );
    }

    // レイヤー列が "次月号" の工程を抽出
    const nextMonthProcesses = ganttData.slice(1)
      .filter(row => row[1] === '次月号') // B列: レイヤー
      .map(row => {
        const processName = row[0]; // "S-1 【12月号】ゆめマガ○月号企画決定"
        if (!processName) return null;

        const match = processName.match(/^([A-Z]-\d+)/);
        const monthMatch = processName.match(/【(\d+月号)】/);

        return {
          processNo: match ? match[1] : '',
          name: processName,
          nextMonthIssue: monthMatch ? `2025年${monthMatch[1]}` : '',
          layer: row[1],
          isNextMonth: true,
        };
      })
      .filter(p => p !== null && p.processNo);

    // 次月号を推定
    let nextMonthIssue = '';
    if (nextMonthProcesses.length > 0 && nextMonthProcesses[0].nextMonthIssue) {
      nextMonthIssue = nextMonthProcesses[0].nextMonthIssue;
    }

    console.log(`✅ 次月号工程: ${nextMonthProcesses.length}件取得 (次月号: ${nextMonthIssue})`);

    return NextResponse.json({
      success: true,
      nextMonthIssue,
      processes: nextMonthProcesses,
    });
  } catch (error: any) {
    console.error('次月号準備データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '次月号準備データの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
