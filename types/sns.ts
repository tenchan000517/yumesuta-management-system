/**
 * SNS投稿管理の型定義
 */

/**
 * SNS種類
 */
export type SNSType = 'Instagram' | 'X';

/**
 * アカウント名
 */
export type SNSAccount = '公式' | '被リンク1' | '被リンク2' | '被リンク3';

/**
 * 投稿ステータス
 */
export type PostStatus = '予定' | '完了' | '期限切れ';

/**
 * 投稿履歴
 */
export interface PostHistory {
  /** 投稿日時 */
  postedAt: string;
  /** SNS種類 */
  snsType: SNSType;
  /** アカウント名 */
  accountName: SNSAccount;
  /** 投稿内容 */
  content: string;
  /** 画像URL */
  imageUrl?: string;
  /** リンクURL */
  linkUrl?: string;
  /** いいね数 */
  likes?: number;
  /** RT数/コメント数 */
  engagements?: number;
  /** 備考 */
  note?: string;
}

/**
 * 投稿予定
 */
export interface PostSchedule {
  /** 投稿予定日時 */
  scheduledAt: string;
  /** SNS種類 */
  snsType: SNSType;
  /** アカウント名 */
  accountName: SNSAccount;
  /** 投稿予定内容 */
  content: string;
  /** ステータス */
  status: PostStatus;
  /** 備考 */
  note?: string;
  /** 期限切れフラグ（フロントエンドで計算） */
  isOverdue?: boolean;
}

/**
 * SNS投稿管理データ
 */
export interface SNSData {
  /** 投稿履歴 */
  history: PostHistory[];
  /** 投稿予定 */
  schedule: PostSchedule[];
  /** 未投稿件数（期限切れ） */
  overdueCount: number;
  /** 今日の投稿予定件数 */
  todayScheduledCount: number;
  /** 今週の投稿予定件数 */
  weekScheduledCount: number;
}

/**
 * SNS投稿管理APIレスポンス
 */
export interface SNSDataResponse {
  success: boolean;
  data?: SNSData;
  error?: string;
}
