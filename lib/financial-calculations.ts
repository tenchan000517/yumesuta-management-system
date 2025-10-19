// lib/financial-calculations.ts
// 財務諸表計算ロジック

import { getSheetData } from '@/lib/google-sheets';
import type {
  ProfitAndLoss,
  BalanceSheet,
  CashFlowStatement,
  PaymentItem,
  WeeklyItem,
  DailyCashFlowItem,
  MonthlyPrediction,
  CashDepletionWarning,
  FuturePredictionResponse,
  PredictionMode,
  SimulationSetting,
  TaxPaymentSetting
} from '@/types/financial';

/**
 * 日付が指定された年月の範囲内かどうかをチェック
 */
function isDateInMonth(dateStr: string, year: number, month: number): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  return date.getFullYear() === year && date.getMonth() + 1 === month;
}

/**
 * 日付が指定された年の範囲内かどうかをチェック
 */
function isDateInYear(dateStr: string, year: number): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  return date.getFullYear() === year;
}

/**
 * 日付が指定された日付以前かどうかをチェック
 */
function isDateBeforeOrEqual(dateStr: string, targetDate: string): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  const target = new Date(targetDate);
  return date <= target;
}

/**
 * 日付にN月を加算
 */
function addMonths(dateStr: string, months: number): Date {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date;
}

/**
 * 金額文字列をパース（カンマ区切りや円マーク対応）
 * 日本円は整数で扱うため、小数点以下は四捨五入
 */
