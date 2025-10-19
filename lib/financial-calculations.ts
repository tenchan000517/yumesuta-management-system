// lib/financial-calculations.ts
// 財務諸表計算ロジック

import { getSheetData } from '@/lib/google-sheets';
import type {
  ProfitAndLoss,
  BalanceSheet,
  CashFlowStatement,
  PaymentItem,
  WeeklyItem,
  DailyCashFlowItem
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
 * 金額文字列をパース（カンマ区切りや円マーク対応）
 */
function parseAmount(amountStr: string | number | undefined): number {
  if (typeof amountStr === 'number') return amountStr;
  if (!amountStr) return 0;

  const cleaned = String(amountStr).replace(/[¥,円]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
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
  // M列（入金実績日）が対象期間内のレコードを抽出し、F列（契約金額）を合計
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:P');

  let revenue = 0;
  contractData.slice(1).forEach(row => {
    const paymentActualDate = row[12]; // M列（入金実績日）
    const amount = parseAmount(row[5]); // F列（契約金額）

    const isInPeriod = month !== undefined
      ? isDateInMonth(paymentActualDate, year, month)
      : isDateInFiscalYear(paymentActualDate, year);

    if (isInPeriod) {
      revenue += amount;
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
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:P');

  let totalIncome = 0;
  contractData.slice(1).forEach(row => {
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
      const endDate = new Date(year, month - 1);

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
  contractData.slice(1).forEach(row => {
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
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:P');

  let cashFromCustomers = 0;
  contractData.slice(1).forEach(row => {
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
  const contractData = await getSheetData(spreadsheetId, '契約・入金管理!A:P');

  contractData.slice(1).forEach(row => {
    const companyName = row[1];                 // B列: 企業名
    const productName = row[2];                 // C列: 商品名
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
