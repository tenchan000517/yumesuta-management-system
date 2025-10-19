// app/api/simulation-settings/route.ts
// シミュレーション設定API - Phase 1-2-2

import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { SimulationSetting } from '@/types/financial';

/**
 * シミュレーション設定取得API
 * GET /api/simulation-settings
 *
 * シミュレーションベース予測で使用する経費・人件費の売上比率を取得
 *
 * レスポンス例:
 * {
 *   success: true,
 *   data: [
 *     { itemName: "交通費", salesRatio: 3.0, minimumAmount: 10000, notes: "営業活動に伴う交通費" },
 *     { itemName: "人件費", salesRatio: 25.0, minimumAmount: 250000, notes: "給与・賞与" }
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

    // シミュレーション設定シートからデータ取得（最低金額列を追加）
    const rawData = await getSheetData(spreadsheetId, 'シミュレーション設定!A:D');

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'シミュレーション設定シートが見つかりません。Googleスプレッドシートに「シミュレーション設定」シートを作成してください。' },
        { status: 404 }
      );
    }

    // ヘッダー行をスキップしてデータをパース
    const settings: SimulationSetting[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];

      // 空行をスキップ
      if (!row || row.length === 0 || !row[0]) continue;

      settings.push({
        itemName: row[0] || '',
        salesRatio: parseFloat(row[1]) || 0,
        // カンマを除去してから数値化（Googleシートのロケール問題対策）
        minimumAmount: parseFloat(String(row[2] || '0').replace(/,/g, '')) || 0,
        notes: row[3] || undefined
      });
    }

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('[simulation-settings API] エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      },
      { status: 500 }
    );
  }
}
