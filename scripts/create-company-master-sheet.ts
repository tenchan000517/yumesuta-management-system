/**
 * 契約企業マスタシート作成スクリプト
 *
 * 目的: 営業予実管理スプレッドシートに「契約企業マスタ」シートを追加し、ヘッダー行を設定する
 * 作成日: 2025年10月12日
 * Phase: 1.6-1（データマイグレーション）
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

async function createCompanyMasterSheet() {
  console.log('===== 契約企業マスタシート作成開始 =====\n');

  try {
    // 1. 認証設定
    console.log('[1/4] Google Sheets API認証中...');
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    console.log(`✅ 認証成功`);
    console.log(`   スプレッドシートID: ${spreadsheetId}\n`);

    // 2. 既存のシート一覧を取得（重複チェック）
    console.log('[2/4] 既存シートをチェック中...');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheets = spreadsheet.data.sheets || [];
    const sheetNames = existingSheets.map(sheet => sheet.properties?.title);

    if (sheetNames.includes('契約企業マスタ')) {
      console.log('⚠️  「契約企業マスタ」シートは既に存在します。');
      console.log('   処理を中断します。\n');
      return;
    }

    console.log(`✅ 既存シート数: ${existingSheets.length}`);
    console.log(`   既存シート名: ${sheetNames.join(', ')}\n`);

    // 3. 新規シート「契約企業マスタ」を作成
    console.log('[3/4] 「契約企業マスタ」シートを作成中...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: '契約企業マスタ',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 25, // A〜Y列（25列）
                },
              },
            },
          },
        ],
      },
    });

    console.log('✅ シート作成完了\n');

    // 4. ヘッダー行を設定
    console.log('[4/4] ヘッダー行を設定中...');
    const headers = [
      '企業ID',                    // A列
      '企業正式名称',              // B列
      '企業略称',                  // C列
      '代表者役職',                // D列
      '代表者名',                  // E列
      '郵便番号',                  // F列
      '住所',                      // G列
      '電話番号',                  // H列
      'FAX番号',                   // I列
      'メールアドレス',            // J列
      'HP URL',                    // K列
      '担当者名',                  // L列
      '担当者メールアドレス',      // M列
      '担当者電話番号',            // N列
      '業種',                      // O列
      '従業員数',                  // P列
      '資本金',                    // Q列
      '設立年月日',                // R列
      '備考',                      // S列
      '登録日',                    // T列
      '最終更新日',                // U列
      'データソース',              // V列
      '顧客マスタ企業名',          // W列
      '契約実績',                  // X列
      '最新契約ID',                // Y列
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: '契約企業マスタ!A1:Y1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    console.log('✅ ヘッダー行設定完了');
    console.log(`   列数: ${headers.length}列（A〜Y）\n`);

    console.log('===== 契約企業マスタシート作成完了 =====');
    console.log('✅ シート「契約企業マスタ」が正常に作成されました。\n');
    console.log('次のステップ:');
    console.log('1. Google Sheetsで営業予実管理スプレッドシートを開く');
    console.log('2. 「契約企業マスタ」シートが作成されていることを確認');
    console.log('3. ヘッダー行（A1〜Y1）が正しく設定されていることを確認\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('   エラーメッセージ:', error.message);
    }
    process.exit(1);
  }
}

// スクリプト実行
createCompanyMasterSheet();
