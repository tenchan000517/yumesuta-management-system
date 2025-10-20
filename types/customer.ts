// types/customer.ts
// 顧客管理システム - ゆめマガ企業マスター（51列）の型定義

/**
 * ゆめマガ企業マスター（51列）のデータ型
 * データソース: ゆめマガ進捗管理スプレッドシート > 企業マスター
 */
export interface YumeMagaCompany {
  // 基本情報
  companyId: string;              // A列（必須）
  companyName: string;            // B列（必須）
  companyNameKana?: string;       // C列
  industry?: string;              // D列
  area?: string;                  // E列
  description?: string;           // F列

  // 画像パス
  logoPath?: string;              // G列
  heroPath?: string;              // H列
  qrPath?: string;                // I列

  // 企業情報
  slogan?: string;                // J列
  presidentName?: string;         // K列
  presidentNameEn?: string;       // L列
  presidentPosition?: string;     // M列
  presidentPhoto?: string;        // N列

  // サービス情報
  service1ImagePath?: string;     // O列
  service1Title?: string;         // P列
  service1Desc?: string;          // Q列
  service2ImagePath?: string;     // R列
  service2Title?: string;         // S列
  service2Desc?: string;          // T列
  service3ImagePath?: string;     // U列
  service3Title?: string;         // V列
  service3Desc?: string;          // W列

  // 社長・社員情報
  presidentMessage?: string;      // X列
  member1ImagePath?: string;      // Y列
  member1Question?: string;       // Z列
  member1Answer?: string;         // AA列
  member2ImagePath?: string;      // AB列
  member2Question?: string;       // AC列
  member2Answer?: string;         // AD列
  member3ImagePath?: string;      // AE列
  member3Question?: string;       // AF列
  member3Answer?: string;         // AG列

  // 取り組み
  initiative1Title?: string;      // AH列
  initiative1Desc?: string;       // AI列
  initiative2Title?: string;      // AJ列
  initiative2Desc?: string;       // AK列
  initiative3Title?: string;      // AL列
  initiative3Desc?: string;       // AM列

  // 連絡先情報
  address?: string;               // AN列
  phone?: string;                 // AO列
  fax?: string;                   // AP列
  website?: string;               // AQ列
  email?: string;                 // AR列

  // その他
  established?: string;           // AS列
  employees?: string;             // AT列
  business?: string;              // AU列
  firstIssue?: string;            // AV列
  lastIssue?: string;             // AW列
  status?: 'new' | 'updated' | 'existing' | 'archive';  // AX列
  notes?: string;                 // AY列
}

/**
 * 企業フィールド情報
 * 各フィールドの詳細情報（列インデックス、名前、値、入力状態等）
 */
export interface CompanyField {
  index: number;                  // 列インデックス（0-50）
  name: string;                   // フィールド名（日本語）
  key: keyof YumeMagaCompany;     // プロパティキー
  value: string;                  // 値
  filled: boolean;                // 入力済みかどうか
  required: boolean;              // 必須フィールドかどうか
}

/**
 * 企業情報の入力進捗
 * 51列のうち何列入力済みかを管理
 */
export interface CompanyProgress {
  total: number;                  // 総フィールド数（51）
  filled: number;                 // 入力済みフィールド数
  notFilled: number;              // 未入力フィールド数
  progressRate: number;           // 進捗率（%）
}

/**
 * 企業一覧のサマリー情報
 */
export interface CompanySummary {
  total: number;                  // 総企業数
  new: number;                    // 新規企業数
  updated: number;                // 変更企業数
  existing: number;               // 継続企業数
  archive: number;                // アーカイブ企業数
}

/**
 * 企業一覧API レスポンス
 */
export interface CompanyListResponse {
  success: boolean;
  companies?: YumeMagaCompany[];
  total?: number;
  summary?: CompanySummary;
  error?: string;
}

/**
 * 企業詳細API レスポンス
 */
export interface CompanyDetailResponse {
  success: boolean;
  company?: YumeMagaCompany & {
    progress: CompanyProgress;
    fields: CompanyField[];
  };
  error?: string;
}

/**
 * 企業更新API リクエスト
 */
export interface CompanyUpdateRequest {
  [key: string]: string | undefined;
}

/**
 * 企業更新API レスポンス
 */
export interface CompanyUpdateResponse {
  success: boolean;
  company?: YumeMagaCompany;
  error?: string;
}

/**
 * 企業検索・フィルターパラメータ
 */
export interface CompanySearchParams {
  industry?: string;              // 業種フィルター
  area?: string;                  // エリアフィルター
  status?: 'new' | 'updated' | 'existing' | 'archive';  // ステータスフィルター
  search?: string;                // 検索ワード（企業名・業種）
}
