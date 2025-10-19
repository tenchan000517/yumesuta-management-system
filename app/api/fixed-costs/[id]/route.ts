// app/api/fixed-costs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getSheetData, updateSheetRow } from '@/lib/google-sheets';
import type { FixedCost, ApiResponse } from '@/types/financial';

const SHEET_NAME = '固定費マスタ';

/**
 * GET /api/fixed-costs/[id]
 * 固定費詳細取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fixedCostId = parseInt(id);

    if (isNaN(fixedCostId)) {
      return NextResponse.json(
        { success: false, error: '無効なIDです' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // スプレッドシートから全データ取得
    const rawData = await getSheetData(spreadsheetId, `${SHEET_NAME}!A:H`);

    // 該当行を検索（行番号 = ID）
    if (fixedCostId < 1 || fixedCostId >= rawData.length) {
      return NextResponse.json(
        { success: false, error: '固定費が見つかりません' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const row = rawData[fixedCostId];

    // 空行チェック
    if (!row || row.length === 0 || !row[1]) {
      return NextResponse.json(
        { success: false, error: '固定費が見つかりません' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // FixedCost型に変換
    const fixedCost = parseFixedCostRow(row, fixedCostId);

    return NextResponse.json({
      success: true,
      data: fixedCost,
    } as ApiResponse<FixedCost>);
  } catch (error: any) {
    console.error('固定費詳細取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message || '不明なエラー' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * 行データをFixedCost型に変換
 */
function parseFixedCostRow(row: any[], id: number): FixedCost {
  return {
    id,
    isActive: row[0] === true || row[0] === 'TRUE' || row[0] === 'true',
    itemName: String(row[1] || ''),
    amount: Number(row[2] || 0),
    category: 'fixed_cost',
    paymentMethod: parsePaymentMethod(row[4]),
    paymentDay: Number(row[5] || 1),
    startMonth: String(row[6] || ''),
    notes: row[7] ? String(row[7]) : undefined,
  };
}

function parsePaymentMethod(value: string): FixedCost['paymentMethod'] {
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
 * PUT /api/fixed-costs/[id]
 * 固定費更新
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fixedCostId = parseInt(id);

    if (isNaN(fixedCostId)) {
      return NextResponse.json(
        { success: false, error: '無効なIDです' } as ApiResponse<null>,
        { status: 400 }
      );
    }

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

    // IDの存在確認
    const rawData = await getSheetData(spreadsheetId, `${SHEET_NAME}!A:H`);

    if (fixedCostId < 1 || fixedCostId >= rawData.length) {
      return NextResponse.json(
        { success: false, error: '固定費が見つかりません' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const row = rawData[fixedCostId];
    if (!row || row.length === 0 || !row[1]) {
      return NextResponse.json(
        { success: false, error: '固定費が見つかりません' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // FixedCost型 → スプレッドシート行データに変換
    const rowData = convertToSheetRow(body);

    // スプレッドシートの行番号（1-indexed）= fixedCostId + 1（ヘッダー行分）
    const sheetRowNumber = fixedCostId + 1;

    // 行を更新
    await updateSheetRow(spreadsheetId, SHEET_NAME, sheetRowNumber, rowData);

    return NextResponse.json({
      success: true,
      data: { message: '固定費を更新しました' },
    } as ApiResponse<{ message: string }>);
  } catch (error: any) {
    console.error('固定費更新エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message || '不明なエラー' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fixed-costs/[id]
 * 固定費削除（有効フラグをfalseに変更）
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fixedCostId = parseInt(id);

    if (isNaN(fixedCostId)) {
      return NextResponse.json(
        { success: false, error: '無効なIDです' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // IDの存在確認
    const rawData = await getSheetData(spreadsheetId, `${SHEET_NAME}!A:H`);

    if (fixedCostId < 1 || fixedCostId >= rawData.length) {
      return NextResponse.json(
        { success: false, error: '固定費が見つかりません' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const row = rawData[fixedCostId];
    if (!row || row.length === 0 || !row[1]) {
      return NextResponse.json(
        { success: false, error: '固定費が見つかりません' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // 固定費は削除ではなく、有効フラグをfalseに変更
    const sheetRowNumber = fixedCostId + 1;

    // 行全体を取得してA列だけをfalseに変更
    const updatedRow = [...row];
    updatedRow[0] = false; // A列: 有効フラグ

    // 行全体を更新
    await updateSheetRow(spreadsheetId, SHEET_NAME, sheetRowNumber, updatedRow);

    return NextResponse.json({
      success: true,
      data: { message: '固定費を無効化しました' },
    } as ApiResponse<{ message: string }>);
  } catch (error: any) {
    console.error('固定費削除エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message || '不明なエラー' } as ApiResponse<null>,
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
