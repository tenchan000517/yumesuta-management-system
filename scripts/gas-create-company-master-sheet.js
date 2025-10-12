/**
 * Google Apps Script: 契約企業マスタシート作成
 *
 * 目的: 営業予実管理スプレッドシートに「契約企業マスタ」シートを追加
 * Phase: 1.6-1（データマイグレーション）
 * 作成日: 2025年10月12日
 *
 * 実行方法:
 * 1. 営業予実管理スプレッドシートを開く
 *    https://docs.google.com/spreadsheets/d/13PzSnGekGxDWX7B1_TwczNibR6j_JxDb3UuquPX1GyQ
 * 2. 拡張機能 → Apps Script
 * 3. このスクリプトをコピー&ペースト
 * 4. 関数 createCompanyMasterSheet() を実行
 * 5. 権限を承認（初回のみ）
 */

function createCompanyMasterSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  console.log('===== 契約企業マスタシート作成開始 =====');
  console.log('');

  // 既存のシートをチェック
  const existingSheet = spreadsheet.getSheetByName('契約企業マスタ');
  if (existingSheet) {
    console.log('⚠️  「契約企業マスタ」シートは既に存在します。');
    console.log('   処理を中断します。');
    console.log('');
    console.log('既存のシートを削除して再作成する場合:');
    console.log('1. 既存の「契約企業マスタ」シートを手動で削除');
    console.log('2. このスクリプトを再実行');
    return;
  }

  // 新規シート作成
  console.log('[1/3] 「契約企業マスタ」シートを作成中...');
  const sheet = spreadsheet.insertSheet('契約企業マスタ');
  console.log('✅ シート作成完了');
  console.log('');

  // ヘッダー行を設定（25列: A〜Y）
  console.log('[2/3] ヘッダー行を設定中...');
  const headers = [
    '企業ID',                    // A列
    '企業正式名称',              // B列
    '企業略称',                  // C列
    '代表者役職',                // D列
    '代表者名',                  // E列
    '郵便番号',                  // F列
    '住所',                      // G列
    '電話番号',                  // H列
    'FAX番号',                   // I列
    'メールアドレス',            // J列
    'HP URL',                    // K列
    '担当者名',                  // L列
    '担当者メールアドレス',      // M列
    '担当者電話番号',            // N列
    '業種',                      // O列
    '従業員数',                  // P列
    '資本金',                    // Q列
    '設立年月日',                // R列
    '備考',                      // S列
    '登録日',                    // T列
    '最終更新日',                // U列
    'データソース',              // V列
    '顧客マスタ企業名',          // W列
    '契約実績',                  // X列
    '最新契約ID'                 // Y列
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  console.log('✅ ヘッダー行設定完了（' + headers.length + '列）');
  console.log('');

  // ヘッダー行のスタイル設定
  console.log('[3/3] スタイル設定中...');
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');

  // 列幅を調整
  sheet.setColumnWidth(1, 80);   // A: 企業ID
  sheet.setColumnWidth(2, 200);  // B: 企業正式名称
  sheet.setColumnWidth(3, 150);  // C: 企業略称
  sheet.setColumnWidth(4, 120);  // D: 代表者役職
  sheet.setColumnWidth(5, 120);  // E: 代表者名
  sheet.setColumnWidth(6, 100);  // F: 郵便番号
  sheet.setColumnWidth(7, 300);  // G: 住所
  sheet.setColumnWidth(8, 150);  // H: 電話番号
  sheet.setColumnWidth(9, 150);  // I: FAX番号
  sheet.setColumnWidth(10, 200); // J: メールアドレス
  sheet.setColumnWidth(11, 250); // K: HP URL
  sheet.setColumnWidth(12, 120); // L: 担当者名
  sheet.setColumnWidth(13, 200); // M: 担当者メールアドレス
  sheet.setColumnWidth(14, 150); // N: 担当者電話番号
  sheet.setColumnWidth(15, 120); // O: 業種
  sheet.setColumnWidth(16, 100); // P: 従業員数
  sheet.setColumnWidth(17, 120); // Q: 資本金
  sheet.setColumnWidth(18, 120); // R: 設立年月日
  sheet.setColumnWidth(19, 250); // S: 備考
  sheet.setColumnWidth(20, 120); // T: 登録日
  sheet.setColumnWidth(21, 120); // U: 最終更新日
  sheet.setColumnWidth(22, 150); // V: データソース
  sheet.setColumnWidth(23, 200); // W: 顧客マスタ企業名
  sheet.setColumnWidth(24, 100); // X: 契約実績
  sheet.setColumnWidth(25, 120); // Y: 最新契約ID

  // 1行目を固定
  sheet.setFrozenRows(1);

  console.log('✅ スタイル設定完了');
  console.log('');

  console.log('===== 契約企業マスタシート作成完了 =====');
  console.log('');
  console.log('✅ シート「契約企業マスタ」が正常に作成されました！');
  console.log('');
  console.log('📋 シート情報:');
  console.log('   列数: ' + headers.length + '列（A〜Y）');
  console.log('   ヘッダー行: 青色背景、白文字、太字');
  console.log('   固定行: 1行目（スクロール時も常に表示）');
  console.log('');
  console.log('次のステップ:');
  console.log('1. ✅ シートが正しく作成されているか確認');
  console.log('2. ✅ ヘッダー行（A1〜Y1）が正しく設定されているか確認');
  console.log('3. 📝 次のGASスクリプトを実行: migrateCompanyMasterData()');
  console.log('      → 既存の契約データから企業マスタにデータを移行');
  console.log('');
}
