/**
 * タスク管理機能 - 型定義
 * Phase 2実装
 */

// ===== タスクマスタ関連型定義 =====

export interface TaskMaster {
  taskId: string; // タスクID (例: TASK-001)
  taskName: string; // タスク名
  category: TaskCategory; // カテゴリ
  frequencyType: FrequencyType; // 頻度種別
  frequencyDetail: string; // 頻度詳細
  estimatedTime: string; // 所要時間
  priority: Priority; // 優先度
  riskLevel: RiskLevel; // 抜けもれリスク
  relatedUrls: RelatedUrl[]; // 関連URL（最大3つ）
  relatedPaths: RelatedPath[]; // 関連パス（最大2つ）
  relatedCommand?: string; // 関連コマンド
  relatedInfo?: string; // その他必要情報
  dependsOnTaskIds?: string[]; // 依存タスクID
  notes?: string; // 備考
}

export type TaskCategory =
  | 'パートナー管理'
  | '営業管理'
  | 'ゆめマガ制作'
  | 'HP・LLMO'
  | 'SNS'
  | '請求書';

export type FrequencyType = '毎日' | '週次' | '月次' | '不定期';

export type Priority = '最高' | '高' | '中';

export type RiskLevel = '最高' | '高' | '中' | '低';

export interface RelatedUrl {
  url: string;
  name: string;
}

export interface RelatedPath {
  path: string;
  name: string;
}

// ===== タスク実施履歴関連型定義 =====

export interface TaskHistory {
  date: string; // 実施日 (YYYY-MM-DD)
  taskId: string;
  taskName: string;
  status: TaskStatus;
  time?: string; // 実施時刻 (HH:MM)
  actualDuration?: number; // 所要時間実績（分）
  resultMemo?: string; // 結果・メモ
  urlClicked: boolean; // 関連URLクリック
  nextAction?: string; // 次のアクション
  alertDate?: string; // アラート設定日 (YYYY-MM-DD)
  timestamp: string; // 記録日時（自動）
  notes?: string; // 備考
}

export type TaskStatus = '完了' | '未完了' | 'スキップ';

// ===== 定期タスクスケジュール関連型定義 =====

export interface ScheduledTask {
  scheduledDate: string; // 予定日 (YYYY-MM-DD)
  taskId: string;
  taskName: string;
  scheduledTime?: string; // 予定時刻 (HH:MM)
  status: ScheduledTaskStatus;
  alert: ScheduledTaskAlert;
  completedDate?: string; // 実施日 (YYYY-MM-DD)
  notes?: string;
  timestamp: string; // 記録日時（自動）
}

export type ScheduledTaskStatus = '未実施' | '実施済み' | 'スキップ';

export type ScheduledTaskAlert = '期限超過' | '本日実施' | '';

// ===== プロジェクトタスク関連型定義 =====

export interface ProjectTask {
  projectName: string;
  taskId: string;
  taskName: string;
  plannedStartDate: string; // 開始予定日 (YYYY-MM-DD)
  plannedEndDate: string; // 完了予定日 (YYYY-MM-DD)
  status: ProjectTaskStatus;
  actualStartDate?: string; // 実際開始日 (YYYY-MM-DD)
  actualEndDate?: string; // 実際完了日 (YYYY-MM-DD)
  delayDays: number; // 遅延日数
  assignee: string; // 担当者
  dependsCompleted: boolean; // 依存タスク完了
  notes?: string;
  timestamp: string; // 記録日時（自動）
}

export type ProjectTaskStatus = '未着手' | '進行中' | '完了';

// ===== 今日のタスク関連型定義 =====

export interface TodayTask {
  task: TaskMaster;
  scheduled?: ScheduledTask; // 定期タスクの場合
  project?: ProjectTask; // プロジェクトタスクの場合
  alert: ScheduledTaskAlert;
  canStart: boolean; // 依存タスクチェック結果
}

// ===== ダッシュボードデータ型定義 =====

export interface TaskDashboardData {
  todayTasks: TodayTask[]; // 今日のタスク
  overdueScheduledTasks: ScheduledTask[]; // 期限超過の定期タスク
  overdueProjectTasks: ProjectTask[]; // 期限超過のプロジェクトタスク
  allTaskMasters: TaskMaster[]; // 全タスクマスタ
  recentHistory: TaskHistory[]; // 最近の実施履歴（10件）
}
