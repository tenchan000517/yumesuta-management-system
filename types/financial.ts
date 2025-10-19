// types/financial.ts
// 財務管理（決算書システム）関連の型定義

/**
 * 支出データ（支出管理マスタ）= 変動費
 */
export interface Expenditure {
  id: number;                          // 自動採番（行番号ベース）
  date: string;                        // A列: 日付（発生日、P/L用）
  itemName: string;                    // B列: 項目名
  amount: number;                      // C列: 金額（数値、円）
  category: 'expense' | 'salary' | 'fixed_cost';  // D列: カテゴリ
  paymentMethod: 'company_card' | 'reimbursement' | 'bank_transfer' | 'cash' | 'invoice';  // E列: 支払方法
  reimbursedPerson?: string;           // F列: 立替者名（立替の場合のみ）
  settlementStatus: 'unsettled' | 'settled' | 'none';  // G列: 清算ステータス
  settlementDate?: string;             // H列: 清算日（YYYY/MM/DD形式）
  notes?: string;                      // I列: 備考
  paymentScheduledDate?: string;       // J列: 支払予定日（C/F用、YYYY/MM/DD形式）
}

/**
 * 固定費データ（固定費マスタ）
 */
export interface FixedCost {
  id: number;                          // 自動採番（行番号ベース）
  isActive: boolean;                   // A列: 有効フラグ
  itemName: string;                    // B列: 項目名
  amount: number;                      // C列: 金額（数値、円）
  category: 'fixed_cost';              // D列: カテゴリ（固定値「固定費」）
  paymentMethod: 'company_card' | 'bank_transfer' | 'cash';  // E列: 支払方法
  paymentDay: number;                  // F列: 支払日（1〜31）
  startMonth: string;                  // G列: 開始月（YYYY/MM形式）
  notes?: string;                      // H列: 備考
}

/**
 * 支払設定データ（支払設定マスタ）
 */
export interface PaymentSetting {
  paymentMethod: 'company_card' | 'bank_transfer' | 'cash' | 'invoice' | 'reimbursement';  // A列: 支払方法
  paymentTiming: string;               // B列: 支払日タイミング（例: 「翌月27日」「即日」）
  withdrawalDay?: number;              // C列: 引き落とし日（1〜31、または空白）
  notes?: string;                      // D列: 備考
}

/**
 * 損益計算書（P/L: Profit and Loss Statement）
 */
export interface ProfitAndLoss {
  fiscalYear: string;           // 会計年度（例: "2024年度"）
  fiscalMonth?: string;         // 会計月（例: "2024/10"、月次の場合）

  // 売上
  revenue: number;              // 売上高

  // 支出
  costOfSales: number;          // 売上原価（経費）
  salaryExpenses: number;       // 人件費（給与）
  fixedCosts: number;           // 固定費

  // 利益（段階別）
  grossProfit: number;          // 粗利（売上 - 売上原価）
  operatingProfit: number;      // 営業利益（粗利 - 人件費 - 固定費）
  profitBeforeTax: number;      // 税引前当期純利益
  incomeTax: number;            // 法人税等
  netProfit: number;            // 税引後当期純利益（最終利益）

  // 税率情報
  effectiveTaxRate: number;     // 適用した実効税率（0.3 = 30%）

  // メタデータ
  generatedAt: string;          // 生成日時（ISO 8601形式）
}

/**
 * 貸借対照表（B/S: Balance Sheet）
 */
export interface BalanceSheet {
  fiscalYear: string;
  fiscalMonth?: string;
  asOfDate: string;             // 基準日（例: "2024/10/31"）

  // 資産の部
  assets: {
    currentAssets: {
      cash: number;             // 現金及び預金
      accountsReceivable: number;  // 売掛金
      totalCurrentAssets: number;
    };
    fixedAssets: {
      // 簡易版では固定資産は手動入力または別途管理
      totalFixedAssets: number;
    };
    totalAssets: number;
  };

