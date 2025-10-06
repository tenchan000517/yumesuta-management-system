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
    appointmentRate: ConversionRateData; // アポ獲得率
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

// 営業KPI APIレスポンス
export interface SalesKPIResponse {
  success: boolean;
  data?: {
    kpi: SalesKPI;
    magazineDistribution: MagazineDistribution;
    updatedAt: string; // 更新日時
  };
  error?: string;
}
