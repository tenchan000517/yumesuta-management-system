import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { moveFileWithOAuth, ensureDirectoryWithOAuth } from '@/lib/google-drive';

/**
 * Googleドキュメント移動API
 * POST /api/yumemaga-v2/move-document
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, processNo, issue } = body;

    // バリデーション
    if (!documentId || !processNo || !issue) {
      return NextResponse.json(
        { success: false, error: 'documentId, processNo, and issue are required' },
        { status: 400 }
      );
    }

    // processNoからカテゴリIDを抽出（例: "A-4" → "A"）
    const categoryId = processNo.split('-')[0];

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // カテゴリマスターからDriveフォルダIDを取得
    const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:J100');
    const categoryRow = categoryData.find((row: any[]) => row[0] === categoryId);

    if (!categoryRow) {
      return NextResponse.json(
        { success: false, error: `Category ${categoryId} not found` },
        { status: 404 }
      );
    }

    const driveFolderId = categoryRow[9]; // J列: DriveフォルダID

    if (!driveFolderId) {
      return NextResponse.json(
        { success: false, error: `DriveフォルダID not set for category ${categoryId}` },
        { status: 400 }
      );
    }

    // 月号を "2025_11" 形式に変換
    const issueFormatted = issue.replace(/(\d{4})年(\d{1,2})月号/, (_: string, year: string, month: string) => {
      const paddedMonth = month.padStart(2, '0');
      return `${year}_${paddedMonth}`;
    });

    // ディレクトリパス: ["録音データ", "2025_11"]
    const pathSegments = ['録音データ', issueFormatted];

    // フォルダIDを解決（存在しなければ作成）
    const targetFolderId = await ensureDirectoryWithOAuth(driveFolderId, pathSegments);

    // ドキュメントを移動
    const result = await moveFileWithOAuth(documentId, targetFolderId);

    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        name: result.name,
        webViewLink: result.webViewLink,
      },
      targetFolder: `${categoryId}/録音データ/${issueFormatted}/`,
    });

  } catch (error: any) {
    console.error('Move document API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
