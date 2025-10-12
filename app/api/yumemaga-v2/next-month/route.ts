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

    // ガントシートのヘッダー行（日付）を取得
    const headers = ganttData[0];
    const dateHeaders = headers.slice(3); // A,B,C列をスキップ

    // レイヤー列が "次月号" の工程を抽出
    type ProcessData = {
      processNo: string;
      name: string;
      plannedDate: string;
      nextMonthIssue: string;
      layer: string;
      isNextMonth: boolean;
    };

    const nextMonthProcesses = ganttData.slice(1)
      .filter(row => row[1] === '次月号') // B列: レイヤー
      .map(row => {
        const processName = row[0]; // "S-1 【12月号】ゆめマガ○月号企画決定"
        if (!processName) return null;

        const match = processName.match(/^([A-Z]-\d+)/);
        const monthMatch = processName.match(/【(\d+月号)】/);

        // 工程名から工程Noと【月号】を除去
        // "S-1 【12月号】ゆめマガ○月号企画決定" → "ゆめマガ○月号企画決定"
        let cleanName = processName;
        cleanName = cleanName.replace(/^[A-Z]-\d+\s+/, ''); // 工程No除去
        cleanName = cleanName.replace(/【\d+月号】/, '');    // 【月号】除去

        // 最初の予定日を取得
        let plannedDate = '-';
        for (let i = 0; i < dateHeaders.length; i++) {
          if (row[i + 3]) { // 列A,B,Cをスキップして値をチェック
            plannedDate = dateHeaders[i];
            break;
          }
        }

        return {
          processNo: match ? match[1] : '',
          name: cleanName,
          plannedDate, // ガントから取得した予定日
          nextMonthIssue: monthMatch ? `2025年${monthMatch[1]}` : '',
          layer: row[1],
          isNextMonth: true,
        };
      })
      .filter((p): p is ProcessData => p !== null && !!p.processNo);

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
