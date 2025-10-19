// app/api/tax-payment-settings/route.ts
// 税金支払設定API - Phase 1-2-3

import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { TaxPaymentSetting } from '@/types/financial';

/**
 * 税金支払設定取得API
 * GET /api/tax-payment-settings
 *
 * 法人税・消費税などの税金支払月・計算方法・金額を取得
 *
 * レスポンス例:
 * {
 *   success: true,
 *   data: [
 *     {
 *       taxType: "法人税等",
 *       paymentMonth: 11,
 *       calculationMethod: "profitRatio",
 *       rateOrAmount: 30,
 *       notes: "実効税率30%"
 *     }
 *   ]
 * }
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'SALES_SPREADSHEET_ID が設定されていません' },
        { status: 500 }
      );
    }

    // 税金支払設定シートからデータ取得
    const rawData = await getSheetData(spreadsheetId, '税金支払設定!A:E');

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { success: false, error: '税金支払設定シートが見つかりません。Googleスプレッドシートに「税金支払設定」シートを作成してください。' },
        { status: 404 }
      );
    }

    // ヘッダー行をスキップしてデータをパース
    const settings: TaxPaymentSetting[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];

      // 空行をスキップ
      if (!row || row.length === 0 || !row[0]) continue;

      // C列（計算方法）を英語型に変換
      const calculationMethodStr = row[2] || '固定';
      let calculationMethod: 'fixed' | 'salesRatio' | 'profitRatio' = 'fixed';

      if (calculationMethodStr === '売上比率') {
        calculationMethod = 'salesRatio';
      } else if (calculationMethodStr === '利益比率') {
        calculationMethod = 'profitRatio';
      } else if (calculationMethodStr === '固定') {
        calculationMethod = 'fixed';
      }

      // B列（支払月）のバリデーション
      const paymentMonth = parseInt(row[1]) || 1;
      if (paymentMonth < 1 || paymentMonth > 12) {
        console.warn(`[tax-payment-settings] 不正な支払月: ${paymentMonth}（行${i + 1}）`);
        continue;
      }

      settings.push({
        taxType: row[0] || '',
        paymentMonth,
        calculationMethod,
        rateOrAmount: parseFloat(row[3]) || 0,
        notes: row[4] || undefined
      });
    }

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('[tax-payment-settings API] エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      },
      { status: 500 }
    );
  }
}
