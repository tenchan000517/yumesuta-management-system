import { NextResponse } from 'next/server';
import { getBatchSheetData } from '@/lib/google-sheets';

/**
 * 日付をパース（"9/29" → Date）
 */
function parseDate(dateStr: string): Date | null {
  // 文字列でない場合は早期リターン
  if (typeof dateStr !== 'string' || !dateStr || dateStr === '-') return null;

  const parts = dateStr.split('/');
  if (parts.length !== 2) return null;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = new Date().getFullYear();

  return new Date(year, month - 1, day);
}

/**
 * 遅延日数を計算
 */
function calculateDelayDays(plannedDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const planned = parseDate(plannedDate);
  if (!planned) return 0;

  planned.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - planned.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * 準備OK・遅延工程の判定
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

    // 1. バッチで必要なシートを一括取得（2つのシートを1回のAPIリクエストで取得）
    const [dependenciesData, progressData] = await getBatchSheetData(
      spreadsheetId,
      [
        '新依存関係マスター!A1:D200',
        '進捗入力シート!A1:J1000',
      ]
    );

    if (dependenciesData.length === 0) {
      return NextResponse.json(
        { success: false, error: '新依存関係マスターが見つかりません' },
        { status: 404 }
      );
    }

    // 依存関係のマッピング: processNo -> [prerequisite1, prerequisite2, ...]
    const dependencyMap: Record<string, string[]> = {};

    dependenciesData.slice(1).forEach(row => {
      const processNo = row[0];      // A列: 工程No
      const prerequisite = row[1];   // B列: 前提工程

      if (!processNo || !prerequisite) return;

      if (!dependencyMap[processNo]) {
        dependencyMap[processNo] = [];
      }
      dependencyMap[processNo].push(prerequisite);
    });

    console.log(`🔗 依存関係: ${Object.keys(dependencyMap).length}工程分を読み込み`);

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シートが見つかりません' },
        { status: 404 }
      );
    }

    // 工程の完了状態をマップ化: processNo -> {completed: boolean, plannedDate: string, processName: string}
    const processStatusMap: Record<string, { completed: boolean; plannedDate: string; processName: string }> = {};

    progressData.slice(1).forEach(row => {
      const processNo = row[0];          // A列: 工程No
      const processName = row[1];        // B列: 工程名
      const rowIssue = row[3];           // D列: 月号
      const plannedDate = row[4] || '-'; // E列: 逆算予定日
      const actualDate = row[6];         // G列: 実績日
      const status = row[8];             // I列: ステータス

      if (!processNo || status === 'archived') return;
      if (rowIssue && rowIssue !== issue) return;

      processStatusMap[processNo] = {
        completed: !!actualDate,
        plannedDate,
        processName,
      };
    });

    console.log(`📊 進捗データ: ${Object.keys(processStatusMap).length}工程分を読み込み`);

    // 3. 準備OK工程を判定
    const readyProcesses: Array<{
      processNo: string;
      processName: string;
      prerequisitesCompleted: string[];
    }> = [];

    const delayedProcesses: Array<{
      processNo: string;
      processName: string;
      plannedDate: string;
      delayDays: number;
    }> = [];

    Object.keys(processStatusMap).forEach(processNo => {
      const process = processStatusMap[processNo];
      const prerequisites = dependencyMap[processNo] || [];

      // 準備OK判定: 前提工程がすべて完了 && 自分は未完了 && データ提出工程が完了
      if (!process.completed && prerequisites.length > 0) {
        const allPrerequisitesCompleted = prerequisites.every(prereq => {
          const prereqProcess = processStatusMap[prereq];
          return prereqProcess && prereqProcess.completed;
        });

        // Phase 3: カテゴリのデータ提出工程が完了しているかチェック
        const categoryPrefix = processNo.split('-')[0]; // "A-3" → "A"
        const dataSubmissionProcessNo = `${categoryPrefix}-1`; // データ提出は通常 X-1
        const dataSubmissionProcess = processStatusMap[dataSubmissionProcessNo];
        const dataSubmitted = !dataSubmissionProcess || dataSubmissionProcess.completed;

        if (allPrerequisitesCompleted && dataSubmitted) {
          readyProcesses.push({
            processNo,
            processName: process.processName,
            prerequisitesCompleted: prerequisites,
          });
        }
      }

      // 遅延判定: 予定日を過ぎている && 未完了
      if (!process.completed && process.plannedDate && process.plannedDate !== '-') {
        const delayDays = calculateDelayDays(process.plannedDate);
        if (delayDays > 0) {
          delayedProcesses.push({
            processNo,
            processName: process.processName,
            plannedDate: process.plannedDate,
            delayDays,
          });
        }
      }
    });

    console.log(`✅ 準備OK工程: ${readyProcesses.length}件`);
    console.log(`⚠️ 遅延工程: ${delayedProcesses.length}件`);

    return NextResponse.json({
      success: true,
      readyProcesses,
      delayedProcesses,
      summary: {
        totalProcesses: Object.keys(processStatusMap).length,
        readyCount: readyProcesses.length,
        delayedCount: delayedProcesses.length,
      },
    });
  } catch (error: any) {
    console.error('準備OK判定エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '準備OK判定に失敗しました',
      },
      { status: 500 }
    );
  }
}
