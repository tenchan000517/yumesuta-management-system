import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { listFilesInFolderWithOAuth, ensureDirectoryWithOAuth } from '@/lib/google-drive';
import type { DataType, CompanyFolderType } from '@/types/data-submission';

/**
 * フォルダ内ファイル一覧取得API
 * カテゴリモード: GET /api/yumemaga-v2/data-submission/list-files?categoryId=A&dataType=recording&issue=2025_11
 * 企業モード: GET /api/yumemaga-v2/data-submission/list-files?companyName=マルトモ&folderType=ロゴ
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // カテゴリモード or 企業モード判定
    const categoryId = searchParams.get('categoryId');
    const companyName = searchParams.get('companyName');

    if (categoryId) {
      // カテゴリモード
      return await handleCategoryMode(searchParams);
    } else if (companyName) {
      // 企業モード
      return await handleCompanyMode(searchParams);
    } else {
      return NextResponse.json(
        { success: false, error: 'Either categoryId or companyName is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('List files API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * カテゴリモード処理
 */
async function handleCategoryMode(searchParams: URLSearchParams) {
  const categoryId = searchParams.get('categoryId');
  const dataType = searchParams.get('dataType') as DataType;
  const issue = searchParams.get('issue'); // "2025_11"

  // バリデーション
  if (!categoryId || !dataType || !issue) {
    return NextResponse.json(
      { success: false, error: 'categoryId, dataType, and issue are required for category mode' },
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
}

/**
 * 企業モード処理
 */
async function handleCompanyMode(searchParams: URLSearchParams) {
  const companyName = searchParams.get('companyName');
  const folderType = searchParams.get('folderType') as CompanyFolderType;

  // バリデーション
  if (!companyName || !folderType) {
    return NextResponse.json(
      { success: false, error: 'companyName and folderType are required for company mode' },
      { status: 400 }
    );
  }

  const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

  // カテゴリマスターからCカテゴリのDriveフォルダIDを取得
  const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:J100');
  const categoryRow = categoryData.find((row: any[]) => row[0] === 'C');

  if (!categoryRow) {
    return NextResponse.json(
      { success: false, error: 'Category C not found' },
      { status: 404 }
    );
  }

  const driveFolderId = categoryRow[9]; // J列: DriveフォルダID

  if (!driveFolderId) {
    return NextResponse.json(
      { success: false, error: 'DriveフォルダID not set for category C' },
      { status: 400 }
    );
  }

  // ディレクトリパス: ["企業名", "フォルダ種別"]
  const pathSegments = [companyName, folderType];
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
