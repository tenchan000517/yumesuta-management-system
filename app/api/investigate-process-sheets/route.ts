import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata, getSheetData } from '@/lib/google-sheets';

const SPREADSHEET_ID = '1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw';

export async function GET() {
  try {
    const report: any = {
      timestamp: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID,
      sheets: [],
      ganttSheetDetails: null,
      progressSheetDetails: null,
      otherSheets: [],
    };

    // 1. メタデータ取得
    const metadata = await getSpreadsheetMetadata(SPREADSHEET_ID);
    const sheets = metadata.sheets?.map((sheet: any) => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
      index: sheet.properties?.index,
      rowCount: sheet.properties?.gridProperties?.rowCount,
      columnCount: sheet.properties?.gridProperties?.columnCount,
    })) || [];

    report.sheets = sheets;

    // 2. ガントシート詳細調査（最新号）
    const ganttSheets = sheets.filter((s: any) => s.title.includes('逆算配置_ガント'));
    if (ganttSheets.length > 0) {
      const latestGantt = ganttSheets[ganttSheets.length - 1];

      // 全データ取得（全行、全列）
      const fullData = await getSheetData(SPREADSHEET_ID, `${latestGantt.title}!A1:ZZ1000`);

      report.ganttSheetDetails = {
        sheetName: latestGantt.title,
        dimensions: `${latestGantt.rowCount}行 × ${latestGantt.columnCount}列`,
        availableIssues: ganttSheets.map((s: any) => {
          const match = s.title.match(/(\d+年\d+月号)/);
          return match ? match[1] : '';
        }).filter(Boolean),
        headers: fullData[0] || [],
        fullData: fullData, // 全データを含める
        totalDataRows: fullData.length - 1,
        columnAnalysis: {
          columnA: '工程名',
          columnB: 'レイヤー',
          columnC: '配置理由',
          columnD_onwards: '日付列（' + (fullData[0]?.length - 3 || 0) + '列）',
        },
      };
    }

    // 3. 進捗入力シート詳細調査（全データ）
    const progressSheet = sheets.find((s: any) => s.title === '進捗入力シート');
    if (progressSheet) {
      const progressData = await getSheetData(SPREADSHEET_ID, `進捗入力シート!A1:ZZ1000`);

      report.progressSheetDetails = {
        sheetName: progressSheet.title,
        dimensions: `${progressSheet.rowCount}行 × ${progressSheet.columnCount}列`,
        headers: progressData[0] || [],
        fullData: progressData, // 全データを含める
        totalDataRows: progressData.length - 1,
      };
    }

    // 4. その他のシート（全データ取得）
    const otherSheets = sheets.filter((s: any) =>
      !s.title.includes('逆算配置_ガント') &&
      s.title !== '進捗入力シート'
    );

    for (const sheet of otherSheets) {
      // 全データを取得（最大1000行）
      const data = await getSheetData(SPREADSHEET_ID, `${sheet.title}!A1:ZZ1000`);
      report.otherSheets.push({
        sheetName: sheet.title,
        dimensions: `${sheet.rowCount}行 × ${sheet.columnCount}列`,
        headers: data[0] || [],
        fullData: data, // 全データを含める
        totalRows: data.length,
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Investigation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
