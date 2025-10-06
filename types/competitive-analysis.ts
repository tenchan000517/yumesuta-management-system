/**
 * 競合分析型定義
 */

export interface CompetitorLink {
  /** リンク名（HP、Instagram、X等） */
  linkName: string;
  /** URL */
  url: string;
  /** アイコン名（lucide-react） */
  iconName?: string;
}

export interface CompetitorDocument {
  /** ファイル名 */
  name: string;
  /** GoogleドライブのファイルID */
  id: string;
  /** WebViewLink（表示用URL） */
  webViewLink: string;
  /** WebContentLink（ダウンロード用URL） */
  webContentLink?: string;
  /** MIMEタイプ */
  mimeType: string;
  /** ファイルサイズ（バイト） */
  size?: number;
  /** 最終更新日時 */
  modifiedTime?: string;
  /** アイコンリンク */
  iconLink?: string;
}

export interface Competitor {
  /** 競合企業名 */
  companyName: string;
  /** カテゴリ（就活情報誌、求人サイト等） */
  category: string;
  /** 主要URLリンク */
  links: CompetitorLink[];
  /** GoogleドライブフォルダID（資料格納先） */
  driveFolderId?: string;
  /** 資料ファイル一覧 */
  documents?: CompetitorDocument[];
  /** メモ・特記事項 */
  notes?: string;
  /** 最終確認日 */
  lastChecked?: string;
  /** 表示順 */
  displayOrder: number;
}

export interface CompetitiveAnalysisData {
  competitors: Competitor[];
}

export interface CompetitiveAnalysisAPIResponse {
  success: boolean;
  data?: CompetitiveAnalysisData;
  error?: string;
}
