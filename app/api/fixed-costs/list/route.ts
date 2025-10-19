// app/api/fixed-costs/list/route.ts
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { FixedCost, ApiResponse } from '@/types/financial';

/**
 * 固定費マスタのパース関数
 */
function parseFixedCostData(data: any[][]): FixedCost[] {
  if (!data || data.length <= 1) return [];

  const fixedCosts: FixedCost[] = [];

  // ヘッダー行をスキップ（data[0]）
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // 空行スキップ
    if (!row || row.length === 0 || !row[1]) continue;

    const fixedCost: FixedCost = {
      id: i + 1, // 行番号（1始まり、ヘッダーを含むため +1）
      isActive: row[0] === true || row[0] === 'TRUE' || row[0] === 'true',
      itemName: String(row[1] || ''),
      amount: Number(row[2] || 0),
      category: 'fixed_cost',
      paymentMethod: convertPaymentMethod(row[4]),
      paymentDay: Number(row[5] || 1),
      startMonth: String(row[6] || ''),
      notes: row[7] ? String(row[7]) : undefined,
    };

    fixedCosts.push(fixedCost);
  }

  return fixedCosts;
}

/**
 * 支払方法の変換
 */
function convertPaymentMethod(value: string): FixedCost['paymentMethod'] {
  switch (value) {
    case '会社カード':
      return 'company_card';
    case '銀行振込':
      return 'bank_transfer';
    case '現金':
      return 'cash';
    default:
      return 'bank_transfer';
  }
}

/**
 * GET /api/fixed-costs/list
 * 固定費マスタの一覧を取得
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'SALES_SPREADSHEET_ID not configured' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // 固定費マスタシートからデータ取得
    const range = '固定費マスタ!A:H';
    const data = await getSheetData(spreadsheetId, range);

    const fixedCosts = parseFixedCostData(data);

    return NextResponse.json({
      success: true,
      data: fixedCosts,
    } as ApiResponse<FixedCost[]>);
  } catch (error: any) {
    console.error('Error fetching fixed costs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch fixed costs' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
