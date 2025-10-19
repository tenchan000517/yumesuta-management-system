// app/api/financial-statements/cf/route.ts
// キャッシュフロー計算書（C/F）取得API

import { NextRequest, NextResponse } from 'next/server';
import { calculateCashFlowStatement } from '@/lib/financial-calculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const cashAtBeginning = searchParams.get('cashAtBeginning')
      ? parseFloat(searchParams.get('cashAtBeginning')!)
      : undefined;

    // バリデーション
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: '年月のパラメータが不正です' },
        { status: 400 }
      );
    }

    // C/F計算
    const cf = await calculateCashFlowStatement(year, month, cashAtBeginning);

    return NextResponse.json({
      success: true,
      data: cf
    });
  } catch (error: any) {
    console.error('C/F calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'C/Fの計算に失敗しました' },
      { status: 500 }
    );
  }
}
