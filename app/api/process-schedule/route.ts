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
        progressData = progressRawData.slice(1).map((row) => {
          // 列構造：
          // 0: 工程No, 1: 工程名, 2: 必要データ, 3: 月号,
          // 4: 逆算予定日, 5: 入力予定日, 6: 実績日,
          // 7: 先方確認ステータス, 8: ステータス, 9: 備考
          const processName = `${row[0] || ''}: ${row[1] || ''}`.trim(); // 工程No + 工程名
          const plannedDate = row[4] || ''; // 逆算予定日
          const actualDate = row[6] || undefined; // 実績日
          const statusRaw = row[8] || 'not_started'; // ステータス
          const assignee = undefined; // 担当者列なし
          const notes = row[9] || undefined; // 備考

          // 月号から年を抽出（予定日の年判定に使用）
          const issueYear = (() => {
            const issueMatch = targetIssue.match(/(\d{4})年(\d{1,2})月号/);
            if (issueMatch) {
              return {
                year: parseInt(issueMatch[1]),
                month: parseInt(issueMatch[2])
              };
            }
            return null;
          })();

          // 日付のパース（M/D形式またはYYYY-MM-DD形式に対応）
          const parseDate = (dateStr: string): Date | null => {
            if (!dateStr || dateStr === '-') return null;

            // YYYY-MM-DD形式
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const date = new Date(dateStr + 'T00:00:00+09:00'); // 日本時間で解釈
              date.setHours(0, 0, 0, 0);
              return date;
            }

            // M/D形式（月号の年を基準に判定）
            const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
            if (match && issueYear) {
              const month = parseInt(match[1], 10);
              const day = parseInt(match[2], 10);

              // まず月号の前年で日付を作成（制作は前年から始まる）
              let year = issueYear.year - 1;
              let date = new Date(year, month - 1, day, 0, 0, 0, 0);

              // その日付が過去すぎる（今日より6ヶ月以上前）なら今年とする
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const monthsDiff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
              if (monthsDiff > 6) {
                year = issueYear.year;
                date = new Date(year, month - 1, day, 0, 0, 0, 0);
              }

              return date;
            }

            return null;
          };

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const planned = parseDate(plannedDate);
          const actual = actualDate ? parseDate(actualDate) : null;

          // activeな工程のみを対象とする（archiveは除外）
          if (statusRaw !== 'active') {
            return null; // archiveの工程はスキップ
          }

          // ステータスの判定
          let status: 'not_started' | 'in_progress' | 'completed' | 'delayed' = 'not_started';

          if (actual) {
            // 実施日がある場合は完了
            status = 'completed';
          } else if (planned) {
            // 実施日がない場合
            if (today > planned) {
              // 予定日を過ぎている → 遅延
              status = 'delayed';
            } else {
              // 予定日前 → 未着手（または先方確認ステータスを見て判定）
              const confirmStatus = row[7] || ''; // 先方確認ステータス
              if (confirmStatus && confirmStatus !== '') {
                // 先方確認ステータスがある場合は進行中
                status = 'in_progress';
              } else {
                status = 'not_started';
              }
            }
          } else {
            // 予定日が設定されていない場合は未着手
            status = 'not_started';
          }

          return {
            processName,
            plannedDate,
            actualDate,
            status,
            assignee,
            notes,
          };
        }).filter((p): p is ProgressData => p !== null && p.processName !== ''); // null（archive）と工程名が空の行は除外
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
