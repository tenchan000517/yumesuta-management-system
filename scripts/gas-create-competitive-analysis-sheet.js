/**
 * Google Apps Script: 競合分析シート作成
 *
 * 実行方法:
 * 1. タスク管理スプレッドシートを開く
 *    https://docs.google.com/spreadsheets/d/1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k
 * 2. 拡張機能 → Apps Script
 * 3. このスクリプトをコピー&ペースト
 * 4. 関数 createCompetitiveAnalysisSheet() を実行
 */

function createCompetitiveAnalysisSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // 既存の競合分析シートを削除（存在する場合）
  const existingSheet = spreadsheet.getSheetByName('競合分析');
  if (existingSheet) {
    spreadsheet.deleteSheet(existingSheet);
    console.log('既存の競合分析シートを削除しました');
  }

  // 新規シート作成
  const sheet = spreadsheet.insertSheet('競合分析');

  // ヘッダー行を設定
  const headers = ['企業名', 'カテゴリ', 'リンク名', 'URL', 'メモ', '表示順', 'ドライブフォルダID'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#FF6B35');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // 列幅を調整
  sheet.setColumnWidth(1, 150); // 企業名
  sheet.setColumnWidth(2, 150); // カテゴリ
  sheet.setColumnWidth(3, 120); // リンク名
  sheet.setColumnWidth(4, 400); // URL
  sheet.setColumnWidth(5, 200); // メモ
  sheet.setColumnWidth(6, 80);  // 表示順
  sheet.setColumnWidth(7, 300); // ドライブフォルダID

  // 競合企業データ（8社）
  const competitorData = [
    // 中広（START）
    ['中広（START）', '就活情報誌', 'HP', 'https://chuco.co.jp/', '愛知県の高校生向け就活情報誌', 1, '1LpTxfKvES648D6e_C5JMR3RM1aADpa8H'],

    // COURSE
    ['COURSE', '就活情報誌', 'HP', 'https://course-ibaraki.jp/', '茨城県の就活情報誌', 2, '1JrKB48rSqfNBth6cDW2YP5TplKhimBdP'],

    // カケハシ
    ['カケハシ', '就活情報誌', 'HP', 'https://kakehashi.asia/', '', 3, '1xBmcn-GNUIM04JN_0ZzzvMTAY6sneUO3'],

    // ハリケンナビ
    ['ハリケンナビ', '求人サイト', 'HP', 'https://www.harikennabi.jp/', '就職採用求人サイト', 4, '1xBmcn-GNUIM04JN_0ZzzvMTAY6sneUO3'],

    // Handy
    ['Handy', '求人管理システム', 'HP', 'https://handy.school/', '高校生向け求人管理システム', 5, '11r4VbBMSko2v06LliHbkFjI6JZvYBdFz'],

    // 日本の人事部
    ['日本の人事部', '情報サイト', 'HP', 'https://jinjibu.jp/', '高卒採用情報', 6, '1xBmcn-GNUIM04JN_0ZzzvMTAY6sneUO3'],

    // START WEB版
    ['START WEB版', '就活情報サイト', 'HP', 'https://aichi.job-start.jp/', 'STARTのWEB版', 7, '1eeOVlZ8DcDOFuwrd6lK5eFQW5gcFluoV'],

    // @18
    ['@18', '就活情報誌', 'HP', 'https://at18.press/', '高校生向け就活情報誌', 8, '1ghuBGYF0I-vrWsqG1bMkZ1oNAvghWmk0'],
  ];

  // データを入力
  sheet.getRange(2, 1, competitorData.length, competitorData[0].length).setValues(competitorData);

  // データ行のスタイル設定（奇数行に背景色）
  for (let i = 2; i <= competitorData.length + 1; i++) {
    if (i % 2 === 0) {
      sheet.getRange(i, 1, 1, headers.length).setBackground('#FFF4F0');
    }
  }

  console.log('✅ 競合分析シート作成完了！');
  console.log('登録企業: ' + competitorData.length + '社');
  console.log('');
  console.log('📋 次のステップ:');
  console.log('');
  console.log('1. Google Drive API有効化:');
  console.log('   - Google Cloud Consoleでプロジェクトを開く');
  console.log('   - 「APIとサービス」→「ライブラリ」');
  console.log('   - "Google Drive API" を検索して有効化');
  console.log('');
  console.log('2. 競合企業の資料フォルダ作成:');
  console.log('   - Googleドライブに「競合分析」フォルダを作成');
  console.log('   - 各競合企業のサブフォルダを作成（例: 「中広（START）」）');
  console.log('   - フォルダを右クリック → 共有 → サービスアカウントのメールアドレスを追加（閲覧者）');
  console.log('   - フォルダURLからフォルダIDをコピー（例: https://drive.google.com/drive/folders/FOLDER_ID）');
  console.log('   - スプレッドシートの「ドライブフォルダID」列に貼り付け');
  console.log('');
  console.log('3. 資料をアップロード:');
  console.log('   - 各企業フォルダにPDF、画像、パンフレット等をアップロード');
  console.log('   - マネジメントシステムで自動的に表示されます');
  console.log('');
  console.log('4. 追加機能:');
  console.log('   - 各企業のSNSを追加: 同じ企業名で行を追加し、リンク名を「Instagram」「X」等に設定');
  console.log('   - 新しい競合企業を追加: 企業名、カテゴリ、リンク名、URLを入力');
  console.log('');
  console.log('💡 ヒント:');
  console.log('- リンク名に「Instagram」「X」「Facebook」等を含めると自動でアイコンが設定されます');
  console.log('- 同じ企業名で複数行追加すると、1つのカードに複数リンクとして表示されます');
  console.log('- ドライブフォルダIDを設定すると、フォルダ内のファイルが自動で表示されます');
}
