// 次月号準備工程の型定義

import type { ContractManagementData } from './contract';

export type NextMonthProcessStatus = 'completed' | 'in_progress' | 'not_started';

export interface NextMonthProcessData {
  processNo: string;
  name: string;
  plannedDate: string;    // MM/DD形式
  actualDate?: string;    // MM/DD形式
  status: NextMonthProcessStatus;
}

export interface NextMonthCategory {
  id: string;
  name: string;
  icon: string;
  processNos: string[];  // このカテゴリに含まれる工程番号
  progress: number;      // 進捗率 (0-100)
  completed: number;     // 完了工程数
  total: number;         // 総工程数
  processes: NextMonthProcessData[];  // このカテゴリに属する工程
}

export interface NextMonthPrepData {
  currentMonthIssue: string;      // 例: "2025年11月号"
  nextMonthIssue: string;          // 例: "2025年12月号"
  processes: NextMonthProcessData[];
}

export interface NextMonthPrepSectionProps {
  currentMonthIssue: string;
  nextMonthIssue: string;
  processes: NextMonthProcessData[];
  companyPrepTasks?: any[]; // 企業別準備タスク
  categoryMetadata?: any[]; // カテゴリマスターデータ
  contractManagementData?: ContractManagementData; // 契約管理データ
  onRefresh: () => void;
  onUpdateActualDate: (processNo: string, date: string) => Promise<void>;
  onUpdateCompanyActualDate?: (processNo: string, date: string) => Promise<void>;
  onUpdateCompanyPlannedDate?: (processNo: string, date: string) => Promise<void>;
  onProcessDetail?: (processNo: string) => void; // 工程詳細表示
}

export interface NextMonthProgressSummaryProps {
  processes: NextMonthProcessData[];
}

export interface NextMonthProcessCardProps {
  process: NextMonthProcessData;
}

export interface NextMonthProcessTableProps {
  processes: NextMonthProcessData[];
  onUpdateActualDate: (processNo: string, date: string) => Promise<void>;
}

export interface NextMonthCategoryCardProps {
  category: NextMonthCategory;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdateActualDate: (processNo: string, date: string) => Promise<void>;
  onProcessDetail?: (processNo: string) => void; // 工程詳細表示
}
