import { google } from 'googleapis';

/**
 * Google Drive APIクライアントを取得
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
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
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
    });
    return true;
  } catch (error: any) {
    if (error.code === 404) {
      return false;
    }
    throw error;
  }
}
