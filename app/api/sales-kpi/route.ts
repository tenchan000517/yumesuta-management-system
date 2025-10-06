import { NextResponse } from 'next/server';
import { getSheetData, getBatchSheetData } from '@/lib/google-sheets';
import type { SalesKPIResponse, CustomerMasterStats, MonthlyPerformance } from '@/types/sales';

/**
 * 営業KPIデータ取得API
 * KPI

ダッシュボード、月次予実管理、顧客マスタから営業進捗データを取得
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

    // 複数シートから一括取得
    const [kpiData, monthlyData, customerData, statusColumn] = await getBatchSheetData(
      spreadsheetId,
      [
        'KPIダッシュボード!A1:K25', // 転換率（行20-23）まで含める
        '月次予実管理!A1:W15',
        '顧客マスタ!A1:S100',
        '顧客マスタ!R1:R100', // ステータス列を直接取得
      ]
    );

    // データのパースとレスポンス作成
    const kpiResponse = parseKPIData(kpiData);
    const monthlyPerformance = parseMonthlyPerformance(monthlyData);
    const customerStats = parseCustomerMasterStats(customerData, statusColumn);

    return NextResponse.json<SalesKPIResponse>({
      success: true,
      data: {
        ...kpiResponse,
        monthlyPerformance,
        customerStats,
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

  // 転換率の検証（配列インデックス19-22 = シート行20-23）
  const conversionRates = {
    appointmentRate: parseConversionRow(data[19]), // アポ獲得率（シート行20）
    meetingRate: parseConversionRow(data[20]), // 商談率（シート行21）
    closingRate: parseConversionRow(data[21]), // クロージング率（シート行22）
    contractRate: parseConversionRow(data[22]), // 契約率（シート行23）
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

/**
 * 月次予実管理シートのデータをパース
 * 今月（10月）のデータを取得
 */
function parseMonthlyPerformance(data: any[][]): MonthlyPerformance {
  // 10月のデータは3行目（インデックス2）
  const octoberRow = data[2] || [];

  const parseNumber = (val: string) => {
    if (!val) return 0;
    return parseInt(val.replace(/[¥,]/g, '')) || 0;
  };

  return {
    contractTarget: parseNumber(octoberRow[1]), // B列: 契約件数目標
    contractActual: parseNumber(octoberRow[6]), // G列: 契約件数実績
    contractGap: parseNumber(octoberRow[8]), // I列: 差異
    revenueTarget: parseNumber(octoberRow[9]), // J列: 売上目標
    revenueActual: parseNumber(octoberRow[10]), // K列: 売上実績
    revenueGap: parseNumber(octoberRow[12]), // M列: 差異
    paymentTarget: parseNumber(octoberRow[13]), // N列: 入金目標額
    paymentActual: parseNumber(octoberRow[14]), // O列: 入金実績額
    unpaidAmount: parseNumber(octoberRow[16]), // Q列: 未入金額
  };
}

/**
 * 顧客マスタシートのデータをパースして集計
 */
