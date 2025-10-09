import { google } from 'googleapis';
import { getAuthenticatedDriveClient } from './google-oauth';

/**
 * Google Drive APIクライアントを取得（サービスアカウント）
 */
export function getDriveClient() {
  try {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!credentialsJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive', // 全アクセス（共有フォルダ含む）
      ],
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Failed to initialize Google Drive client:', error);
    throw error;
  }
}

/**
 * 指定フォルダ内のファイル一覧を取得
 */
export async function listFilesInFolder(folderId: string) {
  const drive = getDriveClient();

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink)',
      orderBy: 'name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return response.data.files || [];
  } catch (error: any) {
    console.error('Google Drive API error:', error);
    throw new Error(`Failed to list files in folder ${folderId}: ${error.message}`);
  }
}

/**
 * ファイルのメタデータを取得
 */
export async function getFileMetadata(fileId: string) {
  const drive = getDriveClient();

  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink',
      supportsAllDrives: true,
    });

    return response.data;
  } catch (error: any) {
    console.error('Google Drive API error:', error);
    throw new Error(`Failed to get file metadata for ${fileId}: ${error.message}`);
  }
}

/**
 * フォルダが存在するか確認
 */
export async function folderExists(folderId: string): Promise<boolean> {
  const drive = getDriveClient();

  try {
    await drive.files.get({
      fileId: folderId,
      fields: 'id, mimeType',
      supportsAllDrives: true,
    });
    return true;
  } catch (error: any) {
    if (error.code === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * フォルダを作成
 * @param parentFolderId 親フォルダID
 * @param folderName 作成するフォルダ名
 * @returns 作成されたフォルダID
 */
export async function createFolder(parentFolderId: string, folderName: string): Promise<string> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    return response.data.id!;
  } catch (error: any) {
    console.error('Google Drive API error (createFolder):', error);
    throw new Error(`Failed to create folder ${folderName}: ${error.message}`);
  }
}

/**
 * ファイルをアップロード
 * @param folderId アップロード先フォルダID
 * @param file アップロードするファイル（File or Blob）
 * @param fileName ファイル名（省略時はfile.nameを使用）
 * @returns アップロードされたファイル情報
 */
export async function uploadFile(
  folderId: string,
  file: File | Blob,
  fileName?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const drive = getDriveClient();

  try {
    // File型の場合はfile.nameを使用、Blob型の場合はfileNameが必須
    const name = fileName || (file instanceof File ? file.name : 'untitled');

    // FileオブジェクトをBufferに変換してからStreamに
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Readable streamを作成
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: stream,
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      webViewLink: response.data.webViewLink!,
    };
  } catch (error: any) {
    console.error('Google Drive API error (uploadFile):', error);
    throw new Error(`Failed to upload file ${fileName || 'unknown'}: ${error.message}`);
  }
}

/**
 * ディレクトリパスを解決（存在しなければ作成）
 * @param rootFolderId ルートフォルダID
 * @param pathSegments パスセグメント配列（例: ["録音データ", "2025_11"]）
 * @returns 最終フォルダID
 */
export async function ensureDirectory(
  rootFolderId: string,
  pathSegments: string[]
): Promise<string> {
  let currentFolderId = rootFolderId;

  for (const segment of pathSegments) {
    // 現在のフォルダ内にセグメント名のフォルダが存在するか確認
    const existingFolder = await findFolderByName(currentFolderId, segment);

    if (existingFolder) {
      // 存在する場合はそのIDを使用
      currentFolderId = existingFolder.id;
    } else {
      // 存在しない場合は作成
      currentFolderId = await createFolder(currentFolderId, segment);
    }
  }

  return currentFolderId;
}

/**
 * 指定フォルダ内で名前からフォルダを検索
 * @param parentFolderId 親フォルダID
 * @param folderName 検索するフォルダ名
 * @returns フォルダ情報（見つからない場合はnull）
 */
async function findFolderByName(
  parentFolderId: string,
  folderName: string
): Promise<{ id: string; name: string } | null> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.list({
      q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = response.data.files || [];
    return files.length > 0 ? { id: files[0].id!, name: files[0].name! } : null;
  } catch (error: any) {
    console.error('Google Drive API error (findFolderByName):', error);
    return null;
  }
}

/**
 * ===== OAuth認証版の関数群 =====
 * ユーザー認証でファイルアップロード・フォルダ作成を行う
 */

/**
 * OAuth認証を使ってファイルをアップロード
 */
export async function uploadFileWithOAuth(
  folderId: string,
  file: File | Blob,
  fileName?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const drive = await getAuthenticatedDriveClient();

  try {
    const name = fileName || (file instanceof File ? file.name : 'untitled');

    // FileオブジェクトをBufferに変換してからStreamに
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Readable streamを作成
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: stream,
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      webViewLink: response.data.webViewLink!,
    };
  } catch (error: any) {
    console.error('Google Drive API error (uploadFileWithOAuth):', error);
    throw new Error(`Failed to upload file ${fileName || 'unknown'}: ${error.message}`);
  }
}

/**
 * OAuth認証を使ってフォルダを作成
 */
export async function createFolderWithOAuth(
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const drive = await getAuthenticatedDriveClient();

  try {
    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    return response.data.id!;
  } catch (error: any) {
    console.error('Google Drive API error (createFolderWithOAuth):', error);
    throw new Error(`Failed to create folder ${folderName}: ${error.message}`);
  }
}

/**
 * OAuth認証を使ってディレクトリパスを解決（存在しなければ作成）
 */
export async function ensureDirectoryWithOAuth(
  rootFolderId: string,
  pathSegments: string[]
): Promise<string> {
  let currentFolderId = rootFolderId;

  for (const segment of pathSegments) {
    // 現在のフォルダ内にセグメント名のフォルダが存在するか確認
    const existingFolder = await findFolderByNameWithOAuth(currentFolderId, segment);

    if (existingFolder) {
      currentFolderId = existingFolder.id;
    } else {
      currentFolderId = await createFolderWithOAuth(currentFolderId, segment);
    }
  }

  return currentFolderId;
}

/**
 * OAuth認証を使って指定フォルダ内のファイル一覧を取得
 */
export async function listFilesInFolderWithOAuth(folderId: string) {
  const drive = await getAuthenticatedDriveClient();

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return response.data.files || [];
  } catch (error: any) {
    console.error('Google Drive API error (listFilesInFolderWithOAuth):', error);
    throw new Error(`Failed to list files in folder ${folderId}: ${error.message}`);
  }
}

/**
 * OAuth認証を使って指定フォルダ内で名前からフォルダを検索
 */
async function findFolderByNameWithOAuth(
  parentFolderId: string,
  folderName: string
): Promise<{ id: string; name: string } | null> {
  const drive = await getAuthenticatedDriveClient();

  try {
    const response = await drive.files.list({
      q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = response.data.files || [];
    return files.length > 0 ? { id: files[0].id!, name: files[0].name! } : null;
  } catch (error: any) {
    console.error('Google Drive API error (findFolderByNameWithOAuth):', error);
    return null;
  }
}
