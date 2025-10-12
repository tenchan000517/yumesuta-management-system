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
  id: number;                      // A列（契約ID）
  companyId: number;               // B列（企業ID）- Phase 1.6追加
  companyName: string;             // C列（企業名）
  contractService: string;         // D列
  contractDate: string;            // E列（YYYY/MM/DD形式）
  amount: string;                  // F列（¥XXX,XXX形式）
  paymentMethod: string;           // G列
  contractSentDate?: string;       // H列
  contractReceivedDate?: string;   // I列
  applicationSentDate?: string;    // J列
  applicationReceivedDate?: string;// K列
  paymentDueDate: string;          // L列
  paymentActualDate?: string;      // M列
  paymentStatus: string;           // N列
  delayDays?: number;              // O列
  publicationIssue: string;        // P列
  notes?: string;                  // Q列

  // Phase 1.5追加: 進捗管理フィールド（R〜AD列）
  step1CompletedAt?: string;       // R列
  step2CompletedAt?: string;       // S列
  step3CompletedAt?: string;       // T列
  step4CompletedAt?: string;       // U列
  step5CompletedAt?: string;       // V列
  step6CompletedAt?: string;       // W列
  step7CompletedAt?: string;       // X列
  step8CompletedAt?: string;       // Y列
  step9CompletedAt?: string;       // Z列
  step10CompletedAt?: string;      // AA列
  step11CompletedAt?: string;      // AB列
  step12CompletedAt?: string;      // AC列
  step13CompletedAt?: string;      // AD列
}

export interface WorkflowState {
  stepStatuses: Record<number, StepStatus>;
  checklists: Record<string, boolean>;
}

// Phase 1.5追加: リマインダーカード型定義
export interface ReminderCard {
  type: 'new-contract-required' | 'payment-overdue' | 'payment-pending' | 'in-progress' | 'completed' | 'contract-expiry-near';
  companyName: string;
  contractId?: number;
  priority: 'high' | 'medium' | 'low';

  // 入金関連
  paymentDueDate?: string;
  delayDays?: number;

  // 進捗関連
  completedSteps?: number;
  totalSteps?: number;
  nextStep?: number;              // 次に進むべきステップ番号
  nextStepTitle?: string;         // 次に進むべきステップのタイトル

  // 契約満了関連
  contractEndDate?: string;
  daysUntilExpiry?: number;
}

// Phase 1.5追加: 情報収集フォーマットのパース結果型定義
export interface ParsedContractForm {
  companyName: string;
  representativeTitle: string;
  representativeName: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  contactEmail: string;
  contractDate: string;
  annualFee: number;
  monthlyFee: number;
  publicationStart: string;
  publicationEnd: string;
  adSize: string;
  adPosition: string;
  designFormat: string;
  sendBasicContract: boolean;
  sendApplication: boolean;
  paymentDeadline: string;
}

// Phase 1.6追加: 契約企業マスタの型定義
export interface CompanyMasterData {
  companyId: number;              // A列
  officialName: string;           // B列
  shortName?: string;             // C列
  representativeTitle: string;    // D列
  representativeName: string;     // E列
  postalCode: string;             // F列
  address: string;                // G列
  phone: string;                  // H列
  fax?: string;                   // I列
  email: string;                  // J列
  websiteUrl?: string;            // K列
  contactPerson: string;          // L列
  contactEmail: string;           // M列
  contactPhone?: string;          // N列
  industry?: string;              // O列
  employeeCount?: number;         // P列
  capital?: string;               // Q列
  establishedDate?: string;       // R列
  notes?: string;                 // S列
  registeredDate: string;         // T列
  lastUpdatedDate: string;        // U列
  dataSource: string;             // V列
  customerMasterName?: string;    // W列
  contractCount: number;          // X列
  latestContractId?: number;      // Y列
}