  // 負債の部
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;  // 買掛金（未清算の立替金）
      totalCurrentLiabilities: number;
    };
    fixedLiabilities: {
      // 簡易版では固定負債は別途管理
      totalFixedLiabilities: number;
    };
    totalLiabilities: number;
  };

  // 純資産の部
  netAssets: {
    capital: number;            // 資本金（手動入力）
    retainedEarnings: number;   // 利益剰余金（累積純利益）
    totalNetAssets: number;
  };

  totalLiabilitiesAndNetAssets: number;

  generatedAt: string;
}

/**
 * キャッシュフロー計算書（C/F: Cash Flow Statement）
 */
export interface CashFlowStatement {
  fiscalYear: string;
  fiscalMonth?: string;

  // 営業活動によるキャッシュフロー
  operatingActivities: {
    cashFromCustomers: number;       // 顧客からの入金（契約・入金管理シートのM列）
    cashToSuppliers: number;         // 支払（支出管理マスタの合計）
    netOperatingCashFlow: number;    // 営業CF（入金 - 支払）
  };

  // 投資活動によるキャッシュフロー（簡易版では手動入力または0）
  investingActivities: {
    purchaseOfFixedAssets: number;   // 固定資産の取得（手動入力）
    netInvestingCashFlow: number;
  };

  // 財務活動によるキャッシュフロー（簡易版では手動入力または0）
  financingActivities: {
    proceedsFromBorrowings: number;  // 借入による収入（手動入力）
    repaymentOfBorrowings: number;   // 借入金の返済（手動入力）
    netFinancingCashFlow: number;
  };

  // キャッシュフロー合計
  netCashFlow: number;
  cashAtBeginning: number;           // 期首現金残高
  cashAtEnd: number;                 // 期末現金残高

  generatedAt: string;
}

/**
 * 財務3表の一括取得レスポンス
 */
export interface FinancialStatements {
  pl: ProfitAndLoss;
  bs: BalanceSheet;
  cf: CashFlowStatement;
}

/**
 * 支出サマリー（月次）
 */
export interface ExpenditureSummary {
  year: number;
  month: number;
  expense: number;              // 経費の合計
  salary: number;               // 給与の合計
  fixedCost: number;            // 固定費の合計
  total: number;                // 全支出の合計
  unsettledCount: number;       // 未清算の立替金の件数
  unsettledAmount: number;      // 未清算の立替金の合計
}

/**
 * APIレスポンス共通型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * カテゴリの日本語マッピング
 */
export const CategoryLabels: Record<Expenditure['category'], string> = {
  expense: '経費',
  salary: '給与',
  fixed_cost: '固定費'
};

/**
 * 支払方法の日本語マッピング
 */
export const PaymentMethodLabels: Record<Expenditure['paymentMethod'], string> = {
  company_card: '会社カード',
  reimbursement: '立替',
  bank_transfer: '銀行振込',
  cash: '現金',
  invoice: '請求書'
};

/**
 * 清算ステータスの日本語マッピング
 */
export const SettlementStatusLabels: Record<Expenditure['settlementStatus'], string> = {
  unsettled: '未清算',
  settled: '清算済み',
  none: '-'
};

/**
 * 支払予定一覧の項目（C/F詳細データ）
 */
export interface PaymentItem {
  date: string;              // 支払予定日（YYYY/MM/DD形式）
  itemName: string;          // 項目名
  amount: number;            // 金額（正=入金、負=出金）
  paymentMethod: string;     // 支払方法
  category: string;          // カテゴリ
  isPaid: boolean;           // 支払済みかどうか（過去の日付はtrue）
}

/**
 * 週次サマリーの項目（C/F詳細データ）
 */
export interface WeeklyItem {
  weekNumber: number;        // 週番号（1, 2, 3...）
  weekLabel: string;         // 週ラベル（例: "第1週 (10/1-10/7)"）
  inflow: number;            // 入金合計
  outflow: number;           // 出金合計
  netCashFlow: number;       // 純増減（入金 - 出金）
  majorEvents: Array<{       // 主要イベント（10万円以上の入出金）
    date: string;
    itemName: string;
    amount: number;
  }> | null;
}

