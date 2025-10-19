import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { ExpenditureSummary, ApiResponse } from '@/types/financial';

const SHEET_NAME = '支出管理マスタ';
const FIXED_COST_SHEET_NAME = '固定費マスタ';

/**
 * GET /api/expenditures/summary?year=2025&month=10
 * 月次サマリー取得
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        {
          success: false,
          error: 'yearとmonthパラメータが必要です'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        {
          success: false,
          error: '無効な年月です'
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

    // 固定費マスタも取得
    const fixedCostRawData = await getSheetData(
      spreadsheetId,
      `${FIXED_COST_SHEET_NAME}!A:H`
    );

    // ヘッダー行をスキップ
    const dataRows = rawData.slice(1);
    const fixedCostRows = fixedCostRawData.slice(1);

    // サマリーの初期化
    let expenseTotal = 0;
    let salaryTotal = 0;
    let fixedCostTotal = 0;
    let unsettledCount = 0;
    let unsettledAmount = 0;

    // 各行を処理
    for (const row of dataRows) {
      // 空行をスキップ
      if (!row || row.length === 0 || !row[0]) {
        continue;
      }

      const date = row[0] || '';
      const amountStr = row[2] || '0';
      const category = (row[3] || '').trim();
      const paymentMethod = (row[4] || '').trim();
      const settlementStatus = (row[6] || '').trim();

      // 日付フィルタリング（YYYY/MM/DD形式）
      const dateMatch = date.match(/^(\d{4})\/(\d{1,2})\/\d{1,2}$/);
      if (!dateMatch) {
        continue;
      }

      const rowYear = parseInt(dateMatch[1]);
      const rowMonth = parseInt(dateMatch[2]);

      // 該当月のデータのみ集計（未清算の立替金は後で別途集計）
      const isTargetMonth = (rowYear === yearNum && rowMonth === monthNum);
      if (!isTargetMonth && settlementStatus !== '未清算') {
        continue;
      }

      // 金額をパース
      const amount = typeof amountStr === 'string'
        ? parseInt(amountStr.replace(/,/g, ''))
        : parseInt(amountStr);

      if (isNaN(amount)) {
        continue;
      }

      // 該当月のデータのみカテゴリ別に集計
      if (isTargetMonth) {
        switch (category) {
          case '経費':
            expenseTotal += amount;
            break;
          case '給与':
            salaryTotal += amount;
            break;
          case '固定費':
            fixedCostTotal += amount;
            break;
        }
      }

      // 未清算の立替金は常に集計（該当月以外も含む）
      if (paymentMethod === '立替' && settlementStatus === '未清算') {
        unsettledCount++;
        unsettledAmount += amount;
      }
    }

    // 固定費マスタから該当月の固定費を集計
    for (const row of fixedCostRows) {
      // 空行をスキップ
      if (!row || row.length === 0 || !row[1]) {
        continue;
      }

      // 有効フラグのチェック
      const isActive = (row[0] || '').toString().trim() === 'TRUE' || (row[0] || '').toString().trim() === '有効';
      if (!isActive) {
        continue;
      }

      // 開始月チェック
      const startMonth = row[6] || '';
      if (startMonth) {
        const [startYear, startMonthNum] = startMonth.split('/').map(s => parseInt(s));
        if (yearNum < startYear || (yearNum === startYear && monthNum < startMonthNum)) {
          continue; // まだ開始していない
        }
      }

      // 金額をパース
      const amountStr = row[2] || '0';
      const amount = typeof amountStr === 'string'
        ? parseInt(amountStr.replace(/,/g, ''))
        : parseInt(amountStr);

      if (!isNaN(amount)) {
        fixedCostTotal += amount;
      }
    }

    const summary: ExpenditureSummary = {
      year: yearNum,
      month: monthNum,
      expense: expenseTotal,
      salary: salaryTotal,
      fixedCost: fixedCostTotal,
      total: expenseTotal + salaryTotal + fixedCostTotal,
      unsettledCount,
      unsettledAmount
    };

    const response: ApiResponse<ExpenditureSummary> = {
      success: true,
      data: summary
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('サマリー取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