function parseAmount(amountStr: string | number | undefined): number {
  if (typeof amountStr === 'number') return Math.round(amountStr);
  if (!amountStr) return 0;

  const cleaned = String(amountStr).replace(/[¥,円]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

/**
 * 会計年度の開始月を取得（環境変数から、デフォルトは10月）
 */
function getFiscalYearStartMonth(): number {
  const startMonth = parseInt(process.env.FISCAL_YEAR_START_MONTH || '10');
  return startMonth >= 1 && startMonth <= 12 ? startMonth : 10;
}

/**
 * 前期の年月を取得（会計年度対応）
 * @param year - 現在の年
 * @param month - 現在の月（省略時は年次）
 * @returns { year: 前期の年, month?: 前期の月 }
 */
function getPreviousFiscalPeriod(year: number, month?: number): { year: number; month?: number } {
  const fiscalStartMonth = getFiscalYearStartMonth();

  if (month === undefined) {
    // 年次計算の場合: 前年度末（前年の決算月）
    // 会計年度が10月開始の場合、決算月は9月なので前年度末は前年の9月
    return { year: year - 1, month: fiscalStartMonth - 1 };
  } else if (month === fiscalStartMonth) {
    // 期首月の場合: 前年度末（前年の決算月）
    return { year: year - 1, month: fiscalStartMonth - 1 };
  } else if (month < fiscalStartMonth) {
    // 期首より前の月（年をまたぐケース）
    // 例: 会計年度が10月開始で、現在が2025年3月の場合
    // 前月は2025年2月（同じ会計年度内）
    return { year, month: month - 1 };
  } else {
    // 期首より後の月（同じ暦年内）
    return { year, month: month - 1 };
  }
}

/**
 * 日付が指定された会計年度の範囲内かどうかをチェック
 * @param dateStr - チェック対象の日付文字列
 * @param fiscalYear - 会計年度（例: 2025年度 = 2025年10月〜2026年9月）
 * @returns 範囲内ならtrue
 */
function isDateInFiscalYear(dateStr: string, fiscalYear: number): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  const fiscalStartMonth = getFiscalYearStartMonth();

  // 会計年度の開始日と終了日を計算
  // 例: 2025年度（10月開始）= 2025/10/01 〜 2026/09/30
  const fiscalStartDate = new Date(fiscalYear, fiscalStartMonth - 1, 1);
  const fiscalEndDate = new Date(fiscalYear + 1, fiscalStartMonth - 1, 0); // 翌年の期首月の前日

  return date >= fiscalStartDate && date <= fiscalEndDate;
}

/**
 * 損益計算書（P/L）を計算
 * @param year - 対象年
 * @param month - 対象月（1-12、省略時は年度全体）
 * @returns 損益計算書データ
 */
export async function calculateProfitAndLoss(
  year: number,
  month?: number
): Promise<ProfitAndLoss> {
  const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

  // 1. 売上高の計算（契約・入金管理シートから）
  // 契約期間ベースで売上を認識（発生主義会計）
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:AH');

  let revenue = 0;
  contractData.slice(2).forEach(row => {
    const contractStartDate = row[17] || row[4]; // R列（契約開始日）、なければE列（契約日）を使用
    const contractAmount = parseAmount(row[5]); // F列（契約金額）
    const contractPeriodMonths = parseInt(row[18]) || 12; // S列（契約期間、月数）、デフォルト12ヶ月
    const autoRenewal = row[19]; // T列（自動更新有無: ○/✖）
    const autoRenewalAmount = parseAmount(row[20]); // U列（自動更新後の金額）

    if (!contractStartDate || contractAmount === 0) return;

    // 月額売上 = 契約金額 ÷ 契約期間（整数化）
    const monthlyRevenue = Math.round(contractAmount / contractPeriodMonths);

    // 契約期間の各月に月額売上を計上
    for (let i = 0; i < contractPeriodMonths; i++) {
      const revenueDate = addMonths(contractStartDate, i);
      const revenueYear = revenueDate.getFullYear();
      const revenueMonth = revenueDate.getMonth() + 1;

      const isInPeriod = month !== undefined
        ? (revenueYear === year && revenueMonth === month)
        : isDateInFiscalYear(`${revenueYear}/${String(revenueMonth).padStart(2, '0')}/01`, year);

      if (isInPeriod) {
        revenue += monthlyRevenue;
      }
    }

    // 自動更新ロジック（○または〇で判定）
    if ((autoRenewal === '○' || autoRenewal === '〇') && autoRenewalAmount > 0) {
      // 契約期間終了月を計算
      const contractEndDate = addMonths(contractStartDate, contractPeriodMonths);

      // 自動更新後の月額売上
      const renewalMonthlyRevenue = autoRenewalAmount;

      if (month !== undefined) {
        // 月次計算の場合: 契約期間終了後かつ対象月である場合のみ計上
        const targetDate = new Date(year, month - 1, 1);
        const contractEndYear = contractEndDate.getFullYear();
        const contractEndMonth = contractEndDate.getMonth() + 1;
        const contractEndFirstDay = new Date(contractEndYear, contractEndMonth - 1, 1);

        // 対象月が契約期間終了月以降の場合に計上
        if (targetDate >= contractEndFirstDay) {
          revenue += renewalMonthlyRevenue;
        }
      } else {
        // 年次計算の場合: 契約期間終了後から会計年度末までの月数を計算
        const fiscalStartMonth = getFiscalYearStartMonth();
        const fiscalStartDate = new Date(year, fiscalStartMonth - 1, 1);
        const fiscalEndDate = new Date(year + 1, fiscalStartMonth - 1, 0); // 会計年度終了日（翌年の期首月の前日）

        // 契約期間終了後から会計年度末までの有効期間を計算
        if (contractEndDate < fiscalEndDate) {
          // 有効開始日: 契約終了日 vs 会計年度開始日の遅い方
          const effectiveStartDate = contractEndDate > fiscalStartDate ? contractEndDate : fiscalStartDate;

          // 有効月数を計算
          const monthsDiff = (fiscalEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12
                            + (fiscalEndDate.getMonth() - effectiveStartDate.getMonth()) + 1;

          if (monthsDiff > 0) {
            revenue += renewalMonthlyRevenue * monthsDiff;
          }
        }
      }
    }
  });

  // 2. 支出データの取得（支出管理マスタから）
  // A列（日付）が対象期間内のレコードを抽出
  const expenditureData = await getSheetData(spreadsheetId, '支出管理マスタ!A:J');

  let costOfSales = 0;      // 経費
  let salaryExpenses = 0;   // 給与

  expenditureData.slice(1).forEach(row => {
    const date = row[0];                          // A列（日付）
    const amount = parseAmount(row[2]);           // C列（金額）
    const category = row[3];                      // D列（カテゴリ）

    const isInPeriod = month !== undefined
      ? isDateInMonth(date, year, month)
      : isDateInFiscalYear(date, year);

    if (isInPeriod) {
      if (category === '経費') {
        costOfSales += amount;
      } else if (category === '給与') {
        salaryExpenses += amount;
      }
      // '固定費'カテゴリは支出管理マスタには存在しない（固定費マスタで管理）
    }
  });

  // 3. 固定費の計算（固定費マスタから）
  const fixedCostData = await getSheetData(spreadsheetId, '固定費マスタ!A:H');

  let fixedCosts = 0;
  if (month !== undefined) {
    // 月次計算: 有効な全固定費を該当月のP/Lに計上
    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6]; // G列（開始月、YYYY/MM形式）

      if (isActive && startMonth) {
        const targetMonth = `${year}/${String(month).padStart(2, '0')}`;
        if (startMonth <= targetMonth) {
          fixedCosts += amount;
        }
      }
    });
  } else {
    // 年次計算: 各固定費を会計年度内の有効月数分カウント
    const fiscalStartMonth = getFiscalYearStartMonth();
    const fiscalStartDate = new Date(year, fiscalStartMonth - 1, 1); // 会計年度開始日
    const fiscalEndDate = new Date(year + 1, fiscalStartMonth - 1, 0); // 会計年度終了日（翌年の期首月の前日）

    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6]; // G列（開始月、YYYY/MM形式）

      if (isActive && startMonth) {
        const [startYear, startMon] = startMonth.split('/').map(Number);
        const fixedCostStartDate = new Date(startYear, startMon - 1, 1);

        // 固定費開始日が会計年度終了日以前の場合のみ対象
        if (fixedCostStartDate <= fiscalEndDate) {
          // 有効期間の開始日: 固定費開始日 vs 会計年度開始日の遅い方
          const effectiveStartDate = fixedCostStartDate > fiscalStartDate ? fixedCostStartDate : fiscalStartDate;

          // 有効月数を計算
          const monthsDiff = (fiscalEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12
                            + (fiscalEndDate.getMonth() - effectiveStartDate.getMonth()) + 1;

          fixedCosts += amount * monthsDiff;
        }
      }
    });
  }

  // 4. 利益の計算
  const grossProfit = revenue - costOfSales;
  const operatingProfit = grossProfit - salaryExpenses - fixedCosts;

  // 5. 税金計算
  const effectiveTaxRate = 0.3; // 実効税率30%
  const profitBeforeTax = operatingProfit;
  const incomeTax = Math.max(0, profitBeforeTax * effectiveTaxRate); // 赤字の場合は税金0
  const netProfit = profitBeforeTax - incomeTax;

  return {
    fiscalYear: `${year}年度`,
    fiscalMonth: month !== undefined ? `${year}/${String(month).padStart(2, '0')}` : undefined,
    revenue,
    costOfSales,
    salaryExpenses,
    fixedCosts,
    grossProfit,
    operatingProfit,
    profitBeforeTax,
    incomeTax,
    netProfit,
    effectiveTaxRate,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 貸借対照表（B/S）を計算
 * @param year - 対象年
 * @param month - 対象月（1-12、省略時は12月末時点）
 * @param initialCash - 期首現金残高（デフォルト: 0）
 * @param capital - 資本金（デフォルト: 100000 = 10万円）
 * @returns 貸借対照表データ
 */
export async function calculateBalanceSheet(
  year: number,
  month?: number,
  initialCash: number = 0,
  capital: number = 100000
): Promise<BalanceSheet> {
  const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

  // 基準日（月末、年次計算の場合は12月末）
  const targetMonth = month !== undefined ? month : 12;
  const lastDay = new Date(year, targetMonth, 0).getDate();
  const asOfDate = `${year}/${String(targetMonth).padStart(2, '0')}/${String(lastDay).padStart(2, '0')}`;

  // 1. 現金の計算
  // 累積入金額 - 累積支出額 + 初期残高
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:AH');

  let totalIncome = 0;
  contractData.slice(2).forEach(row => {
    const paymentActualDate = row[12]; // M列（入金実績日）
    const amount = parseAmount(row[5]); // F列（契約金額）

    if (paymentActualDate && isDateBeforeOrEqual(paymentActualDate, asOfDate)) {
      totalIncome += amount;
    }
  });

  // 支出の計算（支出管理マスタ + 固定費マスタ）
  const expenditureData = await getSheetData(spreadsheetId, '支出管理マスタ!A:J');
  const fixedCostData = await getSheetData(spreadsheetId, '固定費マスタ!A:H');

  let totalExpenses = 0;

  // 支出管理マスタからの支出
  expenditureData.slice(1).forEach(row => {
    const date = row[0];                // A列（日付）
    const amount = parseAmount(row[2]); // C列（金額）

    if (date && isDateBeforeOrEqual(date, asOfDate)) {
      totalExpenses += amount;
    }
  });

  // 固定費マスタからの累積支出（基準日までの月数分）
  fixedCostData.slice(1).forEach(row => {
    const isActive = row[0] === true || row[0] === 'TRUE';
    const amount = parseAmount(row[2]);
    const startMonth = row[6]; // G列（開始月、YYYY/MM形式）

    if (isActive && startMonth) {
      // 開始月から基準日までの月数を計算
      const [startYear, startMon] = startMonth.split('/').map(Number);
      const startDate = new Date(startYear, startMon - 1);
      const endDate = new Date(year, targetMonth - 1);

      if (startDate <= endDate) {
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12
                          + (endDate.getMonth() - startDate.getMonth()) + 1;
        totalExpenses += amount * monthsDiff;
      }
    }
  });

  const cash = initialCash + totalIncome - totalExpenses;

  // 2. 売掛金の計算
  // 契約日が基準日以前で、入金実績日が空 OR 入金ステータスが「未入金」
  let accountsReceivable = 0;
  contractData.slice(2).forEach(row => {
    const contractDate = row[4];        // E列（契約日）
    const amount = parseAmount(row[5]); // F列（契約金額）
    const paymentActualDate = row[12];  // M列（入金実績日）
    const paymentStatus = row[13];       // N列（入金ステータス）

    if (contractDate && isDateBeforeOrEqual(contractDate, asOfDate)) {
      if (!paymentActualDate || paymentStatus === '未入金') {
        accountsReceivable += amount;
      }
    }
  });

  // 3. 買掛金（未払金）の計算
  let accountsPayable = 0;
  expenditureData.slice(1).forEach(row => {
    const date = row[0];                          // A列（発生日）
    const amount = parseAmount(row[2]);           // C列（金額）
    const paymentMethod = row[4];                 // E列（支払方法）
    const settlementStatus = row[6];              // G列（清算ステータス）
    const settlementDate = row[7];                // H列（清算日）
    const paymentScheduledDate = row[9];          // J列（支払予定日）

    // 発生日が基準日以前の場合のみ処理
    if (date && isDateBeforeOrEqual(date, asOfDate)) {
      if (paymentMethod === '立替') {
        // 立替の場合：未清算のみ計上
        if (settlementStatus === '未清算') {
          accountsPayable += amount;
        }
      } else {
        // その他の支払方法：支払予定日が基準日より後の場合に未払金として計上
        if (paymentScheduledDate && !isDateBeforeOrEqual(paymentScheduledDate, asOfDate)) {
          accountsPayable += amount;
        }
      }
    }
  });

  // 4. 資産・負債の集計（利益剰余金計算前）
  const totalCurrentAssets = cash + accountsReceivable;
  const totalFixedAssets = 0; // 簡易版では0
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities = accountsPayable;
  const totalFixedLiabilities = 0; // 簡易版では0
  const totalLiabilities = totalCurrentLiabilities + totalFixedLiabilities;

  // 5. 利益剰余金の計算（会計恒等式から逆算）
  // 総資産 = 総負債 + 資本金 + 利益剰余金
  // → 利益剰余金 = 総資産 - 総負債 - 資本金
  const retainedEarnings = totalAssets - totalLiabilities - capital;

  const totalNetAssets = capital + retainedEarnings;
  const totalLiabilitiesAndNetAssets = totalLiabilities + totalNetAssets;

  return {
    fiscalYear: `${year}年度`,
    fiscalMonth: month !== undefined ? `${year}/${String(month).padStart(2, '0')}` : undefined,
    asOfDate,
    assets: {
      currentAssets: {
        cash,
        accountsReceivable,
        totalCurrentAssets
      },
      fixedAssets: {
        totalFixedAssets
      },
      totalAssets
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable,
        totalCurrentLiabilities
      },
      fixedLiabilities: {
        totalFixedLiabilities
      },
      totalLiabilities
    },
    netAssets: {
      capital,
      retainedEarnings,
      totalNetAssets
    },
    totalLiabilitiesAndNetAssets,
    generatedAt: new Date().toISOString()
  };
}

