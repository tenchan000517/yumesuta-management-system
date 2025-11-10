import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), '.oauth-tokens.json');

/**
 * OAuth 2.0クライアントを取得
 */
export function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('OAuth credentials not configured in .env.local');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * 認証URLを生成
 */
export function generateAuthUrl() {
  const oauth2Client = getOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ],
    prompt: 'consent', // リフレッシュトークンを確実に取得
  });
}

/**
 * トークンをファイルに保存
 */
export function saveTokens(tokens: any) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

/**
 * トークンをファイルから読み込み
 */
export function loadTokens() {
  if (!fs.existsSync(TOKEN_PATH)) {
    return null;
  }
  const tokensJson = fs.readFileSync(TOKEN_PATH, 'utf-8');
  return JSON.parse(tokensJson);
}

/**
 * 認証済みのDriveクライアントを取得
 */
export async function getAuthenticatedDriveClient() {
  const oauth2Client = getOAuthClient();
  const tokens = loadTokens();

  if (!tokens) {
    throw new Error('Not authenticated. Please visit /api/auth/google to authenticate.');
  }

  oauth2Client.setCredentials(tokens);

  // トークンの有効期限チェックと自動リフレッシュ
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      saveTokens(credentials);
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // トークンが無効な場合はファイルを削除して再認証を促す
      if (fs.existsSync(TOKEN_PATH)) {
        fs.unlinkSync(TOKEN_PATH);
      }
      throw new Error('Token refresh failed. Please re-authenticate.');
    }
  }

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * 認証状態をチェック
 * トークンファイルの存在と基本的な有効性を確認
 */
export function isAuthenticated(): boolean {
  if (!fs.existsSync(TOKEN_PATH)) {
    return false;
  }

  try {
    const tokens = loadTokens();
    if (!tokens || !tokens.refresh_token) {
      // トークンファイルが壊れている、またはリフレッシュトークンがない
      return false;
    }
    return true;
  } catch (error) {
    // トークンファイルが読み込めない場合は未認証扱い
    return false;
  }
}
