/**
 * Google Driveフォルダ自動作成スクリプト
 * カテゴリマスターの各カテゴリ用のルートフォルダを作成
 */

import { google } from 'googleapis';
import * as dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

// カテゴリ定義（データ提出が必要なカテゴリのみ）
const CATEGORIES = [
  { id: 'A', name: 'メインインタビュー', needsData: true },
  { id: 'D', name: '表紙制作', needsData: true },
  { id: 'K', name: 'レジェンドインタビュー', needsData: true },
  { id: 'L', name: '愛知県立高等技術専門校', needsData: true },
  { id: 'M', name: '＠18コラボ企画', needsData: true },
  { id: 'C', name: '新規企業', needsData: true },
];

async function getDriveClient() {
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

async function getSheetsClient() {
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

  console.log(`  ✅ カテゴリマスター更新: ${categoryId} → ${driveFolderId}`);
}

async function main() {
  console.log('🚀 Google Driveフォルダ自動作成スクリプト開始\n');

  const drive = await getDriveClient();
  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

  console.log('📁 ゆめマガデータ提出用ルートフォルダを作成します...\n');

  // 1. ゆめマガ統合ルートフォルダを作成
  const rootFolder = await createFolder(drive, '【ゆめマガ】データ提出');
  console.log(`✅ ルートフォルダ作成: ${rootFolder.name}`);
  console.log(`   ID: ${rootFolder.id}`);
  console.log(`   URL: ${rootFolder.webViewLink}\n`);

  // 2. 各カテゴリのフォルダを作成
  for (const category of CATEGORIES) {
    console.log(`📂 カテゴリ${category.id}: ${category.name}`);

    const folderName = `${category.id}_${category.name}`;
    const folder = await createFolder(drive, folderName, rootFolder.id);

    console.log(`  ✅ フォルダ作成: ${folder.name}`);
    console.log(`     ID: ${folder.id}`);
    console.log(`     URL: ${folder.webViewLink}`);

    // カテゴリマスターを更新
    await updateCategoryMaster(sheets, spreadsheetId, category.id, folder.id!);

    console.log('');
  }

  console.log('✨ すべてのフォルダ作成が完了しました！');
  console.log('\n📌 次のステップ:');
  console.log('1. Google Driveでルートフォルダを確認');
  console.log(`   ${rootFolder.webViewLink}`);
  console.log('2. サービスアカウントに編集権限があることを確認');
  console.log('3. ダッシュボードでファイルアップロードをテスト');
}

main().catch((error) => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
