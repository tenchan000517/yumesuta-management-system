// app/api/financial-statements/all/route.ts
// 財務3表一括取得API（最適化版：データ重複取得を削減）

import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import {
  calculateProfitAndLossFromData,
  calculateBalanceSheetFromData,
  calculateCashFlowStatementFromData
} from '@/lib/financial-calculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const monthParam = searchParams.get('month');
    const month = monthParam ? parseInt(monthParam) : undefined;
    const initialCash = parseFloat(searchParams.get('initialCash') || '0');
    const capital = parseFloat(searchParams.get('capital') || '100000');

    // バリデーション
    if (isNaN(year)) {
      return NextResponse.json(
        { success: false, error: '年のパラメータが不正です' },
        { status: 400 }
      );
    }
    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return NextResponse.json(
        { success: false, error: '月のパラメータが不正です（1-12）' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // 最適化: 必要なシートデータを1回だけ並列取得
    const [contractData, expenditureData, fixedCostData] = await Promise.all([
      getSheetData(spreadsheetId, '契約・入金管理!A:AH'),
      getSheetData(spreadsheetId, '支出管理マスタ!A:J'),
      getSheetData(spreadsheetId, '固定費マスタ!A:H')
    ]);

    // 取得したデータを使って財務3表を並列計算
    const [pl, bs, cf] = await Promise.all([
      calculateProfitAndLossFromData(contractData, expenditureData, fixedCostData, year, month),
      calculateBalanceSheetFromData(contractData, expenditureData, fixedCostData, year, month, initialCash, capital),
      calculateCashFlowStatementFromData(contractData, expenditureData, fixedCostData, year, month)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pl,
        bs,
        cf
      }
    });
  } catch (error: any) {
    console.error('Financial statements calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '財務諸表の計算に失敗しました' },
      { status: 500 }
    );
  }
}
