import { NextResponse } from 'next/server';
import { listFilesInFolder } from '@/lib/google-drive';

/**
 * 利用可能な月号一覧を取得
 * - Google Driveのカテゴリフォルダ内の月号ディレクトリをスキャン
 * - 存在する月号 + 向こう3ヶ月分を返す
 */
export async function GET() {
  try {
    // カテゴリAのフォルダID（カテゴリマスターJ列から取得）
    const categoryAFolderId = '1w57bpaloqFGX7XYpJSr3q-XiDtjrfUc5';

    // 録音データフォルダ配下の月号ディレクトリを取得
    const folders = await listFilesInFolder(categoryAFolderId);
    const recordingFolder = folders.find(f => f.name === '録音データ');

    const existingIssues = new Set<string>();

    if (recordingFolder) {
      // 録音データフォルダ配下の月号フォルダを取得
      const issueFolders = await listFilesInFolder(recordingFolder.id!);
      issueFolders.forEach(folder => {
        // "2025_11" → "2025年11月号" に変換
        const match = folder.name?.match(/^(\d{4})_(\d{1,2})$/);
        if (match) {
          const year = match[1];
          const month = parseInt(match[2], 10);
          existingIssues.add(`${year}年${month}月号`);
        }
      });
    }

    // 現在の日付から向こう3ヶ月分を生成
    const futureIssues: Array<{ issue: string; isNew: boolean }> = [];
    const today = new Date();

    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const issueLabel = `${year}年${month}月号`;

      if (existingIssues.has(issueLabel)) {
        futureIssues.push({ issue: issueLabel, isNew: false });
      } else {
        futureIssues.push({ issue: issueLabel, isNew: true });
      }
    }

    // 既存の月号で未来3ヶ月に含まれないものを追加
    const allIssues: Array<{ issue: string; isNew: boolean }> = [];

    existingIssues.forEach(issue => {
      if (!futureIssues.some(f => f.issue === issue)) {
        allIssues.push({ issue, isNew: false });
      }
    });

    // 日付順にソート
    allIssues.push(...futureIssues);
    allIssues.sort((a, b) => {
      const [yearA, monthA] = a.issue.match(/(\d+)年(\d+)月号/)?.slice(1).map(Number) || [0, 0];
      const [yearB, monthB] = b.issue.match(/(\d+)年(\d+)月号/)?.slice(1).map(Number) || [0, 0];
      return (yearA * 12 + monthA) - (yearB * 12 + monthB);
    });

    return NextResponse.json({
      success: true,
      issues: allIssues,
    });

  } catch (error: any) {
    console.error('Failed to fetch available issues:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
