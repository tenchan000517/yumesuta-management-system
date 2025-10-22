import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * 実績日更新API (V2対応)
 *
 * V2の変更点:
 * - 進捗入力シート_V2（横持ち構造）の該当セルのみ更新
 * - ヘッダー行から動的に列を特定
 * - API負荷: 大幅削減（ヘッダー行 + 該当行のみ読み込み）
 *
 * 注意: 確認送付工程（JSON管理）の実績日更新は、confirmation APIで行う
 */

/**
 * 列番号を列文字に変換（1-indexed）
 * @param col - 列番号（1=A, 26=Z, 27=AA）
 * @returns 列文字（例: "A", "Z", "AA"）
 */
function getColumnLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

export async function PUT(request: Request) {
  try {
    const { issue, processNo, actualDate } = await request.json();

    // バリデーション
    if (!issue || !processNo) {
      return NextResponse.json(
        { success: false, error: '月号と工程Noを指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 進捗入力シート_V2のヘッダー行と全データを読み込む
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート_V2!A1:GV100');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シート_V2が見つかりません' },
        { status: 404 }
      );
    }

    // 2. ヘッダー行から該当工程の実績列を特定
    const headers = progressData[0];
    let actualCol = -1;

    for (let col = 1; col < headers.length; col++) {
      const header = headers[col];
      if (!header) continue;

      // "${processNo}実績" or "${processNo}実績(JSON)" を探す
      if (header === `${processNo}実績` || header === `${processNo}実績(JSON)`) {
        actualCol = col;
        break;
      }
    }

    if (actualCol === -1) {
      return NextResponse.json(
        { success: false, error: `工程 ${processNo} が見つかりません` },
        { status: 404 }
      );
    }

    // 確認送付工程（JSON管理）はこのAPIでは更新しない
    if (headers[actualCol].includes('(JSON)')) {
      return NextResponse.json(
        { success: false, error: '確認送付工程の実績日更新は /api/yumemaga-v2/confirmation を使用してください' },
        { status: 400 }
      );
    }

    // 3. 該当月号の行を特定
    const rowIndex = progressData.findIndex((row, i) => i > 0 && row[0] === issue);

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: `月号 ${issue} が見つかりません` },
        { status: 404 }
      );
    }

    // 4. 該当セルを更新（A1記法に変換）
    const colLetter = getColumnLetter(actualCol);
    const range = `進捗入力シート_V2!${colLetter}${rowIndex + 1}`;

    console.log(`📝 実績日更新: ${range} -> "${actualDate || ''}"`);

    await updateSheetData(
      spreadsheetId,
      range,
      [[actualDate || '']]
    );

    return NextResponse.json({
      success: true,
      issue,
      processNo,
      actualDate: actualDate || '',
      updated: {
        range,
        column: colLetter,
        row: rowIndex + 1,
      }
    });

  } catch (error: any) {
    console.error('実績日更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '実績日の更新に失敗しました',
      },
      { status: 500 }
    );
  }
}
