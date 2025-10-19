// app/api/financial-statements/bs/route.ts
// 貸借対照表（B/S）取得API

import { NextRequest, NextResponse } from 'next/server';
import { calculateBalanceSheet } from '@/lib/financial-calculations';

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

    // B/S計算（monthがundefinedの場合は年次計算=12月末時点）
    const bs = await calculateBalanceSheet(year, month, initialCash, capital);

    return NextResponse.json({
      success: true,
      data: bs
    });
  } catch (error: any) {
    console.error('B/S calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'B/Sの計算に失敗しました' },
      { status: 500 }
    );
  }
}
