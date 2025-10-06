/**
 * 営業KPIデータの型定義
 */

// 営業KPIサマリー
export interface SalesKPI {
  month: number; // 対象月
  // 営業日の進捗状況
  totalBusinessDays: number; // 今月の営業日数
  elapsedBusinessDays: number; // 経過営業日数
  progressRate: number; // 進捗率（%）

  // 行動量の日次進捗
  metrics: {
    telAppointments: MetricData; // テレアポ件数
    appointments: MetricData; // アポ獲得数
    meetings: MetricData; // 商談件数
    closings: MetricData; // クロージング数
    contracts: MetricData; // 契約件数
  };

  // 転換率の検証
  conversionRates: {
    appointmentRate: ConversionRateData; // アポ獲得率（テレアポ→アポ）
    meetingRate: ConversionRateData; // 商談率（アポ→商談）
    closingRate: ConversionRateData; // クロージング率（商談→クロージング）
    contractRate: ConversionRateData; // 契約率（クロージング→契約）
  };
}

// メトリクスデータ
export interface MetricData {
  monthlyTarget: number; // 月間目標
  requiredToday: number; // 今日時点で必要
  actual: number; // 実績
  gap: number; // 過不足
  status: 'ok' | 'warning'; // 状態
}

// 転換率データ
export interface ConversionRateData {
  actualRate: number; // 実績転換率（%）
  expectedRate: number; // 想定転換率（%）
  gap: number; // 差分（%）
  status: 'ok' | 'warning'; // 状態
}

// ゆめマガ配布状況
export interface MagazineDistribution {
  availableSchools: DistributionMetric; // 配布可能校
  distributedSchools: DistributionMetric; // 配布学校数
  distributedCopies: DistributionMetric; // 配布部数
}

export interface DistributionMetric {
  target: number; // 目標
  actual: number; // 実績
  achievementRate: number; // 達成率（%）
  gap: number; // 過不足
  status: 'ok' | 'warning'; // 状態
}

// 月次予実管理データ
export interface MonthlyPerformance {
  contractTarget: number; // 契約件数目標
  contractActual: number; // 契約件数実績
  contractGap: number; // 契約件数過不足
  revenueTarget: number; // 売上目標
  revenueActual: number; // 売上実績
  revenueGap: number; // 売上過不足
  paymentTarget: number; // 入金目標額
  paymentActual: number; // 入金実績額
  unpaidAmount: number; // 未入金額
}

// 週別商談予定データ
export interface WeeklyMeetings {
  weekLabel: string; // 週のラベル（例: "第1週 (10/1-10/6)"）
  startDate: string; // 開始日（ISO形式）
  endDate: string; // 終了日（ISO形式）
  count: number; // 商談予定件数
}

// 顧客マスタ集計データ
export interface CustomerMasterStats {
  weeklyMeetings: WeeklyMeetings[]; // 週別商談予定
  awaitingReport: number; // 報告待ち件数
  statusCounts: {
    initialMeeting: number; // 初回商談待ち
    awaitingResponse: number; // 返事待ち
    inNegotiation: number; // 商談中
  };
}

// 営業KPI APIレスポンス
export interface SalesKPIResponse {
  success: boolean;
  data?: {
    kpi: SalesKPI;
    magazineDistribution: MagazineDistribution;
    monthlyPerformance: MonthlyPerformance; // 月次予実
    customerStats: CustomerMasterStats; // 顧客マスタ集計
    updatedAt: string; // 更新日時
  };
  error?: string;
}
