// types/yumemaga-process.ts
// ゆめマガ制作フローの工程詳細管理用の型定義

export type ProcessStatus = 'completed' | 'in_progress' | 'delayed' | 'not_started';

export interface ProcessDetail {
  // 基本情報
  processNo: string;              // 工程番号（例: "A-2"）
  processName: string;            // 工程名
  categoryId: string;             // カテゴリID（例: "A"）
  categoryName: string;           // カテゴリ名（例: "メイン記事"）
  issue: string;                  // 対象月号（例: "2025年11月号"）

  // 概要
  overview?: string;              // 工程の概要説明

  // 日程管理
  plannedDate: string;            // 予定日
  actualDate?: string;            // 実績日
  status: ProcessStatus;          // ステータス
  delayDays?: number;             // 遅延日数

  // チェックリスト
  checklist: ChecklistItem[];     // チェックリスト

  // 必要データ・成果物
  requiredData?: RequiredDataItem[];   // 必要なデータ（録音、写真等）
  deliverables?: DeliverableItem[];    // 成果物（文字起こし、原稿等）

  // リンク・ガイド
  guides?: GuideLink[];           // 作業ガイドへのリンク
  canvaUrl?: string;              // Canvaデザインリンク
  driveFolder?: string;           // Google Driveフォルダリンク
  relatedProcesses?: string[];    // 関連工程（前工程・後工程）

  // メモ
  notes?: string;                 // メモ

  // インタビュー連携（準備工程→内容整理工程）
  interviewerRequests?: string;   // インタビュワーのこだわり（準備工程から取得）
}

export interface ChecklistItem {
  id: string;                     // チェック項目ID（例: "A-2-c1"）
  text: string;                   // チェック項目内容
  checked: boolean;               // チェック状態
}

export interface RequiredDataItem {
  id: string;
  type: 'audio' | 'document' | 'image' | 'video' | 'other';
  name: string;                   // データ名
  fileName?: string;              // ファイル名
  fileSize?: string;              // ファイルサイズ
  deadline?: string;              // 提出期限
  status: 'submitted' | 'pending' | 'none';
  driveUrl?: string;              // Google DriveのファイルURL
  driveFileId?: string;           // Google DriveのファイルID（ダウンロード用）
  optional: boolean;              // 任意フラグ
}

export interface DeliverableItem {
  id: string;
  name: string;                   // 成果物名
  type: 'text' | 'design' | 'pdf' | 'other';
  status: 'completed' | 'in_progress' | 'not_started';
  driveUrl?: string;
  driveFileId?: string;
  updatedAt?: string;
}

export interface GuideLink {
  id: string;
  label: string;                  // リンクラベル
  type: 'internal' | 'external' | 'modal';
  url?: string;
  icon?: string;
}
