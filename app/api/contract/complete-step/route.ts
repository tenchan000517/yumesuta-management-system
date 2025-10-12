// app/api/contract/complete-step/route.ts
import { NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';

export async function POST(request: Request) {
  try {
    const { contractId, stepNumber } = await request.json();

    // バリデーション
    if (!contractId || !stepNumber) {
      return NextResponse.json(
        { success: false, error: '契約IDとステップ番号が必要です' },
        { status: 400 }
      );
    }

    if (stepNumber < 1 || stepNumber > 13) {
      return NextResponse.json(
        { success: false, error: 'ステップ番号は1〜13の範囲で指定してください' },
        { status: 400 }
      );
    }

    // 今日の日付（YYYY/MM/DD形式）
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    // ステップ番号に応じて更新する列を決定
    const updates = getColumnsToUpdate(stepNumber, dateStr);

    // Google Sheets API初期化
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const sheetName = '契約・入金管理';

    // 契約IDから行番号を取得
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    });

    const rowIndex = existingData.data.values?.findIndex(
      (row, index) => index > 0 && parseInt(row[0]) === parseInt(contractId)
    );

    if (rowIndex === undefined || rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: '契約が見つかりません' },
        { status: 404 }
      );
    }

    const actualRowNumber = rowIndex + 1; // 1-indexed

    // 各列を更新（batchUpdate使用）
    const batchUpdateData = Object.entries(updates).map(([column, value]) => ({
      range: `${sheetName}!${column}${actualRowNumber}`,
      values: [[value]]
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: batchUpdateData
      }
    });

    console.log(`✅ ステップ${stepNumber}完了: 契約ID ${contractId} (行${actualRowNumber})`);
    console.log(`   更新列:`, updates);

    return NextResponse.json({
      success: true,
      updatedFields: updates,
      rowNumber: actualRowNumber
    });

  } catch (error) {
    console.error('ステップ完了エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

/**
 * ステップ番号に応じて更新する列を決定する関数
 * @param stepNumber ステップ番号（1〜13）
 * @param dateStr 日付文字列（YYYY/MM/DD形式）
 * @returns 列名と値のマッピング
 */
function getColumnsToUpdate(stepNumber: number, dateStr: string): Record<string, string> {
  // 実際のスプレッドシート構造に基づくマッピング
  // R列=ステップ1完了日、S列=ステップ2完了日、...、AD列=ステップ13完了日

  const mapping: Record<number, Record<string, string>> = {
    1: {
      R: dateStr  // ステップ1完了日
    },
    2: {
      H: dateStr,  // 契約書送付日
      S: dateStr   // ステップ2完了日
    },
    3: {
      I: dateStr,  // 契約書回収日
      T: dateStr   // ステップ3完了日
    },
    4: {
      J: dateStr,  // 申込書送付日
      U: dateStr   // ステップ4完了日
    },
    5: {
      K: dateStr,  // 申込書回収日
      V: dateStr   // ステップ5完了日
    },
    6: {
      W: dateStr   // ステップ6完了日
    },
    7: {
      X: dateStr   // ステップ7完了日
    },
    8: {
      Y: dateStr   // ステップ8完了日
    },
    9: {
      M: dateStr,      // 入金実績日
      N: '入金済',     // 入金ステータス
      Z: dateStr       // ステップ9完了日
    },
    10: {
      AA: dateStr  // ステップ10完了日
    },
    11: {
      AB: dateStr  // ステップ11完了日
    },
    12: {
      AC: dateStr  // ステップ12完了日
    },
    13: {
      AD: dateStr  // ステップ13完了日
    }
  };

  return mapping[stepNumber] || {};
}
