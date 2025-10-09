# OAuth 2.0実装計画書
## Google Drive ファイルアップロード機能のOAuth認証への移行

**作成日**: 2025-10-09
**目的**: サービスアカウントのストレージ容量制限を回避し、ユーザーアカウントでのファイルアップロードを実現
**対象**: 次世代Claude Code + ユーザー（tenchan1341@gmail.com）

---

## 📋 背景と問題

### 現状の問題
- **サービスアカウントでファイルアップロード不可**: サービスアカウントにはストレージ容量がないため、`drive.files.create`が403エラーで失敗
- **エラーメッセージ**: `Service Accounts do not have storage quota`

### 解決策
**OAuth 2.0認証**を実装し、ユーザー（tenchan1341@gmail.com）として認証することで、ユーザーのGoogle Driveストレージにファイルをアップロード

---

## 🎯 実装目標

1. ✅ OAuth 2.0クライアントIDの作成（ユーザー作業）
2. ✅ 認証フローの実装（初回のみ手動認証）
3. ✅ トークン管理システムの構築（自動リフレッシュ）
4. ✅ アップロードAPIのOAuth対応
5. ✅ フォルダ作成APIのOAuth対応
6. ✅ エンドツーエンドテスト

---

## 📝 実装手順

### Phase 1: Google Cloud Console設定（ユーザー作業）

#### ステップ 1-1: OAuth 2.0クライアントIDの作成

**担当**: ユーザー（tenchan1341@gmail.com）
**所要時間**: 約10分

1. **Google Cloud Consoleにアクセス**
   - URL: https://console.cloud.google.com/
   - プロジェクト `fair-yew-446514-q5` を選択（既存のサービスアカウントと同じプロジェクト）

2. **OAuth同意画面の設定**
   - 左メニュー → 「APIとサービス」 → 「OAuth同意画面」
   - ユーザータイプ: **外部** を選択（個人アカウントの場合）
   - アプリ名: `ゆめスタ統合マネジメントシステム`
   - ユーザーサポートメール: `tenchan1341@gmail.com`
   - デベロッパーの連絡先情報: `tenchan1341@gmail.com`
   - 「保存して次へ」をクリック

3. **スコープの追加**
   - 「スコープを追加または削除」をクリック
   - 以下のスコープを追加:
     - `https://www.googleapis.com/auth/drive`
     - `https://www.googleapis.com/auth/drive.file`
   - 「保存して次へ」をクリック

4. **テストユーザーの追加**
   - 「テストユーザーを追加」をクリック
   - `tenchan1341@gmail.com` を追加
   - 「保存して次へ」をクリック

5. **OAuth 2.0クライアントIDの作成**
   - 左メニュー → 「APIとサービス」 → 「認証情報」
   - 「認証情報を作成」 → 「OAuth クライアント ID」
   - アプリケーションの種類: **ウェブアプリケーション**
   - 名前: `ゆめスタマネジメント - OAuth Client`
   - 承認済みのリダイレクト URI:
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   - 「作成」をクリック

6. **クライアントIDとシークレットを保存**
   - 表示されたダイアログから以下をコピー:
     - クライアントID（例: `123456789-abcdefg.apps.googleusercontent.com`）
     - クライアントシークレット（例: `GOCSPX-xxxxxxxxxxxxx`）
   - **次のステップで使用するため、メモ帳に保存しておく**

---

### Phase 2: 環境変数の設定（ユーザー + Claude Code）

#### ステップ 2-1: .env.localに認証情報を追加

**担当**: Claude Code（ユーザーが提供した情報を使用）

ユーザーから以下の情報を受け取る:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

`.env.local`に追加:
```bash
# OAuth 2.0 認証情報
GOOGLE_OAUTH_CLIENT_ID="ユーザーから受け取ったクライアントID"
GOOGLE_OAUTH_CLIENT_SECRET="ユーザーから受け取ったシークレット"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# トークン保存用（初期値は空）
GOOGLE_OAUTH_ACCESS_TOKEN=""
GOOGLE_OAUTH_REFRESH_TOKEN=""
GOOGLE_OAUTH_TOKEN_EXPIRY=""
```

**重要**: `.env.local`はGitにコミットしない（`.gitignore`で除外済み）

---

### Phase 3: OAuth認証フローの実装（Claude Code）

#### ステップ 3-1: OAuth認証ライブラリのインストール

```bash
# 既にgoogleapisパッケージがインストール済みなので追加不要
```

#### ステップ 3-2: OAuth認証ユーティリティの作成

**ファイル**: `lib/google-oauth.ts`