function parseCustomerMasterStats(
  customerData: any[][],
  statusColumn: any[][]
): CustomerMasterStats {
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // 今月+来月初めまでの週別範囲を計算（月をまたぐ商談予定に対応）
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  // 来月末まで範囲を拡張して、月をまたぐ日付をカウントできるようにする
  const extendedEnd = new Date(currentYear, currentMonth + 2, 0);

  const weeklyBuckets = getMonthlyWeeks(monthStart, extendedEnd);

  let awaitingReport = 0;
  const statusCounts = {
    initialMeeting: 0, // 初回商談待ち
    awaitingResponse: 0, // 返事待ち
    inNegotiation: 0, // 商談中
  };

  // データ行をループ（ヘッダー行を除く）
  for (let i = 1; i < customerData.length; i++) {
    const row = customerData[i];
    if (!row || row.length === 0) continue;

    // Q列（インデックス16）: ネクスト日
    const nextDateStr = row[16] || '';
    if (nextDateStr) {
      const parsedDate = parseNextDate(nextDateStr, today);
      if (parsedDate) {
        // 週別バケットに振り分け
        for (const week of weeklyBuckets) {
          const weekStart = new Date(week.startDate);
          const weekEnd = new Date(week.endDate);
          weekEnd.setHours(23, 59, 59, 999);

          if (parsedDate >= weekStart && parsedDate <= weekEnd) {
            week.count++;
            break;
          }
        }

        // 過去1ヶ月以内の日付（報告待ち）
        if (parsedDate < today && parsedDate >= oneMonthAgo) {
          awaitingReport++;
        }
      }
    }

    // R列: ステータス（statusColumnから取得）
    const status = (statusColumn[i]?.[0] || '').trim(); // トリムして余分なスペースを削除

    if (status === '初回商談待ち') statusCounts.initialMeeting++;
    else if (status === '返事待ち') statusCounts.awaitingResponse++;
    else if (status === '商談中') statusCounts.inNegotiation++;
  }

  return {
    weeklyMeetings: weeklyBuckets,
    awaitingReport,
    statusCounts,
  };
}

/**
 * ネクスト日の文字列をパースして Date オブジェクトを返す
 * 例: "10/9 15時～" → 2025年10月9日
 * 例: "10月6日" → 2025年10月6日
 */
function parseNextDate(dateStr: string, today: Date): Date | null {
  if (!dateStr) return null;

  // "10/9" または "10/9 15時～" 形式
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1]);
    const day = parseInt(slashMatch[2]);
    return createDateWithYearAdjustment(month, day, today);
  }

  // "10月6日" 形式
  const kanjiMatch = dateStr.match(/(\d{1,2})月(\d{1,2})日/);
  if (kanjiMatch) {
    const month = parseInt(kanjiMatch[1]);
    const day = parseInt(kanjiMatch[2]);
    return createDateWithYearAdjustment(month, day, today);
  }

  return null;
}

/**
 * 月/日から Date オブジェクトを作成
 * 1ヶ月以上過去の場合は来年扱いにする
 */
function createDateWithYearAdjustment(month: number, day: number, today: Date): Date {
  const currentYear = today.getFullYear();
  const date = new Date(currentYear, month - 1, day);

  // 1ヶ月以上過去の場合は来年とする
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  if (date < oneMonthAgo) {
    date.setFullYear(currentYear + 1);
  }

  return date;
}

/**
 * 今週の開始日（月曜日）を取得
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 日曜日の場合は-6、それ以外は1-day
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 今週の終了日（日曜日）を取得
 */
function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * 月の週別範囲を生成
 * 月曜始まり、日曜終わりで週を区切る
 */
function getMonthlyWeeks(monthStart: Date, monthEnd: Date) {
  const weeks = [];
  let weekNum = 1;

  // 月初の週の開始日を取得（月初が週の途中でも月初から開始）
  let currentWeekStart = new Date(monthStart);
  currentWeekStart.setHours(0, 0, 0, 0);

  while (currentWeekStart < monthEnd) {
    // 週の終了日を計算（常に日曜日まで）
    const weekStartDay = currentWeekStart.getDay();
    const daysUntilSunday = weekStartDay === 0 ? 0 : 7 - weekStartDay;
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + daysUntilSunday);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const startMonth = currentWeekStart.getMonth() + 1;
    const startDay = currentWeekStart.getDate();
    const endMonth = currentWeekEnd.getMonth() + 1;
    const endDay = currentWeekEnd.getDate();

    weeks.push({
      weekLabel: `第${weekNum}週 (${startMonth}/${startDay}-${endMonth}/${endDay})`,
      startDate: currentWeekStart.toISOString(),
      endDate: currentWeekEnd.toISOString(),
      count: 0,
    });

    // 次の週へ
    currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setDate(currentWeekStart.getDate() + 1);
    currentWeekStart.setHours(0, 0, 0, 0);
    weekNum++;
  }

  return weeks;
}
