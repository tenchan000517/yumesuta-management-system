import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata, getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // スプレッドシートのメタデータ取得（シート一覧）
    const metadata = await getSpreadsheetMetadata(spreadsheetId);
    const sheetNames = metadata.sheets?.map((sheet: any) => sheet.properties.title) || [];

    // 顧客マスタシートのデータを取得（R列、S列を含む）
    const customerData = await getSheetData(spreadsheetId, '顧客マスタ!A1:T100');

    // R列（ステータス）を直接確認
    const rColumn = await getSheetData(spreadsheetId, '顧客マスタ!R1:R30');

    return NextResponse.json({
      success: true,
      sheetNames,
      customerData: customerData.slice(0, 30), // 最初の30行のみ
      rColumnDirect: rColumn, // R列を直接取得した結果
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
