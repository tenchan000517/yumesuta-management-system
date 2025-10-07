import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * カテゴリ別進捗データ取得
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

    // 進捗入力シートから実績を取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シートが見つかりません' },
        { status: 404 }
      );
    }

    // カテゴリ別に分類
    const categories: Record<string, any[]> = {
      A: [], K: [], H: [], I: [], L: [], M: [], C: [], E: [], P: [], Z: [],
    };

    progressData.slice(1).forEach(row => {
      const processNo = row[0]; // A列: 工程No
      const status = row[8];    // I列: ステータス
      const rowIssue = row[3];  // D列: 月号

      if (!processNo || status === 'archived') return;
      if (rowIssue && rowIssue !== issue) return;

      const prefix = processNo.split('-')[0]; // "A-3" → "A"

      if (categories[prefix]) {
        categories[prefix].push({
          processNo: row[0],
          processName: row[1],
          actualDate: row[6] || '',
          confirmationStatus: row[7] || '-',
        });
      }
    });

    // カテゴリ別の進捗率を計算
    const progress: Record<string, any> = {};

    Object.keys(categories).forEach(cat => {
      const processes = categories[cat];
      const completed = processes.filter(p => p.actualDate).length;
      const total = processes.length;

      progress[cat] = {
        category: cat,
        total,
        completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        processes,
      };
    });

    console.log(`✅ カテゴリ別進捗: ${Object.keys(progress).length}カテゴリ`);

    return NextResponse.json({
      success: true,
      categories: progress,
    });
  } catch (error: any) {
    console.error('カテゴリ別進捗取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'カテゴリ別進捗の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
