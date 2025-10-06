/**
 * クイックアクセスボタン型定義
 */

export interface QuickAccessButton {
  /** ボタン表示名 */
  buttonName: string;
  /** 遷移先URL */
  url: string;
  /** lucide-reactアイコン名（オプション） */
  iconName?: string;
  /** カテゴリ（グルーピング用） */
  category?: string;
  /** 表示順（小さい順に表示） */
  displayOrder: number;
  /** 背景色（オプション・デフォルトは青） */
  bgColor?: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
}

export interface QuickAccessData {
  buttons: QuickAccessButton[];
}

export interface QuickAccessAPIResponse {
  success: boolean;
  data?: QuickAccessData;
  error?: string;
}
