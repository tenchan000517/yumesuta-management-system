// app/api/financial-statements/all/route.ts
// 財務3表一括取得API

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateProfitAndLoss,
  calculateBalanceSheet,
  calculateCashFlowStatement
} from '@/lib/financial-calculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const monthParam = searchParams.get('month');
    const month = monthParam ? parseInt(monthParam) : undefined;
    const initialCash = parseFloat(searchParams.get('initialCash') || '0');
    const capital = parseFloat(searchParams.get('capital') || '1000000');

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

    // 財務3表を並列計算（monthがundefinedの場合は年次計算）
    const [pl, bs, cf] = await Promise.all([
      calculateProfitAndLoss(year, month),
      calculateBalanceSheet(year, month, initialCash, capital),
      calculateCashFlowStatement(year, month)
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
