import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

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
 * 工程データ取得 (V2対応)
 *
 * V2の変更点:
 * - 進捗入力シート_V2（横持ち構造）から該当月号の1行のみ読み込み
 * - 新工程マスター_V2から工程定義を取得
 * - ガントシートは使用しない
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

    // 1. 進捗入力シート_V2から該当月号のデータを取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート_V2!A1:GV100');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シート_V2が見つかりません' },
        { status: 404 }
      );
    }

    // 2. ヘッダー行から列マッピングを作成
    const progressHeaders = progressData[0];
    const headerMap: Record<string, { plannedCol: number; actualCol: number }> = {};

    for (let col = 1; col < progressHeaders.length; col++) {
      const header = progressHeaders[col];
      if (!header) continue;

      const match = header.match(/^([A-Z]-\d+)(予定|実績.*)/);
      if (match) {
        const processNo = match[1];
        const type = match[2];

        if (!headerMap[processNo]) {
          headerMap[processNo] = { plannedCol: -1, actualCol: -1 };
        }

        if (type === '予定') {
          headerMap[processNo].plannedCol = col;
        } else if (type.startsWith('実績')) {
          headerMap[processNo].actualCol = col;
        }
      }
    }

    // 3. 該当月号の行を取得
    const progressRow = progressData.slice(1).find(row => row[0] === issue);

    if (!progressRow) {
      return NextResponse.json(
        { success: false, error: `月号 ${issue} の進捗データが見つかりません` },
        { status: 404 }
      );
    }

    // 4. 新工程マスター_V2から工程定義を取得
    const processMasterData = await getSheetData(spreadsheetId, '新工程マスター_V2!A1:F200');

    if (processMasterData.length === 0) {
      return NextResponse.json(
        { success: false, error: '新工程マスター_V2が見つかりません' },
        { status: 404 }
      );
    }

    // 5. 工程データを構築
    const processes = processMasterData
      .slice(1)
      .filter(row => row[1]) // 工程Noがあるもののみ
      .map(row => {
        const processNo = row[1]; // B列: 工程No
        const processName = row[2]; // C列: 工程名
        const phase = row[3]; // D列: フェーズ
        const order = row[4]; // E列: 順序
        const dataType = row[5]; // F列: データ型

        const cols = headerMap[processNo];
        let plannedDate = '-';
        let actualDate = '';

        if (cols) {
          if (cols.plannedCol >= 0) {
            plannedDate = progressRow[cols.plannedCol] || '-';
          }
          if (cols.actualCol >= 0) {
            actualDate = progressRow[cols.actualCol] || '';
          }
        }

        return {
          processNo,
          processName,
          requiredData: '-', // V2では不使用
          issue,
          plannedDate,
          inputPlannedDate: '-', // V2では不使用
          actualDate,
          confirmationStatus: '-', // 別途JSON管理
          scheduledDates: [], // V2ではガント不使用
          status: determineStatus(plannedDate, actualDate),
        };
      });

    console.log(`✅ 工程データ: ${processes.length}件取得 (月号: ${issue})`);

    // 6. サマリー集計
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
