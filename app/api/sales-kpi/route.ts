import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { SalesKPIResponse } from '@/types/sales';

/**
 * 営業KPIデータ取得API
 * KPIダッシュボードシートから営業進捗データを取得
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json<SalesKPIResponse>(
        {
          success: false,
          error: 'SALES_SPREADSHEET_ID is not set',
        },
        { status: 500 }
      );
    }

    // KPIダッシュボードシートからデータを取得
    const kpiData = await getSheetData(spreadsheetId, 'KPIダッシュボード!A1:K20');

    // データのパースとレスポンス作成
    const response = parseKPIData(kpiData);

    return NextResponse.json<SalesKPIResponse>({
      success: true,
      data: {
        ...response,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sales KPI API error:', error);
    return NextResponse.json<SalesKPIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * KPIダッシュボードシートのデータをパース
 */
function parseKPIData(data: any[][]) {
  // 対象月（行1、列B）
  const month = parseInt(data[1]?.[1] || '0');

  // 営業日の進捗状況（行5-7）
  const totalBusinessDays = parseInt(data[5]?.[1] || '0');
  const elapsedBusinessDays = parseInt(data[6]?.[1] || '0');
  const progressRate = parseFloat(data[7]?.[1]?.replace('%', '') || '0');

  // 行動量の日次進捗（行11-15）
  const metrics = {
    telAppointments: parseMetricRow(data[11]),
    appointments: parseMetricRow(data[12]),
    meetings: parseMetricRow(data[13]),
    closings: parseMetricRow(data[14]),
    contracts: parseMetricRow(data[15]),
  };

  // 転換率の検証（行19）
  const conversionRates = {
    appointmentRate: parseConversionRow(data[19]),
  };

  // ゆめマガ配布状況（行5-7、列F-J）
  const magazineDistribution = {
    availableSchools: parseDistributionRow(data[5], 5),
    distributedSchools: parseDistributionRow(data[6], 5),
    distributedCopies: parseDistributionRow(data[7], 5),
  };

  return {
    kpi: {
      month,
      totalBusinessDays,
      elapsedBusinessDays,
      progressRate,
      metrics,
      conversionRates,
    },
    magazineDistribution,
  };
}

/**
 * メトリクス行をパース
 * 行形式: [指標名, 月間目標, 今日時点で必要, 実績, 過不足, 状態]
 */
function parseMetricRow(row: any[] | undefined) {
  if (!row) {
    return {
      monthlyTarget: 0,
      requiredToday: 0,
      actual: 0,
      gap: 0,
      status: 'warning' as const,
    };
  }

  const monthlyTarget = parseInt(row[1] || '0');
  const requiredToday = parseInt(row[2] || '0');
  const actual = parseInt(row[3] || '0');
  const gap = parseInt(row[4] || '0');
  const statusText = row[5] || '';
  const status = statusText.includes('順調') ? 'ok' : 'warning';

  return {
    monthlyTarget,
    requiredToday,
    actual,
    gap,
    status: status as 'ok' | 'warning',
  };
}

/**
 * 転換率行をパース
 * 行形式: [指標名, 実績転換率, 想定転換率, 差分, 状態]
 */
function parseConversionRow(row: any[] | undefined) {
  if (!row) {
    return {
      actualRate: 0,
      expectedRate: 0,
      gap: 0,
      status: 'warning' as const,
    };
  }

  const actualRate = parseFloat(row[1]?.replace('%', '') || '0');
  const expectedRate = parseFloat(row[2]?.replace('%', '') || '0');
  const gap = parseFloat(row[3]?.replace('%', '') || '0');
  const statusText = row[4] || '';
  const status = statusText.includes('想定以下') || statusText.includes('遅れ')
    ? 'warning'
    : 'ok';

  return {
    actualRate,
    expectedRate,
    gap,
    status: status as 'ok' | 'warning',
  };
}

/**
 * 配布状況行をパース
 * 行形式: [..., 項目, 目標, 実績, 達成率, 過不足, 状態]
 */
function parseDistributionRow(row: any[] | undefined, startCol: number) {
  if (!row) {
    return {
      target: 0,
      actual: 0,
      achievementRate: 0,
      gap: 0,
      status: 'warning' as const,
    };
  }

  const target = parseInt(row[startCol + 1]?.replace(/,/g, '') || '0');
  const actual = parseInt(row[startCol + 2]?.replace(/,/g, '') || '0');
  const achievementRate = parseFloat(row[startCol + 3]?.replace('%', '') || '0');
  const gap = parseInt(row[startCol + 4]?.replace(/,/g, '') || '0');
  const statusText = row[startCol + 5] || '';
  const status = statusText.includes('順調') ? 'ok' : 'warning';

  return {
    target,
    actual,
    achievementRate,
    gap,
    status: status as 'ok' | 'warning',
  };
}
