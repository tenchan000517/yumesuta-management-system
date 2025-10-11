// types/workflow.ts
// 契約業務フロー関連の型定義

export type StepStatus = 'pending' | 'in_progress' | 'completed';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface GuideLink {
  id: string;
  label: string;
  type: 'modal' | 'external' | 'internal';
  target?: string;  // モーダルID or URL
  icon?: string;    // 📧 📋 🔗 etc
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  overview: string;
  status: StepStatus;
  actions: string[];           // やることリスト（HTML可）
  checklist: ChecklistItem[];
  guides: GuideLink[];
  sourceUrl?: string;           // 原本URL（ステップ②④）
  emailTemplate?: EmailTemplate;// メール例文（ステップ⑤⑪⑫⑬）
  notes?: string[];             // 注意事項
}

export interface Milestone {
  stepNumber: number;
  label: string;
}

export interface ContractData {
  id: number;                      // A列
  companyName: string;             // B列
  contractService: string;         // C列
  contractDate: string;            // D列（YYYY/MM/DD形式）
  amount: string;                  // E列（¥XXX,XXX形式）
  paymentMethod: string;           // F列
  contractSentDate?: string;       // G列
  contractReceivedDate?: string;   // H列
  applicationSentDate?: string;    // I列
  applicationReceivedDate?: string;// J列
  paymentDueDate: string;          // K列
  paymentActualDate?: string;      // L列
  paymentStatus: string;           // M列
  delayDays?: number;              // N列
  publicationIssue: string;        // O列
  notes?: string;                  // P列
}

export interface WorkflowState {
  stepStatuses: Record<number, StepStatus>;
  checklists: Record<string, boolean>;
}
