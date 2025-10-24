/**
 * 企業マスター関連の型定義
 */

/**
 * 企業情報（企業マスターシートの1行）
 */
export interface CompanyInfo {
  // 基本情報
  企業ID: string;
  企業名: string;
  企業名_カナ: string;
  業種: string;
  事業エリア: string;
  説明文_一覧用: string;

  // 画像
  ロゴ画像パス: string;
  ヒーロー画像パス: string;
  QRコード画像パス: string;

  // 代表者情報
  スローガン: string;
  代表者名: string;
  代表者名_英語: string;
  代表者役職: string;
  代表者写真パス: string;

  // サービス情報
  サービス1_画像パス: string;
  サービス1_タイトル: string;
  サービス1_説明: string;
  サービス2_画像パス: string;
  サービス2_タイトル: string;
  サービス2_説明: string;
  サービス3_画像パス: string;
  サービス3_タイトル: string;
  サービス3_説明: string;

  // 社長メッセージ
  社長メッセージ: string;

  // 社員インタビュー
  社員1_画像パス: string;
  社員1_質問: string;
  社員1_回答: string;
  社員2_画像パス: string;
  社員2_質問: string;
  社員2_回答: string;
  社員3_画像パス: string;
  社員3_質問: string;
  社員3_回答: string;

  // 取り組み
  取り組み1_タイトル: string;
  取り組み1_説明: string;
  取り組み2_タイトル: string;
  取り組み2_説明: string;
  取り組み3_タイトル: string;
  取り組み3_説明: string;

  // 連絡先情報
  住所: string;
  電話番号: string;
  FAX番号: string;
  ウェブサイト: string;
  問い合わせメール: string;
  設立年: string;
  従業員数: string;
  事業内容: string;

  // 掲載情報
  初掲載号: string;
  最終更新号: string;
  ステータス: string;
  備考: string;
}

/**
 * 企業情報フォームセクション
 */
export type CompanyInfoSection =
  | 'basic'
  | 'images'
  | 'representative'
  | 'services'
  | 'president_message'
  | 'staff_interviews'
  | 'initiatives'
  | 'contact';

/**
 * 企業情報フォームのプロップス
 */
export interface CompanyInfoFormProps {
  companyId?: string;
  initialData?: Partial<CompanyInfo>;
  onSave: (data: CompanyInfo) => Promise<void>;
  onCancel: () => void;
}
