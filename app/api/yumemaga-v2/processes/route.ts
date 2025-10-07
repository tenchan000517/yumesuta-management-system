import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * 日付をパース（"9/29" → Date）
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;

  const parts = dateStr.split('/');
  if (parts.length !== 2) return null;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = new Date().getFullYear();

  return new Date(year, month - 1, day);
}

/**
 * 2つの日付が同じ日かチェック
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * ステータスを判定
 */
function determineStatus(plannedDate: string, actualDate: string): string {
  if (actualDate) return 'completed';
  if (!plannedDate || plannedDate === '-') return 'not_started';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const planned = parseDate(plannedDate);
  if (!planned) return 'not_started';

  planned.setHours(0, 0, 0, 0);

  if (today > planned) return 'delayed';
  if (isSameDay(today, planned)) return 'in_progress';
  return 'not_started';
}

/**
 * 工程データ取得（ガント + 進捗シート結合）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue');

    if (!issue) {
      return NextResponse.json(
        { success: false, error: '月号を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. ガントシートから工程スケジュールを取得
    const ganttSheetName = `逆算配置_ガント_${issue}`;
    const ganttData = await getSheetData(spreadsheetId, `${ganttSheetName}!A1:ZZ1000`);

    if (ganttData.length === 0) {
      return NextResponse.json(
        { success: false, error: `ガントシート「${ganttSheetName}」が見つかりません` },
        { status: 404 }
      );
    }

    const headers = ganttData[0];
    const dateHeaders = headers.slice(3); // A,B,C列をスキップ

    const processSchedule: Record<string, string[]> = {};

    ganttData.slice(1).forEach(row => {
      const processName = row[0]; // "A-3 メイン文字起こし"
      if (!processName) return;

      const match = processName.match(/^([A-Z]-\d+)/);
      if (!match) return;

      const processNo = match[1];
      const scheduledDates: string[] = [];

      dateHeaders.forEach((date: string, i: number) => {
        if (row[i + 3]) { // 列A,B,Cをスキップして値をチェック
          scheduledDates.push(date);
        }
      });

      processSchedule[processNo] = scheduledDates;
    });

    console.log(`📅 ガントシート: ${Object.keys(processSchedule).length}工程のスケジュールを取得`);

    // 2. 進捗入力シートから実績を取得（active のみ）
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シートが見つかりません' },
        { status: 404 }
      );
    }

    const processes = progressData
      .slice(1)
      .filter(row => {
        const status = row[8]; // I列: ステータス
        const rowIssue = row[3]; // D列: 月号
        return (status === 'active' || !status) && (!rowIssue || rowIssue === issue);
      })
      .map(row => ({
        processNo: row[0],              // A列: 工程No
        processName: row[1],            // B列: 工程名
        requiredData: row[2] || '-',    // C列: 必要データ
        issue: row[3] || '',            // D列: 月号
        plannedDate: row[4] || '-',     // E列: 逆算予定日
        inputPlannedDate: row[5] || '-', // F列: 入力予定日
        actualDate: row[6] || '',       // G列: 実績日
        confirmationStatus: row[7] || '-', // H列: 先方確認ステータス
        scheduledDates: processSchedule[row[0]] || [],
        status: determineStatus(row[4], row[6]),
      }));

    console.log(`✅ 工程データ: ${processes.length}件取得`);

    // サマリー集計
    const summary = {
      total: processes.length,
      completed: processes.filter(p => p.status === 'completed').length,
      in_progress: processes.filter(p => p.status === 'in_progress').length,
      delayed: processes.filter(p => p.status === 'delayed').length,
      not_started: processes.filter(p => p.status === 'not_started').length,
    };

    return NextResponse.json({
      success: true,
      processes,
      summary,
    });
  } catch (error: any) {
    console.error('工程データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '工程データの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
