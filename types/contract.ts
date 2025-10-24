/**
 * 契約・入金管理シート関連の型定義
 */

/**
 * 契約レコード（契約・入金管理シートの1行）
 */
export interface ContractRecord {
  契約ID: string;
  企業ID: string;
  企業名: string;
  契約サービス: string;
  契約日: string;
  契約金額: string;
  入金方法: string;
  契約書送付: string;
  契約書回収: string;
  申込書送付: string;
  申込書回収: string;
  入金予定日: string;
  入金実績日: string;
  入金ステータス: string;
  遅延日数: string;
  掲載開始号: string;
  備考: string;
  契約開始日: string;
  契約期間: number;
  自動更新有無: '〇' | '✖' | string;
  自動更新後の金額: string;
  ステップ1完了日: string;
  ステップ2完了日: string;
  ステップ3完了日: string;
  ステップ4完了日: string;
  ステップ5完了日: string;
}

/**
 * 新規企業情報（次月号準備セクション用）
 */
export interface NewCompany {
  契約ID: string;
  企業名: string;
  契約サービス: string;
  掲載開始号: string;
  契約金額: string;
  契約開始日: string;
}

/**
 * 契約更新リマインド情報
 */
export interface RenewalReminder {
  契約ID: string;
  企業名: string;
  契約サービス: string;
  契約開始日: string;
  契約終了日: string;
  daysUntilEnd: number;
  自動更新有無: '〇' | '✖' | string;
  自動更新後の金額?: string;
  mailTemplate: string;
}

/**
 * 契約管理データ（APIレスポンス）
 */
export interface ContractManagementData {
  newCompanies: NewCompany[];
  renewalReminders: RenewalReminder[];
}

/**
 * 契約管理APIレスポンス
 */
export interface ContractManagementResponse {
  success: boolean;
  data?: ContractManagementData;
  error?: string;
}
