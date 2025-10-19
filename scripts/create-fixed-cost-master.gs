/**
 * 固定費マスタ スプレッドシート自動生成スクリプト
 *
 * 作成日: 2025-10-18
 * 対象: 営業管理スプレッドシート内に「固定費マスタ」シートを作成
 *
 * 実行方法:
 * 1. Google Sheetsを開く
 * 2. 拡張機能 > Apps Script を開く
 * 3. このスクリプトを追加（支出管理マスタスクリプトの後に）
 * 4. createFixedCostMaster() を実行
 */

/**
 * メイン関数: 固定費マスタシートを作成
 */
function createFixedCostMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = '固定費マスタ';

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

  // シートタブの色設定（紫系）
  sheet.setTabColor('#9C27B0');

  // 1. ヘッダー行作成
  createFixedCostHeaders(sheet);

  // 2. 列幅調整
  adjustFixedCostColumnWidths(sheet);

  // 3. サンプルデータ投入
  insertFixedCostSampleData(sheet);

  // 4. データ検証設定
  setupFixedCostDataValidation(sheet);

  // 5. 条件付き書式設定
  setupFixedCostConditionalFormatting(sheet);

  Logger.log('✅ 固定費マスタシートの作成が完了しました');
  SpreadsheetApp.getUi().alert('✅ 固定費マスタシートの作成が完了しました');
}

/**
 * ヘッダー行作成
 */
function createFixedCostHeaders(sheet) {
  const headers = [
    '有効',
    '項目名',
    '金額',
    'カテゴリ',
    '支払方法',
    '支払日',
    '開始月',
    '備考'
  ];

  // ヘッダー設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ヘッダー書式
  headerRange
    .setBackground('#6A1B9A')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // ヘッダー行を固定
  sheet.setFrozenRows(1);

  Logger.log('✅ 固定費マスタのヘッダー行を作成しました');
}

/**
 * 列幅調整
 */
function adjustFixedCostColumnWidths(sheet) {
  sheet.setColumnWidth(1, 60);   // A列: 有効（チェックボックス）
  sheet.setColumnWidth(2, 250);  // B列: 項目名
  sheet.setColumnWidth(3, 100);  // C列: 金額
  sheet.setColumnWidth(4, 80);   // D列: カテゴリ
  sheet.setColumnWidth(5, 100);  // E列: 支払方法
  sheet.setColumnWidth(6, 80);   // F列: 支払日
  sheet.setColumnWidth(7, 100);  // G列: 開始月
  sheet.setColumnWidth(8, 200);  // H列: 備考

  Logger.log('✅ 固定費マスタの列幅を調整しました');
}

/**
 * サンプルデータ投入
 */
function insertFixedCostSampleData(sheet) {
  const today = new Date();
  const currentYearMonth = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy/MM');

  const sampleData = [
    [true, '家賃', 100000, '固定費', '銀行振込', 1, currentYearMonth, '月次固定費'],
    [true, '社用車リース（車両代・飯田くん）', 33660, '固定費', '銀行振込', 1, currentYearMonth, 'リース契約期間: 3年'],
    [true, '社用車保険（自損有特約込・飯田くん）', 37700, '固定費', '銀行振込', 1, currentYearMonth, '月次固定費'],
    [true, '通信費（インターネット）', 50000, '固定費', '銀行振込', 15, currentYearMonth, '月次固定費'],
    [true, '光熱費', 30000, '固定費', '銀行振込', 20, currentYearMonth, '月次固定費']
  ];

  const dataRange = sheet.getRange(2, 1, sampleData.length, 8);
  dataRange.setValues(sampleData);

  // A列（有効）をチェックボックスに変換
  sheet.getRange('A2:A1000').insertCheckboxes();

  // C列（金額）のフォーマット（3桁区切りカンマ）
  sheet.getRange('C2:C1000').setNumberFormat('#,##0');

  // D列（カテゴリ）は固定値「固定費」
  sheet.getRange('D2:D1000').setValue('固定費');

  // G列（開始月）のフォーマット
  sheet.getRange('G2:G1000').setNumberFormat('yyyy/MM');

  Logger.log('✅ 固定費マスタのサンプルデータを投入しました');
}

/**
 * データ検証設定
 */
function setupFixedCostDataValidation(sheet) {
  // E列: 支払方法（会社カード/銀行振込/現金）
  const paymentMethodRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['会社カード', '銀行振込', '現金'], true)
    .setAllowInvalid(false)
    .setHelpText('リストから選択してください')
    .build();
  sheet.getRange('E2:E1000').setDataValidation(paymentMethodRule);

  // F列: 支払日（1〜31の整数）
  const paymentDayRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 31)
    .setAllowInvalid(false)
    .setHelpText('支払日は1〜31の範囲で入力してください')
    .build();
  sheet.getRange('F2:F1000').setDataValidation(paymentDayRule);

  // C列: 金額（正の整数のみ）
  const amountRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 10000000)
    .setAllowInvalid(false)
    .setHelpText('金額は1〜10,000,000の範囲で入力してください')
    .build();
  sheet.getRange('C2:C1000').setDataValidation(amountRule);

  Logger.log('✅ 固定費マスタのデータ検証を設定しました');
}

/**
 * 条件付き書式設定
 */
function setupFixedCostConditionalFormatting(sheet) {
  // 無効な固定費: 行全体をグレー背景
  const disabledRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$A2=FALSE')
    .setBackground('#F5F5F5')
    .setFontColor('#9E9E9E')
    .setRanges([sheet.getRange('A2:H1000')])
    .build();

  // 有効な固定費: 行全体を薄紫背景
  const enabledRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$A2=TRUE')
    .setBackground('#F3E5F5')
    .setRanges([sheet.getRange('A2:H1000')])
    .build();

  const rules = sheet.getConditionalFormatRules();
  rules.push(disabledRule);
  rules.push(enabledRule);
  sheet.setConditionalFormatRules(rules);

  Logger.log('✅ 固定費マスタの条件付き書式を設定しました');
}
