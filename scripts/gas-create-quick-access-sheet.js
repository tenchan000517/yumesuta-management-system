/**
 * Google Apps Script: クイックアクセスシート作成
 *
 * 実行方法:
 * 1. タスク管理スプレッドシートを開く
 *    https://docs.google.com/spreadsheets/d/1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k
 * 2. 拡張機能 → Apps Script
 * 3. このスクリプトをコピー&ペースト
 * 4. 関数 createQuickAccessSheet() を実行
 */

function createQuickAccessSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // 既存のクイックアクセスシートを削除（存在する場合）
  const existingSheet = spreadsheet.getSheetByName('クイックアクセス');
  if (existingSheet) {
    spreadsheet.deleteSheet(existingSheet);
    console.log('既存のクイックアクセスシートを削除しました');
  }

  // 新規シート作成
  const sheet = spreadsheet.insertSheet('クイックアクセス');

  // ヘッダー行を設定
  const headers = ['ボタン名', 'URL', 'アイコン', 'カテゴリ', '表示順', '背景色'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // 列幅を調整
  sheet.setColumnWidth(1, 150); // ボタン名
  sheet.setColumnWidth(2, 400); // URL
  sheet.setColumnWidth(3, 120); // アイコン
  sheet.setColumnWidth(4, 100); // カテゴリ
  sheet.setColumnWidth(5, 80);  // 表示順
  sheet.setColumnWidth(6, 100); // 背景色

  // 全リンクデータ
  const sampleData = [
    // 分析ツール
    ['GA4', 'https://analytics.google.com/', 'BarChart3', '分析ツール', 1, 'green'],
    ['Google Search Console', 'https://search.google.com/search-console', 'TrendingUp', '分析ツール', 2, 'green'],
    ['Clarity', 'https://clarity.microsoft.com/', 'Eye', '分析ツール', 3, 'green'],

    // スプレッドシート管理
    ['営業管理', 'https://docs.google.com/spreadsheets/d/13PzSnGekGxDWX7B1_TwczNibR6j_JxDb3UuquPX1GyQ', 'Users', 'スプレッドシート', 4, 'blue'],
    ['配布状況管理', 'URL_TO_BE_ADDED', 'Package', 'スプレッドシート', 5, 'blue'],
    ['工程管理', 'URL_TO_BE_ADDED', 'Calendar', 'スプレッドシート', 6, 'blue'],
    ['ゆめスタSTAR管理', 'URL_TO_BE_ADDED', 'Star', 'スプレッドシート', 7, 'blue'],
    ['ゆめスタ問い合わせ', 'URL_TO_BE_ADDED', 'MessageSquare', 'スプレッドシート', 8, 'blue'],
    ['タスク管理', 'https://docs.google.com/spreadsheets/d/1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k', 'CheckSquare', 'スプレッドシート', 9, 'blue'],
    ['顧客管理（未実装）', 'URL_TO_BE_ADDED', 'UserCheck', 'スプレッドシート', 10, 'gray'],
    ['請求書作成', 'URL_TO_BE_ADDED', 'FileText', 'スプレッドシート', 11, 'blue'],

    // SNS管理
    ['META', 'https://business.facebook.com/', 'Facebook', 'SNS管理', 12, 'purple'],
    ['Instagram', 'https://www.instagram.com/', 'Instagram', 'SNS管理', 13, 'purple'],
    ['X (Twitter)', 'https://twitter.com/', 'Twitter', 'SNS管理', 14, 'purple'],

    // CANVA
    ['CANVA - 10月号', 'URL_TO_BE_ADDED', 'FileImage', 'CANVA', 15, 'orange'],
    ['CANVA - 11月号', 'URL_TO_BE_ADDED', 'FileImage', 'CANVA', 16, 'orange'],
    ['CANVA - 8月号', 'URL_TO_BE_ADDED', 'FileImage', 'CANVA', 17, 'orange'],
    ['CANVA - 7月号', 'URL_TO_BE_ADDED', 'FileImage', 'CANVA', 18, 'orange'],
    ['CANVA - 6月号', 'URL_TO_BE_ADDED', 'FileImage', 'CANVA', 19, 'orange'],
    ['CANVA - 名刺', 'URL_TO_BE_ADDED', 'CreditCard', 'CANVA', 20, 'orange'],
    ['CANVA - ロゴデザイン', 'URL_TO_BE_ADDED', 'Palette', 'CANVA', 21, 'orange'],
    ['CANVA - ゆめスタロゴ', 'URL_TO_BE_ADDED', 'Sparkles', 'CANVA', 22, 'orange'],
    ['CANVA - ゆめスポロゴ', 'URL_TO_BE_ADDED', 'Zap', 'CANVA', 23, 'orange'],
    ['CANVA - 営業資料', 'URL_TO_BE_ADDED', 'Presentation', 'CANVA', 24, 'orange'],
    ['CANVA - インスタフィード', 'URL_TO_BE_ADDED', 'Layout', 'CANVA', 25, 'orange'],

    // AIツール
    ['Claude', 'https://claude.ai/', 'Bot', 'AIツール', 26, 'purple'],
    ['ChatGPT', 'https://chat.openai.com/', 'MessageCircle', 'AIツール', 27, 'purple'],
    ['Gemini Studio', 'https://gemini.google.com/', 'Sparkles', 'AIツール', 28, 'purple'],
    ['FishAudio', 'URL_TO_BE_ADDED', 'Music', 'AIツール', 29, 'purple'],

    // 業務ツール
    ['ファイルコンバーター', 'URL_TO_BE_ADDED', 'RefreshCw', '業務ツール', 30, 'gray'],
    ['Googleカレンダー', 'https://calendar.google.com/', 'Calendar', '業務ツール', 31, 'gray'],
    ['Gmail', 'https://mail.google.com/', 'Mail', '業務ツール', 32, 'gray'],
    ['マネーフォワード', 'https://biz.moneyforward.com/', 'DollarSign', '業務ツール', 33, 'gray'],
    ['QRコード作成1', 'URL_TO_BE_ADDED', 'QrCode', '業務ツール', 34, 'gray'],
    ['QRコード作成2', 'URL_TO_BE_ADDED', 'QrCode', '業務ツール', 35, 'gray'],
    ['Googleドライブ', 'https://drive.google.com/', 'HardDrive', '業務ツール', 36, 'gray'],

    // HP・サーバー管理
    ['ゆめスタHP', 'https://yumesuta.com/', 'Globe', 'HP・サーバー', 37, 'green'],
    ['Xserver', 'https://www.xserver.ne.jp/', 'Server', 'HP・サーバー', 38, 'green'],
  ];

  // サンプルデータを入力
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);

  console.log('✅ クイックアクセスシート作成完了！');
  console.log('登録データ: ' + sampleData.length + '件');
  console.log('');
  console.log('次のステップ:');
  console.log('1. URL_TO_BE_ADDEDの箇所に正しいURLを入力してください');
  console.log('2. 必要に応じてアイコンやカテゴリーを調整してください');
  console.log('3. マネジメントシステムで「更新」ボタンをクリックしてください');
  console.log('');
  console.log('カテゴリー一覧:');
  console.log('- 分析ツール (green)');
  console.log('- スプレッドシート (blue)');
  console.log('- SNS管理 (purple)');
  console.log('- CANVA (orange)');
  console.log('- AIツール (purple)');
  console.log('- 業務ツール (gray)');
  console.log('- HP・サーバー (green)');
}
