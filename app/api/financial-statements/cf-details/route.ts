// app/api/financial-statements/cf-details/route.ts
// C/F詳細データ取得API（支払予定一覧・週次サマリー・日次推移）

import { NextRequest, NextResponse } from 'next/server';
import {
  calculatePaymentSchedule,
  calculateWeeklySummary,
  calculateDailyCashFlow
} from '@/lib/financial-calculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    // バリデーション
    if (isNaN(year)) {
      return NextResponse.json(
        { success: false, error: '年のパラメータが不正です' },
        { status: 400 }
      );
    }
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: '月のパラメータが不正です（1-12）' },
        { status: 400 }
      );
    }

    // 詳細データを並列計算
    const [paymentSchedule, weeklySummary, dailyCashFlow] = await Promise.all([
      calculatePaymentSchedule(year, month),
      calculateWeeklySummary(year, month),
      calculateDailyCashFlow(year, month)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        paymentSchedule,
        weeklySummary,
        dailyCashFlow
      }
    });
  } catch (error: any) {
    console.error('C/F details calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'C/F詳細データの計算に失敗しました' },
      { status: 500 }
    );
  }
}
