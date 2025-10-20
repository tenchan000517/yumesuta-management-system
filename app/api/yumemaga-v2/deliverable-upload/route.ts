import { NextRequest, NextResponse } from 'next/server';
import { uploadFileWithOAuth, ensureDirectoryWithOAuth } from '@/lib/google-drive';
import { getSheetData } from '@/lib/google-sheets';

/**
 * 成果物アップロードAPI
 * POST /api/yumemaga-v2/deliverable-upload
 */
export async function POST(request: NextRequest) {
  try {
    // 1. FormDataをパース
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const processNo = formData.get('processNo') as string;
    const issue = formData.get('issue') as string;

    // バリデーション
    if (!file || !processNo || !issue) {
      return NextResponse.json(
        { success: false, error: 'file, processNo, issue are required' },
        { status: 400 }
      );
    }

    // ファイル形式チェック
    const fileName = file.name;
    const ext = fileName.toLowerCase().split('.').pop();
    if (!['txt', 'md', 'docx'].includes(ext || '')) {
      return NextResponse.json(
        { success: false, error: '対応形式: .txt, .md, .docx' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 2. カテゴリマスターからDriveフォルダIDを取得
    const categoryId = processNo.split('-')[0]; // 例: A-3 → A
    const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:J100');
    const categoryRow = categoryData.find((row: any[]) => row[0] === categoryId);

    if (!categoryRow) {
      return NextResponse.json(
        { success: false, error: `カテゴリ${categoryId}が見つかりません` },
        { status: 404 }
      );
    }

    const driveFolderId = categoryRow[9]; // J列: DriveフォルダID

    if (!driveFolderId) {
      return NextResponse.json(
        { success: false, error: `カテゴリ${categoryId}のDriveフォルダIDが設定されていません` },
        { status: 400 }
      );
    }

    // 3. 月号フォーマット変換: "2025年11月号" → "2025_11"
    const issueFormatted = issue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
      const paddedMonth = month.padStart(2, '0');
      return `${year}_${paddedMonth}`;
    });

    // 4. ディレクトリパス: ["原稿", "2025_11"]
    const pathSegments = ['原稿', issueFormatted];

    // 5. フォルダIDを解決（存在しなければ作成）
    const targetFolderId = await ensureDirectoryWithOAuth(driveFolderId, pathSegments);

    // 6. ファイルをアップロード
    const result = await uploadFileWithOAuth(targetFolderId, file);

    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        name: result.name,
        webViewLink: result.webViewLink,
      },
    });

  } catch (error: any) {
    console.error('成果物アップロードエラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
