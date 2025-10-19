// app/api/financial-statements/future-prediction/route.ts
// 未来の現金推移予測API

import { NextRequest, NextResponse } from 'next/server';
import { predictFutureCashFlow } from '@/lib/financial-calculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const months = parseInt(searchParams.get('months') || '6');

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
    if (isNaN(months) || months < 1 || months > 24) {
      return NextResponse.json(
        { success: false, error: '予測期間が不正です（1-24ヶ月）' },
        { status: 400 }
      );
    }

    // 未来予測を計算
    const prediction = await predictFutureCashFlow(year, month, months);

    return NextResponse.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    console.error('Future prediction calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '未来予測の計算に失敗しました' },
      { status: 500 }
    );
  }
}
