import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { listFilesInFolderWithOAuth } from '@/lib/google-drive';

/**
 * 前月Google Forms取得API
 * GET /api/yumemaga-v2/get-previous-form?processNo=B-3&issue=2025年11月号
 *
 * 前月フォルダからGoogle Formsを取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const processNo = searchParams.get('processNo');
    const issue = searchParams.get('issue');

    // バリデーション
    if (!processNo || !issue) {
      return NextResponse.json(
        { success: false, error: 'processNo and issue are required' },
        { status: 400 }
      );
    }

    // processNoからカテゴリIDを抽出（例: "B-3" → "B"）
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

    // 前月の月号を計算
    const match = issue.match(/(\d{4})年(\d{1,2})月号/);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Invalid issue format' },
        { status: 400 }
      );
    }

    const year = parseInt(match[1]);
    const month = parseInt(match[2]);

    // 前月を計算
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    const prevIssueFormatted = `${prevYear}_${prevMonth.toString().padStart(2, '0')}`;

    // 前月フォルダのパスを構築
    // Google Drive APIでフォルダを探索
    // 簡易実装: "録音データ" フォルダ配下を検索
    const drive = await import('@/lib/google-drive');

    // まず "録音データ" フォルダを探す
    const recordingFolderId = await findFolderIdByPath(driveFolderId, ['録音データ', prevIssueFormatted]);

    if (!recordingFolderId) {
      return NextResponse.json({
        success: true,
        previousForm: null,
        message: `前月（${prevYear}年${prevMonth}月号）のフォルダが見つかりませんでした`,
      });
    }

    // フォルダ内のGoogle Formsを取得
    const files = await listFilesInFolderWithOAuth(recordingFolderId);
    const googleForms = files.filter((file: any) =>
      file.mimeType === 'application/vnd.google-apps.form'
    );

    if (googleForms.length === 0) {
      return NextResponse.json({
        success: true,
        previousForm: null,
        message: `前月（${prevYear}年${prevMonth}月号）のフォルダにGoogle Formsが見つかりませんでした`,
      });
    }

    // 最新のフォームを返す（modifiedTime desc でソート済み）
    const latestForm = googleForms[0];

    return NextResponse.json({
      success: true,
      previousForm: {
        id: latestForm.id,
        name: latestForm.name,
        webViewLink: latestForm.webViewLink,
        modifiedTime: latestForm.modifiedTime,
      },
      previousIssue: `${prevYear}年${prevMonth}月号`,
    });

  } catch (error: any) {
    console.error('Get previous form API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * パスを辿ってフォルダIDを取得
 */
async function findFolderIdByPath(
  rootFolderId: string,
  pathSegments: string[]
): Promise<string | null> {
  const drive = await import('@/lib/google-drive');
  let currentFolderId = rootFolderId;

  for (const segment of pathSegments) {
    const files = await listFilesInFolderWithOAuth(currentFolderId);
    const folder = files.find((file: any) =>
      file.name === segment && file.mimeType === 'application/vnd.google-apps.folder'
    );

    if (!folder || !folder.id) {
      return null;
    }

    currentFolderId = folder.id;
  }

  return currentFolderId;
}
