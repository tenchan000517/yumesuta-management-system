import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { Expenditure, FixedCost, ApiResponse } from '@/types/financial';

const SHEET_NAME = '支出管理マスタ';
const FIXED_COST_SHEET_NAME = '固定費マスタ';

/**
 * GET /api/expenditures/list
 * 支出一覧取得（年月フィルター対応）
 *
 * Query params:
 * - year: 年（例: 2025）
 * - month: 月（例: 10）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // スプレッドシートから全データ取得
    const rawData = await getSheetData(
      spreadsheetId,
      `${SHEET_NAME}!A:J`
    );

    // 固定費マスタも取得
    const fixedCostRawData = await getSheetData(
      spreadsheetId,
      `${FIXED_COST_SHEET_NAME}!A:H`
    );

    // データをパース
    const expenditures = parseExpenditureData(rawData);
    const fixedCosts = parseFixedCostData(fixedCostRawData);

    // 年月フィルター適用
    let filteredData = expenditures;
    if (year && month) {
      const targetYearMonth = `${year}/${month.padStart(2, '0')}`;
      filteredData = expenditures.filter(exp => {
        // 該当月のデータ、または未清算の立替金は常に表示
        if (exp.settlementStatus === 'unsettled') return true;
        if (!exp.date) return false;
        return exp.date.startsWith(targetYearMonth);
      });

      // 該当月の有効な固定費を追加
      const targetYear = parseInt(year);
      const targetMonth = parseInt(month);
      const fixedCostExpenditures = convertFixedCostsToExpenditures(
        fixedCosts,
        targetYear,
        targetMonth
      );
      filteredData = [...filteredData, ...fixedCostExpenditures];
    }

    const response: ApiResponse<Expenditure[]> = {
      success: true,
      data: filteredData
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('支出一覧取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      } as ApiResponse<Expenditure[]>,
      { status: 500 }
    );
  }
}

/**
 * スプレッドシートデータをExpenditure型に変換
 */
function parseExpenditureData(rows: any[][]): Expenditure[] {
  const data: Expenditure[] = [];

  if (!rows || rows.length === 0) return data;

  // 1行目（ヘッダー）をスキップ
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // 空行をスキップ
    if (!row || row.length === 0 || !row[0]) continue;

    // 日付が空の場合もスキップ
    if (!row[0] || row[0].trim() === '') continue;

    // 金額をパース（カンマ区切りの数値文字列を数値に変換）
    const amountStr = row[2] || '0';
    const amount = typeof amountStr === 'string'
      ? parseInt(amountStr.replace(/,/g, ''))
      : parseInt(amountStr);

    data.push({
      id: i, // 行番号をIDとして使用
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
    });
  }

  return data;
}

/**
 * カテゴリの日本語 → 英語変換
 */
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
      return 'expense'; // デフォルトは経費
  }
}

/**
 * 支払方法の日本語 → 英語変換
 */
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
      return 'cash'; // デフォルトは現金
  }
}

/**
 * 固定費用の支払方法パース（reimbursement/invoiceは除外）
 */
function parseFixedCostPaymentMethod(value: string): FixedCost['paymentMethod'] {
  const normalized = (value || '').trim();
  switch (normalized) {
    case '会社カード':
      return 'company_card';
    case '銀行振込':
      return 'bank_transfer';
    case '現金':
      return 'cash';
    default:
      return 'cash'; // デフォルトは現金
  }
}

/**
 * 清算ステータスの日本語 → 英語変換
 */
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
 * 固定費マスタデータをFixedCost型に変換
 */
function parseFixedCostData(rows: any[][]): FixedCost[] {
  const data: FixedCost[] = [];

  if (!rows || rows.length === 0) return data;

  // 1行目（ヘッダー）をスキップ
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // 空行をスキップ
    if (!row || row.length === 0 || !row[1]) continue;

    // 有効フラグのパース
    const isActive = (row[0] || '').toString().trim() === 'TRUE' || (row[0] || '').toString().trim() === '有効';

    // 金額をパース
    const amountStr = row[2] || '0';
    const amount = typeof amountStr === 'string'
      ? parseInt(amountStr.replace(/,/g, ''))
      : parseInt(amountStr);

    // 支払日をパース
    const paymentDay = parseInt(row[5]) || 1;

    data.push({
      id: i,
      isActive,
      itemName: row[1] || '',
      amount: isNaN(amount) ? 0 : amount,
      category: 'fixed_cost',
      paymentMethod: parseFixedCostPaymentMethod(row[4]),
      paymentDay,
      startMonth: row[6] || '',
      notes: row[7] || undefined
    });
  }

  return data;
}

/**
 * 固定費マスタを該当月の支出データに変換
 */
function convertFixedCostsToExpenditures(
  fixedCosts: FixedCost[],
  targetYear: number,
  targetMonth: number
): Expenditure[] {
  const expenditures: Expenditure[] = [];

  const targetYearMonth = `${targetYear}/${targetMonth.toString().padStart(2, '0')}`;

  for (const fixedCost of fixedCosts) {
    // 無効な固定費はスキップ
    if (!fixedCost.isActive) continue;

    // 開始月チェック
    if (fixedCost.startMonth) {
      const [startYear, startMonth] = fixedCost.startMonth.split('/').map(s => parseInt(s));
      if (targetYear < startYear || (targetYear === startYear && targetMonth < startMonth)) {
        continue; // まだ開始していない
      }
    }

    // 固定費を支出データに変換（IDは負の値にして区別）
    const paymentDate = `${targetYearMonth}/${fixedCost.paymentDay.toString().padStart(2, '0')}`;

    expenditures.push({
      id: -fixedCost.id, // 負の値で固定費マスタ由来であることを示す
      date: paymentDate,
      itemName: `${fixedCost.itemName}（固定費）`,
      amount: fixedCost.amount,
      category: 'fixed_cost',
      paymentMethod: fixedCost.paymentMethod,
      reimbursedPerson: undefined,
      settlementStatus: 'none',
      settlementDate: undefined,
      notes: fixedCost.notes,
      paymentScheduledDate: paymentDate
    });
  }

  return expenditures;
}
