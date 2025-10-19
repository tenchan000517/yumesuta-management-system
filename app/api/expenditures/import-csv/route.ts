import { NextResponse } from 'next/server';
import { appendSheetData } from '@/lib/google-sheets';
import type { Expenditure, ApiResponse } from '@/types/financial';

const SHEET_NAME = '支出管理マスタ';

/**
 * POST /api/expenditures/import-csv
 * CSV一括登録
 *
 * Request body: { expenditures: Omit<Expenditure, 'id'>[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.expenditures || !Array.isArray(body.expenditures)) {
      return NextResponse.json(
        {
          success: false,
          error: 'expenditures配列が必要です'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const expenditures = body.expenditures;

    if (expenditures.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '登録するデータがありません'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 各データのバリデーション
    const errors: string[] = [];
    const rowsData: any[][] = [];

    for (let i = 0; i < expenditures.length; i++) {
      const exp = expenditures[i];

      // 必須フィールドのバリデーション
      if (!exp.date || !exp.itemName || exp.amount === undefined || !exp.category || !exp.paymentMethod) {
        errors.push(`${i + 1}行目: 必須フィールドが不足しています（date, itemName, amount, category, paymentMethod）`);
        continue;
      }

      // スプレッドシート行データに変換
      const rowData = convertToSheetRow(exp);
      rowsData.push(rowData);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `バリデーションエラー:\n${errors.join('\n')}`
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (rowsData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '有効なデータがありません'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // スプレッドシートに一括追加
    await appendSheetData(spreadsheetId, SHEET_NAME, rowsData);

    const response: ApiResponse<{ message: string; count: number }> = {
      success: true,
      data: {
        message: `${rowsData.length}件の支出を登録しました`,
        count: rowsData.length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('CSV一括登録エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * Expenditure型 → スプレッドシート行データに変換
 */
function convertToSheetRow(expenditure: Omit<Expenditure, 'id'>): any[] {
  return [
    expenditure.date || '',                                    // A: 日付
    expenditure.itemName || '',                                // B: 項目名
    expenditure.amount || 0,                                   // C: 金額
    convertCategoryToJapanese(expenditure.category),          // D: カテゴリ
    convertPaymentMethodToJapanese(expenditure.paymentMethod), // E: 支払方法
    expenditure.reimbursedPerson || '',                        // F: 立替者名
    convertSettlementStatusToJapanese(expenditure.settlementStatus), // G: 清算ステータス
    expenditure.settlementDate || '',                          // H: 清算日
    expenditure.notes || '',                                   // I: 備考
    expenditure.paymentScheduledDate || ''                     // J: 支払予定日
  ];
}

function convertCategoryToJapanese(category: Expenditure['category']): string {
  switch (category) {
    case 'expense':
      return '経費';
    case 'salary':
      return '給与';
    case 'fixed_cost':
      return '固定費';
    default:
      return '経費';
  }
}

function convertPaymentMethodToJapanese(method: Expenditure['paymentMethod']): string {
  switch (method) {
    case 'company_card':
      return '会社カード';
    case 'reimbursement':
      return '立替';
    case 'bank_transfer':
      return '銀行振込';
    case 'cash':
      return '現金';
    case 'invoice':
      return '請求書';
    default:
      return '現金';
  }
}

function convertSettlementStatusToJapanese(status: Expenditure['settlementStatus']): string {
  switch (status) {
    case 'unsettled':
      return '未清算';
    case 'settled':
      return '清算済み';
    case 'none':
      return '-';
    default:
      return '-';
  }
}