```typescript
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
      throw new Error('Token refresh failed. Please re-authenticate.');
    }
  }

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * 認証状態をチェック
 */
export function isAuthenticated(): boolean {
  return fs.existsSync(TOKEN_PATH);
}
```

#### ステップ 3-3: 認証開始APIの作成

**ファイル**: `app/api/auth/google/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { generateAuthUrl } from '@/lib/google-oauth';

export async function GET() {
  try {
    const authUrl = generateAuthUrl();

    // 認証URLにリダイレクト
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### ステップ 3-4: 認証コールバックAPIの作成

**ファイル**: `app/api/auth/google/callback/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getOAuthClient, saveTokens } from '@/lib/google-oauth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code not found' },
        { status: 400 }
      );
    }

    // 認証コードをトークンに交換
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // トークンを保存
    saveTokens(tokens);

    // 成功ページにリダイレクト
    return NextResponse.redirect('http://localhost:3000/auth/success');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### ステップ 3-5: 認証成功ページの作成

**ファイル**: `app/auth/success/page.tsx`

```typescript
export default function AuthSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mb-4 text-6xl">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            認証成功！
          </h1>
          <p className="text-gray-600 mb-6">
            Google Driveへのアクセスが許可されました。<br />
            ファイルアップロード機能が利用可能になりました。
          </p>
          <a
            href="/dashboard/yumemaga-v2"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ダッシュボードに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 4: アップロードAPIのOAuth対応（Claude Code）

#### ステップ 4-1: lib/google-drive.tsを拡張

**ファイル**: `lib/google-drive.ts`（既存ファイルに追加）

```typescript
import { getAuthenticatedDriveClient } from './google-oauth';

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
```

#### ステップ 4-2: アップロードAPIを修正

**ファイル**: `app/api/yumemaga-v2/data-submission/upload/route.ts`

既存の`uploadFile`呼び出しを`uploadFileWithOAuth`に変更:

```typescript
// 変更前
const uploadResult = await uploadFile(targetFolderId, file);

// 変更後
const uploadResult = await uploadFileWithOAuth(targetFolderId, file);
```

同様に`ensureDirectory`を`ensureDirectoryWithOAuth`に変更:

```typescript
// 変更前
const targetFolderId = await ensureDirectory(categoryFolderId, pathSegments);

// 変更後
const targetFolderId = await ensureDirectoryWithOAuth(categoryFolderId, pathSegments);
```

---

### Phase 5: 認証状態チェックの実装（Claude Code）

#### ステップ 5-1: 認証状態チェックAPIの作成

**ファイル**: `app/api/auth/status/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/google-oauth';

export async function GET() {
  const authenticated = isAuthenticated();

  return NextResponse.json({
    authenticated,
    message: authenticated
      ? 'OAuth authenticated'
      : 'Not authenticated. Please visit /api/auth/google',
  });
}
```

#### ステップ 5-2: ダッシュボードに認証状態を表示

**ファイル**: `app/dashboard/yumemaga-v2/page.tsx`

ページの上部に認証状態を表示するバナーを追加:

```typescript
const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; message: string } | null>(null);

useEffect(() => {
  fetch('/api/auth/status')
    .then(res => res.json())
    .then(setAuthStatus);
}, []);

// JSX
{authStatus && !authStatus.authenticated && (
  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-yellow-800 font-medium">⚠️ Google Drive認証が必要です</p>
        <p className="text-yellow-700 text-sm mt-1">
          ファイルアップロード機能を使用するには、Google Driveへのアクセスを許可してください。
        </p>
      </div>
      <a
        href="/api/auth/google"
        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
      >
        認証する
      </a>
    </div>
  </div>
)}
```

---

### Phase 6: テストと検証（Claude Code + ユーザー）

#### ステップ 6-1: OAuth認証フローのテスト

**手順**:
1. 開発サーバーを起動: `npm run dev`
2. ブラウザで `http://localhost:3000/dashboard/yumemaga-v2` にアクセス
3. 「認証する」ボタンをクリック
4. Googleの認証画面で `tenchan1341@gmail.com` でログイン
5. アクセス許可を承認
6. 認証成功ページにリダイレクトされることを確認
7. ダッシュボードに戻り、認証バナーが消えることを確認

#### ステップ 6-2: ファイルアップロードのテスト

**手順**:
1. ダッシュボードの「データ提出進捗管理」セクションへ移動
2. 月号を選択（例: 2025年11月号）
3. カテゴリモードで「A (メインインタビュー)」を選択
4. データ種別「録音データ」を選択
5. テストファイル（.mp3や.wav）をアップロード
6. 成功メッセージとGoogle Driveリンクが表示されることを確認
7. Google Driveでファイルが正しくアップロードされたか確認
   - パス: `ゆめマガ素材/A_メインインタビュー/録音データ/2025_11/ファイル名`

