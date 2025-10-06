/**
 * ゆめマガ制作進捗管理 - Phase4逆算スケジューラー関連の型定義
 */

// 工程データ
export interface ProcessTask {
  processName: string; // 工程名
  layer: string; // レイヤー
  reason: string; // 配置理由
  dates: Record<string, string>; // 日付ごとのステータス（日付キー: ステータス値）
}

// ガントチャートデータ
export interface GanttData {
  sheetTitle: string; // シート名（例: 逆算配置_ガント_2025年11月号）
  issueNumber: string; // 月号（例: 2025年11月号）
  dateHeaders: string[]; // 日付ヘッダー配列
  tasks: ProcessTask[]; // 工程データ配列
}

// 進捗データ
export interface ProgressData {
  processName: string; // 工程名
  plannedDate: string; // 予定日
  actualDate?: string; // 実績日
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed'; // ステータス
  assignee?: string; // 担当者
  notes?: string; // 備考
}

// API レスポンス型
export interface ProcessScheduleResponse {
  success: boolean;
  message: string;
  ganttData: GanttData;
  progressData: ProgressData[];
  availableIssues: string[]; // 利用可能な月号リスト
}
