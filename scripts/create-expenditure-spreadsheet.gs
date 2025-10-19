/**
 * 支出管理マスタ スプレッドシート自動生成スクリプト
 *
 * 作成日: 2025-10-18
 * 対象: 営業管理スプレッドシート内に「支出管理マスタ」シートを作成
 *
 * 実行方法:
 * 1. Google Sheetsを開く
 * 2. 拡張機能 > Apps Script を開く
 * 3. このスクリプトをコピペ
 * 4. createExpenditureSheet() を実行
 */

/**
 * メイン関数: 支出管理マスタシートを作成
 */
function createExpenditureSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = '支出管理マスタ';

  // 既存のシートがあれば削除（確認メッセージ付き）
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '確認',
      `「${sheetName}」シートが既に存在します。削除して再作成しますか？`,
      ui.ButtonSet.YES_NO
    );

    if (response == ui.Button.YES) {
      ss.deleteSheet(existingSheet);
    } else {
      Logger.log('処理をキャンセルしました');
      return;
    }
  }

  // 新規シート作成
  const sheet = ss.insertSheet(sheetName);

  // シートタブの色設定（オレンジ系）
  sheet.setTabColor('#FF6D00');

  // 1. ヘッダー行作成
  createHeaders(sheet);

  // 2. 列幅調整
  adjustColumnWidths(sheet);

  // 3. サンプルデータ投入（データ検証の前に投入）
  insertSampleData(sheet);

  // 4. データ検証設定（サンプルデータ投入後に設定）
  setupDataValidation(sheet);

  // 5. 条件付き書式設定
  setupConditionalFormatting(sheet);

  Logger.log('✅ 支出管理マスタシートの作成が完了しました');
  SpreadsheetApp.getUi().alert('✅ 支出管理マスタシートの作成が完了しました');
}

/**
 * ヘッダー行作成
 */
function createHeaders(sheet) {
  const headers = [
    '日付',
    '項目名',
    '金額',
    'カテゴリ',
    '支払方法',
    '立替者名',
    '清算ステータス',
    '清算日',
    '備考',
    '支払予定日'
  ];

  // ヘッダー設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ヘッダー書式
  headerRange
    .setBackground('#434343')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // ヘッダー行を固定
  sheet.setFrozenRows(1);

  Logger.log('✅ ヘッダー行を作成しました');
}

/**
 * データ検証設定
 */
function setupDataValidation(sheet) {
  // D列: カテゴリ（経費/給与/固定費）
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['経費', '給与', '固定費'], true)
    .setAllowInvalid(false)
    .setHelpText('リストから選択してください')
    .build();
  sheet.getRange('D2:D1000').setDataValidation(categoryRule);

  // E列: 支払方法（会社カード/立替/銀行振込/現金）
  const paymentMethodRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['会社カード', '立替', '銀行振込', '現金'], true)
    .setAllowInvalid(false)
    .setHelpText('リストから選択してください')
    .build();
  sheet.getRange('E2:E1000').setDataValidation(paymentMethodRule);

  // G列: 清算ステータス（未清算/清算済み/-）
  const settlementStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['未清算', '清算済み', '-'], true)
    .setAllowInvalid(false)
    .setHelpText('リストから選択してください')
    .build();
  sheet.getRange('G2:G1000').setDataValidation(settlementStatusRule);

  // A列・H列・J列: 日付形式（YYYY/MM/DD）
  const dateRule = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('日付形式で入力してください（例: 2024/10/01）')
    .build();
  sheet.getRange('A2:A1000').setDataValidation(dateRule);
  sheet.getRange('H2:H1000').setDataValidation(dateRule);
  sheet.getRange('J2:J1000').setDataValidation(dateRule);

  // C列: 金額（正の整数のみ）
  const amountRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 100000000)
    .setAllowInvalid(false)
    .setHelpText('金額は1〜100,000,000の範囲で入力してください')
    .build();
  sheet.getRange('C2:C1000').setDataValidation(amountRule);

  Logger.log('✅ データ検証を設定しました');
}

/**
 * 条件付き書式設定
 */
function setupConditionalFormatting(sheet) {
  // 未清算の立替金: 行全体を黄色背景
  const unsettledRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$G2="未清算"')
    .setBackground('#FFF9C4')
    .setRanges([sheet.getRange('A2:J1000')])
    .build();

  // 清算済み: 行全体を緑背景
  const settledRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$G2="清算済み"')
    .setBackground('#C8E6C9')
    .setRanges([sheet.getRange('A2:J1000')])
    .build();

  const rules = sheet.getConditionalFormatRules();
  rules.push(unsettledRule);
  rules.push(settledRule);
  sheet.setConditionalFormatRules(rules);

  Logger.log('✅ 条件付き書式を設定しました');
}

/**
 * サンプルデータ投入
 */
function insertSampleData(sheet) {
  const sampleData = [
    ['2025/09/22', '電子定款作成（公証人　伊藤敏治役場）', 16980, '経費', '立替', '笠本', '清算済み', '2024/10/10', '創立費', '2024/10/10'],
    ['2025/09/27', 'ゆめマガ10月号印刷（ラクスル）', 159998, '経費', '立替', '株式会社Sing', '清算済み', '2024/10/15', '印刷製本費（1000部）', '2024/10/15'],
    ['2025/09/29', '飲食代（あっちっち　未広点）', 13453, '経費', '立替', '株式会社Sing', '未清算', '', '接待交際費', ''],
    ['2025/09/30', '保険加入共済金（中部自動車共済組合）', 1000, '固定費', '立替', '清水', '未清算', '', '協賛金（保険）', ''],
    ['2025/10/06', '名刺印刷（ラクスル）', 998, '経費', '立替', '株式会社Sing', '未清算', '', '消耗品費（清水・ヒデップ）', '']
  ];

  const dataRange = sheet.getRange(2, 1, sampleData.length, 10);
  dataRange.setValues(sampleData);

  // 日付列のフォーマット
  sheet.getRange('A2:A1000').setNumberFormat('yyyy/mm/dd');
  sheet.getRange('H2:H1000').setNumberFormat('yyyy/mm/dd');
  sheet.getRange('J2:J1000').setNumberFormat('yyyy/mm/dd');

  // 金額列のフォーマット（3桁区切りカンマ）
  sheet.getRange('C2:C1000').setNumberFormat('#,##0');

  Logger.log('✅ サンプルデータを投入しました');
}

/**
 * 列幅調整
 */
function adjustColumnWidths(sheet) {
  sheet.setColumnWidth(1, 100);  // A列: 日付
  sheet.setColumnWidth(2, 250);  // B列: 項目名
  sheet.setColumnWidth(3, 100);  // C列: 金額
  sheet.setColumnWidth(4, 100);  // D列: カテゴリ
  sheet.setColumnWidth(5, 120);  // E列: 支払方法
  sheet.setColumnWidth(6, 120);  // F列: 立替者名
  sheet.setColumnWidth(7, 120);  // G列: 清算ステータス
  sheet.setColumnWidth(8, 100);  // H列: 清算日
  sheet.setColumnWidth(9, 200);  // I列: 備考
  sheet.setColumnWidth(10, 100); // J列: 支払予定日

  Logger.log('✅ 列幅を調整しました');
}

/**
 * メニューに追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 支出管理マスタ')
    .addItem('シート作成', 'createExpenditureSheet')
    .addToUi();
}
