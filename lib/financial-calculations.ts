// lib/financial-calculations.ts
// 財務諸表計算ロジック

import { getSheetData } from '@/lib/google-sheets';
import type { ProfitAndLoss, BalanceSheet, CashFlowStatement } from '@/types/financial';

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
      : isDateInYear(paymentActualDate, year);

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
      : isDateInYear(date, year);

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
    // 年次計算: 各固定費を有効月数分カウント
    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6]; // G列（開始月、YYYY/MM形式）

      if (isActive && startMonth) {
        const [startYear, startMon] = startMonth.split('/').map(Number);
        // 対象年の1月〜12月のうち、固定費が有効な月数を計算
        if (startYear < year || (startYear === year && startMon <= 12)) {
          const effectiveStartMonth = startYear < year ? 1 : startMon;
          const monthsCount = 12 - effectiveStartMonth + 1;
          fixedCosts += amount * monthsCount;
        }
      }
    });
  }

  // 4. 利益の計算
  const grossProfit = revenue - costOfSales;
  const operatingProfit = grossProfit - salaryExpenses - fixedCosts;
  const netProfit = operatingProfit; // 簡易版では営業利益と同じ

  return {
    fiscalYear: `${year}年度`,
    fiscalMonth: month !== undefined ? `${year}/${String(month).padStart(2, '0')}` : undefined,
    revenue,
    costOfSales,
    salaryExpenses,
    fixedCosts,
    grossProfit,
    operatingProfit,
    netProfit,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 貸借対照表（B/S）を計算
 * @param year - 対象年
 * @param month - 対象月（1-12、省略時は12月末時点）
 * @param initialCash - 期首現金残高（デフォルト: 0）
 * @param capital - 資本金（デフォルト: 1000000）
 * @returns 貸借対照表データ
 */
export async function calculateBalanceSheet(
  year: number,
  month?: number,
  initialCash: number = 0,
  capital: number = 1000000
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

  // 3. 買掛金（未清算の立替金）の計算
  let accountsPayable = 0;
  expenditureData.slice(1).forEach(row => {
    const date = row[0];                          // A列（日付）
    const amount = parseAmount(row[2]);           // C列（金額）
    const paymentMethod = row[4];                 // E列（支払方法）
    const settlementStatus = row[6];              // G列（清算ステータス）

    if (date && isDateBeforeOrEqual(date, asOfDate)) {
      if (paymentMethod === '立替' && settlementStatus === '未清算') {
        accountsPayable += amount;
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
    if (month === undefined) {
      // 年次計算の場合は前年12月末のB/Sから取得
      const prevBS = await calculateBalanceSheet(year - 1, 12);
      beginningCash = prevBS.assets.currentAssets.cash;
    } else if (month === 1) {
      // 1月の場合は前年12月のB/Sから取得
      const prevBS = await calculateBalanceSheet(year - 1, 12);
      beginningCash = prevBS.assets.currentAssets.cash;
    } else {
      // それ以外は前月のB/Sから取得
      const prevBS = await calculateBalanceSheet(year, month - 1);
      beginningCash = prevBS.assets.currentAssets.cash;
    }
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
      : isDateInYear(paymentActualDate, year);

    if (isInPeriod) {
      cashFromCustomers += amount;
    }
  });

  // 支払（A列: 日付が対象期間内、立替以外）
  const expenditureData = await getSheetData(spreadsheetId, '支出管理マスタ!A:J');
  const fixedCostData = await getSheetData(spreadsheetId, '固定費マスタ!A:H');

  let cashToSuppliers = 0;

  // 支出管理マスタからの支払（立替以外）
  expenditureData.slice(1).forEach(row => {
    const date = row[0];                // A列（日付）
    const amount = parseAmount(row[2]); // C列（金額）
    const paymentMethod = row[4];       // E列（支払方法）

    const isInPeriod = month !== undefined
      ? isDateInMonth(date, year, month)
      : isDateInYear(date, year);

    if (isInPeriod) {
      // 立替以外の支払方法のみカウント（立替は清算時にキャッシュアウト）
      if (paymentMethod !== '立替') {
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
    // 年次計算: 各固定費を有効月数分カウント
    fixedCostData.slice(1).forEach(row => {
      const isActive = row[0] === true || row[0] === 'TRUE';
      const amount = parseAmount(row[2]);
      const startMonth = row[6];

      if (isActive && startMonth) {
        const [startYear, startMon] = startMonth.split('/').map(Number);
        if (startYear < year || (startYear === year && startMon <= 12)) {
          const effectiveStartMonth = startYear < year ? 1 : startMon;
          const monthsCount = 12 - effectiveStartMonth + 1;
          cashToSuppliers += amount * monthsCount;
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
