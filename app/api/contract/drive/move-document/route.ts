import { NextRequest, NextResponse } from 'next/server';
import { moveFileWithOAuth, ensureDirectoryWithOAuth, createFolderWithOAuth } from '@/lib/google-drive';
import { getSheetData, updateSheetCell } from '@/lib/google-sheets';

/**
 * GoogleドキュメントまたはスプレッドシートのURLからファイルIDを抽出
 */
function extractFileIdFromUrl(url: string): string | null {
  // GoogleドキュメントのURL: https://docs.google.com/document/d/{FILE_ID}/edit
  // スプレッドシートのURL: https://docs.google.com/spreadsheets/d/{FILE_ID}/edit
  const docPattern = /docs\.google\.com\/(document|spreadsheets)\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(docPattern);

  if (match && match[2]) {
    return match[2];
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, contractId, companyId } = body;

    // バリデーション
    if (!url || !contractId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'url, contractId, companyId are required' },
        { status: 400 }
      );
    }

    // URLからファイルIDを抽出
    const fileId = extractFileIdFromUrl(url);
    if (!fileId) {
      return NextResponse.json(
        { success: false, error: '無効なGoogleドキュメント/スプレッドシートのURLです' },
        { status: 400 }
      );
    }

    // 環境変数からルートフォルダIDを取得
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootFolderId) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_DRIVE_ROOT_FOLDER_ID is not set' },
        { status: 500 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // 契約企業マスタから企業情報を取得（A:Z列）
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

    // AE列が空の場合、企業フォルダを作成
    if (!companyFolderId) {
      console.log(`企業フォルダを作成: ${companyName}`);
      companyFolderId = await createFolderWithOAuth(rootFolderId, companyName);

      // Z列に企業フォルダIDを書き込み
      const rowIndex = companyData.findIndex((row: any[]) => parseInt(row[0]) === companyId);
      const actualRowNumber = rowIndex + 2;
      await updateSheetCell(spreadsheetId, '契約企業マスタ', `Z${actualRowNumber}`, companyFolderId);

      console.log(`企業フォルダIDをZ${actualRowNumber}に記録: ${companyFolderId}`);
    }

    // 契約フォルダを作成・取得
    const contractName = `契約${String(contractId).padStart(2, '0')}`;
    const pathSegments = [contractName];
    const targetFolderId = await ensureDirectoryWithOAuth(companyFolderId, pathSegments);

    // ファイルを移動
    const result = await moveFileWithOAuth(fileId, targetFolderId);

    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        name: result.name,
        webViewLink: result.webViewLink,
      },
    });

  } catch (error: any) {
    console.error('File move error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
