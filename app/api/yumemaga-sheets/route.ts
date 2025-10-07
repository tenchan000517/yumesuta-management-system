import { NextResponse } from 'next/server';
import { getSpreadsheetMetadata, getSheetData, updateCell, appendSheetData, insertColumns, deleteColumns, deleteRows } from '@/lib/google-sheets';

export async function GET(request: Request) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;
    const { searchParams } = new URL(request.url);
    const sheetName = searchParams.get('sheet');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    // シート名が指定されている場合は、そのシートのデータを取得
    if (sheetName) {
      const range = `${sheetName}!A1:ZZ${limit}`;
      const data = await getSheetData(spreadsheetId, range);

      return NextResponse.json({
        success: true,
        data: {
          sheetName,
          rows: data,
          rowCount: data.length,
          columnCount: data[0]?.length || 0,
        },
      });
    }

    // シート名が指定されていない場合は、全シート一覧を取得
    const metadata = await getSpreadsheetMetadata(spreadsheetId);
    const sheets = metadata.sheets.map((sheet: any) => ({
      title: sheet.properties.title,
      sheetId: sheet.properties.sheetId,
      index: sheet.properties.index,
      rowCount: sheet.properties.gridProperties?.rowCount || 0,
      columnCount: sheet.properties.gridProperties?.columnCount || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        spreadsheetId,
        sheets,
        totalSheets: sheets.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching yumemaga sheets:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;
    const body = await request.json();
    const { sheetName, row, col, value } = body;

    if (!sheetName || !row || !col) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sheetName, row, col' },
        { status: 400 }
      );
    }

    await updateCell(spreadsheetId, sheetName, row, col, value);

    return NextResponse.json({
      success: true,
      message: `Updated cell ${String.fromCharCode(64 + col)}${row} in ${sheetName}`,
    });
  } catch (error: any) {
    console.error('Error updating cell:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;
    const body = await request.json();
    const { action, sheetName, sheetId, rows, startIndex, count } = body;

    if (action === 'appendRows') {
      if (!sheetName || !rows || !Array.isArray(rows)) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: sheetName, rows (array)' },
          { status: 400 }
        );
      }

      await appendSheetData(spreadsheetId, sheetName, rows);

      return NextResponse.json({
        success: true,
        message: `Appended ${rows.length} rows to ${sheetName}`,
      });
    } else if (action === 'insertColumns') {
      if (sheetId === undefined || startIndex === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: sheetId, startIndex' },
          { status: 400 }
        );
      }

      await insertColumns(spreadsheetId, sheetId, startIndex, count || 1);

      return NextResponse.json({
        success: true,
        message: `Inserted ${count || 1} column(s) at index ${startIndex}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "appendRows" or "insertColumns"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;
    const body = await request.json();
    const { type, sheetId, startIndex, count } = body;

    if (sheetId === undefined || startIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sheetId, startIndex' },
        { status: 400 }
      );
    }

    if (type === 'columns') {
      await deleteColumns(spreadsheetId, sheetId, startIndex, count || 1);
      return NextResponse.json({
        success: true,
        message: `Deleted ${count || 1} column(s) from index ${startIndex}`,
      });
    } else if (type === 'rows') {
      await deleteRows(spreadsheetId, sheetId, startIndex, count || 1);
      return NextResponse.json({
        success: true,
        message: `Deleted ${count || 1} row(s) from index ${startIndex}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Use "columns" or "rows"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in DELETE request:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
