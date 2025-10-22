import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * 利用可能な月号一覧を取得
 * - 進捗入力シート_V2のA列から月号を取得
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 進捗入力シート_V2のA列（月号）を取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート_V2!A:A');
    const issues: Array<{ issue: string; isNew: boolean }> = [];

    // ヘッダー行をスキップ（1行目）
    for (let i = 1; i < progressData.length; i++) {
      const issue = progressData[i][0];
      if (issue && typeof issue === 'string' && issue.match(/^\d{4}年\d{1,2}月号$/)) {
        issues.push({ issue, isNew: false });
      }
    }

    // 日付順にソート（降順: 新しい号が上）
    issues.sort((a, b) => {
      const [yearA, monthA] = a.issue.match(/(\d+)年(\d+)月号/)?.slice(1).map(Number) || [0, 0];
      const [yearB, monthB] = b.issue.match(/(\d+)年(\d+)月号/)?.slice(1).map(Number) || [0, 0];
      return (yearB * 12 + monthB) - (yearA * 12 + monthA); // 降順
    });

    console.log(`📋 進捗入力シート_V2から ${issues.length} 件の月号を取得`);

    return NextResponse.json({
      success: true,
      issues,
    });

  } catch (error: any) {
    console.error('Failed to fetch available issues:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
