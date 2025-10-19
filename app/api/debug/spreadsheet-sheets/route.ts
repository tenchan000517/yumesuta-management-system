import { NextRequest, NextResponse } from 'next/server';
import { getSpreadsheetMetadata } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const spreadsheetId = searchParams.get('id') || process.env.SALES_SPREADSHEET_ID!;

    const metadata = await getSpreadsheetMetadata(spreadsheetId);
    const sheets = metadata.sheets?.map((sheet: any) => ({
      title: sheet.properties.title,
      sheetId: sheet.properties.sheetId,
      index: sheet.properties.index,
    }));

    return NextResponse.json({
      success: true,
      spreadsheetId,
      title: metadata.properties.title,
      sheets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
