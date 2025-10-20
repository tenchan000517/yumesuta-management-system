// T列（自動更新有無）の文字を確認するスクリプト
const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function checkTColumn() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;

    console.log('契約・入金管理シートからT列のデータを取得中...\n');

    // T列（自動更新有無）を含むデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '契約・入金管理!A1:T20'  // A列からT列まで、20行取得
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      console.log('データが見つかりませんでした');
      return;
    }

    // ヘッダー行を確認
    console.log('=== ヘッダー行 ===');
    console.log(`T列のヘッダー: "${rows[0][19] || '(空欄)'}"`);
    console.log('');

    // T列（インデックス19）のデータを確認
    console.log('=== T列のデータサンプル ===');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const tValue = row[19] || '(空欄)';
      const companyName = row[2] || '(企業名なし)';

      if (tValue !== '(空欄)') {
        console.log(`行${i + 1}: 企業名="${companyName}" | T列="${tValue}" | 文字コード=${Array.from(tValue).map(c => c.charCodeAt(0).toString(16)).join(' ')}`);
      }
    }

    // ユニークな値を集計
    console.log('\n=== T列で使用されている文字（重複除く） ===');
    const uniqueValues = new Set();
    for (let i = 1; i < rows.length; i++) {
      const tValue = rows[i][19];
      if (tValue && tValue.trim() !== '') {
        uniqueValues.add(tValue);
      }
    }

    for (const value of uniqueValues) {
      const charCodes = Array.from(value).map(c =>
        `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`
      ).join(' ');
      console.log(`"${value}" (${charCodes})`);
    }

  } catch (error) {
    console.error('エラー:', error.message);
  }
}

checkTColumn();
