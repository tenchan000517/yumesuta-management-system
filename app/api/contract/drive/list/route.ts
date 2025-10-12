import { NextRequest, NextResponse } from 'next/server';
import { listFilesInFolderWithOAuth, ensureDirectoryWithOAuth, createFolderWithOAuth } from '@/lib/google-drive';
import { getSheetData, updateSheetCell } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    // 1. クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const contractId = parseInt(searchParams.get('contractId') || '');
    const companyId = parseInt(searchParams.get('companyId') || '');

    // バリデーション
    if (!contractId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'contractId and companyId are required' },
        { status: 400 }
      );
    }

    // 2. 環境変数からルートフォルダIDを取得
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootFolderId) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_DRIVE_ROOT_FOLDER_ID is not set' },
        { status: 500 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // 3. 契約企業マスタから企業情報を取得
    const companyData = await getSheetData(spreadsheetId, '契約企業マスタ!A2:Z');
    const companyRow = companyData.find((row: any[]) => parseInt(row[0]) === companyId);

    if (!companyRow) {
      return NextResponse.json(
        { success: false, error: `企業ID ${companyId} が見つかりません` },
        { status: 404 }
      );
    }

    const companyName = companyRow[1];
    let companyFolderId = companyRow[25]; // Z列（26列目、インデックス25）

    // 4. AE列が空の場合、企業フォルダを作成（アップロード前にリスト取得する場合に備えて）
    if (!companyFolderId) {
      console.log(`企業フォルダを作成: ${companyName}`);
      companyFolderId = await createFolderWithOAuth(rootFolderId, companyName);

      const rowIndex = companyData.findIndex((row: any[]) => parseInt(row[0]) === companyId);
      const actualRowNumber = rowIndex + 2;
      await updateSheetCell(spreadsheetId, '契約企業マスタ', `Z${actualRowNumber}`, companyFolderId);
    }

    // 5. 契約フォルダを取得
    const contractName = `契約${String(contractId).padStart(2, '0')}`;
    const pathSegments = [contractName];
    const targetFolderId = await ensureDirectoryWithOAuth(companyFolderId, pathSegments);

    // 6. ファイル一覧を取得
    const files = await listFilesInFolderWithOAuth(targetFolderId);

    // 7. Google Driveでフォルダを開くURL
    const driveFolderUrl = `https://drive.google.com/drive/folders/${targetFolderId}`;

    // 8. レスポンスを整形
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
      files: fileList,
      driveFolderUrl,
    });

  } catch (error: any) {
    console.error('List files error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
