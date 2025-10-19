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
  // V列=ステップ1完了日、W列=ステップ2完了日、...、AH列=ステップ13完了日
  // R～U列は財務諸表用フィールド（契約開始日、契約期間、自動更新有無、自動更新後の金額）

  const mapping: Record<number, Record<string, string>> = {
    1: {
      V: dateStr  // ステップ1完了日
    },
    2: {
      W: dateStr   // ステップ2完了日（基本契約書作成）
    },
    3: {
      H: dateStr,  // 契約書送付日（基本契約書の押印・送信）
      X: dateStr   // ステップ3完了日
    },
    4: {
      Y: dateStr   // ステップ4完了日（申込書作成）
    },
    5: {
      J: dateStr,  // 申込書送付日（申込書の押印・送信）
      Z: dateStr   // ステップ5完了日
    },
    6: {
      AA: dateStr   // ステップ6完了日（重要事項説明）
    },
    7: {
      I: dateStr,  // 契約書回収日（契約完了確認）
      K: dateStr,  // 申込書回収日（契約完了確認）
      AB: dateStr   // ステップ7完了日
    },
    8: {
      AC: dateStr   // ステップ8完了日（請求書作成・送付）
    },
    9: {
      M: dateStr,      // 入金実績日
      N: '入金済',     // 入金ステータス
      AD: dateStr       // ステップ9完了日
    },
    10: {
      AE: dateStr  // ステップ10完了日（入金管理シート更新）
    },
    11: {
      AF: dateStr  // ステップ11完了日（入金確認連絡・原稿依頼）
    },
    12: {
      AG: dateStr  // ステップ12完了日（制作・校正）
    },
    13: {
      AH: dateStr  // ステップ13完了日（掲載）
    }
  };

  return mapping[stepNumber] || {};
}
