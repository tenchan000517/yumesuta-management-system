import { NextResponse } from 'next/server';
import { appendSheetRow } from '@/lib/google-sheets';
import type { Expenditure, ApiResponse } from '@/types/financial';

const SHEET_NAME = '支出管理マスタ';

/**
 * POST /api/expenditures/create
 * 新規支出登録
 *
 * Request body: Omit<Expenditure, 'id'>
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 必須フィールドのバリデーション
    if (!body.date || !body.itemName || body.amount === undefined || !body.category || !body.paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: '必須フィールドが不足しています（date, itemName, amount, category, paymentMethod）'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // Expenditure型 → スプレッドシート行データに変換
    const rowData = convertToSheetRow(body);

    // スプレッドシートに行を追加
    await appendSheetRow(spreadsheetId, SHEET_NAME, rowData);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: '支出を登録しました' }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('支出登録エラー:', error);
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

/**
 * カテゴリの英語 → 日本語変換
 */
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

/**
 * 支払方法の英語 → 日本語変換
 */
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

/**
 * 清算ステータスの英語 → 日本語変換
 */
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