/**
 * キャッシュフロー計算書（C/F）を計算
 * @param year - 対象年
 * @param month - 対象月（1-12、省略時は年度全体）
 * @param cashAtBeginning - 期首現金残高（デフォルト: 前月末/前年末のB/Sから自動計算）
 * @returns キャッシュフロー計算書データ
 */
export async function calculateCashFlowStatement(
  year: number,
  month?: number,
  cashAtBeginning?: number
): Promise<CashFlowStatement> {
  const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

  // 期首現金残高の計算（指定がなければ前期末のB/Sから取得）
  let beginningCash = cashAtBeginning;
  if (beginningCash === undefined) {
    const previousPeriod = getPreviousFiscalPeriod(year, month);
    const prevBS = await calculateBalanceSheet(previousPeriod.year, previousPeriod.month);
    beginningCash = prevBS.assets.currentAssets.cash;
  }

  // 1. 営業活動によるキャッシュフロー
  // 顧客からの入金（M列: 入金実績日が対象期間内）
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:AH');

  let cashFromCustomers = 0;
  contractData.slice(2).forEach(row => {
    const paymentActualDate = row[12]; // M列（入金実績日）
    const amount = parseAmount(row[5]); // F列（契約金額）

    const isInPeriod = month !== undefined
      ? isDateInMonth(paymentActualDate, year, month)
      : isDateInFiscalYear(paymentActualDate, year);

    if (isInPeriod) {
      cashFromCustomers += amount;
    }
  });

  // 支払（A列: 日付が対象期間内、立替以外）
  const expenditureData = await getSheetData(spreadsheetId, '支出管理マスタ!A:J');
  const fixedCostData = await getSheetData(spreadsheetId, '固定費マスタ!A:H');

  let cashToSuppliers = 0;

  // 支出管理マスタからの支払
  expenditureData.slice(1).forEach(row => {
    const amount = parseAmount(row[2]); // C列（金額）
    const paymentMethod = row[4];       // E列（支払方法）
    const settlementDate = row[7];      // H列（清算日）
    const paymentScheduledDate = row[9]; // J列（支払予定日）

    // 支払日の決定
    let effectivePaymentDate: string | null = null;

    if (paymentMethod === '立替') {
      // 立替の場合：清算日を使用（清算済みの場合のみ）
      if (settlementDate) {
        effectivePaymentDate = settlementDate;
      }
      // 未清算の場合はスキップ（キャッシュアウトしていない）
    } else {
      // その他の支払方法：支払予定日を使用
      effectivePaymentDate = paymentScheduledDate;
    }

    // 有効な支払日がある場合のみカウント
    if (effectivePaymentDate) {
      const isInPeriod = month !== undefined
        ? isDateInMonth(effectivePaymentDate, year, month)
        : isDateInFiscalYear(effectivePaymentDate, year);

      if (isInPeriod) {
        cashToSuppliers += amount;
      }
    }
  });

  // 固定費マスタからの支払
  if (month !== undefined) {
    // 月次計算: 該当月の有効な固定費
    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6];

      if (isActive && startMonth) {
        const targetMonth = `${year}/${String(month).padStart(2, '0')}`;
        if (startMonth <= targetMonth) {
          cashToSuppliers += amount;
        }
      }
    });
  } else {
    // 年次計算: 各固定費を会計年度内の有効月数分カウント
    const fiscalStartMonth = getFiscalYearStartMonth();
    const fiscalStartDate = new Date(year, fiscalStartMonth - 1, 1); // 会計年度開始日
    const fiscalEndDate = new Date(year + 1, fiscalStartMonth - 1, 0); // 会計年度終了日（翌年の期首月の前日）

    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6];

      if (isActive && startMonth) {
        const [startYear, startMon] = startMonth.split('/').map(Number);
        const fixedCostStartDate = new Date(startYear, startMon - 1, 1);

        // 固定費開始日が会計年度終了日以前の場合のみ対象
        if (fixedCostStartDate <= fiscalEndDate) {
          // 有効期間の開始日: 固定費開始日 vs 会計年度開始日の遅い方
          const effectiveStartDate = fixedCostStartDate > fiscalStartDate ? fixedCostStartDate : fiscalStartDate;

          // 有効月数を計算
          const monthsDiff = (fiscalEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12
                            + (fiscalEndDate.getMonth() - effectiveStartDate.getMonth()) + 1;

          cashToSuppliers += amount * monthsDiff;
        }
      }
    });
  }

  const netOperatingCashFlow = cashFromCustomers - cashToSuppliers;

  // 2. 投資活動によるキャッシュフロー（簡易版では0）
  const purchaseOfFixedAssets = 0;
  const netInvestingCashFlow = -purchaseOfFixedAssets;

  // 3. 財務活動によるキャッシュフロー（簡易版では0）
  const proceedsFromBorrowings = 0;
  const repaymentOfBorrowings = 0;
  const netFinancingCashFlow = proceedsFromBorrowings - repaymentOfBorrowings;

  // 4. キャッシュフロー合計と期末残高
  const netCashFlow = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;
  const cashAtEnd = beginningCash + netCashFlow;

  return {
    fiscalYear: `${year}年度`,
    fiscalMonth: month !== undefined ? `${year}/${String(month).padStart(2, '0')}` : undefined,
    operatingActivities: {
      cashFromCustomers,
      cashToSuppliers,
      netOperatingCashFlow
    },
    investingActivities: {
      purchaseOfFixedAssets,
      netInvestingCashFlow
    },
    financingActivities: {
      proceedsFromBorrowings,
      repaymentOfBorrowings,
      netFinancingCashFlow
    },
    netCashFlow,
    cashAtBeginning: beginningCash,
    cashAtEnd,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 支払予定一覧を計算（C/F詳細データ）
 * @param year - 対象年
 * @param month - 対象月（1-12）
 * @returns 支払予定一覧
 */
export async function calculatePaymentSchedule(
  year: number,
  month: number
): Promise<PaymentItem[]> {
  const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
  const items: PaymentItem[] = [];

  // 1. 支出管理マスタから支払予定データを取得
  const expenditureData = await getSheetData(spreadsheetId, '支出管理マスタ!A:J');

  expenditureData.slice(1).forEach(row => {
    const itemName = row[1];                    // B列: 項目名
    const amount = parseAmount(row[2]);         // C列: 金額
    const category = row[3];                    // D列: カテゴリ
    const paymentMethod = row[4];               // E列: 支払方法
    const paymentScheduledDate = row[9];        // J列: 支払予定日

    // J列が当月内かチェック
    if (paymentScheduledDate && isDateInMonth(paymentScheduledDate, year, month)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paymentDate = new Date(paymentScheduledDate);

      items.push({
        date: paymentScheduledDate,
        itemName,
        amount: -amount,  // 支出なのでマイナス
        paymentMethod,
        category,
        isPaid: paymentDate < today
      });
    }
  });

  // 2. 固定費マスタから当月の固定費を取得
  const fixedCostData = await getSheetData(spreadsheetId, '固定費マスタ!A:H');

  fixedCostData.slice(1).forEach(row => {
    const isActive = row[0] === true || row[0] === 'TRUE';
    const itemName = row[1];                    // B列: 項目名
    const amount = parseAmount(row[2]);         // C列: 金額
    const category = '固定費';                   // D列: カテゴリ
    const paymentMethod = row[4];               // E列: 支払方法
    const paymentDay = parseInt(row[5]) || 1;   // F列: 支払日
    const startMonth = row[6];                  // G列: 開始月

    if (isActive && startMonth) {
      const targetMonth = `${year}/${String(month).padStart(2, '0')}`;

      // 開始月以降の固定費のみ対象
      if (startMonth <= targetMonth) {
        // 支払予定日を計算（当月の支払日）
        const paymentScheduledDate = `${year}/${String(month).padStart(2, '0')}/${String(paymentDay).padStart(2, '0')}`;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const paymentDate = new Date(paymentScheduledDate);

        items.push({
          date: paymentScheduledDate,
          itemName,
          amount: -amount,  // 支出なのでマイナス
          paymentMethod,
          category,
          isPaid: paymentDate < today
        });
      }
    }
  });

  // 3. 契約・入金管理シートから入金予定を取得
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:AH');

  contractData.slice(2).forEach(row => {
    const companyName = row[2];                 // C列: 企業名
    const productName = row[3];                 // D列: 契約サービス
    const amount = parseAmount(row[5]);         // F列: 契約金額
    const paymentScheduledDate = row[11];       // L列: 入金予定日

    // L列が当月内かチェック
    if (paymentScheduledDate && isDateInMonth(paymentScheduledDate, year, month)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paymentDate = new Date(paymentScheduledDate);

      items.push({
        date: paymentScheduledDate,
        itemName: `${companyName} - ${productName}`,
        amount: amount,  // 入金なのでプラス
        paymentMethod: '売上入金',
        category: '売上',
        isPaid: paymentDate < today
      });
    }
  });

  // 日付順にソート
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return items;
}

/**
 * 週次サマリーを計算（C/F詳細データ）
 * @param year - 対象年
 * @param month - 対象月（1-12）
 * @returns 週次サマリー
 */
export async function calculateWeeklySummary(
  year: number,
  month: number
): Promise<WeeklyItem[]> {
  // まず支払予定一覧を取得
  const paymentSchedule = await calculatePaymentSchedule(year, month);

  // 月の日数を取得
  const daysInMonth = new Date(year, month, 0).getDate();

  // 週ごとに分割（1-7日、8-14日、15-21日、22-末日）
  const weeks: WeeklyItem[] = [];
  let weekNumber = 1;
  let startDay = 1;

  while (startDay <= daysInMonth) {
    const endDay = Math.min(startDay + 6, daysInMonth);

    // この週の期間
    const weekStart = `${year}/${String(month).padStart(2, '0')}/${String(startDay).padStart(2, '0')}`;
    const weekEnd = `${year}/${String(month).padStart(2, '0')}/${String(endDay).padStart(2, '0')}`;

    // この週のデータを集計
    let inflow = 0;
    let outflow = 0;
    const majorEvents: Array<{ date: string; itemName: string; amount: number }> = [];

    paymentSchedule.forEach(item => {
      const itemDate = new Date(item.date);
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekEnd);

      if (itemDate >= weekStartDate && itemDate <= weekEndDate) {
        if (item.amount > 0) {
          inflow += item.amount;
        } else {
          outflow += Math.abs(item.amount);
        }

        // 主要イベント（10万円以上）
        if (Math.abs(item.amount) >= 100000) {
          majorEvents.push({
            date: item.date,
            itemName: item.itemName,
            amount: item.amount
          });
        }
      }
    });

    const netCashFlow = inflow - outflow;

    weeks.push({
      weekNumber,
      weekLabel: `第${weekNumber}週 (${startDay}-${endDay}日)`,
      inflow,
      outflow,
      netCashFlow,
      majorEvents: majorEvents.length > 0 ? majorEvents : null
    });

    weekNumber++;
    startDay += 7;
  }

  return weeks;
}

