import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { listFilesInFolderWithOAuth, ensureDirectoryWithOAuth } from '@/lib/google-drive';
import type { DataType } from '@/types/data-submission';

/**
 * フォルダ内ファイル一覧取得API
 * GET /api/yumemaga-v2/data-submission/list-files?categoryId=A&dataType=recording&issue=2025_11
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const dataType = searchParams.get('dataType') as DataType;
    const issue = searchParams.get('issue'); // "2025_11"

    // バリデーション
    if (!categoryId || !dataType || !issue) {
      return NextResponse.json(
        { success: false, error: 'categoryId, dataType, and issue are required' },
        { status: 400 }
      );
    }

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

    // データ種別名を取得
    const dataTypeName = getDataTypeFolderName(dataType);

    // ディレクトリパス: ["録音データ", "2025_11"]
    const pathSegments = [dataTypeName, issue];

    // フォルダIDを解決（存在しなければ作成）
    const targetFolderId = await ensureDirectoryWithOAuth(driveFolderId, pathSegments);

    // ファイル一覧を取得
    const files = await listFilesInFolderWithOAuth(targetFolderId);

    // レスポンスを整形
    const fileList = files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size) : 0,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
    }));

    return NextResponse.json({
      success: true,
      folderId: targetFolderId,
      files: fileList,
      count: fileList.length,
    });

  } catch (error: any) {
    console.error('List files API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * データ種別からフォルダ名を取得
 */
function getDataTypeFolderName(dataType: DataType): string {
  const map: Record<DataType, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
  };
  return map[dataType];
}
