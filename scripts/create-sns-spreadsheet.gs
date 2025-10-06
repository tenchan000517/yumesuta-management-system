/**
 * SNS投稿管理スプレッドシート自動作成スクリプト
 *
 * 使い方:
 * 1. Google Apps Scriptエディタで新規プロジェクトを作成
 * 2. このコードを貼り付け
 * 3. 関数「createSNSManagementSpreadsheet」を実行
 * 4. 作成されたスプレッドシートのURLがログに出力されます
 */

function createSNSManagementSpreadsheet() {
  // 新規スプレッドシート作成
  const spreadsheet = SpreadsheetApp.create('SNS投稿管理');
  const spreadsheetId = spreadsheet.getId();
  const spreadsheetUrl = spreadsheet.getUrl();

  Logger.log('='.repeat(80));
  Logger.log('SNS投稿管理スプレッドシートを作成しました！');
  Logger.log('='.repeat(80));
  Logger.log('スプレッドシートURL: ' + spreadsheetUrl);
  Logger.log('スプレッドシートID: ' + spreadsheetId);
  Logger.log('='.repeat(80));

  // デフォルトシートを削除
  const defaultSheet = spreadsheet.getSheets()[0];

  // シート1: 投稿履歴
  createPostHistorySheet(spreadsheet);

  // シート2: 投稿予定
  createPostScheduleSheet(spreadsheet);

  // デフォルトシートを削除
  spreadsheet.deleteSheet(defaultSheet);

  // サービスアカウントに共有権限を付与
  const serviceAccountEmail = 'yumesuta-management-sys@fair-yew-446514-q5.iam.gserviceaccount.com';
  try {
    spreadsheet.addViewer(serviceAccountEmail);
    Logger.log('✅ サービスアカウントに閲覧権限を付与しました: ' + serviceAccountEmail);
  } catch (e) {
    Logger.log('⚠️ サービスアカウントの権限付与に失敗しました（手動で追加してください）: ' + serviceAccountEmail);
    Logger.log('エラー: ' + e.toString());
  }

  Logger.log('='.repeat(80));
  Logger.log('次のステップ:');
  Logger.log('1. .env.local に以下を追加:');
  Logger.log('   SNS_SPREADSHEET_ID=' + spreadsheetId);
  Logger.log('2. スプレッドシートを開いて内容を確認:');
  Logger.log('   ' + spreadsheetUrl);
  Logger.log('='.repeat(80));

  return spreadsheet;
}

/**
 * シート1: 投稿履歴を作成
 */
function createPostHistorySheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('投稿履歴');

  // ヘッダー行設定
  const headers = [
    '投稿日時',
    'SNS種類',
    'アカウント名',
    '投稿内容',
    '画像URL',
    'リンクURL',
    'いいね数',
    'RT数/コメント数',
    '備考'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ヘッダーのスタイル設定
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');

  // 列幅設定
  sheet.setColumnWidth(1, 150);  // A: 投稿日時
  sheet.setColumnWidth(2, 100);  // B: SNS種類
  sheet.setColumnWidth(3, 120);  // C: アカウント名
  sheet.setColumnWidth(4, 400);  // D: 投稿内容
  sheet.setColumnWidth(5, 250);  // E: 画像URL
  sheet.setColumnWidth(6, 250);  // F: リンクURL
  sheet.setColumnWidth(7, 100);  // G: いいね数
  sheet.setColumnWidth(8, 130);  // H: RT数/コメント数
  sheet.setColumnWidth(9, 200);  // I: 備考

  // 行の高さ設定
  sheet.setRowHeight(1, 40);

  // サンプルデータ
  const sampleData = [
    [
      new Date('2025-10-01 10:00'),
      'Instagram',
      '公式',
      '【高卒採用】〇〇株式会社のスター紹介！\n\n高校生の皆さん、こんにちは！\n今回は〇〇株式会社で活躍する先輩社員をご紹介します✨\n\n#高卒採用 #ゆめスタ #キャリア',
      'https://example.com/star1.jpg',
      'https://yumesuta.com/stars/001',
      120,
      15,
      'スター紹介投稿'
    ],
    [
      new Date('2025-10-01 14:00'),
      'X',
      '被リンク1',
      'ゆめスタ最新号配布開始！📚\n\n高校生のキャリアを応援する情報誌「ゆめスタ」の最新号を配布開始しました。\n地元企業の魅力を高校生に届けます。\n\n詳しくはこちら👉',
      'https://example.com/yumemaga.jpg',
      'https://yumesuta.com',
      45,
      8,
      'ゆめマガ配布告知'
    ],
    [
      new Date('2025-10-02 09:00'),
      'Instagram',
      '公式',
      '【企業紹介】△△企業の魅力を紹介！🏢\n\n地域に根ざした企業で、高校生の成長をサポート。\n先輩社員のインタビューも掲載中です。\n\n#企業紹介 #高卒採用 #地域企業',
      'https://example.com/partner1.jpg',
      'https://yumesuta.com/partners/002',
      98,
      12,
      'パートナー企業紹介'
    ]
  ];

  const dataRange = sheet.getRange(2, 1, sampleData.length, headers.length);
  dataRange.setValues(sampleData);

  // データ行のスタイル設定
  dataRange.setVerticalAlignment('top');
  dataRange.setWrap(true);

  // 日時列のフォーマット設定
  sheet.getRange(2, 1, 1000, 1).setNumberFormat('yyyy-mm-dd hh:mm');

  // 数値列のフォーマット設定
  sheet.getRange(2, 7, 1000, 2).setNumberFormat('#,##0');

  // データ行の高さ設定
  for (let i = 2; i <= sampleData.length + 1; i++) {
    sheet.setRowHeight(i, 80);
  }

  // 枠線設定
  const allRange = sheet.getRange(1, 1, sampleData.length + 1, headers.length);
  allRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  // 条件付き書式: SNS種類でセルの色を変更
  const snsTypeRange = sheet.getRange(2, 2, 1000, 1);

  // Instagram = ピンク系
  const instagramRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Instagram')
    .setBackground('#FCE5CD')
    .setRanges([snsTypeRange])
    .build();

  // X = 青系
  const xRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('X')
    .setBackground('#CFE2F3')
    .setRanges([snsTypeRange])
    .build();

  sheet.setConditionalFormatRules([instagramRule, xRule]);

  // シート保護（ヘッダー行のみ）
  const protection = sheet.getRange(1, 1, 1, headers.length).protect();
  protection.setDescription('ヘッダー行は編集できません');
  protection.setWarningOnly(true);

  // フィルター設定
  sheet.getRange(1, 1, 1000, headers.length).createFilter();

  // 固定行設定（ヘッダー行を固定）
  sheet.setFrozenRows(1);

  Logger.log('✅ シート「投稿履歴」を作成しました');
}

/**
 * シート2: 投稿予定を作成
 */
function createPostScheduleSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('投稿予定');

  // ヘッダー行設定
  const headers = [
    '投稿予定日時',
    'SNS種類',
    'アカウント名',
    '投稿予定内容',
    'ステータス',
    '備考'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ヘッダーのスタイル設定
  headerRange.setBackground('#34A853');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');

  // 列幅設定
  sheet.setColumnWidth(1, 150);  // A: 投稿予定日時
  sheet.setColumnWidth(2, 100);  // B: SNS種類
  sheet.setColumnWidth(3, 120);  // C: アカウント名
  sheet.setColumnWidth(4, 500);  // D: 投稿予定内容
  sheet.setColumnWidth(5, 100);  // E: ステータス
  sheet.setColumnWidth(6, 200);  // F: 備考

  // 行の高さ設定
  sheet.setRowHeight(1, 40);

  // サンプルデータ
  const sampleData = [
    [
      new Date('2025-10-05 10:00'),
      'Instagram',
      '公式',
      '【高卒採用】◇◇企業のスター紹介！\n\n今週は◇◇企業で活躍する先輩社員をご紹介します。\n高校生の皆さん、ぜひチェックしてください！\n\n#高卒採用 #ゆめスタ',
      '予定',
      '画像準備完了'
    ],
    [
      new Date('2025-10-05 14:00'),
      'X',
      '被リンク1',
      'ゆめマガ11月号の特集記事を紹介！📖\n\n今月の特集は「地域で働く魅力」です。\n地元企業のリアルな声をお届けします。\n\n詳細はこちら👉',
      '予定',
      'リンク確認済み'
    ],
    [
      new Date('2025-10-06 09:00'),
      'Instagram',
      '公式',
      '【企業紹介】□□企業の魅力を紹介！\n\n地域に根ざした企業で、高校生の成長をサポート。\n働きやすい環境が魅力です✨\n\n#企業紹介 #高卒採用',
      '予定',
      '画像準備待ち'
    ],
    [
      new Date('2025-10-07 10:00'),
      'X',
      '公式',
      '高卒採用の最新トレンドを解説！📊\n\n2025年度の高卒採用市場の動向をまとめました。\n企業の皆様、ぜひご参考にしてください。\n\n記事はこちら👉',
      '予定',
      '記事執筆中'
    ],
    [
      new Date('2025-10-01 10:00'),
      'Instagram',
      '被リンク2',
      '【イベント告知】ゆめスタイベント開催！🎉\n\n高校生と企業のマッチングイベントを開催します。\n参加企業募集中です！\n\n#イベント #高卒採用',
      '期限切れ',
      '投稿忘れ - 要リスケ'
    ]
  ];

  const dataRange = sheet.getRange(2, 1, sampleData.length, headers.length);
  dataRange.setValues(sampleData);

  // データ行のスタイル設定
  dataRange.setVerticalAlignment('top');
  dataRange.setWrap(true);

  // 日時列のフォーマット設定
  sheet.getRange(2, 1, 1000, 1).setNumberFormat('yyyy-mm-dd hh:mm');

  // データ行の高さ設定
  for (let i = 2; i <= sampleData.length + 1; i++) {
    sheet.setRowHeight(i, 80);
  }

  // 枠線設定
  const allRange = sheet.getRange(1, 1, sampleData.length + 1, headers.length);
  allRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  // 条件付き書式1: SNS種類でセルの色を変更
  const snsTypeRange = sheet.getRange(2, 2, 1000, 1);

  const instagramRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Instagram')
    .setBackground('#FCE5CD')
    .setRanges([snsTypeRange])
    .build();

  const xRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('X')
    .setBackground('#CFE2F3')
    .setRanges([snsTypeRange])
    .build();

  // 条件付き書式2: ステータスで行全体の色を変更
  const statusRange = sheet.getRange(2, 5, 1000, 1);

  // 予定 = 白
  const scheduledRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('予定')
    .setBackground('#FFFFFF')
    .setRanges([statusRange])
    .build();

  // 完了 = 緑
  const completedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('完了')
    .setBackground('#D9EAD3')
    .setRanges([statusRange])
    .build();

  // 期限切れ = 赤
  const overdueRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('期限切れ')
    .setBackground('#F4CCCC')
    .setRanges([statusRange])
    .build();

  sheet.setConditionalFormatRules([
    instagramRule,
    xRule,
    scheduledRule,
    completedRule,
    overdueRule
  ]);

  // シート保護（ヘッダー行のみ）
  const protection = sheet.getRange(1, 1, 1, headers.length).protect();
  protection.setDescription('ヘッダー行は編集できません');
  protection.setWarningOnly(true);

  // データ検証: SNS種類
  const snsValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Instagram', 'X'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 2, 1000, 1).setDataValidation(snsValidation);

  // データ検証: アカウント名
  const accountValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['公式', '被リンク1', '被リンク2', '被リンク3'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 3, 1000, 1).setDataValidation(accountValidation);

  // データ検証: ステータス
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['予定', '完了', '期限切れ'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 5, 1000, 1).setDataValidation(statusValidation);

  // フィルター設定
  sheet.getRange(1, 1, 1000, headers.length).createFilter();

  // 固定行設定（ヘッダー行を固定）
  sheet.setFrozenRows(1);

  Logger.log('✅ シート「投稿予定」を作成しました');
}

/**
 * テスト実行用の関数
 */
function testCreateSpreadsheet() {
  const spreadsheet = createSNSManagementSpreadsheet();
  Logger.log('スプレッドシート作成完了: ' + spreadsheet.getUrl());
}
