// app/api/fixed-costs/create/route.ts
import { NextResponse } from 'next/server';
import { appendSheetRow } from '@/lib/google-sheets';
import type { FixedCost, ApiResponse } from '@/types/financial';

const SHEET_NAME = '固定費マスタ';

/**
 * POST /api/fixed-costs/create
 * 新規固定費登録
 *
 * Request body: Omit<FixedCost, 'id'>
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 必須フィールドのバリデーション
    if (!body.itemName || body.amount === undefined || !body.paymentMethod || !body.paymentDay || !body.startMonth) {
      return NextResponse.json(
        {
          success: false,
          error: '必須フィールドが不足しています（itemName, amount, paymentMethod, paymentDay, startMonth）'
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // FixedCost型 → スプレッドシート行データに変換
    const rowData = convertToSheetRow(body);

    // スプレッドシートに行を追加
    await appendSheetRow(spreadsheetId, SHEET_NAME, rowData);

    return NextResponse.json({
      success: true,
      data: { message: '固定費を登録しました' },
    } as ApiResponse<{ message: string }>);
  } catch (error: any) {
    console.error('固定費登録エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '不明なエラー'
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * FixedCost型 → スプレッドシート行データに変換
 */
function convertToSheetRow(fixedCost: Omit<FixedCost, 'id'>): any[] {
  return [
    fixedCost.isActive !== undefined ? fixedCost.isActive : true, // A: 有効
    fixedCost.itemName || '',                                     // B: 項目名
    fixedCost.amount || 0,                                        // C: 金額
    '固定費',                                                     // D: カテゴリ（固定値）
    convertPaymentMethodToJapanese(fixedCost.paymentMethod),      // E: 支払方法
    fixedCost.paymentDay || 1,                                    // F: 支払日
    fixedCost.startMonth || '',                                   // G: 開始月
    fixedCost.notes || '',                                        // H: 備考
  ];
}

/**
 * 支払方法の英語 → 日本語変換
 */
function convertPaymentMethodToJapanese(method: FixedCost['paymentMethod']): string {
  switch (method) {
    case 'company_card':
      return '会社カード';
    case 'bank_transfer':
      return '銀行振込';
    case 'cash':
      return '現金';
    default:
      return '銀行振込';
  }
}
