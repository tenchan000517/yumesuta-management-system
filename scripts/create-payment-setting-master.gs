/**
 * 支払設定マスタ スプレッドシート自動生成スクリプト
 *
 * 作成日: 2025-10-18
 * 対象: 営業管理スプレッドシート内に「支払設定マスタ」シートを作成
 *
 * 実行方法:
 * 1. Google Sheetsを開く
 * 2. 拡張機能 > Apps Script を開く
 * 3. このスクリプトを追加（固定費マスタスクリプトの後に）
 * 4. createPaymentSettingMaster() を実行
 */

/**
 * メイン関数: 支払設定マスタシートを作成
 */
function createPaymentSettingMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = '支払設定マスタ';

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

  // シートタブの色設定（青系）
  sheet.setTabColor('#2196F3');

  // 1. ヘッダー行作成
  createPaymentSettingHeaders(sheet);

  // 2. 列幅調整
  adjustPaymentSettingColumnWidths(sheet);

  // 3. サンプルデータ投入
  insertPaymentSettingSampleData(sheet);

  // 4. データ検証設定
  setupPaymentSettingDataValidation(sheet);

  Logger.log('✅ 支払設定マスタシートの作成が完了しました');
  SpreadsheetApp.getUi().alert('✅ 支払設定マスタシートの作成が完了しました');
}

/**
 * ヘッダー行作成
 */
function createPaymentSettingHeaders(sheet) {
  const headers = [
    '支払方法',
    '支払日タイミング',
    '引き落とし日',
    '備考'
  ];

  // ヘッダー設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ヘッダー書式
  headerRange
    .setBackground('#1976D2')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // ヘッダー行を固定
  sheet.setFrozenRows(1);

  Logger.log('✅ 支払設定マスタのヘッダー行を作成しました');
}

/**
 * 列幅調整
 */
function adjustPaymentSettingColumnWidths(sheet) {
  sheet.setColumnWidth(1, 120);  // A列: 支払方法
  sheet.setColumnWidth(2, 150);  // B列: 支払日タイミング
  sheet.setColumnWidth(3, 100);  // C列: 引き落とし日
  sheet.setColumnWidth(4, 250);  // D列: 備考

  Logger.log('✅ 支払設定マスタの列幅を調整しました');
}

/**
 * サンプルデータ投入
 */
function insertPaymentSettingSampleData(sheet) {
  const sampleData = [
    ['会社カード', '翌月27日', 27, 'クレカ引き落とし日'],
    ['銀行振込', '即日', null, '発生日=支払日'],
    ['現金', '即日', null, '発生日=支払日'],
    ['請求書払い', '個別設定', null, '支出管理マスタで個別に設定'],
    ['立替', '清算日', null, '清算ステータスによる']
  ];

  const dataRange = sheet.getRange(2, 1, sampleData.length, 4);
  dataRange.setValues(sampleData);

  Logger.log('✅ 支払設定マスタのサンプルデータを投入しました');
}

/**
 * データ検証設定
 */
function setupPaymentSettingDataValidation(sheet) {
  // A列: 支払方法（会社カード/銀行振込/現金/請求書払い/立替）
  const paymentMethodRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['会社カード', '銀行振込', '現金', '請求書払い', '立替'], true)
    .setAllowInvalid(false)
    .setHelpText('リストから選択してください')
    .build();
  sheet.getRange('A2:A1000').setDataValidation(paymentMethodRule);

  // C列: 引き落とし日（1〜31の整数、または空白）
  const withdrawalDayRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 31)
    .setAllowInvalid(true) // 空白を許可
    .setHelpText('引き落とし日は1〜31の範囲で入力してください（空白可）')
    .build();
  sheet.getRange('C2:C1000').setDataValidation(withdrawalDayRule);

  Logger.log('✅ 支払設定マスタのデータ検証を設定しました');
}
