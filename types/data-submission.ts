/**
 * データ種別
 */
export type DataType = 'recording' | 'photo' | 'planning';

/**
 * アップロードモード
 */
export type UploadMode = 'category' | 'company';

/**
 * 企業選択モード
 */
export type CompanyMode = 'existing' | 'new';

/**
 * 企業フォルダ種別
 */
export type CompanyFolderType = 'メイン' | 'サブ' | '情報シート';

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