/**
 * 日次キャッシュフロー推移の項目（C/F詳細データ）
 */
export interface DailyCashFlowItem {
  date: string;              // 日付（YYYY/MM/DD形式）
  cash: number;              // その日の現金残高
  inflow: number;            // その日の入金
  outflow: number;           // その日の出金
}

/**
 * C/F詳細データのレスポンス
 */
export interface CFDetailsResponse {
  paymentSchedule: PaymentItem[];      // 支払予定一覧
  weeklySummary: WeeklyItem[];         // 週次サマリー
  dailyCashFlow: DailyCashFlowItem[];  // 日次推移
}

/**
 * 月次予測データ（拡張版）
 */
export interface MonthlyPrediction {
  year: number;
  month: number;
  period: string;                    // 例: "2025/11"

  // 予測値
  predictedRevenue: number;          // 予測売上（予定入金）
  predictedExpenses: number;         // 予測経費
  predictedSalary: number;           // 予測給与
  predictedFixedCosts: number;       // 予測固定費
  predictedTax: number;              // 予測税金（シミュレーションモード時のみ使用）

  // 計算値
  netCashFlow: number;               // 純増減（予測売上 - 予測支出 - 税金）
  cumulativeCashFlow: number;        // 累積現金残高

  // メタ情報
  isPredicted: true;                 // 予測データであることを示すフラグ
}

/**
 * 現金枯渇警告
 */
export interface CashDepletionWarning {
  willDeplete: boolean;              // 枯渇するかどうか
  depletionMonth?: string;           // 枯渇月（例: "2025/12"）
  monthsUntilDepletion?: number;     // 枯渇までの月数
  severity: 'safe' | 'caution' | 'warning' | 'danger';  // 警告レベル
  message: string;                   // 警告メッセージ
}

/**
 * シミュレーション設定項目
 */
export interface SimulationSetting {
  itemName: string;           // A列: 項目名（例: 交通費、接待交際費、人件費など）
  salesRatio: number;         // B列: 売上比率（％、例: 3.0 = 3%）
  minimumAmount: number;      // C列: 最低金額（円、売上0円でも発生する金額）
  notes?: string;             // D列: 備考
}

/**
 * 税金支払設定項目
 */
export interface TaxPaymentSetting {
  taxType: string;                               // A列: 税金種別（例: 法人税等、消費税など）
  paymentMonth: number;                          // B列: 支払月（1-12）
  calculationMethod: 'fixed' | 'salesRatio' | 'profitRatio';  // C列: 計算方法
  rateOrAmount: number;                          // D列: 比率（％）または金額（円）
  notes?: string;                                // E列: 備考
}

/**
 * PL比率履歴項目（Phase 2）
 */
export interface PLHistoryRecord {
  yearMonth: string;          // A列: 年月（YYYY/MM）
  revenue: number;            // B列: 売上高
  costOfSalesRatio: number;   // D列: 売上原価率(%)
  salaryRatio: number;        // F列: 人件費率(%)
  travelExpenseRatio: number; // H列: 交通費率(%)
  entertainmentRatio: number; // J列: 接待交際費率(%)
  miscExpenseRatio: number;   // L列: 雑費率(%)
  fixedCostRatio: number;     // N列: 固定費率(%)
  operatingProfitRatio: number; // P列: 営業利益率(%)
}

/**
 * 未来予測のモード
 */
export type PredictionMode = 'actual' | 'simulation';

/**
 * 未来予測レスポンス（拡張版）
 */
export interface FuturePredictionResponse {
  // 基準情報
  baseYear: number;
  baseMonth: number;
  mode: PredictionMode;              // 予測モード（実績ベース or シミュレーション）
  currentCash: number;               // 現在の現金残高

  // 過去3ヶ月の実績平均（参考値）
  historicalAverage: {
    revenue: number;
    expenses: number;
    salary: number;
    fixedCosts: number;
    netCashFlow: number;
  };

  // 予測データ
  predictions: MonthlyPrediction[];

  // 現金枯渇警告
  cashDepletionWarning: CashDepletionWarning;

  generatedAt: string;
}
