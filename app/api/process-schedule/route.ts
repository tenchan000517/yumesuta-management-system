import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata, getSheetData } from '@/lib/google-sheets';
import type { ProcessScheduleResponse, GanttData, ProgressData, ProcessTask } from '@/types/process';

const SPREADSHEET_ID = '1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueNumber = searchParams.get('issue') || ''; // 月号指定（例: 2025年11月号）

    // スプレッドシートのメタデータを取得
    const metadata = await getSpreadsheetMetadata(SPREADSHEET_ID);
    const sheets = metadata.sheets?.map((sheet: any) => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      index: sheet.properties?.index,
    })) || [];

    // 利用可能な月号リストを取得
    const ganttSheets = sheets.filter((s: any) => s.title.includes('逆算配置_ガント'));
    const availableIssues = ganttSheets.map((s: any) => {
      const match = s.title.match(/(\d+年\d+月号)/);
      return match ? match[1] : '';
    }).filter(Boolean);

    // 指定された月号、またはデフォルトで最新の月号を取得
    let targetIssue = issueNumber;
    if (!targetIssue && availableIssues.length > 0) {
      targetIssue = availableIssues[availableIssues.length - 1]; // 最新号
    }

    // ガントシートを取得
    const ganttSheet = sheets.find((s: any) =>
      s.title.includes('逆算配置_ガント') && s.title.includes(targetIssue)
    );

    if (!ganttSheet) {
      return NextResponse.json(
        {
          success: false,
          error: `Gantt sheet not found for issue: ${targetIssue}`,
          availableIssues,
        },
        { status: 404 }
      );
    }

    // ガントチャートデータを取得（全列取得）
    const ganttRawData = await getSheetData(SPREADSHEET_ID, `${ganttSheet.title}!A1:AZ100`);

    if (!ganttRawData || ganttRawData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data found in gantt sheet',
        },
        { status: 404 }
      );
    }

    // ヘッダー行を取得
    const headers = ganttRawData[0];
    const dateHeaders = headers.slice(3); // 最初の3列（工程、レイヤー、配置理由）を除く

    // タスクデータを構築
    const tasks: ProcessTask[] = ganttRawData.slice(1).map((row) => {
      const dates: Record<string, string> = {};
      dateHeaders.forEach((date, index) => {
        const value = row[index + 3] || '';
        if (value) {
          dates[date] = value;
        }
      });

      return {
        processName: row[0] || '',
        layer: row[1] || '',
        reason: row[2] || '',
        dates,
      };
    }).filter(task => task.processName); // 工程名が空の行は除外

    const ganttData: GanttData = {
      sheetTitle: ganttSheet.title,
      issueNumber: targetIssue,
      dateHeaders,
      tasks,
    };

    // 進捗入力シートからデータ取得
    const progressSheet = sheets.find((s: any) => s.title === '進捗入力シート');
    let progressData: ProgressData[] = [];

    if (progressSheet) {
      const progressRawData = await getSheetData(SPREADSHEET_ID, `${progressSheet.title}!A1:Z100`);

      if (progressRawData && progressRawData.length > 1) {
        const progressHeaders = progressRawData[0];
        progressData = progressRawData.slice(1).map((row) => {
          const processName = row[0] || '';
          const plannedDate = row[1] || '';
          const actualDate = row[2] || undefined;
          const statusRaw = row[3] || 'not_started';
          const assignee = row[4] || undefined;
          const notes = row[5] || undefined;

          // ステータスの判定
          let status: 'not_started' | 'in_progress' | 'completed' | 'delayed' = 'not_started';
          if (actualDate) {
            status = 'completed';
          } else if (statusRaw === '進行中' || statusRaw === 'in_progress') {
            status = 'in_progress';
          } else if (statusRaw === '遅延' || statusRaw === 'delayed') {
            status = 'delayed';
          }

          return {
            processName,
            plannedDate,
            actualDate,
            status,
            assignee,
            notes,
          };
        }).filter(p => p.processName); // 工程名が空の行は除外
      }
    }

    const response: ProcessScheduleResponse = {
      success: true,
      message: 'Process schedule data fetched successfully',
      ganttData,
      progressData,
      availableIssues,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Process schedule API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
