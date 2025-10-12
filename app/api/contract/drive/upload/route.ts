import { NextRequest, NextResponse } from 'next/server';
import { uploadFileWithOAuth, ensureDirectoryWithOAuth, createFolderWithOAuth } from '@/lib/google-drive';
import { getSheetData, updateSheetCell } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    // 1. FormDataをパース
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contractId = parseInt(formData.get('contractId') as string);
    const companyId = parseInt(formData.get('companyId') as string);

    // バリデーション
    if (!file || !contractId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'file, contractId, companyId are required' },
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

    // 3. 契約企業マスタから企業情報を取得（A:Z列）
    const companyData = await getSheetData(spreadsheetId, '契約企業マスタ!A2:Z');
    const companyRow = companyData.find((row: any[]) => parseInt(row[0]) === companyId);

    if (!companyRow) {
      return NextResponse.json(
        { success: false, error: `企業ID ${companyId} が見つかりません` },
        { status: 404 }
      );
    }

    const companyName = companyRow[1]; // B列: 企業正式名称
    let companyFolderId = companyRow[25]; // Z列: 企業DriveフォルダID（インデックス25）

    // 4. AE列が空の場合、企業フォルダを作成
    if (!companyFolderId) {
      console.log(`企業フォルダを作成: ${companyName}`);
      companyFolderId = await createFolderWithOAuth(rootFolderId, companyName);

      // Z列に企業フォルダIDを書き込み（行番号 = companyRowのインデックス + 2）
      const rowIndex = companyData.findIndex((row: any[]) => parseInt(row[0]) === companyId);
      const actualRowNumber = rowIndex + 2; // ヘッダー1行 + データ開始行2行目
      await updateSheetCell(spreadsheetId, '契約企業マスタ', `Z${actualRowNumber}`, companyFolderId);

      console.log(`企業フォルダIDをZ${actualRowNumber}に記録: ${companyFolderId}`);
    }

    // 5. 契約フォルダを作成・取得（ensureDirectoryWithOAuthが自動判定）
    const contractName = `契約${String(contractId).padStart(2, '0')}`;
    const pathSegments = [contractName]; // 企業フォルダ直下に契約フォルダ
    const targetFolderId = await ensureDirectoryWithOAuth(companyFolderId, pathSegments);

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
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
