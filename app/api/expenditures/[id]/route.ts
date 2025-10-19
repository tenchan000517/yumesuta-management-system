import { NextResponse } from 'next/server';
import { getSheetData, updateSheetRow, deleteRows } from '@/lib/google-sheets';
import { calculatePaymentScheduledDate } from '@/lib/payment-schedule';
import type { Expenditure, ApiResponse } from '@/types/financial';

const SHEET_NAME = '支出管理マスタ';

/**
 * GET /api/expenditures/[id]
 * 支出詳細取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenditureId = parseInt(id);

    if (isNaN(expenditureId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効なIDです'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // スプレッドシートから全データ取得
    const rawData = await getSheetData(
      spreadsheetId,
      `${SHEET_NAME}!A:J`
    );

    // 該当行を検索（行番号 = ID + ヘッダー行）
    if (expenditureId < 1 || expenditureId >= rawData.length) {
      return NextResponse.json(
        {
          success: false,
          error: '支出が見つかりません'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const row = rawData[expenditureId];

    // 空行チェック
    if (!row || row.length === 0 || !row[0]) {
      return NextResponse.json(
        {
          success: false,
          error: '支出が見つかりません'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Expenditure型に変換
    const expenditure = parseExpenditureRow(row, expenditureId);

    const response: ApiResponse<Expenditure> = {
      success: true,
      data: expenditure
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('支出詳細取得エラー:', error);
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
 * 行データをExpenditure型に変換
 */
function parseExpenditureRow(row: any[], id: number): Expenditure {
  const amountStr = row[2] || '0';
  const amount = typeof amountStr === 'string'
    ? parseInt(amountStr.replace(/,/g, ''))
    : parseInt(amountStr);

  return {
    id,
    date: row[0] || '',
    itemName: row[1] || '',
    amount: isNaN(amount) ? 0 : amount,
    category: parseCategory(row[3]),
    paymentMethod: parsePaymentMethod(row[4]),
    reimbursedPerson: row[5] || undefined,
    settlementStatus: parseSettlementStatus(row[6]),
    settlementDate: row[7] || undefined,
    notes: row[8] || undefined,
    paymentScheduledDate: row[9] || undefined
  };
}

function parseCategory(value: string): Expenditure['category'] {
  const normalized = (value || '').trim();
  switch (normalized) {
    case '経費':
      return 'expense';
    case '給与':
      return 'salary';
    case '固定費':
      return 'fixed_cost';
    default:
      return 'expense';
  }
}

function parsePaymentMethod(value: string): Expenditure['paymentMethod'] {
  const normalized = (value || '').trim();
  switch (normalized) {
    case '会社カード':
      return 'company_card';
    case '立替':
      return 'reimbursement';
    case '銀行振込':
      return 'bank_transfer';
    case '現金':
      return 'cash';
    case '請求書':
      return 'invoice';
    default:
      return 'cash';
  }
}

function parseSettlementStatus(value: string): Expenditure['settlementStatus'] {
  const normalized = (value || '').trim();
  switch (normalized) {
    case '未清算':
      return 'unsettled';
    case '清算済み':
      return 'settled';
    case '-':
    case '':
      return 'none';
    default:
      return 'none';
  }
}

/**
 * PUT /api/expenditures/[id]
 * 支出更新
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenditureId = parseInt(id);

    if (isNaN(expenditureId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効なIDです'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

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

    // 支払予定日の自動計算（bodyに指定がない場合）
    if (!body.paymentScheduledDate) {
      body.paymentScheduledDate = await calculatePaymentScheduledDate(body);
    }

    // IDの存在確認
    const rawData = await getSheetData(
      spreadsheetId,
      `${SHEET_NAME}!A:J`
    );

    if (expenditureId < 1 || expenditureId >= rawData.length) {
      return NextResponse.json(
        {
          success: false,
          error: '支出が見つかりません'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const row = rawData[expenditureId];
    if (!row || row.length === 0 || !row[0]) {
      return NextResponse.json(
        {
          success: false,
          error: '支出が見つかりません'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Expenditure型 → スプレッドシート行データに変換
    const rowData = convertToSheetRow(body);

    // スプレッドシートの行番号（1-indexed）= expenditureId + 1（ヘッダー行分）
    const sheetRowNumber = expenditureId + 1;

    // 行を更新
    await updateSheetRow(spreadsheetId, SHEET_NAME, sheetRowNumber, rowData);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: '支出を更新しました' }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('支出更新エラー:', error);
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
 * DELETE /api/expenditures/[id]
 * 支出削除
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenditureId = parseInt(id);

    if (isNaN(expenditureId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効なIDです'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // IDの存在確認
    const rawData = await getSheetData(
      spreadsheetId,
      `${SHEET_NAME}!A:J`
    );

    if (expenditureId < 1 || expenditureId >= rawData.length) {
      return NextResponse.json(
        {
          success: false,
          error: '支出が見つかりません'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const row = rawData[expenditureId];
    if (!row || row.length === 0 || !row[0]) {
      return NextResponse.json(
        {
          success: false,
          error: '支出が見つかりません'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // スプレッドシートのメタデータを取得してsheetIdを取得する必要がある
    // 簡易的に、行を空にする方法で削除を実装
    const emptyRow = ['', '', '', '', '', '', '', '', '', ''];
    const sheetRowNumber = expenditureId + 1;

    await updateSheetRow(spreadsheetId, SHEET_NAME, sheetRowNumber, emptyRow);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: '支出を削除しました' }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('支出削除エラー:', error);
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