#### ステップ 6-3: トークンリフレッシュのテスト

**手順**:
1. `.oauth-tokens.json`のトークン有効期限を過去の日時に変更
2. 再度ファイルアップロードを実行
3. 自動的にトークンがリフレッシュされ、アップロードが成功することを確認

---

## 🔒 セキュリティ考慮事項

### 1. トークンの保護
- `.oauth-tokens.json`を`.gitignore`に追加（必須）
- 本番環境では暗号化ストレージに保存
- 環境変数でクライアントシークレットを管理

### 2. スコープの最小化
- 必要最小限のスコープのみ要求
- `drive.file`スコープのみで十分な場合は使用

### 3. トークンの有効期限管理
- アクセストークンは1時間で失効
- リフレッシュトークンで自動更新
- リフレッシュ失敗時は再認証を促す

---

## 📂 ファイル構成

```
yumesuta-management-system/
├── lib/
│   ├── google-oauth.ts          ✨ 新規作成
│   └── google-drive.ts          📝 拡張
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── google/
│   │   │   │   ├── route.ts              ✨ 新規作成
│   │   │   │   └── callback/
│   │   │   │       └── route.ts          ✨ 新規作成
│   │   │   └── status/
│   │   │       └── route.ts              ✨ 新規作成
│   │   └── yumemaga-v2/
│   │       └── data-submission/
│   │           └── upload/
│   │               └── route.ts          📝 修正
│   ├── auth/
│   │   └── success/
│   │       └── page.tsx                  ✨ 新規作成
│   └── dashboard/
│       └── yumemaga-v2/
│           └── page.tsx                  📝 修正
├── .env.local                            📝 環境変数追加
├── .oauth-tokens.json                    ✨ 自動生成（.gitignore対象）
└── .gitignore                            📝 .oauth-tokens.json追加
```

---

## ✅ 完了チェックリスト

### ユーザー作業
- [ ] Google Cloud ConsoleでOAuth 2.0クライアントIDを作成
- [ ] クライアントIDとシークレットをClaude Codeに提供
- [ ] 初回OAuth認証を実行（ブラウザで許可）

### Claude Code作業
- [ ] `.env.local`に認証情報を追加
- [ ] `lib/google-oauth.ts`を作成
- [ ] 認証フロー関連のAPIを作成
  - [ ] `/api/auth/google`
  - [ ] `/api/auth/google/callback`
  - [ ] `/api/auth/status`
- [ ] 認証成功ページを作成
- [ ] `lib/google-drive.ts`にOAuth対応関数を追加
- [ ] アップロードAPIを修正
- [ ] ダッシュボードに認証状態表示を追加
- [ ] `.gitignore`に`.oauth-tokens.json`を追加
- [ ] OAuth認証フローをテスト
- [ ] ファイルアップロードをテスト
- [ ] トークンリフレッシュをテスト

---

## 🚨 トラブルシューティング

### エラー: "OAuth credentials not configured"
**原因**: `.env.local`に認証情報が設定されていない
**解決策**: Phase 2を再確認し、環境変数を正しく設定

### エラー: "redirect_uri_mismatch"
**原因**: Google Cloud Consoleで設定したリダイレクトURIと`.env.local`の値が一致しない
**解決策**: 両方の値を確認し、完全に一致させる（末尾のスラッシュにも注意）

### エラー: "Token refresh failed"
**原因**: リフレッシュトークンの有効期限切れまたは取り消し
**解決策**: `.oauth-tokens.json`を削除し、再度OAuth認証を実行

### エラー: "Not authenticated"
**原因**: トークンファイルが存在しないまたは認証が完了していない
**解決策**: `/api/auth/google`にアクセスして認証フローを完了

---

## 📚 参考資料

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API v3 Reference](https://developers.google.com/drive/api/v3/reference)
- [googleapis Node.js Client](https://github.com/googleapis/google-api-nodejs-client)

---

## 🎉 完成後の動作

1. ユーザーが初回のみOAuth認証を実行
2. トークンがローカルに保存され、以降は自動で使用
3. ファイルアップロード時、ユーザー（tenchan1341@gmail.com）のストレージにファイルが保存
4. トークンの有効期限が切れても自動でリフレッシュ
5. 完全自動でデータ提出システムが動作

---

**最終更新**: 2025-10-09
**作成者**: Claude Code (前世代)
**次担当**: 次世代 Claude Code
