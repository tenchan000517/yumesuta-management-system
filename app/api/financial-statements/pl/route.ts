// app/api/financial-statements/pl/route.ts
// 損益計算書（P/L）取得API

import { NextRequest, NextResponse } from 'next/server';
import { calculateProfitAndLoss } from '@/lib/financial-calculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    // バリデーション
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: '年月のパラメータが不正です' },
        { status: 400 }
      );
    }

    // P/L計算
    const pl = await calculateProfitAndLoss(year, month);

    return NextResponse.json({
      success: true,
      data: pl
    });
  } catch (error: any) {
    console.error('P/L calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'P/Lの計算に失敗しました' },
      { status: 500 }
    );
  }
}
