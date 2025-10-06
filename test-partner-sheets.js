const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function getPartnerSheetsStructure() {
  const spreadsheetId = '12A5mroEA5ipsIM88y4GOTmK61-V95bnAV5eTEhejvpc';

  try {
    // Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('スプレッドシート名:', metadata.data.properties.title);
    console.log('\nシート一覧:');
    metadata.data.sheets.forEach(sheet => {
      console.log('- シート名:', sheet.properties.title);
      console.log('  行数:', sheet.properties.gridProperties.rowCount);
      console.log('  列数:', sheet.properties.gridProperties.columnCount);
    });

    // Get first 10 rows from the first sheet to understand structure
    const firstSheet = metadata.data.sheets[0].properties.title;
    console.log(`\n最初のシート「${firstSheet}」のデータサンプル（最初の10行）:`);
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${firstSheet}!A1:Z10`,
    });

    if (data.data.values) {
      data.data.values.forEach((row, index) => {
        console.log(`行${index + 1}:`, row);
      });
    }
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

getPartnerSheetsStructure();
