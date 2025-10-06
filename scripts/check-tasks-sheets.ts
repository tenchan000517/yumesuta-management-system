import { google } from 'googleapis';

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.TASKS_SPREADSHEET_ID!;

async function main() {
  const response = await sheets.spreadsheets.get({ spreadsheetId });

  console.log('=== タスク・プロジェクト管理スプレッドシートのシート一覧 ===\n');
  response.data.sheets?.forEach((sheet, index) => {
    console.log(`${index + 1}. ${sheet.properties?.title}`);
  });
}

main().catch(console.error);
