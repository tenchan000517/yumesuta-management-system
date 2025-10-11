/**
 * データ種別
 */
export type DataType = 'recording' | 'photo' | 'planning' | 'content';

/**
 * アップロードモード
 */
export type UploadMode = 'category' | 'company';

/**
 * 企業選択モード
 */
export type CompanyMode = 'existing' | 'new';

/**
 * 企業フォルダ種別（新設計：8フォルダ）
 */
export type CompanyFolderType =
  | 'ロゴ'
  | 'ヒーロー画像'
  | 'QRコード'
  | '代表者写真'
  | 'サービス画像'
  | '社員写真'
  | '情報シート'
  | 'その他';

/**
 * ファイルアップロードリクエスト
 */
export interface FileUploadRequest {
  mode: UploadMode;

  // カテゴリモード用
  categoryId?: string;
  dataType?: DataType;
  issue?: string; // "2025_11" 形式

  // 企業モード用
  companyMode?: CompanyMode;
  companyName?: string;
  companyFolder?: CompanyFolderType;
}

/**
 * ファイルアップロードレスポンス
 */
export interface FileUploadResponse {
  success: boolean;
  uploadedFiles?: {
    fileName: string;
    driveFileId: string;
    driveUrl: string;
  }[];
  error?: string;
}

/**
 * データ種別情報
 */
export interface DataTypeInfo {
  type: DataType;
  name: string;
  folderName: string;
  extensions: string[];
}