/**
 * 日次キャッシュフロー推移を計算（C/F詳細データ）
 * @param year - 対象年
 * @param month - 対象月（1-12）
 * @returns 日次推移
 */
export async function calculateDailyCashFlow(
  year: number,
  month: number
): Promise<DailyCashFlowItem[]> {
  // まず支払予定一覧を取得
  const paymentSchedule = await calculatePaymentSchedule(year, month);

  // 期首現金残高を取得（前期末のB/Sから）
  const previousPeriod = getPreviousFiscalPeriod(year, month);
  const prevBS = await calculateBalanceSheet(previousPeriod.year, previousPeriod.month);
  const beginningCash = prevBS.assets.currentAssets.cash;

  // 月の日数を取得
  const daysInMonth = new Date(year, month, 0).getDate();

  // 日ごとのデータを生成
  const dailyData: DailyCashFlowItem[] = [];
  let currentCash = beginningCash;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;

    // その日の入出金を集計
    let inflow = 0;
    let outflow = 0;

    paymentSchedule.forEach(item => {
      if (item.date === dateStr) {
        if (item.amount > 0) {
          inflow += item.amount;
        } else {
          outflow += Math.abs(item.amount);
        }
      }
    });

    // 現金残高を更新
    currentCash += inflow - outflow;

    dailyData.push({
      date: dateStr,
      cash: currentCash,
      inflow,
      outflow
    });
  }

  return dailyData;
}

/**
 * シミュレーション設定をパース
 */
function parseSimulationSettings(rawData: any[][]): SimulationSetting[] {
  const settings: SimulationSetting[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0 || !row[0]) continue;

    settings.push({
      itemName: row[0] || '',
      salesRatio: parseFloat(row[1]) || 0,
      // カンマを除去してから数値化（Googleシートのロケール問題対策）
      minimumAmount: parseFloat(String(row[2] || '0').replace(/,/g, '')) || 0,
      notes: row[3] || undefined
    });
  }

  return settings;
}

/**
 * 税金支払設定をパース
 */
