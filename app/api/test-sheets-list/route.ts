import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata } from '@/lib/google-sheets';

export async function GET() {
  try {
    const tasksSpreadsheetId = process.env.TASKS_SPREADSHEET_ID!;

    const metadata = await getSpreadsheetMetadata(tasksSpreadsheetId);

    const sheets = metadata.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      index: sheet.properties?.index,
    }));

    return NextResponse.json({
      success: true,
      spreadsheetId: tasksSpreadsheetId,
      sheets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
