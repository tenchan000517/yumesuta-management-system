import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.PARTNERS_SPREADSHEET_ID!;

    // Get first 10 rows to understand structure
    const data = await getSheetData(spreadsheetId, 'A1:Z10');

    return NextResponse.json({
      success: true,
      data,
      rowCount: data.length,
    });
  } catch (error: any) {
    console.error('Error fetching partner data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
