/**
 * 稲垣製作所・一榮工業データ更新スクリプト
 *
 * 【目的】
 * 既存の企業マスターの稲垣製作所と一榮工業のデータを
 * 実データに更新する（プレースホルダーXXを正確な情報に置換）
 *
 * 使い方:
 * 1. Google Sheetsで「拡張機能」→「Apps Script」を開く
 * 2. このスクリプトをコピー&ペースト
 * 3. 保存して「updateInagakiAndIchiei」を実行
 * 4. 完了！（約3秒）
 *
 * 作成日: 2025-10-08
 */

function updateInagakiAndIchiei() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('企業マスター');

  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ エラー', '「企業マスター」シートが見つかりません', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // 企業IDの列インデックスを取得
  const companyIdIndex = headers.indexOf('企業ID');
  if (companyIdIndex === -1) {
    SpreadsheetApp.getUi().alert('❌ エラー', '「企業ID」列が見つかりません', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // 更新対象の列インデックス
  const addressIndex = headers.indexOf('住所');
  const phoneIndex = headers.indexOf('電話番号');
  const faxIndex = headers.indexOf('FAX番号');
  const websiteIndex = headers.indexOf('ウェブサイト');
  const establishedIndex = headers.indexOf('設立年');
  const employeesIndex = headers.indexOf('従業員数');
  const remarkIndex = headers.indexOf('備考');

  let updatedCount = 0;

  // 稲垣製作所を探して更新
  for (let i = 1; i < data.length; i++) {
    if (data[i][companyIdIndex] === 'inagaki') {
      sheet.getRange(i + 1, addressIndex + 1).setValue('〒444-0525 愛知県西尾市吉良町富田東屋敷16-5');
      sheet.getRange(i + 1, phoneIndex + 1).setValue('0563-35-1766');
      sheet.getRange(i + 1, faxIndex + 1).setValue('0563-35-1767');
      sheet.getRange(i + 1, websiteIndex + 1).setValue('https://inagakiseisakusho.studio.site');
      sheet.getRange(i + 1, establishedIndex + 1).setValue('2013年5月');
      sheet.getRange(i + 1, employeesIndex + 1).setValue('約10名');
      sheet.getRange(i + 1, remarkIndex + 1).setValue('✅ 実データ反映済み (2025-10-08更新)');
      updatedCount++;
      Logger.log('✅ 稲垣製作所のデータを更新しました');
    }

    if (data[i][companyIdIndex] === 'ichiei') {
      sheet.getRange(i + 1, addressIndex + 1).setValue('〒494-0012 愛知県一宮市明地字井之内１番地');
      sheet.getRange(i + 1, phoneIndex + 1).setValue('0586-69-2991');
      sheet.getRange(i + 1, faxIndex + 1).setValue('0586-69-7567');
      sheet.getRange(i + 1, websiteIndex + 1).setValue('https://ichiei-ind.co.jp');
      sheet.getRange(i + 1, establishedIndex + 1).setValue('1960年(昭和35年)6月25日');
      sheet.getRange(i + 1, employeesIndex + 1).setValue('147名 (2025年6月1日現在)');
      sheet.getRange(i + 1, remarkIndex + 1).setValue('✅ 実データ反映済み (2025-10-08更新)');
      updatedCount++;
      Logger.log('✅ 一榮工業のデータを更新しました');
    }
  }

  if (updatedCount === 2) {
    SpreadsheetApp.getUi().alert(
      '✅ 更新完了！',
      '稲垣製作所と一榮工業のデータを更新しました。\n\n' +
      '更新項目:\n' +
      '• 住所\n' +
      '• 電話番号\n' +
      '• FAX番号\n' +
      '• ウェブサイト\n' +
      '• 設立年\n' +
      '• 従業員数\n\n' +
      '稲垣製作所:\n' +
      '  〒444-0525 愛知県西尾市吉良町富田東屋敷16-5\n' +
      '  TEL: 0563-35-1766\n' +
      '  設立: 2013年5月\n\n' +
      '一榮工業:\n' +
      '  〒494-0012 愛知県一宮市明地字井之内１番地\n' +
      '  TEL: 0586-69-2991\n' +
      '  設立: 1960年6月25日',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert(
      '⚠️ 警告',
      `更新できたのは ${updatedCount}/2 社です。\n\n` +
      '企業マスターに「inagaki」「ichiei」の企業IDが存在するか確認してください。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
