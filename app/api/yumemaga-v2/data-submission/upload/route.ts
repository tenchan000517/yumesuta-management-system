import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { uploadFileWithOAuth, ensureDirectoryWithOAuth } from '@/lib/google-drive';
import type {
  FileUploadRequest,
  FileUploadResponse,
  DataType,
  CompanyFolderType,
} from '@/types/data-submission';

/**
 * ファイルアップロードAPI
 * POST /api/yumemaga-v2/data-submission/upload
 */
export async function POST(request: NextRequest) {
  try {
    // multipart/form-dataをパース
    const formData = await request.formData();

    // パラメータ取得
    const mode = formData.get('mode') as 'category' | 'company';

    if (!mode) {
      return NextResponse.json(
        { success: false, error: 'mode is required' } as FileUploadResponse,
        { status: 400 }
      );
    }

    // ファイル取得
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' } as FileUploadResponse,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    if (mode === 'category') {
      // カテゴリモード
      return await handleCategoryUpload(formData, files, spreadsheetId);
    } else {
      // 企業モード
      return await handleCompanyUpload(formData, files, spreadsheetId);
    }

  } catch (error: any) {
    console.error('File upload API error:', error);
    return NextResponse.json(
      { success: false, error: error.message } as FileUploadResponse,
      { status: 500 }
    );
  }
}

/**
 * カテゴリモードのアップロード処理
 */
async function handleCategoryUpload(
  formData: FormData,
  files: File[],
  spreadsheetId: string
): Promise<NextResponse<FileUploadResponse>> {
  // パラメータ取得
  const categoryId = formData.get('categoryId') as string;
  const dataType = formData.get('dataType') as DataType;
  const issue = formData.get('issue') as string; // "2025_11"

  // バリデーション
  if (!categoryId || !dataType || !issue) {
    return NextResponse.json(
      { success: false, error: 'categoryId, dataType, and issue are required' },
      { status: 400 }
    );
  }

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

  // ファイルアップロード
  const uploadedFiles = [];

  for (const file of files) {
    // ファイル種別の整合性チェック
    const detectedType = detectFileDataType(file.name);
    if (detectedType !== dataType) {
      return NextResponse.json(
        {
          success: false,
          error: `ファイル ${file.name} は ${dataType} ではありません（検出: ${detectedType}）`,
        },
        { status: 400 }
      );
    }

    const result = await uploadFileWithOAuth(targetFolderId, file);
    uploadedFiles.push({
      fileName: result.name,
      driveFileId: result.id,
      driveUrl: result.webViewLink,
    });
  }

  return NextResponse.json({
    success: true,
    uploadedFiles,
  });
}

/**
 * 企業モードのアップロード処理
 */
async function handleCompanyUpload(
  formData: FormData,
  files: File[],
  spreadsheetId: string
): Promise<NextResponse<FileUploadResponse>> {
  // パラメータ取得
  const companyMode = formData.get('companyMode') as 'existing' | 'new';
  const companyName = formData.get('companyName') as string;
  const companyFolder = formData.get('companyFolder') as CompanyFolderType;

  // バリデーション
  if (!companyMode || !companyName || !companyFolder) {
    return NextResponse.json(
      { success: false, error: 'companyMode, companyName, and companyFolder are required' },
      { status: 400 }
    );
  }

  // 新規企業の場合、企業マスターに存在しないことを確認
  if (companyMode === 'new') {
    const companyData = await getSheetData(spreadsheetId, '企業マスター!A2:A100');
    const existingCompany = companyData.find((row: any[]) => row[0] === companyName);

    if (existingCompany) {
      return NextResponse.json(
        { success: false, error: `企業 ${companyName} は既に存在します` },
        { status: 400 }
      );
    }

    // TODO: 新規企業を企業マスターに追加（Phase 7で実装予定）
  }

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

  // ディレクトリパス: ["企業名", "メイン|サブ|情報シート"]
  const pathSegments = [companyName, companyFolder];

  // フォルダIDを解決（存在しなければ作成）
  const targetFolderId = await ensureDirectoryWithOAuth(driveFolderId, pathSegments);

  // ファイルアップロード
  const uploadedFiles = [];

  for (const file of files) {
    const result = await uploadFileWithOAuth(targetFolderId, file);
    uploadedFiles.push({
      fileName: result.name,
      driveFileId: result.id,
      driveUrl: result.webViewLink,
    });
  }

  return NextResponse.json({
    success: true,
    uploadedFiles,
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
    content: '原稿',
  };
  return map[dataType];
}

/**
 * ファイル名から データ種別を検出
 */
function detectFileDataType(fileName: string): DataType | 'unknown' {
  const ext = fileName.toLowerCase().split('.').pop();

  if (['mp3', 'wav', 'm4a', 'aac'].includes(ext || '')) return 'recording';
  if (['jpg', 'jpeg', 'png', 'gif', 'raw', 'webp'].includes(ext || '')) return 'photo';
  if (['docx', 'doc', 'pdf', 'xlsx', 'xls'].includes(ext || '')) return 'planning';

  return 'unknown';
}
