import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata, getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = '1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw';

    // まずメタデータを取得してシート名を確認
    const metadata = await getSpreadsheetMetadata(spreadsheetId);
    const sheets = metadata.sheets?.map((sheet: any) => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      index: sheet.properties?.index,
    }));

    // 逆算配置_ガントシートからデータ取得
    const ganttSheet = sheets?.find((s: any) => s.title.includes('逆算配置_ガント'));
    const progressSheet = sheets?.find((s: any) => s.title === '進捗入力シート');

    let ganttData: any[][] = [];
    let progressData: any[][] = [];

    if (ganttSheet) {
      ganttData = await getSheetData(spreadsheetId, `${ganttSheet.title}!A1:Z50`);
    }

    if (progressSheet) {
      progressData = await getSheetData(spreadsheetId, `${progressSheet.title}!A1:Z50`);
    }

    return NextResponse.json({
      success: true,
      message: 'Phase4 Gantt data fetched successfully',
      spreadsheetId,
      sheets,
      ganttData: {
        sheetTitle: ganttSheet?.title,
        rowCount: ganttData.length,
        headers: ganttData[0] || [],
        sampleRows: ganttData.slice(1, 6), // 最初の5行
      },
      progressData: {
        sheetTitle: progressSheet?.title,
        rowCount: progressData.length,
        headers: progressData[0] || [],
        sampleRows: progressData.slice(1, 6), // 最初の5行
      },
    });
  } catch (error) {
    console.error('Test Gantt API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
