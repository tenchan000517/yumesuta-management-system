import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getDriveClient as getSharedDriveClient } from '@/lib/google-drive';

// カテゴリ定義（全カテゴリ）
const CATEGORIES = [
  { id: 'A', name: 'メインインタビュー' },
  { id: 'D', name: '表紙制作' },
  { id: 'K', name: 'レジェンドインタビュー' },
  { id: 'H', name: 'STAR①' },
  { id: 'I', name: 'STAR②' },
  { id: 'L', name: '愛知県立高等技術専門校' },
  { id: 'M', name: '＠18コラボ企画' },
  { id: 'C', name: '新規企業' },
  { id: 'E', name: '既存企業' },
  { id: 'P', name: 'パートナー一覧' },
  { id: 'Z', name: '全体進捗' },
  { id: 'B', name: '全体調整' },
  { id: 'F', name: '固定ページ' },
  { id: 'J', name: 'STAR導入' },
  { id: 'N', name: '修正対応' },
  { id: 'S', name: 'スタート' },
];

function getDriveClient() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const credentials = JSON.parse(credentialsJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  return google.drive({ version: 'v3', auth });
}

function getSheetsClient() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const credentials = JSON.parse(credentialsJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function createFolder(drive: any, folderName: string, parentFolderId?: string) {
  const requestBody: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    requestBody.parents = [parentFolderId];
  }

  const response = await drive.files.create({
    requestBody,
    fields: 'id, name, webViewLink',
    supportsAllDrives: true,
  });

  return response.data;
}

async function updateCategoryMaster(sheets: any, spreadsheetId: string, categoryId: string, driveFolderId: string) {
  // カテゴリマスターを取得
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'カテゴリマスター!A:J',
  });

  const rows = response.data.values || [];
  const headerRow = rows[0];
  const driveIdColumnIndex = headerRow.indexOf('DriveフォルダID');

  if (driveIdColumnIndex === -1) {
    throw new Error('DriveフォルダID列が見つかりません');
  }

  // カテゴリIDの行を探す
  const rowIndex = rows.findIndex((row: string[]) => row[0] === categoryId);
  if (rowIndex === -1) {
    throw new Error(`カテゴリ ${categoryId} が見つかりません`);
  }

  // セルを更新
  const cellAddress = `カテゴリマスター!${String.fromCharCode(65 + driveIdColumnIndex)}${rowIndex + 1}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellAddress,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[driveFolderId]],
    },
  });
}

export async function POST(request: Request) {
  try {
    const drive = getDriveClient();
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    const log: string[] = [];
    log.push('🚀 Google Driveフォルダ自動作成開始\n');

    // リクエストボディから既存のrootFolderIdを取得（オプション）
    let body: { rootFolderId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // ボディがない場合は無視
    }

    let rootFolder: any;

    if (body.rootFolderId) {
      // 既存のルートフォルダを使用
      // 共有されたフォルダにアクセスするため、lib/google-drive.tsのクライアントを使用
      log.push('📁 既存のルートフォルダを使用\n');
      const sharedDrive = getSharedDriveClient();
      const response = await sharedDrive.files.get({
        fileId: body.rootFolderId,
        fields: 'id, name, webViewLink',
        supportsAllDrives: true,
      });
      rootFolder = response.data;
      log.push(`✅ ルートフォルダ: ${rootFolder.name}`);
      log.push(`   ID: ${rootFolder.id}`);
      log.push(`   URL: ${rootFolder.webViewLink}\n`);
    } else {
      // 新規作成
      log.push('📁 ゆめマガデータ提出用ルートフォルダを作成...\n');
      rootFolder = await createFolder(drive, '【ゆめマガ】データ提出');
      log.push(`✅ ルートフォルダ作成: ${rootFolder.name}`);
      log.push(`   ID: ${rootFolder.id}`);
      log.push(`   URL: ${rootFolder.webViewLink}\n`);
    }

    // 2. カテゴリマスターから既存のフォルダIDを取得
    const categoryMasterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'カテゴリマスター!A:J',
    });

    const categoryRows = categoryMasterResponse.data.values || [];
    const existingFolderIds = new Map<string, string>();

    // ヘッダー行をスキップして既存IDを取得
    for (let i = 1; i < categoryRows.length; i++) {
      const row = categoryRows[i];
      const categoryId = row[0];
      const driveFolderId = row[9]; // J列
      if (categoryId && driveFolderId) {
        existingFolderIds.set(categoryId, driveFolderId);
      }
    }

    // 3. 各カテゴリのフォルダを作成
    const createdFolders = [];
    const skippedFolders = [];

    for (const category of CATEGORIES) {
      log.push(`📂 カテゴリ${category.id}: ${category.name}`);

      // 既存のフォルダIDがあればスキップ
      if (existingFolderIds.has(category.id)) {
        const existingId = existingFolderIds.get(category.id)!;
        log.push(`  ⏭️  既存フォルダあり（スキップ）`);
        log.push(`     ID: ${existingId}\n`);
        skippedFolders.push({
          categoryId: category.id,
          categoryName: category.name,
          folderId: existingId,
        });
        continue;
      }

      const folderName = `${category.id}_${category.name}`;
      const folder = await createFolder(drive, folderName, rootFolder.id);

      log.push(`  ✅ フォルダ作成: ${folder.name}`);
      log.push(`     ID: ${folder.id}`);
      log.push(`     URL: ${folder.webViewLink}`);

      // カテゴリマスターを更新
      await updateCategoryMaster(sheets, spreadsheetId, category.id, folder.id!);
      log.push(`  ✅ カテゴリマスター更新完了\n`);

      createdFolders.push({
        categoryId: category.id,
        categoryName: category.name,
        folderId: folder.id,
        folderUrl: folder.webViewLink,
      });
    }

    log.push('✨ すべてのフォルダ処理が完了しました！');
    log.push(`\n📊 結果サマリー:`);
    log.push(`  - 新規作成: ${createdFolders.length}個`);
    log.push(`  - スキップ: ${skippedFolders.length}個`);
    log.push('\n📌 次のステップ:');
    log.push('1. Google Driveでルートフォルダを確認');
    log.push(`   ${rootFolder.webViewLink}`);
    log.push('2. サービスアカウントに編集権限があることを確認');
    log.push('3. ダッシュボードでファイルアップロードをテスト');

    return NextResponse.json({
      success: true,
      rootFolder: {
        id: rootFolder.id,
        name: rootFolder.name,
        url: rootFolder.webViewLink,
      },
      createdFolders,
      skippedFolders,
      log: log.join('\n'),
    });

  } catch (error: any) {
    console.error('Setup folders error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