function parseTaxPaymentSettings(rawData: any[][]): TaxPaymentSetting[] {
  const settings: TaxPaymentSetting[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0 || !row[0]) continue;

    // 計算方法を英語型に変換
    const calculationMethodStr = row[2] || '固定';
    let calculationMethod: 'fixed' | 'salesRatio' | 'profitRatio' = 'fixed';

    if (calculationMethodStr === '売上比率') {
      calculationMethod = 'salesRatio';
    } else if (calculationMethodStr === '利益比率') {
      calculationMethod = 'profitRatio';
    }

    // 支払月のバリデーション
    const paymentMonth = parseInt(row[1]) || 1;
    if (paymentMonth < 1 || paymentMonth > 12) {
      console.warn(`[parseTaxPaymentSettings] 不正な支払月: ${paymentMonth}（行${i + 1}）`);
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

  return settings;
}

/**
 * 税金計算（該当月のみ）
 * @param year - 対象年
 * @param month - 対象月
 * @param revenue - 月次売上
 * @param expenses - 月次経費
 * @param salary - 月次給与
 * @param fixedCosts - 月次固定費
 * @param taxSettings - 税金支払設定
 * @returns 税金額
 */
function calculateTaxForMonth(
  year: number,
  month: number,
  revenue: number,
  expenses: number,
  salary: number,
  fixedCosts: number,
  taxSettings: TaxPaymentSetting[]
): number {
  // 環境変数から期首情報を取得
  const fiscalStartYear = parseInt(process.env.FISCAL_YEAR_START_YEAR || '2025');
  const fiscalStartMonth = parseInt(process.env.FISCAL_YEAR_START_MONTH || '11');
  const fiscalEndMonth = parseInt(process.env.FISCAL_YEAR_END_MONTH || '10');

  // 第一期判定: 第一期内は税金を計上しない
  // 第一期の終了年月を計算（例: 2025/11期首、10月決算 → 2026/10期末）
  let firstFiscalYearEndYear = fiscalStartYear;
  if (fiscalEndMonth < fiscalStartMonth) {
    // 決算月が期首月より前の場合、翌年が期末
    firstFiscalYearEndYear = fiscalStartYear + 1;
  }

  // 年月を数値化して比較（例: 2026/10 → 2026*12+10 = 24298）
  const currentYearMonth = year * 12 + month;
  const firstYearEndYearMonth = firstFiscalYearEndYear * 12 + fiscalEndMonth;

  if (currentYearMonth <= firstYearEndYearMonth) {
    // 第一期内は税金計上なし（確定申告は第二期に計上される）
    return 0;
  }

  let totalTax = 0;

  // 該当月の税金設定を抽出
  const monthlyTaxes = taxSettings.filter(t => t.paymentMonth === month);

  // 期首からの経過月数を計算
  let monthsSinceFiscalStart = ((year - fiscalStartYear) * 12) + (month - fiscalStartMonth) + 1;

  // 経過月数が0以下の場合（期首前）は0にする
  if (monthsSinceFiscalStart <= 0) {
    monthsSinceFiscalStart = 0;
  }

  // 経過月数が12を超える場合は、次の会計年度として扱う（12で割った余り）
  if (monthsSinceFiscalStart > 12) {
    monthsSinceFiscalStart = ((monthsSinceFiscalStart - 1) % 12) + 1;
  }

  for (const tax of monthlyTaxes) {
    if (tax.calculationMethod === 'fixed') {
      // 固定金額
      totalTax += tax.rateOrAmount;
    } else if (tax.calculationMethod === 'salesRatio') {
      // 売上比率: 月次予定入金 × 比率
      totalTax += revenue * (tax.rateOrAmount / 100);
    } else if (tax.calculationMethod === 'profitRatio') {
      // 利益比率: 期首からの累積利益推定 × 比率
      // 月次利益を計算
      const monthlyProfit = revenue - expenses - salary - fixedCosts;

      // 期首からの累積利益を推定（簡易版: 月次利益 × 経過月数）
      // ※ 実際にはこれまでの各月の利益を合計すべきだが、簡易的に月次利益が一定と仮定
      const estimatedAccumulatedProfit = monthlyProfit * monthsSinceFiscalStart;

      // 推定確定税額を計算
      totalTax += estimatedAccumulatedProfit * (tax.rateOrAmount / 100);
    }
  }

  return Math.round(totalTax);
}

/**
 * 未来の現金推移を予測
 * @param baseYear - 基準年
 * @param baseMonth - 基準月
 * @param months - 予測期間（月数）
 * @returns 未来予測レスポンス
 */
export async function predictFutureCashFlow(
  baseYear: number,
  baseMonth: number,
  months: number = 6,
  mode: PredictionMode = 'actual'
): Promise<FuturePredictionResponse> {
  const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

  // 1. すべての必要なデータを一度だけ取得（API呼び出しを最小化・重複排除）
  // シミュレーションモード時のみ追加シートを取得
  const dataToFetch = mode === 'simulation'
    ? [
        getSheetData(spreadsheetId, '契約・入金管理!A:AH'),
        getSheetData(spreadsheetId, '支出管理マスタ!A:J'),
        getSheetData(spreadsheetId, '固定費マスタ!A:H'),
        getSheetData(spreadsheetId, 'シミュレーション設定!A:D').catch(() => []),
        getSheetData(spreadsheetId, '税金支払設定!A:E').catch(() => [])
      ]
    : [
        getSheetData(spreadsheetId, '契約・入金管理!A:AH'),
        getSheetData(spreadsheetId, '支出管理マスタ!A:J'),
        getSheetData(spreadsheetId, '固定費マスタ!A:H')
      ];

  const sheetDataResults = await Promise.all(dataToFetch);

  // データを変数に割り当て
  const contractData = sheetDataResults[0];
  const expenditureData = sheetDataResults[1];
  const fixedCostData = sheetDataResults[2];
  const simulationData = mode === 'simulation' ? sheetDataResults[3] : undefined;
  const taxData = mode === 'simulation' ? sheetDataResults[4] : undefined;

  // 2. B/Sと過去実績を取得（TODO: 将来的には取得済みデータを再利用して最適化）
  // 注意: これらの関数は内部でAPI呼び出しを行うため、上記で取得したデータと重複しています
  // 完全な最適化には関数のリファクタリングが必要ですが、まずは動作確認を優先します
  const currentBS = await calculateBalanceSheet(baseYear, baseMonth);
  const currentCash = currentBS.assets.currentAssets.cash;

  const historicalData = await getHistoricalAverages(baseYear, baseMonth);

  // シミュレーション設定と税金設定をパース（シミュレーションモード時のみ）
  let simulationSettings: SimulationSetting[] = [];
  let taxSettings: TaxPaymentSetting[] = [];

  if (mode === 'simulation' && simulationData && taxData) {
    simulationSettings = parseSimulationSettings(simulationData);
    taxSettings = parseTaxPaymentSettings(taxData);
  }

  // 2. 未来N月分の予測を生成（メモリ上で計算、追加のAPI呼び出しなし）
  const predictions: MonthlyPrediction[] = [];
  let cumulativeCash = currentCash;

  for (let i = 1; i <= months; i++) {
    // 次の月を計算
    let futureMonth = baseMonth + i;
    let futureYear = baseYear;

    while (futureMonth > 12) {
      futureMonth -= 12;
      futureYear += 1;
    }

    const period = `${futureYear}/${String(futureMonth).padStart(2, '0')}`;

    // 予測入金（両モードで共通: 入金予定日ベース）
    const predictedRevenue = calculatePredictedRevenueForMonth(contractData, futureYear, futureMonth);

    let predictedExpenses = 0;
    let predictedSalary = 0;
    let predictedTax = 0;

    if (mode === 'actual') {
      // 実績ベースモード: 過去3ヶ月の平均（従来の方式）
      predictedExpenses = calculatePredictedExpensesForMonth(expenditureData, futureYear, futureMonth);
      predictedSalary = calculatePredictedSalaryForMonth(expenditureData, futureYear, futureMonth);
    } else {
      // シミュレーションモード: 売上比率ベース + 最低金額考慮
      // 各経費項目ごとに MAX(売上 × 比率, 最低金額) を計算して合算
      predictedExpenses = simulationSettings
        .filter(s => ['交通費', '接待交際費', '雑費', '印刷代', '配送費'].includes(s.itemName))
        .reduce((sum, s) => {
          const ratioBasedAmount = predictedRevenue * (s.salesRatio / 100);
          const finalAmount = Math.max(ratioBasedAmount, s.minimumAmount);
          return sum + finalAmount;
        }, 0);
      predictedExpenses = Math.round(predictedExpenses);

      // 人件費も同様に最低金額を考慮
      const salarySetting = simulationSettings.find(s => s.itemName === '人件費');
      if (salarySetting) {
        const ratioBasedSalary = predictedRevenue * (salarySetting.salesRatio / 100);
        predictedSalary = Math.round(Math.max(ratioBasedSalary, salarySetting.minimumAmount));
      } else {
        predictedSalary = 0;
      }

      // 固定費（両モードで共通）
      const predictedFixedCosts = calculatePredictedFixedCostsForMonth(fixedCostData, futureYear, futureMonth);

      // 税金計算（シミュレーションモードのみ）
      predictedTax = calculateTaxForMonth(
        futureYear,
        futureMonth,
        predictedRevenue,
        predictedExpenses,
        predictedSalary,
        predictedFixedCosts,
        taxSettings
      );
    }

    const predictedFixedCosts = calculatePredictedFixedCostsForMonth(fixedCostData, futureYear, futureMonth);

    // 純増減 = 売上 - 経費 - 給与 - 固定費 - 税金（整数化）
    const netCashFlow = Math.round(predictedRevenue - predictedExpenses - predictedSalary - predictedFixedCosts - predictedTax);
    cumulativeCash = Math.round(cumulativeCash + netCashFlow);

    predictions.push({
      year: futureYear,
      month: futureMonth,
      period,
      predictedRevenue,
      predictedExpenses,
      predictedSalary,
      predictedFixedCosts,
      predictedTax,
      netCashFlow,
      cumulativeCashFlow: cumulativeCash,
      isPredicted: true
    });
  }

  // 3. 現金枯渇警告を計算
  const cashDepletionWarning = calculateCashDepletionWarning(predictions);

  // 4. 基準月の固定費を計算（参考情報）
  const baseMonthFixedCosts = calculatePredictedFixedCostsForMonth(fixedCostData, baseYear, baseMonth);

  return {
    baseYear,
    baseMonth,
    mode,
    currentCash,
    historicalAverage: {
      revenue: historicalData.revenue,
      expenses: historicalData.expenses,
      salary: historicalData.salary,
      fixedCosts: baseMonthFixedCosts,
      netCashFlow: Math.round(historicalData.revenue - historicalData.expenses - historicalData.salary - baseMonthFixedCosts)
    },
    predictions,
    cashDepletionWarning,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 過去3ヶ月の実績平均を取得（C/Fベース: 現金主義）
 */
async function getHistoricalAverages(
  baseYear: number,
  baseMonth: number
): Promise<{ revenue: number; expenses: number; salary: number }> {
  const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

  // 過去3ヶ月の年月を計算
  const months: Array<{ year: number; month: number }> = [];
  for (let i = 1; i <= 3; i++) {
    let targetMonth = baseMonth - i;
    let targetYear = baseYear;

    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    months.push({ year: targetYear, month: targetMonth });
  }

  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalSalary = 0;

  // 契約データを取得（入金実績ベース）
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:AH');

  // 過去3ヶ月の入金実績を合計
  contractData.slice(2).forEach(row => {
    const paymentActualDate = row[12]; // M列（入金実績日）
    const amount = parseAmount(row[5]); // F列（契約金額）

    if (paymentActualDate) {
      for (const { year, month } of months) {
        if (isDateInMonth(paymentActualDate, year, month)) {
          totalRevenue += amount;
          break;
        }
      }
    }
  });

  // 過去3ヶ月の経費と給与を合計（C/Fベース: 実際の現金支出）
  const expenditureData = await getSheetData(spreadsheetId, '支出管理マスタ!A:J');

  expenditureData.slice(1).forEach(row => {
    const paymentMethod = row[4];       // E列（支払方法）
    const settlementDate = row[7];      // H列（清算日）
    const paymentScheduledDate = row[9]; // J列（支払予定日）
    const amount = parseAmount(row[2]); // C列（金額）
    const category = row[3];            // D列（カテゴリ）

    // 支払日の決定（C/Fと同じロジック）
    let effectivePaymentDate: string | null = null;

    if (paymentMethod === '立替') {
      if (settlementDate) {
        effectivePaymentDate = settlementDate;
      }
    } else {
      effectivePaymentDate = paymentScheduledDate;
    }

    // 有効な支払日がある場合のみカウント
    if (effectivePaymentDate) {
      for (const { year, month } of months) {
        if (isDateInMonth(effectivePaymentDate, year, month)) {
          if (category === '経費') {
            totalExpenses += amount;
          } else if (category === '給与') {
            totalSalary += amount;
          }
          break;
        }
      }
    }
  });

  // 平均を計算（整数化）
  return {
    revenue: Math.round(totalRevenue / 3),
    expenses: Math.round(totalExpenses / 3),
    salary: Math.round(totalSalary / 3)
  };
}

/**
 * 指定月の予測入金を計算（入金予定日ベース）
 * @param contractData - 契約・入金管理シートのデータ
 */
function calculatePredictedRevenueForMonth(contractData: any[][], year: number, month: number): number {
  let totalRevenue = 0;

  contractData.slice(2).forEach(row => {
    const paymentScheduledDate = row[11]; // L列（入金予定日）
    const amount = parseAmount(row[5]);    // F列（契約金額）

    if (isDateInMonth(paymentScheduledDate, year, month)) {
      totalRevenue += amount;
    }
  });

  return Math.round(totalRevenue);
}

/**
 * 指定月の予測経費を計算（支払予定日ベース）
 * @param expenditureData - 支出管理マスタのデータ
 */
function calculatePredictedExpensesForMonth(expenditureData: any[][], year: number, month: number): number {
  let totalExpenses = 0;

  expenditureData.slice(1).forEach(row => {
    const category = row[3];            // D列（カテゴリ）
    const paymentMethod = row[4];       // E列（支払方法）
    const settlementDate = row[7];      // H列（清算日）
    const paymentScheduledDate = row[9]; // J列（支払予定日）
    const amount = parseAmount(row[2]); // C列（金額）

    // 経費のみ（給与は別途集計）
    if (category !== '経費') return;

    // 支払日の決定（C/Fと同じロジック）
    let effectivePaymentDate: string | null = null;

    if (paymentMethod === '立替') {
      if (settlementDate) {
        effectivePaymentDate = settlementDate;
      }
    } else {
      effectivePaymentDate = paymentScheduledDate;
    }

    if (effectivePaymentDate && isDateInMonth(effectivePaymentDate, year, month)) {
      totalExpenses += amount;
    }
  });

  return Math.round(totalExpenses);
}

/**
 * 指定月の予測給与を計算（支払予定日ベース）
 * @param expenditureData - 支出管理マスタのデータ
 */
function calculatePredictedSalaryForMonth(expenditureData: any[][], year: number, month: number): number {
  let totalSalary = 0;

  expenditureData.slice(1).forEach(row => {
    const category = row[3];            // D列（カテゴリ）
    const paymentMethod = row[4];       // E列（支払方法）
    const settlementDate = row[7];      // H列（清算日）
    const paymentScheduledDate = row[9]; // J列（支払予定日）
    const amount = parseAmount(row[2]); // C列（金額）

    // 給与のみ
    if (category !== '給与') return;

    // 支払日の決定（C/Fと同じロジック）
    let effectivePaymentDate: string | null = null;

    if (paymentMethod === '立替') {
      if (settlementDate) {
        effectivePaymentDate = settlementDate;
      }
    } else {
      effectivePaymentDate = paymentScheduledDate;
    }

    if (effectivePaymentDate && isDateInMonth(effectivePaymentDate, year, month)) {
      totalSalary += amount;
    }
  });

  return Math.round(totalSalary);
}

/**
 * 指定月の予測固定費を計算（固定費マスタベース）
 * @param fixedCostData - 固定費マスタのデータ
 */
function calculatePredictedFixedCostsForMonth(fixedCostData: any[][], year: number, month: number): number {
  let totalFixedCosts = 0;
  const targetMonth = `${year}/${String(month).padStart(2, '0')}`;

  fixedCostData.slice(1).forEach(row => {
    const isActive = row[0] === true || row[0] === 'TRUE';
    const amount = parseAmount(row[2]); // C列（金額）
    const startMonth = row[6];          // G列（開始月）

    // 有効かつ開始月が対象月以前
    if (isActive && startMonth && startMonth <= targetMonth) {
      totalFixedCosts += amount;
    }
  });

  return Math.round(totalFixedCosts);
}

/**
 * 現金枯渇警告を計算
 */
function calculateCashDepletionWarning(
  predictions: MonthlyPrediction[]
): CashDepletionWarning {
  // 現金残高がマイナスになる最初の月を検出
  const depletionPrediction = predictions.find(p => p.cumulativeCashFlow < 0);

  if (!depletionPrediction) {
    return {
      willDeplete: false,
      severity: 'safe',
      message: '予測期間内に現金が枯渇する見込みはありません。'
    };
  }

  // 枯渇までの月数を計算
  const depletionIndex = predictions.indexOf(depletionPrediction);
  const monthsUntilDepletion = depletionIndex + 1; // +1 because index is 0-based

  // 警告レベルを判定
  let severity: 'safe' | 'caution' | 'warning' | 'danger';
  let message: string;

  if (monthsUntilDepletion <= 3) {
    severity = 'danger';
    message = `⚠️ 危険: ${monthsUntilDepletion}ヶ月後（${depletionPrediction.period}）に現金が枯渇する見込みです。早急な対策が必要です。`;
  } else if (monthsUntilDepletion <= 6) {
    severity = 'warning';
    message = `⚠️ 警告: ${monthsUntilDepletion}ヶ月後（${depletionPrediction.period}）に現金が枯渇する見込みです。対策を検討してください。`;
  } else {
    severity = 'caution';
    message = `注意: ${monthsUntilDepletion}ヶ月後（${depletionPrediction.period}）に現金が枯渇する可能性があります。`;
  }

  return {
    willDeplete: true,
    depletionMonth: depletionPrediction.period,
    monthsUntilDepletion,
    severity,
    message
  };
}

// ========================================
// 最適化版関数（データを引数で受け取る）
// ========================================

/**
 * 損益計算書（P/L）を計算（最適化版：データを引数で受け取る）
 * @param contractData - 契約・入金管理シートのデータ
 * @param expenditureData - 支出管理マスタのデータ
 * @param fixedCostData - 固定費マスタのデータ
 * @param year - 対象年
 * @param month - 対象月（1-12、省略時は年度全体）
 * @returns 損益計算書データ
 */
export async function calculateProfitAndLossFromData(
  contractData: any[][],
  expenditureData: any[][],
  fixedCostData: any[][],
  year: number,
  month?: number
): Promise<ProfitAndLoss> {
  // 1. 売上高の計算
  let revenue = 0;
  contractData.slice(2).forEach(row => {
    const contractStartDate = row[17] || row[4];
    const contractAmount = parseAmount(row[5]);
    const contractPeriodMonths = parseInt(row[18]) || 12;
    const autoRenewal = row[19];
    const autoRenewalAmount = parseAmount(row[20]);

    if (!contractStartDate || contractAmount === 0) return;

    const monthlyRevenue = Math.round(contractAmount / contractPeriodMonths);

    for (let i = 0; i < contractPeriodMonths; i++) {
      const revenueDate = addMonths(contractStartDate, i);
      const revenueYear = revenueDate.getFullYear();
      const revenueMonth = revenueDate.getMonth() + 1;

      const isInPeriod = month !== undefined
        ? (revenueYear === year && revenueMonth === month)
        : isDateInFiscalYear(`${revenueYear}/${String(revenueMonth).padStart(2, '0')}/01`, year);

      if (isInPeriod) {
        revenue += monthlyRevenue;
      }
    }

    if ((autoRenewal === '○' || autoRenewal === '〇') && autoRenewalAmount > 0) {
      const contractEndDate = addMonths(contractStartDate, contractPeriodMonths);
      const renewalMonthlyRevenue = autoRenewalAmount;

      if (month !== undefined) {
        const targetDate = new Date(year, month - 1, 1);
        const contractEndYear = contractEndDate.getFullYear();
        const contractEndMonth = contractEndDate.getMonth() + 1;
        const contractEndFirstDay = new Date(contractEndYear, contractEndMonth - 1, 1);

        if (targetDate >= contractEndFirstDay) {
          revenue += renewalMonthlyRevenue;
        }
      } else {
        const fiscalStartMonth = getFiscalYearStartMonth();
        const fiscalStartDate = new Date(year, fiscalStartMonth - 1, 1);
        const fiscalEndDate = new Date(year + 1, fiscalStartMonth - 1, 0);

        if (contractEndDate < fiscalEndDate) {
          const effectiveStartDate = contractEndDate > fiscalStartDate ? contractEndDate : fiscalStartDate;
          const monthsDiff = (fiscalEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12
                            + (fiscalEndDate.getMonth() - effectiveStartDate.getMonth()) + 1;

          if (monthsDiff > 0) {
            revenue += renewalMonthlyRevenue * monthsDiff;
          }
        }
      }
    }
  });

  // 2. 支出データの計算
  let costOfSales = 0;
  let salaryExpenses = 0;

  expenditureData.slice(1).forEach(row => {
    const date = row[0];
    const amount = parseAmount(row[2]);
    const category = row[3];

    const isInPeriod = month !== undefined
      ? isDateInMonth(date, year, month)
      : isDateInFiscalYear(date, year);

    if (isInPeriod) {
      if (category === '経費') {
        costOfSales += amount;
      } else if (category === '給与') {
        salaryExpenses += amount;
      }
    }
  });

  // 3. 固定費の計算
  let fixedCosts = 0;
  if (month !== undefined) {
    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6];

      if (isActive && startMonth) {
        const targetMonth = `${year}/${String(month).padStart(2, '0')}`;
        if (startMonth <= targetMonth) {
          fixedCosts += amount;
        }
      }
    });
  } else {
    const fiscalStartMonth = getFiscalYearStartMonth();
    const fiscalStartDate = new Date(year, fiscalStartMonth - 1, 1);
    const fiscalEndDate = new Date(year + 1, fiscalStartMonth - 1, 0);

    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6];

      if (isActive && startMonth) {
        const [startYear, startMon] = startMonth.split('/').map(Number);
        const fixedCostStartDate = new Date(startYear, startMon - 1, 1);

        if (fixedCostStartDate <= fiscalEndDate) {
          const effectiveStartDate = fixedCostStartDate > fiscalStartDate ? fixedCostStartDate : fiscalStartDate;
          const monthsDiff = (fiscalEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12
                            + (fiscalEndDate.getMonth() - effectiveStartDate.getMonth()) + 1;

          fixedCosts += amount * monthsDiff;
        }
      }
    });
  }

  // 4. 利益の計算
  const grossProfit = revenue - costOfSales;
  const operatingProfit = grossProfit - salaryExpenses - fixedCosts;

  // 5. 税金計算
  const effectiveTaxRate = 0.3;
  const profitBeforeTax = operatingProfit;
  const incomeTax = Math.max(0, profitBeforeTax * effectiveTaxRate);
  const netProfit = profitBeforeTax - incomeTax;

  return {
    fiscalYear: `${year}年度`,
    fiscalMonth: month !== undefined ? `${year}/${String(month).padStart(2, '0')}` : undefined,
    revenue,
    costOfSales,
    salaryExpenses,
    fixedCosts,
    grossProfit,
    operatingProfit,
    profitBeforeTax,
    incomeTax,
    netProfit,
    effectiveTaxRate,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 貸借対照表（B/S）を計算（最適化版：データを引数で受け取る）
 */
export async function calculateBalanceSheetFromData(
  contractData: any[][],
  expenditureData: any[][],
  fixedCostData: any[][],
  year: number,
  month?: number,
  initialCash: number = 0,
  capital: number = 100000
): Promise<BalanceSheet> {
  const targetMonth = month !== undefined ? month : 12;
  const lastDay = new Date(year, targetMonth, 0).getDate();
  const asOfDate = `${year}/${String(targetMonth).padStart(2, '0')}/${String(lastDay).padStart(2, '0')}`;

  let totalIncome = 0;
  contractData.slice(2).forEach(row => {
    const paymentActualDate = row[12];
    const amount = parseAmount(row[5]);
    if (paymentActualDate && isDateBeforeOrEqual(paymentActualDate, asOfDate)) {
      totalIncome += amount;
    }
  });

  let totalExpenses = 0;
  expenditureData.slice(1).forEach(row => {
    const date = row[0];
    const amount = parseAmount(row[2]);
    if (date && isDateBeforeOrEqual(date, asOfDate)) {
      totalExpenses += amount;
    }
  });

  fixedCostData.slice(1).forEach(row => {
    const isActive = row[0] === true || row[0] === 'TRUE';
    const amount = parseAmount(row[2]);
    const startMonth = row[6];
    if (isActive && startMonth) {
      const [startYear, startMon] = startMonth.split('/').map(Number);
      const startDate = new Date(startYear, startMon - 1);
      const endDate = new Date(year, targetMonth - 1);
      if (startDate <= endDate) {
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12
                          + (endDate.getMonth() - startDate.getMonth()) + 1;
        totalExpenses += amount * monthsDiff;
      }
    }
  });

  const cash = initialCash + totalIncome - totalExpenses;

  let accountsReceivable = 0;
  contractData.slice(2).forEach(row => {
    const contractDate = row[4];
    const amount = parseAmount(row[5]);
    const paymentActualDate = row[12];
    const paymentStatus = row[13];
    if (contractDate && isDateBeforeOrEqual(contractDate, asOfDate)) {
      if (!paymentActualDate || paymentStatus === '未入金') {
        accountsReceivable += amount;
      }
    }
  });

  let accountsPayable = 0;
  expenditureData.slice(1).forEach(row => {
    const date = row[0];
    const amount = parseAmount(row[2]);
    const paymentMethod = row[4];
    const settlementStatus = row[6];
    const paymentScheduledDate = row[9];
    if (date && isDateBeforeOrEqual(date, asOfDate)) {
      if (paymentMethod === '立替') {
        if (settlementStatus === '未清算') {
          accountsPayable += amount;
        }
      } else {
        if (paymentScheduledDate && !isDateBeforeOrEqual(paymentScheduledDate, asOfDate)) {
          accountsPayable += amount;
        }
      }
    }
  });

  const totalCurrentAssets = cash + accountsReceivable;
  const totalFixedAssets = 0;
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  const totalCurrentLiabilities = accountsPayable;
  const totalFixedLiabilities = 0;
  const totalLiabilities = totalCurrentLiabilities + totalFixedLiabilities;
  const retainedEarnings = totalAssets - totalLiabilities - capital;
  const totalNetAssets = capital + retainedEarnings;
  const totalLiabilitiesAndNetAssets = totalLiabilities + totalNetAssets;

  return {
    fiscalYear: `${year}年度`,
    fiscalMonth: month !== undefined ? `${year}/${String(month).padStart(2, '0')}` : undefined,
    asOfDate,
    assets: {
      currentAssets: { cash, accountsReceivable, totalCurrentAssets },
      fixedAssets: { totalFixedAssets },
      totalAssets
    },
    liabilities: {
      currentLiabilities: { accountsPayable, totalCurrentLiabilities },
      fixedLiabilities: { totalFixedLiabilities },
      totalLiabilities
    },
    netAssets: { capital, retainedEarnings, totalNetAssets },
    totalLiabilitiesAndNetAssets,
    generatedAt: new Date().toISOString()
  };
}

/**
 * キャッシュフロー計算書（C/F）を計算（最適化版：データを引数で受け取る）
 */
export async function calculateCashFlowStatementFromData(
  contractData: any[][],
  expenditureData: any[][],
  fixedCostData: any[][],
  year: number,
  month?: number,
  cashAtBeginning?: number
): Promise<CashFlowStatement> {
  const previousPeriod = getPreviousFiscalPeriod(year, month);
  let beginningCash = cashAtBeginning;
  if (beginningCash === undefined) {
    const previousBS = await calculateBalanceSheetFromData(contractData, expenditureData, fixedCostData, previousPeriod.year, previousPeriod.month);
    beginningCash = previousBS.assets.currentAssets.cash;
  }

  let operatingCashInflow = 0;
  contractData.slice(2).forEach(row => {
    const paymentActualDate = row[12];
    const amount = parseAmount(row[5]);
    const isInPeriod = month !== undefined ? isDateInMonth(paymentActualDate, year, month) : isDateInFiscalYear(paymentActualDate, year);
    if (isInPeriod) {
      operatingCashInflow += amount;
    }
  });

  let operatingCashOutflow = 0;
  expenditureData.slice(1).forEach(row => {
    const date = row[0];
    const amount = parseAmount(row[2]);
    const isInPeriod = month !== undefined ? isDateInMonth(date, year, month) : isDateInFiscalYear(date, year);
    if (isInPeriod) {
      operatingCashOutflow += amount;
    }
  });

  if (month !== undefined) {
    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6];
      if (isActive && startMonth) {
        const targetMonthStr = `${year}/${String(month).padStart(2, '0')}`;
        if (startMonth <= targetMonthStr) {
          operatingCashOutflow += amount;
        }
      }
    });
  } else {
    const fiscalStartMonth = getFiscalYearStartMonth();
    const fiscalStartDate = new Date(year, fiscalStartMonth - 1, 1);
    const fiscalEndDate = new Date(year + 1, fiscalStartMonth - 1, 0);
    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6];
      if (isActive && startMonth) {
        const [startYear, startMon] = startMonth.split('/').map(Number);
        const fixedCostStartDate = new Date(startYear, startMon - 1, 1);
        if (fixedCostStartDate <= fiscalEndDate) {
          const effectiveStartDate = fixedCostStartDate > fiscalStartDate ? fixedCostStartDate : fiscalStartDate;
          const monthsDiff = (fiscalEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12 + (fiscalEndDate.getMonth() - effectiveStartDate.getMonth()) + 1;
          operatingCashOutflow += amount * monthsDiff;
        }
      }
    });
  }

  const operatingActivities = operatingCashInflow - operatingCashOutflow;
  const investingActivities = 0;
  const financingActivities = 0;
  const netCashFlow = operatingActivities + investingActivities + financingActivities;
  const endingCash = beginningCash + netCashFlow;

  return {
    fiscalYear: `${year}年度`,
    fiscalMonth: month !== undefined ? `${year}/${String(month).padStart(2, '0')}` : undefined,
    operatingActivities: {
      cashFromCustomers: operatingCashInflow,
      cashToSuppliers: operatingCashOutflow,
      netOperatingCashFlow: operatingActivities
    },
    investingActivities: {
      purchaseOfFixedAssets: 0,
      netInvestingCashFlow: investingActivities
    },
    financingActivities: {
      proceedsFromBorrowings: 0,
      repaymentOfBorrowings: 0,
      netFinancingCashFlow: financingActivities
    },
    netCashFlow,
    cashAtBeginning: beginningCash,
    cashAtEnd: endingCash,
    generatedAt: new Date().toISOString()
  };
}
